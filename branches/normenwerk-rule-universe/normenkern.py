"""HALVETH/Juri Normenwerk 0.1.0: deterministic offline model evaluation.

No network, subprocess, eval, law database, credential or effect dispatcher.
All consequences are MODEL_ONLY. Input assertions remain declared assertions.
"""
from __future__ import annotations
from datetime import datetime
from pathlib import Path
import argparse, hashlib, json, re

VERSION = '0.1.0'
SCHEMA = 'halveth.norm-model.v1'
TRUTHS = {'TRUE', 'FALSE', 'UNKNOWN'}
MAX_BYTES = 262144
ID = re.compile(r'^[A-Z][A-Z0-9_-]{0,63}$')
class ModelError(ValueError): pass
def require(ok, message):
    if not ok: raise ModelError(message)
def digest(raw): return 'sha256:' + hashlib.sha256(raw).hexdigest()
def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')
def exact(value, keys, label):
    require(type(value) is dict and set(value) == set(keys), label + ': fields must match the contract exactly')
def identifier(value, label):
    require(type(value) is str and bool(ID.fullmatch(value)), label + ': expected a stable ASCII ID')
def timestamp(value):
    require(type(value) is str, 'timestamp must be a string')
    try: dt=datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as e: raise ModelError('invalid ISO timestamp') from e
    require(dt.tzinfo is not None, 'timestamp must bind a timezone')
    return dt
def _pairs(pairs):
    result={}
    for key, value in pairs:
        require(key not in result, 'duplicate JSON key: ' + key)
        result[key]=value
    return result
def parse(raw):
    require(type(raw) is bytes and len(raw) <= MAX_BYTES, 'input byte limit exceeded')
    try:
        text=raw.decode('utf-8'); text.encode('utf-8', errors='strict')
        value=json.loads(text, object_pairs_hook=_pairs, parse_constant=lambda _: (_ for _ in ()).throw(ModelError('nonfinite JSON value')))
        # Escaped unpaired surrogates are invalid even if the original bytes decode.
        canonical(value).decode('utf-8')
    except (UnicodeError, json.JSONDecodeError, RecursionError) as e: raise ModelError('invalid Unicode or JSON') from e
    validate(value)
    return value
def _list(value, label, lower=0):
    require(type(value) is list and lower <= len(value) <= 64, label + ': expected a bounded array')
def _window(value):
    start=timestamp(value['validFrom']); end=timestamp(value['validUntil'])
    require(start < end, 'validity window must be nonempty')
def _expression(expr, facts, depth=0):
    require(depth <= 8 and type(expr) is dict and len(expr)==1, 'condition depth/type invalid')
    op, val=next(iter(expr.items()))
    if op == 'fact': require(type(val) is str and val in facts, 'condition references an unknown fact ID')
    elif op == 'not': _expression(val, facts, depth+1)
    elif op in {'all','any'}:
        require(type(val) is list and 1 <= len(val) <= 16, 'condition needs 1..16 operands')
        for child in val: _expression(child, facts, depth+1)
    else: raise ModelError('condition operator is not allowed')
def _topological(norm_ids, priorities):
    degree={i:0 for i in norm_ids}; outgoing={i:[] for i in norm_ids}
    for p in priorities:
        outgoing[p['stronger']].append(p['weaker']); degree[p['weaker']]+=1
    ready=sorted(i for i,d in degree.items() if d==0); order=[]
    while ready:
        i=ready.pop(0); order.append(i)
        for child in sorted(outgoing[i]):
            degree[child]-=1
            if degree[child]==0: ready.append(child); ready.sort()
    require(len(order)==len(norm_ids), 'priority cycle is invalid')
    return order, outgoing
def validate(model):
    exact(model, {'schema','id','domain','scope','referenceTime','query','sources','facts','norms','priorities'}, 'model')
    require(model['schema']==SCHEMA and model['domain']=='LOCAL_SIMULATION', 'unsupported model schema/domain')
    identifier(model['id'], 'model'); identifier(model['scope'], 'scope'); timestamp(model['referenceTime'])
    exact(model['query'], {'id','subject','action','object'}, 'query')
    for key, value in model['query'].items(): identifier(value, 'query.'+key)
    for key in ['sources','facts','norms','priorities']: _list(model[key], key)
    require(len(model['sources'])>=1, 'one source is required')
    require(model['id']!=model['query']['id'], 'model/query IDs must be distinct')
    seen={model['id'],model['query']['id']}; source_ids=set(); fact_ids=set(); norms={}
    for key in ['sources','facts','norms','priorities']:
        for row in model[key]:
            require(type(row) is dict and 'id' in row, 'record has no ID'); identifier(row['id'], key+'.id')
            require(row['id'] not in seen, 'record IDs must be globally distinct'); seen.add(row['id'])
    for s in model['sources']:
        exact(s, {'id','version','text'}, 'source')
        require(type(s['version']) is str and bool(s['version']) and type(s['text']) is str and bool(s['text']), 'source version/text is required')
        source_ids.add(s['id'])
    for f in model['facts']:
        exact(f, {'id','definitionId','value','source','binding','validFrom','validUntil'}, 'fact')
        identifier(f['definitionId'], 'fact definition')
        require(type(f['value']) is str and f['value'] in TRUTHS, 'fact truth must be TRUE/FALSE/UNKNOWN')
        require(type(f['source']) is str and f['source'] in source_ids, 'fact source reference is unbound')
        exact(f['binding'], {'domain','scope','subject','action','object'}, 'fact binding')
        expected=dict(domain=model['domain'],scope=model['scope'],**{k:model['query'][k] for k in ['subject','action','object']})
        require(f['binding']==expected, 'fact subject/action/object/scope must bind this exact query')
        _window(f); fact_ids.add(f['id'])
    for n in model['norms']:
        exact(n, {'id','definitionId','source','domain','scope','action','effect','when','consequence','validFrom','validUntil'}, 'norm')
        identifier(n['definitionId'], 'norm definition'); identifier(n['scope'], 'norm scope'); identifier(n['action'], 'norm action')
        require(n['domain']=='LOCAL_SIMULATION' and type(n['source']) is str and n['source'] in source_ids, 'norm domain/source is unbound')
        require(type(n['effect']) is str and n['effect'] in {'SUPPORT','OPPOSE'}, 'norm effect must be SUPPORT/OPPOSE')
        require(type(n['consequence']) is str and bool(n['consequence']) and len(n['consequence'])<=256, 'consequence text invalid')
        _expression(n['when'], fact_ids); _window(n); norms[n['id']]=n
    pairs=set()
    for p in model['priorities']:
        exact(p, {'id','stronger','weaker','source','validFrom','validUntil'}, 'priority')
        require(type(p['stronger']) is str and type(p['weaker']) is str and p['stronger'] in norms and p['weaker'] in norms and p['stronger']!=p['weaker'], 'priority endpoints invalid')
        require(type(p['source']) is str and p['source'] in source_ids, 'priority source is unbound'); _window(p)
        a,b=norms[p['stronger']],norms[p['weaker']]
        require((a['domain'],a['scope'],a['action']) == (b['domain'],b['scope'],b['action']), 'priority cannot bridge unrelated domains/scopes/actions')
        pair=(p['stronger'],p['weaker']); require(pair not in pairs, 'duplicate priority edge'); pairs.add(pair)
    _topological(norms, model['priorities'])
def _within(row, at): return timestamp(row['validFrom']) <= at < timestamp(row['validUntil'])
def condition(expr, facts):
    op,val=next(iter(expr.items()))
    if op=='fact': return facts[val]
    if op=='not': return {'TRUE':'FALSE','FALSE':'TRUE','UNKNOWN':'UNKNOWN'}[condition(val,facts)]
    values=[condition(v,facts) for v in val]
    if op=='all': return 'FALSE' if 'FALSE' in values else 'UNKNOWN' if 'UNKNOWN' in values else 'TRUE'
    return 'TRUE' if 'TRUE' in values else 'UNKNOWN' if 'UNKNOWN' in values else 'FALSE'
def evaluate(raw):
    model=parse(raw); at=timestamp(model['referenceTime'])
    facts={f['id']:f['value'] if _within(f,at) else 'UNKNOWN' for f in model['facts']}
    trace=[]; active={}; uncertain=[]; norms={n['id']:n for n in model['norms']}
    for n in sorted(model['norms'], key=lambda n:n['id']):
        applicable=n['scope']==model['scope'] and n['action']==model['query']['action'] and _within(n,at)
        truth=condition(n['when'],facts) if applicable else 'NOT_APPLICABLE'
        trace.append(dict(norm=n['id'],source=n['source'],conditionValue=truth,effect=n['effect'],status='ACTIVE' if truth=='TRUE' else 'UNRESOLVED' if truth=='UNKNOWN' else 'INACTIVE'))
        if truth=='TRUE': active[n['id']]=n
        if truth=='UNKNOWN': uncertain.append(n['id'])
    priorities=[p for p in model['priorities'] if _within(p,at)]
    order,outgoing=_topological(norms,priorities)
    defeated={}; retained=[]
    for i in order:
        if i not in active or i in defeated: continue
        retained.append(i)
        for weaker in outgoing[i]:
            if weaker in active: defeated.setdefault(weaker,i)
    for item in trace:
        if item['norm'] in defeated: item.update(status='DEFEATED',defeatedBy=defeated[item['norm']])
    support=sorted(i for i in retained if active[i]['effect']=='SUPPORT')
    oppose=sorted(i for i in retained if active[i]['effect']=='OPPOSE')
    outcome='CONFLICT' if support and oppose else 'OPEN' if uncertain or not retained else 'MODEL_SUPPORTED' if support else 'MODEL_OPPOSED'
    nodes=[]
    for kind,rows in [('SOURCE',model['sources']),('STATE',model['facts']),('NORM',model['norms']),('PRIORITY',priorities),('QUERY',[model['query']])]:
        for row in rows: nodes.append(dict(kind=kind,id=row['id'],digest=digest(canonical(row)),address='/'+kind.lower()+'/'+row['id']))
    addresses={n['id']:n for n in nodes}; relations=[]
    def relation(ident, kind, left, right, source):
        relations.append(dict(id=ident,type=kind,left=addresses[left],right=addresses[right],source=source,scope=model['scope'],time=model['referenceTime'],evidence='DECLARED_INPUT',authorityEffect='MODEL_ONLY'))
    for n in model['norms']: relation('SOURCE_'+n['id'],'DECLARES_MODEL_RULE',n['source'],n['id'],n['source'])
    for f in model['facts']: relation('SOURCE_'+f['id'],'DECLARES_MODEL_STATE',f['source'],f['id'],f['source'])
    for p in priorities: relation('EDGE_'+p['id'],'EXPLICIT_DIRECT_PRIORITY',p['stronger'],p['weaker'],p['source'])
    body=dict(schema='halveth.norm-receipt.v1',operatorVersion=VERSION,operatorSourceDigest=digest(Path(__file__).read_bytes()),
              inputDigest=digest(raw),canonicalModelDigest=digest(canonical(model)),modelId=model['id'],scope=model['scope'],
              referenceTime=model['referenceTime'],query=model['query'],outcome=outcome,truthContract='STRONG_KLEENE_THREE_VALUED_V1',
              priorityContract='DIRECT_DEFEAT_BY_UNDEFEATED_ACTIVE_RULE_V1',conservativeUnknownContract='ANY_APPLICABLE_UNKNOWN_RULE_KEEPS_RESOLUTION_OPEN',
              support=support,oppose=oppose,uncertain=sorted(uncertain),trace=trace,states=facts,nodes=nodes,relations=relations,
              consequences=[dict(norm=i,text=norms[i]['consequence'],state='MODEL_PROJECTION_ONLY') for i in sorted(retained)],
              sourceAssurance='DECLARED_INPUT_NOT_EXTERNALLY_VERIFIED',authority='MODEL_ONLY',externalActions=0)
    encoded=canonical(body)
    return dict(body=body,canonicalSourceUtf8=encoded.decode('utf-8'),digest=digest(encoded))
def verify(raw, receipt):
    try: return type(receipt) is dict and canonical(receipt) == canonical(evaluate(raw))
    except (ModelError, TypeError, ValueError): return False
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model',type=Path); parser.add_argument('--output',type=Path,required=True); parser.add_argument('--verify',type=Path)
    args=parser.parse_args(); raw=args.model.read_bytes()
    if args.verify:
        result=dict(valid=verify(raw,json.loads(args.verify.read_text(encoding='utf-8'),object_pairs_hook=_pairs)),scope='MODEL_REPLAY_ONLY')
        require(result['valid'], 'receipt replay failed')
    else: result=evaluate(raw)
    # Never silently replace an earlier receipt.
    with args.output.open('x',encoding='utf-8') as stream: stream.write(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__': main()
