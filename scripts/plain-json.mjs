// Closed JSON data validation shared by Node and browser adapters.
export function plainJson(value,depth=0,budget={nodes:0}){
 if(depth>64||++budget.nodes>50000)throw new Error('JSON structure limit');
 if(value===null||typeof value==='boolean')return;
 if(typeof value==='number'){if(!Number.isFinite(value)||Object.is(value,-0))throw new Error('Finite canonical JSON number required');return;}
 if(typeof value==='string'){
  for(let i=0;i<value.length;i++){const n=value.charCodeAt(i);if(n>=0xd800&&n<=0xdbff){const next=value.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))throw new Error('Unicode scalar string required');}else if(n>=0xdc00&&n<=0xdfff)throw new Error('Unicode scalar string required');}return;
 }
 if(Array.isArray(value)){if(Object.getPrototypeOf(value)!==Array.prototype||Object.getOwnPropertySymbols(value).length||Object.keys(value).length!==value.length)throw new Error('Dense plain JSON array required');const ds=Object.getOwnPropertyDescriptors(value);for(let i=0;i<value.length;i++){const d=ds[i];if(!d||!d.enumerable||!Object.hasOwn(d,'value'))throw new Error('JSON array data property required');plainJson(d.value,depth+1,budget);}return;}
 if(!value||typeof value!=='object'||Object.getPrototypeOf(value)!==Object.prototype||Object.getOwnPropertySymbols(value).length)throw new Error('Plain JSON value required');
 for(const [key,d] of Object.entries(Object.getOwnPropertyDescriptors(value))){if(!d.enumerable||!Object.hasOwn(d,'value'))throw new Error('Plain JSON data property required');plainJson(key,depth+1,budget);plainJson(d.value,depth+1,budget);}
}
