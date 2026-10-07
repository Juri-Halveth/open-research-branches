import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyCliResult } from './cli-result-model.mjs';
test('nonzero exit and unavailable controls never become an invented 403',()=>{
  for(const errorCategory of ['NOT_FOUND','TIER_RESTRICTED'])assert.equal(classifyCliResult({exitCode:1,httpStatus:null,errorCategory,responsePresent:false}).state,'CONTROL_UNAVAILABLE');
  assert.equal(classifyCliResult({exitCode:50,httpStatus:null,errorCategory:'OTHER',responsePresent:false}).state,'EXECUTION_ERROR_WITH_OPEN_HTTP_STATUS');
});
test('a captured denial and readable response have distinct contracts',()=>{
  assert.equal(classifyCliResult({exitCode:1,httpStatus:403,errorCategory:'OTHER',responsePresent:true}).state,'DECLARED_HTTP_DENIAL');
  assert.equal(classifyCliResult({exitCode:0,httpStatus:200,errorCategory:'NONE',responsePresent:true}).state,'RESPONSE_PRESENT_POLICY_REVIEW_REQUIRED');
});
test('invalid result fields are rejected without defaults',()=>{
  for(const value of [{exitCode:1},{exitCode:-1,httpStatus:null,errorCategory:'NONE',responsePresent:false},{exitCode:1,httpStatus:999,errorCategory:'NONE',responsePresent:false}])assert.throws(()=>classifyCliResult(value));
});
