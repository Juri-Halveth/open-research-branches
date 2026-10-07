"""Strict source-data consumer: JSON stdin -> verified payload JSON stdout."""
import base64, hashlib, json, sys
import re

LIMIT = 8 * 1024 * 1024
def pairs(items):
    out = {}
    for key, value in items:
        if key in out: raise ValueError('Duplicate JSON key')
        out[key] = value
    return out
def load(text):
    return json.loads(text, object_pairs_hook=pairs, parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite JSON value')))
def decode_packet(p):
    fields={'schema','version','type','source','dataClass','mediaType','encoding','payloadByteLength','payloadSha256','payloadBase64','programsFromSourceExecuted','networkRequests','claimCeiling'}
    if type(p) is not dict or set(p)!=fields or type(p['source']) is not dict or set(p['source'])!={'commit','tree','coverage'} or not re.fullmatch(r'[a-f0-9]{40}(?:[a-f0-9]{24})?',p['source']['commit']) or not re.fullmatch(r'[a-f0-9]{40}(?:[a-f0-9]{24})?',p['source']['tree']) or not re.fullmatch(r'[A-Z][A-Z0-9_]{0,63}',p['type']): raise ValueError('Closed packet fields')
    if type(p['programsFromSourceExecuted']) is not int or type(p['networkRequests']) is not int: raise ValueError('Exact activity counters')
    if p['schema'] != 'halveth.source-entry-packet.v1' or p['version'] != '1.0.0' or p['encoding'] != 'UTF-8' or p['mediaType'] != 'application/json' or p['programsFromSourceExecuted'] != 0 or p['networkRequests'] != 0 or p['claimCeiling'] != 'BOUND_SOURCE_DATA_ONLY': raise ValueError('Unsupported contract')
    if type(p['payloadByteLength']) is not int or not 0 <= p['payloadByteLength'] <= LIMIT or p['dataClass'] not in ('PUBLIC','RESTRICTED_RAW') or len(p['payloadBase64']) > ((LIMIT+2)//3)*4: raise ValueError('Payload limit or class')
    raw = base64.b64decode(p['payloadBase64'], validate=True)
    if len(raw) != p['payloadByteLength'] or base64.b64encode(raw).decode('ascii') != p['payloadBase64'] or hashlib.sha256(raw).hexdigest() != p['payloadSha256']: raise ValueError('Payload binding changed')
    return load(raw.decode('utf-8', errors='strict'))
if __name__ == '__main__':
    try:
        raw = sys.stdin.buffer.read(2*LIMIT+1)
        if len(raw)>2*LIMIT: raise ValueError('Input limit')
        result=decode_packet(load(raw.decode('utf-8',errors='strict')))
        sys.stdout.buffer.write((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
    except (ValueError,KeyError,TypeError) as error:
        print(str(error),file=sys.stderr);sys.exit(1)
