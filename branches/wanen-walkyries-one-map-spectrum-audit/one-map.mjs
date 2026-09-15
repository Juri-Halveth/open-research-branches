export function evaluateConstantMap(inputs, output = 1) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new TypeError("inputs must be a non-empty array");
  }
  const distinctInputs = [...new Set(inputs)];
  const rows = distinctInputs.map((input) => ({ input, output }));
  return {
    rows,
    inputCount: distinctInputs.length,
    outputCount: 1,
    constantOnObservedInputs: true,
    injectiveOnObservedInputs: distinctInputs.length === 1,
    invertibleOnObservedInputs: distinctInputs.length === 1,
    provenanceEstablished: false,
    universalMeaningEstablished: false
  };
}

export function collisionPairs(inputs) {
  const distinct = [...new Set(inputs)];
  const pairs = [];
  for (let left = 0; left < distinct.length; left += 1) {
    for (let right = left + 1; right < distinct.length; right += 1) {
      pairs.push([distinct[left], distinct[right]]);
    }
  }
  return pairs;
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  console.log(JSON.stringify(evaluateConstantMap(process.argv.slice(2).length ? process.argv.slice(2) : ["s_a", "s_b", "s_c"]), null, 2));
}
