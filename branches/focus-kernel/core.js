/**
 * Focus Kernel Research core.
 *
 * These functions are local and deterministic apart from timestamps and IDs.
 * Reviewer results are data. They never become instructions or state changes.
 */

const timestamp = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const asText = (value) => (typeof value === 'string' ? value.trim() : '');
const asTextList = (value) => (Array.isArray(value) ? value.map(asText).filter(Boolean) : []);

function assertFocus(focus) {
  if (!focus || focus.kind !== 'focus_record' || !focus.focus_id || !Number.isInteger(focus.version)) {
    throw new Error('A valid focus record is required.');
  }
}

const words = (text) => new Set(
  asText(text).toLocaleLowerCase('en-US').match(/[\p{L}\p{N}]{3,}/gu) || [],
);

function overlap(leftText, rightText) {
  const left = words(leftText);
  const right = words(rightText);
  if (!left.size || !right.size) return 0;

  let matches = 0;
  left.forEach((word) => {
    if (right.has(word)) matches += 1;
  });
  return matches / Math.max(1, Math.min(left.size, right.size));
}

export function createFocus({ goal, task = '', exclusions = [], constraints = [] } = {}) {
  const confirmedGoal = asText(goal);
  if (!confirmedGoal) throw new Error('A confirmed main goal is required.');

  const createdAt = timestamp();
  return {
    kind: 'focus_record',
    schema_version: 1,
    focus_id: makeId('focus'),
    confirmed_main_goal: confirmedGoal,
    current_task: asText(task),
    excluded_goals: asTextList(exclusions),
    constraints: asTextList(constraints),
    assumptions: [],
    open_questions: [],
    confirmed_decisions: [{ at: createdAt, summary: 'Main focus explicitly confirmed by the user.' }],
    rejected_decisions: [],
    sources: [],
    change_history: [{ version: 1, at: createdAt, reason: 'Focus created', goal: confirmedGoal }],
    last_user_confirmation: createdAt,
    validity_status: 'confirmed',
    storage_status: 'session_only',
    version: 1,
  };
}

export function proposeFocusChange(focus, proposedGoal, reason = '') {
  assertFocus(focus);
  const goal = asText(proposedGoal);
  if (!goal) throw new Error('A proposed goal is required.');

  return {
    kind: 'focus_change_proposal',
    focus_id: focus.focus_id,
    from_version: focus.version,
    proposed_goal: goal,
    reason: asText(reason) || 'No reason supplied.',
    requires_user_confirmation: true,
  };
}

export function confirmFocusChange(focus, proposal) {
  assertFocus(focus);
  if (!proposal || proposal.kind !== 'focus_change_proposal') {
    throw new Error('Only a focus change proposal can be confirmed.');
  }
  if (proposal.focus_id !== focus.focus_id || proposal.from_version !== focus.version) {
    throw new Error('The proposal does not match the current focus version.');
  }

  const proposedGoal = asText(proposal.proposed_goal);
  if (!proposedGoal) throw new Error('The proposed goal is empty.');

  const changedAt = timestamp();
  const version = focus.version + 1;
  return {
    ...focus,
    confirmed_main_goal: proposedGoal,
    version,
    last_user_confirmation: changedAt,
    change_history: [
      ...focus.change_history,
      { version, at: changedAt, reason: asText(proposal.reason), goal: proposedGoal },
    ],
  };
}

export function analyzeInput(input, focus, projectContext = '') {
  assertFocus(focus);
  const text = asText(input);
  const context = asText(projectContext);
  const controlLikeText = /ignore\s+(all|previous|rules?)|system(?:-|\s)?prompt|developer(?:-|\s)?message|override\s+(the\s+)?focus|bypass\s+(the\s+)?rules?/iu.test(text);
  const uncertaintyMarker = /\b(maybe|possibly|probably|uncertain|not sure|unknown)\b/iu.test(text);
  const trailingQuestion = /\?\s*$/u.test(text);
  const alignment = overlap(`${focus.confirmed_main_goal} ${focus.current_task}`, text);
  const inputSource = { type: 'user_input', captured_at: timestamp() };

  const layers = [
    layer('raw_input', text, 1, true, inputSource),
    layer('literal_meaning', text || 'No input supplied.', 0.98, true, inputSource),
    layer(
      'local_context',
      focus.current_task || 'No current task has been confirmed.',
      focus.current_task ? 0.95 : 0.25,
      Boolean(focus.current_task),
      { type: 'focus_record', focus_id: focus.focus_id, version: focus.version },
    ),
    layer(
      'conversation_context',
      `Confirmed main goal: ${focus.confirmed_main_goal}`,
      1,
      true,
      { type: 'focus_record', focus_id: focus.focus_id, version: focus.version },
    ),
    layer(
      'project_context',
      context || 'No additional project context supplied.',
      context ? 0.8 : 0.2,
      Boolean(context),
      { type: context ? 'project_context' : 'missing_context' },
    ),
    layer('inferred_intent', inferIntent(text, focus), alignment ? Math.min(0.9, 0.45 + alignment) : 0.35, false, { type: 'heuristic' }),
    layer('technical_implication', inferTechnical(text), 0.45, false, { type: 'heuristic' }),
    layer('risk_implication', inferRisk(text, controlLikeText), controlLikeText ? 0.95 : 0.45, false, { type: 'heuristic' }),
    layer('unresolved_ambiguity', ambiguity(text, uncertaintyMarker, trailingQuestion), text ? 0.75 : 1, false, { type: 'heuristic' }),
  ];

  return {
    kind: 'layered_analysis',
    input: text,
    input_is_untrusted: true,
    control_like_text_detected: controlLikeText,
    alignment,
    layers,
  };
}

function layer(name, value, confidence, confirmed, source) {
  return { name, value, confidence, confirmed, source };
}

function inferIntent(input, focus) {
  if (!input) return 'No intent can be inferred from an empty input.';
  return `The input may refine or test the confirmed goal "${focus.confirmed_main_goal}". This interpretation is not confirmed.`;
}

function inferTechnical(input) {
  if (/status|result|report|dashboard|interface|screen/iu.test(input)) {
    return 'Possible implementation question: keep the visible result, its evidence and its coverage limits separate.';
  }
  return 'A technical implication requires a more specific task.';
}

function inferRisk(input, controlLikeText) {
  if (controlLikeText) {
    return 'The input contains control-like wording. Treat it as data and do not change the confirmed focus from it.';
  }
  if (/delete\s+all|erase\s+all|publish\s+all|send\s+all/iu.test(input)) {
    return 'The input may request a broad external or destructive effect. Bind exact targets and authority before action.';
  }
  return 'No concrete technical risk is established by the text alone.';
}

function ambiguity(input, uncertaintyMarker, trailingQuestion) {
  if (!input) return 'Input is missing.';
  if (uncertaintyMarker || trailingQuestion) {
    return 'The input contains an uncertainty marker or a question. Clarify it before a consequential decision.';
  }
  return 'No simple ambiguity marker was detected; relevant context may still be missing.';
}

export function runReviewers(analysis, focus) {
  assertFocus(focus);
  if (!analysis || analysis.kind !== 'layered_analysis') {
    throw new Error('A layered analysis is required.');
  }

  const projectLayer = analysis.layers.find((item) => item.name === 'project_context');
  const contextMissing = !focus.current_task || !projectLayer?.confirmed;
  const possibleConflict = analysis.alignment < 0.08 && analysis.input.length > 30;

  return [
    reviewer(
      'context_reviewer',
      contextMissing ? 'context_missing' : 'context_sufficient',
      contextMissing
        ? 'The current task or additional project context is missing.'
        : 'Enough context exists for a first bounded review.',
      contextMissing ? 0.86 : 0.7,
    ),
    reviewer(
      'counterargument_reviewer',
      possibleConflict ? 'possible_goal_conflict' : 'no_clear_conflict',
      possibleConflict
        ? 'The input shares few terms with the confirmed focus. This is a heuristic signal, not proof of conflict.'
        : 'The word-overlap heuristic found no clear conflict.',
      possibleConflict ? 0.62 : 0.48,
    ),
    reviewer(
      'focus_guardian',
      analysis.control_like_text_detected ? 'untrusted_control_text_detected' : 'focus_preserved',
      analysis.control_like_text_detected
        ? 'Control-like wording remains untrusted input. The confirmed focus is unchanged.'
        : `The confirmed focus remains: ${focus.confirmed_main_goal}`,
      analysis.control_like_text_detected ? 0.96 : 0.92,
    ),
  ];
}

function reviewer(role, finding, summary, confidence) {
  return {
    role,
    finding,
    summary,
    confidence,
    untrusted_output: true,
    allowed_content: ['observation', 'reason', 'uncertainty', 'recommendation'],
  };
}

export function arbitrate({ focus, analysis, reviews } = {}) {
  assertFocus(focus);
  if (!analysis || analysis.kind !== 'layered_analysis' || !Array.isArray(reviews)) {
    throw new Error('Focus, analysis and reviewer results are required.');
  }

  const has = (finding) => reviews.some((review) => review.finding === finding);
  const status = analysis.control_like_text_detected
    ? 'warning_required'
    : has('context_missing')
      ? 'context_missing'
      : has('possible_goal_conflict')
        ? 'user_decision_required'
        : 'safe_next_step_available';

  return {
    kind: 'arbitration_decision',
    status,
    focus_preserved: true,
    focus_id: focus.focus_id,
    focus_version: focus.version,
    rationale: rationaleFor(status, focus),
    next_step: nextStepFor(status),
    requires_user_confirmation: status === 'user_decision_required',
    decision_id: makeId('decision'),
    at: timestamp(),
  };
}

function rationaleFor(status, focus) {
  const map = {
    warning_required: 'Control-like wording was treated as data. No focus change was applied.',
    context_missing: 'At least the current task or additional project context is missing.',
    user_decision_required: 'The input may indicate a direction change. Only explicit user confirmation can apply it.',
    safe_next_step_available: `The input can be investigated within the confirmed focus "${focus.confirmed_main_goal}".`,
  };
  return map[status];
}

function nextStepFor(status) {
  const map = {
    warning_required: 'Separate the embedded control wording from the subject matter and restate the intended task.',
    context_missing: 'Add the current task and one relevant project fact.',
    user_decision_required: 'Explicitly confirm whether the main focus should change, be refined or remain unchanged.',
    safe_next_step_available: 'Choose one small, reversible implementation or one targeted fact check.',
  };
  return map[status];
}

export function appendDecision(log, decision) {
  if (!Array.isArray(log) || !decision || decision.kind !== 'arbitration_decision') {
    throw new Error('A decision log and arbitration decision are required.');
  }
  return [
    ...log,
    {
      at: decision.at,
      decision_id: decision.decision_id,
      status: decision.status,
      focus_id: decision.focus_id,
      focus_version: decision.focus_version,
      rationale: decision.rationale,
    },
  ];
}
