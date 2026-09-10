// SPDX-License-Identifier: MIT
// Civil budget arithmetic only. No savings, GDP, health or entitlement forecast.

const INPUT_KEYS = [
  "baseline", "reallocationShare", "transitionCosts", "remediationCosts", "weights"
];
const ALLOCATION_KEYS = ["health", "environment", "research"];

function requireRecord(value, keys, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${name} must be a plain record`);
  }
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new TypeError(`${name} must contain exactly: ${keys.join(", ")}`);
  }
  for (const key of keys) {
    if (!Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), "value")) {
      throw new TypeError(`${name}.${key} must be a data property`);
    }
  }
}

function requireNumber(value, name, maximum = Infinity) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number; no coercion is performed`);
  }
  if (value < 0 || value > maximum) {
    throw new RangeError(`${name} must be between 0 and ${maximum}`);
  }
}

// Compensated summation reduces ordering error; it does not normalize weights.
function sum(values) {
  let total = 0;
  let correction = 0;
  for (const value of values) {
    const next = total + value;
    correction += Math.abs(total) >= Math.abs(value)
      ? (total - next) + value
      : (value - next) + total;
    total = next;
  }
  return total + correction;
}

function requireFiniteResult(value, name) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} is outside finite numeric range`);
  }
  return value;
}

/**
 * Evaluate a hypothetical civil budget allocation in one consistent input unit.
 *
 * Inputs are assumptions, never evidence that funds can actually be redirected.
 * All four amounts use the same currency, price basis and time window chosen by
 * the caller. reallocationShare and each weight are numbers in [0, 1]. The
 * compensated IEEE-754 weight sum must equal 1, without tolerance or rescaling.
 *
 * gross = baseline * reallocationShare
 * net = gross - transitionCosts - remediationCosts
 * A negative net remains negative: no civil allocations are made, and deficit
 * reports the additional funding requirement. Floating point allocation error
 * remains visible as roundingResidual; this is not a payment/accounting engine.
 * No CBO projection is imported or silently selected as the baseline.
 */
export function calculateBudgetScenario(input) {
  requireRecord(input, INPUT_KEYS, "scenario");
  requireNumber(input.baseline, "baseline");
  requireNumber(input.reallocationShare, "reallocationShare", 1);
  requireNumber(input.transitionCosts, "transitionCosts");
  requireNumber(input.remediationCosts, "remediationCosts");
  requireRecord(input.weights, ALLOCATION_KEYS, "weights");
  for (const key of ALLOCATION_KEYS) requireNumber(input.weights[key], `weights.${key}`, 1);
  if (sum(ALLOCATION_KEYS.map(key => input.weights[key])) !== 1) {
    throw new RangeError("weights must sum to 1; weights are not normalized");
  }

  const gross = requireFiniteResult(input.baseline * input.reallocationShare, "gross");
  const totalCosts = requireFiniteResult(input.transitionCosts + input.remediationCosts, "totalCosts");
  const net = requireFiniteResult(gross - totalCosts, "net");
  const deficit = net < 0 ? -net : 0;
  const allocations = Object.fromEntries(ALLOCATION_KEYS.map(key => [
    key, net >= 0 ? requireFiniteResult(net * input.weights[key], `allocations.${key}`) : 0
  ]));
  const allocationTotal = requireFiniteResult(sum(Object.values(allocations)), "allocationTotal");
  const roundingResidual = net >= 0 ? net - allocationTotal : 0;

  return {
    modelType: "SYNTHETIC_CIVIL_BUDGET_SCENARIO",
    baseline: input.baseline,
    reallocationShare: input.reallocationShare,
    transitionCosts: input.transitionCosts,
    remediationCosts: input.remediationCosts,
    weights: { ...input.weights },
    gross,
    totalCosts,
    net,
    deficit,
    allocations,
    allocationTotal,
    roundingResidual,
    status: net < 0 ? "DEFICIT" : net === 0 ? "BREAK_EVEN" : "POSITIVE_HYPOTHETICAL_BALANCE"
  };
}
