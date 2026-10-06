"""HALVETH Code Universe 0.1: bundled models and in-memory provenance demo."""
from pathlib import Path
import argparse, importlib.util, json, sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

norm = load_module('halveth_universe_norm', HERE / 'normenkern.py')
fire = load_module('halveth_universe_fire', ROOT / 'branches' / 'fegefeuer-provenance-transducer' / 'fegefeuer_core.py')

def run_demo():
    furnace = fire.Fegefeuer()
    before = furnace.core_digest
    results = []
    for number, model in enumerate(sorted(HERE.glob('*.model.json')), 1):
        raw = model.read_bytes()
        saved = json.loads(model.with_name(model.name.replace('.model.json', '.receipt.json')).read_text(encoding='utf-8'))
        if not norm.verify(raw, saved):
            raise ValueError('Bundled reference record failed replay: ' + model.name)
        record = norm.evaluate(raw)
        event = fire.Event('NORM_EVENT_' + str(number), norm.canonical(record),
                           'NORMENWERK_0_1_0', record['body']['referenceTime'],
                           fire.pack({'modelId': record['body']['modelId'],
                                      'inputDigest': record['body']['inputDigest']}))
        if not furnace.arrive(event):
            raise ValueError('Unexpected duplicate event in fresh demonstration')
        furnace.hold(event.event_id)
        results.append({'model': model.name, 'outcome': record['body']['outcome'],
                        'replay': True, 'record': record, 'eventId': event.event_id,
                        'eventBinding': event.binding, 'archivedBytesDigest': event.content_digest})
    return {'schema': 'halveth.code-universe-demo.v1', 'authority': 'MODEL_ONLY',
            'externalActions': 0, 'results': results,
            'fegefeuer': {'archiveIds': sorted(furnace.archive_ids),
                         'pendingIds': sorted(furnace.pending),
                         'coreBefore': before, 'coreAfter': furnace.core_digest,
                         'coreSnapshot': furnace.core_snapshot(),
                         'ledger': [json.loads(raw) for raw in furnace.ledger],
                         'integration': 'RESULT_BYTES_ARCHIVED_AND_HELD'}}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--demo', action='store_true')
    mode.add_argument('--catalog', action='store_true')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    value = run_demo() if args.demo else json.loads((HERE / 'universe-catalog.json').read_text(encoding='utf-8'))
    text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        with args.output.open('x', encoding='utf-8') as stream:
            stream.write(text)
    else:
        print(text, end='')

if __name__ == '__main__':
    main()
