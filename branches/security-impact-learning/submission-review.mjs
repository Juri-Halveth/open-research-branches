// A bounded draft checker. Declared fields do not become facts or authority.
const FIELDS=['id','observation','entry','effect','source','assetBound','impactBound','actorBound','productBound','consumerBound','policyBound','proposedSeverity','evidenceSeverity'];
const TIERS=new Set(['UNCLASSIFIED','INFORMATIONAL','LOW','MEDIUM','HIGH','CRITICAL']);
const rank=['UNCLASSIFIED','INFORMATIONAL','LOW','MEDIUM','HIGH','CRITICAL'];
const placeholder=/\[\s*INSERT[^\]]*\]|\[\s*\.\.\.\s*\]|^\s*\.{3}\s*$/iu;
export function reviewDraft(record){
 if(!record||Object.getPrototypeOf(record)!==Object.prototype||Object.keys(record).sort().join('|')!==[...FIELDS].sort().join('|'))throw new TypeError('Exact closed draft fields required');
 if(typeof record.id!=='string'||!/^[A-Za-z0-9_-]+$/.test(record.id))throw new TypeError('Bound ASCII draft ID required');
 for(const name of ['observation','entry','effect','source'])if(typeof record[name]!=='string')throw new TypeError('Text field required: '+name);
 for(const name of ['assetBound','impactBound','actorBound','productBound','consumerBound','policyBound'])if(typeof record[name]!=='boolean')throw new TypeError('Declared boolean required: '+name);
 if(!TIERS.has(record.proposedSeverity)||!TIERS.has(record.evidenceSeverity))throw new TypeError('Explicit severity state required');
 const gaps=[];
 for(const name of ['observation','entry','effect','source'])if(!record[name].trim()||placeholder.test(record[name]))gaps.push('UNFILLED_'+name.toUpperCase());
 for(const name of ['assetBound','impactBound','actorBound','productBound','consumerBound','policyBound'])if(!record[name])gaps.push('UNBOUND_'+name.replace('Bound','').toUpperCase());
 if(rank.indexOf(record.proposedSeverity)>rank.indexOf(record.evidenceSeverity))gaps.push('SEVERITY_EXCEEDS_DECLARED_EVIDENCE');
 return {id:record.id,state:gaps.length?'HOLD_DRAFT_CONTINUE_SOURCE_REVIEW':'STRUCTURALLY_REVIEWABLE_DRAFT',gaps,assessmentKind:'DECLARED_DRAFT_STRUCTURE_ONLY',truthProven:false,severityProven:false,externalSend:false,actionAuthority:'NONE',inputChanged:false};
}
