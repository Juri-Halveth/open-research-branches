// Error classification for declared local fixtures, never an HTTP requester.
export function classifyCliResult(input) {
  if(input===null||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join('|')!=='errorCategory|exitCode|httpStatus|responsePresent')throw new TypeError('exact result fields required');
  const {exitCode,httpStatus,errorCategory,responsePresent}=input;
  if(!Number.isInteger(exitCode)||exitCode<0||typeof responsePresent!=='boolean'||!['NONE','NOT_FOUND','TIER_RESTRICTED','OTHER'].includes(errorCategory)||!(httpStatus===null||Number.isInteger(httpStatus)&&httpStatus>=100&&httpStatus<=599))throw new TypeError('explicit result fields required');
  if(httpStatus===401||httpStatus===403)return {state:'DECLARED_HTTP_DENIAL',authorizationViolation:'NOT_PROVEN'};
  if(errorCategory==='NOT_FOUND'||errorCategory==='TIER_RESTRICTED')return {state:'CONTROL_UNAVAILABLE',authorizationViolation:'NOT_PROVEN'};
  if(exitCode!==0)return {state:'EXECUTION_ERROR_WITH_OPEN_HTTP_STATUS',authorizationViolation:'NOT_PROVEN'};
  return {state:responsePresent?'RESPONSE_PRESENT_POLICY_REVIEW_REQUIRED':'EMPTY_RESULT_REQUIRES_REVIEW',authorizationViolation:'NOT_PROVEN'};
}
