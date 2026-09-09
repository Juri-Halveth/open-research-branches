export const STATUS = Object.freeze({
  UNKNOWN: "UNKNOWN",
  UNBOUND: "UNBOUND",
  CONDITIONAL: "CONDITIONAL",
  CONFLICT: "CONFLICT",
  STOP: "STOP",
});

export const PROTOCOL_RULES = Object.freeze({
  instructionReceivedDoesNotTransferResponsibility: true,
  eachSideOwnsItsOwnOutput: true,
  dialogueResultDoesNotAuthorizeExternalAction: true,
});

const YES_WORDS = new Set(["ja", "yes", "jep", "jo"]);
const NO_WORDS = new Set(["nein", "no", "nope"]);

const CONDITIONAL_PHRASES = [
  "aber",
  "wenn",
  "falls",
  "vielleicht",
  "eigentlich",
  "eher",
  "nur wenn",
  "solange",
  "kommt drauf an",
  "kommt darauf an",
  "unter der bedingung",
];

const UNKNOWN_PHRASES = [
  "weiß nicht",
  "weiss nicht",
  "ich weiß nicht",
  "ich weiss nicht",
  "ich weiß es nicht",
  "ich weiss es nicht",
  "keine ahnung",
  "unbekannt",
  "unknown",
];

function normalize(raw) {
  return raw
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function containsPhrase(normalized, phrase) {
  return ` ${normalized} `.includes(` ${phrase} `);
}

export function classifyAnswer(raw) {
  if (typeof raw !== "string") {
    throw new TypeError("answer text must be a string");
  }

  const normalized = normalize(raw);
  if (!normalized) return "UNBOUND";

  const tokens = normalized.split(" ");
  const hasYes = tokens.some((token) => YES_WORDS.has(token));
  const hasNo = tokens.some((token) => NO_WORDS.has(token));
  const hasUnknown = UNKNOWN_PHRASES.some((phrase) =>
    containsPhrase(normalized, phrase),
  );
  const hasCondition = CONDITIONAL_PHRASES.some((phrase) =>
    containsPhrase(normalized, phrase),
  );
  const looksInterrogative = raw.includes("?");

  if ((hasYes && hasNo) || (hasUnknown && (hasYes || hasNo))) {
    return "CONFLICT";
  }
  if (hasUnknown) return "UNKNOWN";
  if ((hasYes || hasNo) && (hasCondition || looksInterrogative)) {
    return "CONDITIONAL";
  }
  if (hasYes) return "JA";
  if (hasNo) return "NEIN";
  return "UNBOUND";
}

export function createMachine({
  parties = ["SIDE_A", "SIDE_B"],
  maxTurns = 8,
} = {}) {
  if (
    !Array.isArray(parties) ||
    parties.length !== 2 ||
    new Set(parties).size !== 2 ||
    parties.some(
      (party) =>
        typeof party !== "string" ||
        !/^[A-Za-z0-9_-]+$/.test(party),
    )
  ) {
    throw new TypeError("exactly two distinct ASCII party IDs are required");
  }
  if (!Number.isInteger(maxTurns) || maxTurns < 1) {
    throw new TypeError("maxTurns must be a positive integer");
  }

  return {
    version: "1.0.0",
    parties: [...parties],
    maxTurns,
    turn: 0,
    expectedActor: parties[0],
    status: STATUS.UNKNOWN,
    resolution: null,
    stopReason: null,
    snapshotKind: null,
    question: null,
    lastClearQuestion: null,
    votes: Object.fromEntries(parties.map((party) => [party, null])),
    history: [],
  };
}

function requireTurn(state, actor) {
  if (state.status === STATUS.STOP) {
    throw new Error("machine has stopped");
  }
  if (actor !== state.expectedActor) {
    throw new Error(`expected actor ${state.expectedActor}`);
  }
}

function otherParty(state, actor) {
  return state.parties.find((party) => party !== actor);
}

export function ask(state, { actor, questionId, text }) {
  requireTurn(state, actor);
  if (state.question !== null) {
    throw new Error("a question is already active");
  }
  if (
    typeof questionId !== "string" ||
    questionId.trim() === "" ||
    typeof text !== "string" ||
    text.trim() === ""
  ) {
    throw new TypeError("questionId and text must be non-empty strings");
  }

  const question = { id: questionId, text, askedBy: actor };
  return {
    ...state,
    question,
    lastClearQuestion: question,
    expectedActor: otherParty(state, actor),
    status: STATUS.UNKNOWN,
    history: [
      ...state.history,
      {
        sequence: state.history.length + 1,
        kind: "ASK",
        actor,
        questionId,
        classification: "FRAGE",
      },
    ],
  };
}

export function say(state, { actor, text }) {
  requireTurn(state, actor);
  if (state.question === null) {
    throw new Error("no active question");
  }

  const classification = classifyAnswer(text);
  const votes = { ...state.votes };
  const turn = state.turn + 1;

  if (classification === "JA") {
    votes[actor] = "JA";
  } else if (classification === "NEIN") {
    votes[actor] = "NEIN";
  } else if (
    classification === "CONDITIONAL" ||
    classification === "CONFLICT" ||
    classification === "UNKNOWN"
  ) {
    votes[actor] = null;
  }

  let status =
    classification === "JA" || classification === "NEIN"
      ? STATUS.UNKNOWN
      : classification;
  let resolution = null;
  let stopReason = null;
  let snapshotKind = null;

  if (
    classification === "JA" &&
    state.parties.every((party) => votes[party] === "JA")
  ) {
    status = STATUS.STOP;
    resolution = "AGREEMENT";
    stopReason = "BOUND_COMMON_YES";
  } else if (classification === "NEIN") {
    status = STATUS.STOP;
    resolution = "DISAGREEMENT";
    stopReason = "BOUND_NO";
  } else if (classification === "UNKNOWN") {
    status = STATUS.STOP;
    resolution = "UNKNOWN";
    stopReason = "EXPLICIT_UNKNOWN";
  } else if (turn >= state.maxTurns) {
    status = STATUS.STOP;
    stopReason = "MAX_TURNS";
    snapshotKind = "FINITE_SNAPSHOT";
  }

  return {
    ...state,
    turn,
    expectedActor: otherParty(state, actor),
    status,
    resolution,
    stopReason,
    snapshotKind,
    votes,
    history: [
      ...state.history,
      {
        sequence: state.history.length + 1,
        kind: "SAY",
        actor,
        questionId: state.question.id,
        classification,
        resultingStatus: status,
        resolution,
      },
    ],
  };
}

export function publicView(state) {
  let symbol = "FRAGE";
  if (state.resolution === "AGREEMENT") symbol = "JA";
  if (state.resolution === "DISAGREEMENT") symbol = "NEIN";

  return {
    symbol,
    stopped: state.status === STATUS.STOP,
    reason: state.stopReason,
    question:
      symbol === "FRAGE" && state.lastClearQuestion
        ? {
            id: state.lastClearQuestion.id,
            text: state.lastClearQuestion.text,
          }
        : null,
  };
}
