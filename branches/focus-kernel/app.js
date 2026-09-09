import { analyzeInput, appendDecision, arbitrate, createFocus, runReviewers } from './core.js';

const byId = (id) => document.getElementById(id);
let focus = null;
let decisionLog = [];

function clear(node) {
  node.replaceChildren();
}

function make(tag, { className = '', text = '' } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function statusLabel(value) {
  return value.replaceAll('_', ' ');
}

function addField(parent, label, value, className = '') {
  const paragraph = make('p', { className });
  const strong = make('strong', { text: `${label}: ` });
  paragraph.append(strong, document.createTextNode(value));
  parent.append(paragraph);
}

byId('confirmFocus').addEventListener('click', () => {
  try {
    focus = createFocus({ goal: byId('goal').value, task: byId('task').value });
    byId('focusStatus').textContent = `Confirmed · version ${focus.version} · current page session only`;
    renderFocus();
  } catch (error) {
    byId('focusStatus').textContent = error instanceof Error ? error.message : 'Focus could not be created.';
  }
});

byId('insertExample').addEventListener('click', () => {
  byId('input').value = 'A dashboard reports COMPLETE, but one relevant source was not checked. Should the result remain complete?';
  byId('projectContext').value = 'Status labels must remain bound to the sources and coverage that actually produced them.';
});

byId('analyze').addEventListener('click', () => {
  if (!focus) {
    byId('focusStatus').textContent = 'Confirm a main goal first. It is the reference for review.';
    return;
  }

  try {
    const analysis = analyzeInput(byId('input').value, focus, byId('projectContext').value);
    const reviews = runReviewers(analysis, focus);
    const decision = arbitrate({ focus, analysis, reviews });
    decisionLog = appendDecision(decisionLog, decision);
    renderResults(analysis, reviews, decision);
  } catch (error) {
    byId('focusStatus').textContent = error instanceof Error ? error.message : 'Review failed.';
  }
});

function renderFocus() {
  const card = byId('focusCard');
  clear(card);
  card.append(
    make('p', { className: 'eyebrow', text: `CONFIRMED FOCUS · V${focus.version}` }),
    make('h3', { text: focus.confirmed_main_goal }),
  );
  addField(card, 'Current task', focus.current_task || 'not supplied');
  card.append(make('p', {
    className: 'micro',
    text: 'Reviewer output can question this focus but cannot change it.',
  }));
}

function renderResults(analysis, reviews, decision) {
  byId('results').hidden = false;
  renderDecision(decision);
  renderLayers(analysis.layers);
  renderReviews(reviews);
  renderLog();
}

function renderDecision(decision) {
  const container = byId('decision');
  const knownStatuses = new Set([
    'warning_required',
    'context_missing',
    'user_decision_required',
    'safe_next_step_available',
  ]);
  container.className = `decision ${knownStatuses.has(decision.status) ? decision.status : ''}`.trim();
  clear(container);
  container.append(
    make('p', { className: 'eyebrow', text: `ARBITRATION · ${statusLabel(decision.status)}` }),
    make('h2', { text: 'The confirmed focus remains visible.' }),
  );
  addField(container, 'Reason', decision.rationale);
  addField(container, 'Next step', decision.next_step);
}

function renderLayers(layers) {
  const container = byId('layers');
  clear(container);
  layers.forEach((item) => {
    const article = make('article', { className: 'layer' });
    const heading = make('div', { className: 'item-head' });
    heading.append(
      make('h3', { text: statusLabel(item.name) }),
      make('span', {
        className: `tag${item.confirmed ? ' confirmed' : ''}`,
        text: item.confirmed ? 'confirmed' : `${Math.round(item.confidence * 100)}% heuristic`,
      }),
    );
    article.append(heading, make('p', { text: item.value }));
    container.append(article);
  });
}

function renderReviews(reviews) {
  const container = byId('reviews');
  clear(container);
  reviews.forEach((review) => {
    const article = make('article', { className: 'review' });
    const heading = make('div', { className: 'item-head' });
    heading.append(
      make('span', { className: 'role', text: statusLabel(review.role) }),
      make('span', { className: 'tag', text: `${Math.round(review.confidence * 100)}%` }),
    );
    article.append(
      heading,
      make('h3', { text: statusLabel(review.finding) }),
      make('p', { text: review.summary }),
    );
    container.append(article);
  });
}

function renderLog() {
  const container = byId('log');
  clear(container);
  decisionLog.slice().reverse().forEach((item) => {
    const article = make('article', { className: 'logline' });
    article.append(
      make('strong', { text: statusLabel(item.status) }),
      make('p', { text: item.rationale }),
      make('p', { className: 'micro', text: new Date(item.at).toLocaleString() }),
    );
    container.append(article);
  });
}
