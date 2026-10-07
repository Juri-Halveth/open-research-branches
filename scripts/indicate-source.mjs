// INDICATE connects source-data axes. It performs no scan or external action.
export function indicateSource(proof,{extraAxes=[]}={}){
 if(!proof||!/^(?:[FP][0-9]{2}|FILE_[a-f0-9]{40}(?:[a-f0-9]{24})?)$/.test(proof.id)||proof.evidenceState!=='OBSERVED_SOURCE_BYTES'||proof.authorityEffect!=='NONE'||!/^[a-f0-9]{64}$/.test(proof.source?.excerptSha256??'')||!/^[a-f0-9]{64}$/.test(proof.source?.fileSha256??'')||!Array.isArray(extraAxes)||extraAxes.length>64)throw new Error('Bound source proof and finite extra axes required');
 const axes=[
  {id:'SOURCE_BYTES',definition:'Exact acquired excerpt bytes',state:'OBSERVED_SOURCE_BYTES',sourceReference:proof.source.url},
  {id:'OPERATOR',definition:'Named operator in the selected source excerpt',state:'SOURCE_DECLARED',sourceReference:proof.operator},
  {id:'TEST_DEFINITION',definition:'Version-bound test source; execution has a separate receipt',state:proof.testUrl?'SOURCE_LINK_ONLY':'NO_RUNTIME_TEST_CLAIM',sourceReference:proof.testUrl??'NONE'},
  {id:'PRODUCT_EFFECT',definition:'Observed external product consequence',state:'UNKNOWN',sourceReference:'NONE'}
 ];
 const seen=new Set(axes.map(a=>a.id));
 for(const a of extraAxes){
  if(!a||Object.keys(a).sort().join('|')!=='definition|id|sourceReference|state'||!/^[A-Z][A-Z0-9_]{0,63}$/.test(a.id)||seen.has(a.id)||!['DECLARED','HYPOTHESIS','UNKNOWN'].includes(a.state)||typeof a.definition!=='string'||!a.definition.trim()||a.definition.length>2000||typeof a.sourceReference!=='string'||!a.sourceReference||a.sourceReference.length>2000)throw new Error('Exact new axis definition and declared state required');
  seen.add(a.id);axes.push({...a});
 }
 return {schema:'halveth.indicate-source.v1',state:'INDICATED',sourceProofId:proof.id,sourceDigest:proof.source.excerptSha256,sourceAddress:proof.source.url,axes,axesAreExtensible:true,provenanceCluster:'SOURCE_'+proof.source.fileSha256,independence:'COMMON_SOURCE_CLUSTER_NOT_INDEPENDENT_CONFIRMATIONS',severity:'NOT_ASSIGNED',vulnerabilityVerdict:'NOT_EVALUATED',externalEffects:0,authorityEffect:'NONE',claimCeiling:'SOURCE_BOUND_NAVIGATION_HINT_ONLY'};
}
