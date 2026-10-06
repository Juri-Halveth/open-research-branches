import copy,json,unittest
from normenkern import evaluate,parse,verify,ModelError,condition,canonical

def fixture():
    window=dict(validFrom='2026-10-01T00:00:00Z',validUntil='2026-11-01T00:00:00Z')
    query=dict(id='QUERY_A',subject='ACTOR_A',action='REVIEW_ARTIFACT',object='ARTIFACT_A')
    binding=dict(domain='LOCAL_SIMULATION',scope='FIXTURE_A',**{k:query[k] for k in ['subject','action','object']})
    return dict(schema='halveth.norm-model.v1',id='MODEL_A',domain='LOCAL_SIMULATION',scope='FIXTURE_A',referenceTime='2026-10-06T22:28:00+02:00',query=query,
                sources=[dict(id='SOURCE_A',version='fixture-1',text='Synthetic model rules and assertions; no external authority.')],
                facts=[dict(id='CONSENT_A',definitionId='CONSENT_DECLARATION_V1',value='TRUE',source='SOURCE_A',binding=binding,**window),
                       dict(id='RESTRICTION_A',definitionId='RESTRICTION_DECLARATION_V1',value='FALSE',source='SOURCE_A',binding=copy.deepcopy(binding),**window)],
                norms=[dict(id='N_SUPPORT',definitionId='REVIEW_SUPPORT_V1',source='SOURCE_A',domain='LOCAL_SIMULATION',scope='FIXTURE_A',action='REVIEW_ARTIFACT',effect='SUPPORT',when={'fact':'CONSENT_A'},consequence='A local review is supported under these model inputs.',**window),
                       dict(id='N_OPPOSE',definitionId='REVIEW_OPPOSITION_V1',source='SOURCE_A',domain='LOCAL_SIMULATION',scope='FIXTURE_A',action='REVIEW_ARTIFACT',effect='OPPOSE',when={'fact':'RESTRICTION_A'},consequence='The model records an opposing restriction.',**window)],priorities=[])
def run(model):return evaluate(canonical(model))['body']

class NormTests(unittest.TestCase):
    def test_supported_and_model_only(self):
        b=run(fixture());self.assertEqual(b['outcome'],'MODEL_SUPPORTED');self.assertEqual(b['externalActions'],0);self.assertEqual(b['authority'],'MODEL_ONLY')
    def test_conflict_preserves_both(self):
        m=fixture();m['facts'][1]['value']='TRUE';b=run(m)
        self.assertEqual(b['outcome'],'CONFLICT');self.assertEqual(b['support'],['N_SUPPORT']);self.assertEqual(b['oppose'],['N_OPPOSE']);self.assertEqual(len(b['consequences']),2)
    def test_unknown_is_not_false(self):
        m=fixture();m['facts'][0]['value']='UNKNOWN';self.assertEqual(run(m)['outcome'],'OPEN')
        self.assertEqual(condition({'not':{'fact':'F'}},{'F':'UNKNOWN'}),'UNKNOWN')
    def test_no_active_norm_is_open(self):
        m=fixture();m['facts'][0]['value']='FALSE';self.assertEqual(run(m)['outcome'],'OPEN')
    def test_explicit_priority_retains_defeated_rule(self):
        m=fixture();m['facts'][1]['value']='TRUE'
        m['priorities']=[dict(id='PRIORITY_A',stronger='N_OPPOSE',weaker='N_SUPPORT',source='SOURCE_A',validFrom='2026-10-01T00:00:00Z',validUntil='2026-11-01T00:00:00Z')]
        b=run(m);self.assertEqual(b['outcome'],'MODEL_OPPOSED');self.assertEqual(next(t for t in b['trace'] if t['norm']=='N_SUPPORT')['status'],'DEFEATED')
    def test_expired_fact_does_not_silently_keep_truth(self):
        m=fixture();m['facts'][0]['validUntil']='2026-10-06T00:00:00Z';self.assertEqual(run(m)['states']['CONSENT_A'],'UNKNOWN');self.assertEqual(run(m)['outcome'],'OPEN')
    def test_expired_priority_leaves_conflict(self):
        m=fixture();m['facts'][1]['value']='TRUE';m['priorities']=[dict(id='PRIORITY_A',stronger='N_OPPOSE',weaker='N_SUPPORT',source='SOURCE_A',validFrom='2026-10-01T00:00:00Z',validUntil='2026-10-06T00:00:00Z')]
        self.assertEqual(run(m)['outcome'],'CONFLICT')
    def test_cycle_rejected(self):
        m=fixture();w=dict(source='SOURCE_A',validFrom='2026-10-01T00:00:00Z',validUntil='2026-11-01T00:00:00Z')
        m['priorities']=[dict(id='PRIORITY_A',stronger='N_OPPOSE',weaker='N_SUPPORT',**w),dict(id='PRIORITY_B',stronger='N_SUPPORT',weaker='N_OPPOSE',**w)]
        with self.assertRaises(ModelError):run(m)
    def test_scope_cannot_be_bridged_by_priority(self):
        m=fixture();m['norms'][1]['scope']='OTHER_SCOPE';m['priorities']=[dict(id='PRIORITY_A',stronger='N_OPPOSE',weaker='N_SUPPORT',source='SOURCE_A',validFrom='2026-10-01T00:00:00Z',validUntil='2026-11-01T00:00:00Z')]
        with self.assertRaises(ModelError):run(m)
    def test_fact_is_not_imported_from_other_person(self):
        m=fixture();m['facts'][0]['binding']['subject']='OTHER_ACTOR'
        with self.assertRaises(ModelError):run(m)
    def test_missing_fact_is_rejected(self):
        m=fixture();m['norms'][0]['when']={'fact':'MISSING'}
        with self.assertRaises(ModelError):run(m)
    def test_boolean_is_not_truth_label(self):
        m=fixture();m['facts'][0]['value']=True
        with self.assertRaises(ModelError):run(m)
    def test_duplicate_json_key_is_rejected(self):
        with self.assertRaises(ModelError):parse(b'{"id":"A","id":"B"}')
    def test_unpaired_surrogate_rejected(self):
        m=fixture();m['sources'][0]['text']='\ud800'
        with self.assertRaises(ModelError):parse(json.dumps(m).encode())
    def test_replay_detects_mutation_and_type_swap(self):
        raw=canonical(fixture());r=evaluate(raw);self.assertTrue(verify(raw,r))
        changed=copy.deepcopy(r);changed['body']['externalActions']=False;self.assertFalse(verify(raw,changed))
        changed=copy.deepcopy(r);changed['body']['outcome']='MODEL_OPPOSED';self.assertFalse(verify(raw,changed))
    def test_exact_input_bytes_are_bound(self):
        m=fixture();raw=canonical(m);r=evaluate(raw);self.assertFalse(verify(json.dumps(m,indent=2).encode(),r))
    def test_three_valued_conjunction_table(self):
        expected={('TRUE','TRUE'):'TRUE',('TRUE','FALSE'):'FALSE',('TRUE','UNKNOWN'):'UNKNOWN',('FALSE','TRUE'):'FALSE',('FALSE','FALSE'):'FALSE',('FALSE','UNKNOWN'):'FALSE',('UNKNOWN','TRUE'):'UNKNOWN',('UNKNOWN','FALSE'):'FALSE',('UNKNOWN','UNKNOWN'):'UNKNOWN'}
        for (a,b),v in expected.items():self.assertEqual(condition({'all':[{'fact':'A'},{'fact':'B'}]},{'A':a,'B':b}),v)
    def test_two_endpoint_addresses_for_every_relation(self):
        b=run(fixture())
        for r in b['relations']:
            for side in ['left','right']:self.assertEqual(set(r[side]),{'kind','id','digest','address'})
            self.assertEqual(r['authorityEffect'],'MODEL_ONLY')
    def test_foreign_domain_rejected(self):
        m=fixture();m['domain']='REAL_LAW'
        with self.assertRaises(ModelError):run(m)
    def test_unbound_scalar_rank_rejected(self):
        m=fixture();m['norms'][0]['rank']=999
        with self.assertRaises(ModelError):run(m)
    def test_duplicate_query_and_norm_id_rejected(self):
        m=fixture();m['query']['id']='N_SUPPORT'
        with self.assertRaises(ModelError):run(m)
if __name__=='__main__':unittest.main()
