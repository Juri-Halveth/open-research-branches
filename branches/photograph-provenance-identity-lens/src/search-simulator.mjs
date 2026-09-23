import { encodeSyntheticAsset, quantizeSyntheticScene } from "./photograph-lens.mjs";

const FACTORS = ["scene", "exposure", "metadata"];
const MAX_SEED = 0xffffffff;

function nextRandom(state) {
  let value = (state + 0x6d2b79f5) >>> 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return [(value ^ (value >>> 14)) >>> 0, value];
}

function scenarios() {
  const result = [];
  for (let scene = 0; scene < 2; scene++) {
    for (let exposure = 0; exposure < 2; exposure++) {
      for (let metadata = 0; metadata < 2; metadata++) {
        const factors = { scene, exposure, metadata };
        const model = quantizeSyntheticScene({
          irradiances: [scene === 0 ? 0.5 : 0.5001],
          exposure: exposure === 0 ? 1 : 2,
          bits: 8
        });
        const asset = encodeSyntheticAsset(model, metadata + 1);
        result.push({
          id: `S${scene}E${exposure}M${metadata}`,
          factors,
          pixelSha256: model.pixelSha256,
          fileSha256: asset.file.sha256
        });
      }
    }
  }
  return result;
}

function controlledPairs(cases) {
  const pairs = [];
  for (const factor of FACTORS) {
    for (const left of cases) {
      if (left.factors[factor] !== 0) continue;
      const right = cases.find((item) => FACTORS.every((name) =>
        item.factors[name] === (name === factor ? 1 : left.factors[name])));
      const changedFactorCount = FACTORS.filter((name) => left.factors[name] !== right.factors[name]).length;
      pairs.push({
        factor,
        left: left.id,
        right: right.id,
        changedFactorCount,
        pixelChanged: left.pixelSha256 !== right.pixelSha256,
        fileChanged: left.fileSha256 !== right.fileSha256
      });
    }
  }
  return pairs;
}

function pingPongOrder(pairs) {
  const grouped = FACTORS.map((factor) => pairs.filter((pair) => pair.factor === factor));
  return grouped[0].flatMap((_, index) => grouped.map((group) => group[index]));
}

function shuffledOrder(pairs, seed) {
  const result = [...pairs];
  let state = seed;
  for (let index = result.length - 1; index > 0; index--) {
    const [random, next] = nextRandom(state);
    state = next;
    const swap = random % (index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/** Finite, local search over a synthetic 2x2x2 factorial model. */
export function simulatePhotographSearch(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).sort().join(",") !== "budget,seed,strategy") {
    throw new TypeError("input must have exactly budget, seed, strategy");
  }
  const { budget, seed, strategy } = input;
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new TypeError("seed must be a uint32 integer");
  }
  if (!Number.isInteger(budget) || budget < 1 || budget > 12) {
    throw new TypeError("budget must be an integer in [1,12]");
  }
  if (strategy !== "PING_PONG" && strategy !== "SEEDED_RANDOM") {
    throw new TypeError("strategy must be PING_PONG or SEEDED_RANDOM");
  }

  const cases = scenarios();
  const allPairs = controlledPairs(cases);
  const ordered = strategy === "PING_PONG" ? pingPongOrder(allPairs) : shuffledOrder(allPairs, seed);
  const visited = ordered.slice(0, budget);
  const factorCoverage = Object.fromEntries(FACTORS.map((factor) => [factor, {
    visited: visited.filter((pair) => pair.factor === factor).length,
    available: allPairs.filter((pair) => pair.factor === factor).length
  }]));
  const witnessed = {
    samePixelsDifferentScene: visited.some((pair) => pair.factor === "scene" && !pair.pixelChanged),
    differentPixelsSameScene: visited.some((pair) => pair.factor === "exposure" && pair.pixelChanged),
    differentFileSamePixels: visited.some((pair) => pair.factor === "metadata" && !pair.pixelChanged && pair.fileChanged)
  };
  return {
    schemaVersion: "0.2.0",
    strategy,
    seed,
    budget,
    population: { cases: cases.length, controlledPairs: allPairs.length },
    visited,
    factorCoverage,
    witnessed,
    open: Object.entries(witnessed).filter(([, found]) => !found).map(([name]) => name),
    decouplingRule: "EXACTLY_ONE_FACTOR_CHANGES_PER_COMPARISON",
    identityProjection: "NOT_AUTHORIZED_BY_SYNTHETIC_PIXELS_OR_HASHES",
    claimCeiling: "FINITE_SYNTHETIC_ONE_CHANNEL_SEARCH_ONLY"
  };
}
