import test from 'node:test';
import assert from 'node:assert/strict';
import {ray,paraxialFocus,temporal} from './model.mjs';
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);
test('Snell and mirror symmetry hold across 60 synthetic rays',()=>{
  for(const r of [4.8,5.6,6.8])for(const c of [-8,-2,0,8])for(const h of [-1,-0.5,0.5,1,2]){
    const q=ray(r,h,c), mirror=ray(r,-h,c);
    close(q.x,mirror.x);close(q.y,-mirror.y);close(q.tx,mirror.tx);close(q.ty,-mirror.ty);
    close(Math.hypot(q.tx,q.ty),1);
    const slope=-c*h/1000, norm=Math.hypot(1,slope), ix=1/norm, iy=slope/norm;
    const nx=(q.x-r)/r, ny=q.y/r;
    close(Math.abs(ix*ny-iy*nx),1.336*Math.abs(q.tx*ny-q.ty*nx));
  }
});
test('small-angle ray agrees with the independently stated paraxial power',()=>{
  for(const r of [4.8,5.6,6.8])for(const c of [-8,0,8]){
    const q=ray(r,1e-5,c), focus=q.x-q.y*q.tx/q.ty;
    close(focus,paraxialFocus(r,c),1e-4);
  }
});
test('a change in curvature separates the two reference foci',()=>{
  assert.ok(paraxialFocus(6,0)>paraxialFocus(5.6,0));
});
test('past-sample extrapolation helps straight motion and fails at an unseen turn',()=>{
  const straight=temporal(1040,100,1,false),turn=temporal(1040,100,1,true);
  close(straight.errorDelayed,4);close(straight.errorPredicted,0);
  close(turn.errorDelayed,0.8);close(turn.errorPredicted,3.2);
});
test('zero delay retains the present position regardless of gain',()=>{
  for(const gain of [0,1,2])for(const turn of [false,true])close(temporal(1040,0,gain,turn).errorPredicted,0);
});
