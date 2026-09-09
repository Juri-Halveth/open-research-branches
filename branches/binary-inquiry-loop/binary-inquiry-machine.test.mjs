import test from "node:test";
import assert from "node:assert/strict";

import {
  ask,
  classifyAnswer,
  createMachine,
  PROTOCOL_RULES,
  publicView,
  say,
} from "./binary-inquiry-machine.mjs";

function opened(options) {
  return ask(createMachine(options), {
    actor: "SIDE_A",
    questionId: "q-1",
    text: "Stimmen beide Seiten derselben Aussage zu?",
  });
}

test("classifies conditional, conflict and unbound input", () => {
  assert.equal(classifyAnswer("also ja, aber?"), "CONDITIONAL");
  assert.equal(classifyAnswer("ja oder nein"), "CONFLICT");
  assert.equal(classifyAnswer("Ananas Huj V Glas Pidaras"), "UNBOUND");
});

test("one JA keeps the question open; two bound JA stop in agreement", () => {
  let state = opened();
  state = say(state, { actor: "SIDE_B", text: "ja" });
  assert.equal(publicView(state).symbol, "FRAGE");
  assert.equal(state.status, "UNKNOWN");

  state = say(state, { actor: "SIDE_A", text: "JA!" });
  assert.equal(state.status, "STOP");
  assert.equal(state.resolution, "AGREEMENT");
  assert.equal(publicView(state).symbol, "JA");
});

test("bound NEIN stops as disagreement", () => {
  const state = say(opened(), { actor: "SIDE_B", text: "nein" });
  assert.equal(state.status, "STOP");
  assert.equal(state.resolution, "DISAGREEMENT");
  assert.equal(publicView(state).symbol, "NEIN");
});

test("explicit unknown stops without inventing a decision", () => {
  const state = say(opened(), {
    actor: "SIDE_B",
    text: "Ich weiß nicht.",
  });
  assert.equal(state.status, "STOP");
  assert.equal(state.resolution, "UNKNOWN");
  assert.equal(publicView(state).symbol, "FRAGE");
});

test("conditional input preserves the bound question", () => {
  const state = say(opened(), {
    actor: "SIDE_B",
    text: "also ja, aber?",
  });
  assert.equal(state.status, "CONDITIONAL");
  assert.equal(state.lastClearQuestion.id, "q-1");
  assert.equal(publicView(state).symbol, "FRAGE");
  assert.equal(state.expectedActor, "SIDE_A");
});

test("unbound tokens return to the last clear question", () => {
  const state = say(opened(), {
    actor: "SIDE_B",
    text: "Ananas Huj V Glas Pidaras",
  });
  assert.equal(state.status, "UNBOUND");
  assert.deepEqual(publicView(state).question, {
    id: "q-1",
    text: "Stimmen beide Seiten derselben Aussage zu?",
  });
});

test("unresolved loop ends as finite snapshot", () => {
  let state = opened({ maxTurns: 2 });
  state = say(state, { actor: "SIDE_B", text: "also ja, aber?" });
  state = say(state, { actor: "SIDE_A", text: "Ananas" });
  assert.equal(state.status, "STOP");
  assert.equal(state.stopReason, "MAX_TURNS");
  assert.equal(state.snapshotKind, "FINITE_SNAPSHOT");
  assert.equal(publicView(state).symbol, "FRAGE");
});

test("turn order is enforced", () => {
  assert.throws(
    () => say(opened(), { actor: "SIDE_A", text: "ja" }),
    /expected actor SIDE_B/,
  );
});

test("same state and event produce the same result without mutation", () => {
  const state = opened();
  const event = { actor: "SIDE_B", text: "ja" };
  assert.deepEqual(say(state, event), say(state, event));
  assert.equal(state.turn, 0);
  assert.equal(state.votes.SIDE_B, null);
});

test("an instruction never transfers responsibility or authorizes outside action", () => {
  assert.deepEqual(PROTOCOL_RULES, {
    instructionReceivedDoesNotTransferResponsibility: true,
    eachSideOwnsItsOwnOutput: true,
    dialogueResultDoesNotAuthorizeExternalAction: true,
  });
  assert.equal(Object.isFrozen(PROTOCOL_RULES), true);
});

test("a qualified later answer retracts that side's earlier JA", () => {
  let state = opened({ maxTurns: 5 });
  state = say(state, { actor: "SIDE_B", text: "ja" });
  state = say(state, { actor: "SIDE_A", text: "Ananas" });
  state = say(state, { actor: "SIDE_B", text: "also ja, aber?" });

  assert.equal(state.status, "CONDITIONAL");
  assert.equal(state.votes.SIDE_B, null);
  assert.equal(publicView(state).symbol, "FRAGE");
});

test("a bound result takes priority over MAX_TURNS on the final turn", () => {
  let agreement = opened({ maxTurns: 2 });
  agreement = say(agreement, { actor: "SIDE_B", text: "ja" });
  agreement = say(agreement, { actor: "SIDE_A", text: "ja" });
  assert.equal(agreement.stopReason, "BOUND_COMMON_YES");

  const disagreement = say(opened({ maxTurns: 1 }), {
    actor: "SIDE_B",
    text: "nein",
  });
  assert.equal(disagreement.stopReason, "BOUND_NO");

  const unknown = say(opened({ maxTurns: 1 }), {
    actor: "SIDE_B",
    text: "ich weiß nicht",
  });
  assert.equal(unknown.stopReason, "EXPLICIT_UNKNOWN");
});
