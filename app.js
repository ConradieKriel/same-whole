import { lcm, positiveInteger, isEquivalent, isCommonDenominator, isEquivalentWithDenominator, isSimplestEquivalent, pickRandomQuestion } from './math-logic.js';

const contentUrl = './lesson-content.json';

const state = {
  lesson: null,
  stage: 0,
  maxUnlocked: 0,
  workedIndex: 0,
  togetherIndex: 0,
  togetherAnswers: [],
  independentPassed: false,
  independentIndex: 0,
  independentAnswers: [],
  independentValues: {},
  independentCurrentFeedback: null,
  independentProblem: null,
  independentQuestionId: 'starter',
  activeTutorText: '',
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function fractionHtml(n, d, size = '') {
  return `<span class="fraction ${size}" aria-label="${n} over ${d}"><span>${n}</span><span class="bar" aria-hidden="true"></span><span>${d}</span></span>`;
}

function problemHtml(problem) {
  return `<div class="problem-strip" aria-label="${problem.left.n}/${problem.left.d} ${problem.operator} ${problem.right.n}/${problem.right.d}">
    ${fractionHtml(problem.left.n, problem.left.d)}
    <span class="operator" aria-hidden="true">${escapeHtml(problem.operator)}</span>
    ${fractionHtml(problem.right.n, problem.right.d)}
  </div>`;
}

function readNumber(form, name) {
  const input = form.elements.namedItem(name);
  return input ? positiveInteger(input.value.trim()) : null;
}

function readFraction(form, prefix) {
  return {
    n: readNumber(form, `${prefix}Numerator`),
    d: readNumber(form, `${prefix}Denominator`),
  };
}

function setTutorText(message) {
  state.activeTutorText = message;
  const copy = $('#tutor-welcome');
  if (copy) copy.textContent = message;
}

function speakCurrentText() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.activeTutorText || state.lesson.tutor.welcome);
  utterance.rate = 0.96;
  utterance.pitch = 1;
  utterance.lang = 'en-ZA';
  utterance.onstart = () => { $('#speak-button').setAttribute('aria-pressed', 'true'); $('#stop-speech').hidden = false; };
  utterance.onend = () => { $('#speak-button').setAttribute('aria-pressed', 'false'); $('#stop-speech').hidden = true; };
  utterance.onerror = () => { $('#speak-button').setAttribute('aria-pressed', 'false'); $('#stop-speech').hidden = true; };
  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  $('#speak-button').setAttribute('aria-pressed', 'false');
  $('#stop-speech').hidden = true;
}

function setStage(stage) {
  if (stage < 0 || stage > 3 || stage > state.maxUnlocked) return;
  stopSpeech();
  state.stage = stage;
  if (state.lesson) {
    if (stage === 0) setTutorText(state.lesson.tutor.welcome);
    if (stage === 1) setTutorText(state.lesson.workedExample.steps[Math.min(state.workedIndex, state.lesson.workedExample.steps.length - 1)]?.spoken || state.lesson.workedExample.finish);
    if (stage === 2) setTutorText(state.togetherIndex < state.lesson.together.steps.length ? state.lesson.together.steps[state.togetherIndex].question : state.lesson.together.completion);
    if (stage === 3) setTutorText(state.independentPassed ? state.lesson.independent.completion : (getIndependentSteps()[state.independentIndex]?.question || state.lesson.independent.intro));
  }
  render();
  $('#lesson-content').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function updateNavigation() {
  const stages = state.lesson.navigation.stages;
  $('#stage-count').textContent = `PART ${state.stage + 1} OF 4`;
  $('#stage-label').textContent = stages[state.stage].shortLabel.toUpperCase();
  $('#progress-fill').style.width = `${(state.stage + 1) * 25}%`;
  $$('.stage-link').forEach((button, index) => {
    button.classList.toggle('is-active', index === state.stage);
    button.classList.toggle('is-complete', index < state.maxUnlocked);
    button.disabled = index > state.maxUnlocked;
    if (index === state.stage) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  $('#back-button').disabled = state.stage === 0;
  const next = $('#next-button');
  const notes = [
    state.lesson.ui.partStartNote,
    state.workedIndex >= state.lesson.workedExample.steps.length ? state.lesson.ui.workedCompleteNote : state.lesson.ui.workedContinueNote,
    state.togetherIndex >= state.lesson.together.steps.length ? state.lesson.ui.togetherCompleteNote : state.lesson.ui.togetherContinueNote,
    state.independentPassed ? state.lesson.ui.independentCompleteNote : state.lesson.ui.independentContinueNote
  ];
  $('#control-note').textContent = notes[state.stage];
  if (state.stage === 0) {
    next.disabled = false; next.textContent = state.lesson.ui.continue;
  } else if (state.stage === 1) {
    next.disabled = state.workedIndex < state.lesson.workedExample.steps.length;
    next.textContent = state.lesson.ui.tryTogether;
  } else if (state.stage === 2) {
    next.disabled = state.togetherIndex < state.lesson.together.steps.length;
    next.textContent = state.lesson.ui.tryAlone;
  } else {
    next.disabled = !state.independentPassed;
    next.textContent = state.independentPassed ? state.lesson.ui.review : state.lesson.ui.finishFirst;
  }
}


function renderExplain() {
  const lesson = state.lesson.explain;
  const visual = lesson.visualFractions;
  return `
    <p class="kicker">01 / THE IDEA</p>
    <h1>${escapeHtml(lesson.heading)}</h1>
    <p class="lede">${escapeHtml(state.lesson.meta.subtitle)}</p>
    <p class="explain-intro">${escapeHtml(lesson.intro)}</p>
    <div class="fraction-visual">
      <div class="visual-equation" aria-label="${visual.left.n}/${visual.left.d} ${visual.operator} ${visual.right.n}/${visual.right.d}">
        ${fractionHtml(visual.left.n, visual.left.d, 'large')} <span class="operator" aria-hidden="true">${escapeHtml(visual.operator)}</span> ${fractionHtml(visual.right.n, visual.right.d, 'large')}
      </div>
      <p class="visual-caption">${escapeHtml(lesson.visualCaption)}</p>
    </div>
    <div class="explain-list">
      ${lesson.blocks.map((block) => `
        <article class="explain-row">
          <span class="explain-number">${escapeHtml(block.number)}</span>
          <div><h2>${escapeHtml(block.heading)}</h2><p>${escapeHtml(block.body)}</p></div>
        </article>`).join('')}
    </div>
    <p class="remember-note">${escapeHtml(lesson.remember)}</p>
  `;
}

function renderWorked() {
  const lesson = state.lesson.workedExample;
  const total = lesson.steps.length;
  const index = state.workedIndex;
  const step = lesson.steps[index];
  let stepMarkup = '';
  if (step) {
    stepMarkup = `
      <div class="worked-step" aria-live="polite">
        <p class="step-kicker">LINE ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</p>
        <h2>${escapeHtml(step.label)}</h2>
        <p class="math-line">${escapeHtml(step.math)}</p>
        <p class="worked-explanation">${escapeHtml(step.spoken)}</p>
      </div>
      <div class="worked-controls">
        <button id="worked-back" class="button button-quiet button-small" type="button" ${index === 0 ? 'disabled' : ''}>${escapeHtml(state.lesson.ui.workedPrevious)}</button>
        <span class="step-position">${index + 1} of ${total}</span>
        <button id="worked-next" class="button button-primary button-small" type="button">${escapeHtml(index === total - 1 ? state.lesson.ui.workedFinish : state.lesson.ui.workedNext)}</button>
      </div>`;
  } else {
    stepMarkup = `<div class="worked-finish" role="status"><p>${escapeHtml(lesson.finish)}</p><button id="worked-review-last" class="text-button" type="button">${escapeHtml(state.lesson.ui.reviewLastWorkedLine)}</button></div>`;
  }
  return `
    <p class="kicker">02 / WATCH A WORKED EXAMPLE</p>
    <div class="practice-heading"><h1>${escapeHtml(lesson.heading)}</h1><p class="lede">${escapeHtml(lesson.intro)}</p></div>
    ${problemHtml(lesson.problem)}
    <div class="worked-panel">${stepMarkup}</div>
  `;
}

function practiceStepFeedback(message, success = false) {
  const ui = state.lesson.ui;
  return `<div class="feedback ${success ? '' : 'is-error'}" role="status"><strong>${escapeHtml(success ? ui.feedbackCorrectTitle : ui.feedbackTryAgainTitle)}</strong>${escapeHtml(message)}</div>`;
}

function renderFractionEntry(prefix, current = {}) {
  return `<div class="entry-line">
    <span class="entry-prefix">${escapeHtml(state.lesson.ui.yourFraction)}</span>
    <div class="fraction-entry" aria-label="${escapeHtml(state.lesson.ui.fractionEntryAria)}">
      <input class="number-input" name="${prefix}Numerator" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="${escapeHtml(state.lesson.ui.numeratorAria)}" placeholder="${escapeHtml(state.lesson.ui.topPlaceholder)}" value="${current.n ?? ''}">
      <span class="entry-bar" aria-hidden="true"></span>
      <input class="number-input" name="${prefix}Denominator" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="${escapeHtml(state.lesson.ui.denominatorAria)}" placeholder="${escapeHtml(state.lesson.ui.bottomPlaceholder)}" value="${current.d ?? ''}">
    </div>
  </div>`;
}

function renderHint(step, stageId) {
  return `<button class="hint-button" type="button" data-hint="${escapeHtml(step.id)}" data-stage="${stageId}">${escapeHtml(state.lesson.ui.needHint)}</button><div class="hint-slot" id="hint-${escapeHtml(step.id)}"></div>`;
}

function renderCurrentTogetherStep() {
  const lesson = state.lesson.together;
  const index = state.togetherIndex;
  if (index >= lesson.steps.length) {
    const answers = state.togetherAnswers;
    return `
      <div class="practice-summary" role="status">
        <h2>${escapeHtml(state.lesson.ui.togetherCompletedHeading)}</h2>
        <p>${escapeHtml(lesson.completion)}</p>
        <button id="together-review-last" class="text-button" type="button">${escapeHtml(state.lesson.ui.reviewLastLine)}</button>
      </div>
      <div class="work-form completed-lines">
        ${lesson.steps.map((step, i) => `<div class="step-form-row"><h2>${escapeHtml(step.label)}</h2><p class="math-line">${escapeHtml(answers[i].display)}</p></div>`).join('')}
      </div>`;
  }
  const step = lesson.steps[index];
  const problem = lesson.problem;
  const common = state.togetherAnswers[0]?.value;
  const left = state.togetherAnswers[1]?.value;
  const right = state.togetherAnswers[2]?.value;
  let promptMarkup = '';
  if (step.kind === 'denominator') {
    promptMarkup = `<div class="entry-line"><span class="entry-prefix">${escapeHtml(state.lesson.ui.commonDenominatorLabel)}</span><input class="number-input" name="denominator" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="${escapeHtml(state.lesson.ui.commonDenominatorAria)}" placeholder="?"></div>`;
  } else if (step.kind === 'equivalent') {
    const source = problem[step.source];
    const sourceLabel = `${source.n}/${source.d}`;
    promptMarkup = `<div class="entry-line"><span class="entry-prefix">${sourceLabel} =</span>${renderFractionEntry('answer')}</div>`;
  } else if (step.kind === 'sum') {
    promptMarkup = `<div class="entry-line"><span class="entry-prefix">${left?.n ?? '?'} + ${right?.n ?? '?'} =</span><input class="number-input" name="sumNumerator" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="${escapeHtml(state.lesson.ui.sumNumeratorAria)}" placeholder="?"><span class="fixed-denominator">/ ${common ?? '?'}</span></div>`;
  } else if (step.kind === 'finalFraction') {
    const numerator = state.togetherAnswers[3]?.value?.n ?? '?';
    const denominator = common ?? '?';
    promptMarkup = `<div class="entry-line"><span class="entry-prefix">${numerator}/${denominator} =</span>${renderFractionEntry('final')}</div>`;
  }
  const previousLines = lesson.steps.slice(0, index).map((previous, i) => `
    <div class="completed-line"><span class="completed-mark" aria-hidden="true">✓</span><span>${escapeHtml(previous.label.replace(/^\d\.\s*/, ''))}</span><strong>${escapeHtml(state.togetherAnswers[i].display)}</strong></div>`).join('');
  return `
    <div class="completed-lines">${previousLines}</div>
    <form id="together-form" class="work-form">
      <div class="step-form-row current-step">
        <p class="step-kicker">YOUR WORK / LINE ${index + 1} OF ${lesson.steps.length}</p>
        <h2>${escapeHtml(step.label)}</h2>
        <p class="step-question">${escapeHtml(step.question)}</p>
        ${promptMarkup}
        <div class="step-actions">${renderHint(step, 'together')}${index > 0 ? `<button id="together-previous" class="text-button" type="button">${escapeHtml(state.lesson.ui.previousLine)}</button>` : ''}<button class="button button-primary button-small" type="submit">${escapeHtml(state.lesson.ui.checkThisLine)}</button></div>
        <div id="step-feedback"></div>
      </div>
    </form>`;
}

function renderTogether() {
  const lesson = state.lesson.together;
  return `
    <p class="kicker">03 / TRY ONE TOGETHER</p>
    <div class="practice-heading"><h1>${escapeHtml(lesson.heading)}</h1><p class="lede">${escapeHtml(lesson.intro)}</p></div>
    <p class="explain-intro">${escapeHtml(lesson.prompt)}</p>
    ${problemHtml(lesson.problem)}
    ${renderCurrentTogetherStep()}
  `;
}

function renderIndependent() {
  const lesson = state.lesson.independent;
  const steps = getIndependentSteps();
  const problem = state.independentProblem || lesson.problem;
  const index = state.independentIndex;
  const step = steps[index];
  const completed = state.independentAnswers.map((answer, answerIndex) => `
    <div class="completed-line">
      <span class="completed-mark" aria-hidden="true">✓</span>
      <span>${escapeHtml(steps[answerIndex].label.replace(/^\d\.\s*/, ''))}</span>
      <strong>${escapeHtml(answer.display)}</strong>
    </div>`).join('');

  const summary = state.independentPassed ? `
    <div class="practice-summary" role="status" aria-live="polite">
      <h2>${escapeHtml(state.lesson.ui.independentSummarySuccess)}</h2>
      <p>${escapeHtml(lesson.completion)}</p>
      <button id="new-independent-question" class="button button-primary" type="button">${escapeHtml(lesson.newQuestionLabel)}</button>
      <p class="new-question-note">${escapeHtml(lesson.newQuestionNote)}</p>
    </div>` : '';

  const questionPrompt = fillTemplate(lesson.promptTemplate, {
    left: displayFraction(problem.left),
    right: displayFraction(problem.right),
  });

  if (!step) {
    return `
      <p class="kicker">04 / ON YOUR OWN</p>
      <div class="practice-heading"><h1>${escapeHtml(lesson.heading)}</h1><p class="lede">${escapeHtml(lesson.intro)}</p></div>
      <p class="explain-intro">${escapeHtml(questionPrompt)}</p>
      ${problemHtml(problem)}
      <div class="completed-lines" aria-label="${escapeHtml(lesson.previousWorkLabel)}">${completed}</div>
      ${summary}`;
  }

  const values = state.independentValues || {};
  let promptMarkup = '';
  if (step.kind === 'denominator') {
    promptMarkup = `<div class="entry-line"><span class="entry-prefix">${escapeHtml(state.lesson.ui.commonDenominatorLabel)}</span><input class="number-input" name="denominator" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="${escapeHtml(state.lesson.ui.commonDenominatorAria)}" placeholder="?" value="${escapeHtml(values.denominator ?? '')}"></div>`;
  } else if (step.kind === 'equivalent') {
    const original = problem[step.source];
    promptMarkup = `<div class="entry-line"><span class="entry-prefix">${original.n}/${original.d} =</span>${renderFractionEntry(step.source, values[step.source] ?? {})}</div>`;
  } else if (step.kind === 'sum') {
    const common = values.denominator || '?';
    const leftN = values.left?.n ?? '?';
    const rightN = values.right?.n ?? '?';
    promptMarkup = `<div class="entry-line"><span class="entry-prefix">${leftN} + ${rightN} =</span><input class="number-input" name="sumNumerator" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="${escapeHtml(state.lesson.ui.sumNumeratorAria)}" placeholder="?" value="${escapeHtml(values.sum ?? '')}"><span class="fixed-denominator">/ ${common}</span></div>`;
  } else if (step.kind === 'finalFraction') {
    const numerator = values.sum ?? '?';
    const denominator = values.denominator ?? '?';
    promptMarkup = `<div class="entry-line"><span class="entry-prefix">${numerator}/${denominator} =</span>${renderFractionEntry('final', values.final ?? {})}</div>`;
  }

  const feedback = state.independentCurrentFeedback
    ? practiceStepFeedback(state.independentCurrentFeedback.message, state.independentCurrentFeedback.ok)
    : '';

  return `
    <p class="kicker">04 / ON YOUR OWN</p>
    <div class="practice-heading"><h1>${escapeHtml(lesson.heading)}</h1><p class="lede">${escapeHtml(lesson.intro)}</p></div>
    <p class="explain-intro">${escapeHtml(questionPrompt)}</p>
    ${problemHtml(problem)}
    <div class="completed-lines" aria-label="${escapeHtml(lesson.previousWorkLabel)}">${completed}</div>
    <form id="independent-form" class="work-form">
      <section class="step-form-row current-step" aria-live="polite">
        <p class="step-kicker">${escapeHtml(fillTemplate(lesson.lineCounterTemplate, { current: index + 1, total: steps.length }))}</p>
        <h2>${escapeHtml(step.label)}</h2>
        <p class="step-question">${escapeHtml(step.question)}</p>
        ${promptMarkup}
        <div class="step-actions">
          ${renderHint(step, 'independent')}
          ${index > 0 ? `<button id="independent-previous" class="text-button" type="button">${escapeHtml(state.lesson.ui.previousLine)}</button>` : ''}
          <button class="button button-primary button-small" type="submit">${escapeHtml(state.lesson.ui.checkThisLine)}</button>
        </div>
        <div id="independent-step-feedback">${feedback}</div>
      </section>
    </form>
    ${summary}`;
}

function render() {
  updateNavigation();
  const content = $('#lesson-content');
  const renderers = [renderExplain, renderWorked, renderTogether, renderIndependent];
  content.innerHTML = renderers[state.stage]();
  bindStageEvents();
}

function bindStageEvents() {
  if (state.stage === 1) {
    $('#worked-next')?.addEventListener('click', () => {
      state.workedIndex = Math.min(state.workedIndex + 1, state.lesson.workedExample.steps.length);
      if (state.workedIndex < state.lesson.workedExample.steps.length) setTutorText(state.lesson.workedExample.steps[state.workedIndex].spoken);
      else setTutorText(state.lesson.workedExample.finish);
      render();
    });
    $('#worked-back')?.addEventListener('click', () => {
      state.workedIndex = Math.max(0, state.workedIndex - 1);
      const step = state.lesson.workedExample.steps[state.workedIndex];
      if (step) setTutorText(step.spoken);
      render();
    });
    $('#worked-review-last')?.addEventListener('click', () => {
      state.workedIndex = Math.max(0, state.lesson.workedExample.steps.length - 1);
      setTutorText(state.lesson.workedExample.steps[state.workedIndex].spoken);
      render();
    });
  }
  if (state.stage === 2) {
    $('#together-review-last')?.addEventListener('click', () => {
      if (state.togetherIndex > 0) {
        state.togetherAnswers.pop();
        state.togetherIndex -= 1;
        setTutorText(state.lesson.ui.previousLineMessage);
        render();
      }
    });
    $('#together-form')?.addEventListener('submit', handleTogetherSubmit);
    $('#together-previous')?.addEventListener('click', () => {
      if (state.togetherIndex > 0) {
        state.togetherAnswers.pop();
        state.togetherIndex -= 1;
        setTutorText(state.lesson.ui.previousLineMessage);
        render();
      }
    });
  }
  if (state.stage === 3) {
    $('#independent-form')?.addEventListener('submit', handleIndependentSubmit);
    $('#independent-previous')?.addEventListener('click', returnToPreviousIndependentLine);
    $('#new-independent-question')?.addEventListener('click', startNewIndependentQuestion);
  }
  $$('.hint-button').forEach((button) => button.addEventListener('click', () => {
    const stageName = button.dataset.stage;
    const list = stageName === 'together' ? state.lesson.together.steps : getIndependentSteps();
    const step = list.find((item) => item.id === button.dataset.hint);
    if (!step) return;
    const slot = $(`#hint-${CSS.escape(step.id)}`);
    if (!slot) return;
    const wasOpen = !!slot.innerHTML;
    slot.innerHTML = wasOpen ? '' : `<div class="hint-box">${escapeHtml(step.hint)}</div>`;
    button.textContent = wasOpen ? state.lesson.ui.needHint : state.lesson.ui.hideHint;
    if (!wasOpen) setTutorText(step.hint);
  }));
}

function checkDenominator(value, problem) {
  if (!value) return { ok: false, message: state.lesson.ui.commonDenominatorMissing };
  const smallest = lcm(problem.left.d, problem.right.d);
  if (!isCommonDenominator(value, problem.left.d, problem.right.d)) {
    return { ok: false, message: null, type: 'wrong' };
  }
  return { ok: true, value, smallest };
}

function checkEquivalent(value, original, common) {
  if (!value.n || !value.d) return { ok: false, reason: 'missing' };
  if (value.d !== common) return { ok: false, reason: 'denominator' };
  if (!isEquivalentWithDenominator(value, original, common)) return { ok: false, reason: 'numerator' };
  return { ok: true, value };
}

function checkFinalFraction(value, numerator, denominator) {
  if (!value.n || !value.d) return { ok: false, reason: 'missing' };
  if (!isEquivalent(value, { n: numerator, d: denominator })) return { ok: false, reason: 'wrong' };
  if (!isSimplestEquivalent(value, { n: numerator, d: denominator })) return { ok: false, reason: 'notSimplified' };
  return { ok: true, value };
}

function gcdForFeedback(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a) || 1;
}

function displayFraction(value) {
  return `${value.n}/${value.d}`;
}

function fillTemplate(template, values = {}) {
  return String(template || '').replace(/\{([^}]+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

function getIndependentSteps() {
  const lesson = state.lesson.independent;
  const problem = state.independentProblem || lesson.problem;
  const smallest = lcm(problem.left.d, problem.right.d);
  const values = {
    leftDenominator: problem.left.d,
    rightDenominator: problem.right.d,
    leftNumerator: problem.left.n,
    rightNumerator: problem.right.n,
    leftFraction: displayFraction(problem.left),
    rightFraction: displayFraction(problem.right),
    smallest,
  };

  return lesson.steps.map((step) => {
    const built = { ...step };
    if (step.questionTemplate) built.question = fillTemplate(step.questionTemplate, values);
    if (step.kind === 'denominator') {
      built.correctFeedback = fillTemplate(step.correctFeedbackTemplate, values);
      built.largerFeedback = fillTemplate(step.largerFeedbackTemplate, values);
    }
    return built;
  });
}

function handleTogetherSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const lesson = state.lesson.together;
  const step = lesson.steps[state.togetherIndex];
  const problem = lesson.problem;
  let result;
  let display = '';
  let value;

  if (step.kind === 'denominator') {
    value = readNumber(form, 'denominator');
    result = checkDenominator(value, problem);
    if (result.ok) {
      display = `Common denominator: ${value}`;
      const message = value === result.smallest ? step.correctFeedback : (step.largerFeedback || `That is a valid common denominator. The smallest is ${result.smallest}.`);
      state.togetherAnswers.push({ value, display });
      advanceTogether(message);
      return;
    }
    const message = value ? (result.type === 'wrong' ? step.wrongFeedback : state.lesson.ui.commonDenominatorOutOfRange) : state.lesson.ui.commonDenominatorMissing;
    showStepError(step, message);
    return;
  }

  if (step.kind === 'equivalent') {
    value = readFraction(form, 'answer');
    const original = problem[step.source];
    const common = state.togetherAnswers[0].value;
    result = checkEquivalent(value, original, common);
    if (result.ok) {
      const displayValue = displayFraction(value);
      display = `${original.n}/${original.d} = ${displayValue}`;
      state.togetherAnswers.push({ value, display });
      advanceTogether(step.correctFeedback || `${displayValue} has the same value as ${original.n}/${original.d}.`);
      return;
    }
    let message = step.wrongFeedback;
    if (result.reason === 'denominator') message = step.wrongDenominator;
    if (result.reason === 'numerator') message = step.wrongNumerator;
    if (result.reason === 'missing') message = state.lesson.ui.equivalentFractionMissing;
    showStepError(step, message);
    return;
  }

  if (step.kind === 'sum') {
    value = readNumber(form, 'sumNumerator');
    const left = state.togetherAnswers[1].value;
    const right = state.togetherAnswers[2].value;
    const expected = left.n + right.n;
    if (value === expected) {
      display = `${left.n}/${left.d} + ${right.n}/${right.d} = ${expected}/${left.d}`;
      state.togetherAnswers.push({ value: { n: value, d: left.d }, display });
      advanceTogether(step.correctFeedback);
      return;
    }
    showStepError(step, value ? step.wrongFeedback : state.lesson.ui.sumMissing);
    return;
  }

  if (step.kind === 'finalFraction') {
    value = readFraction(form, 'final');
    const sum = state.togetherAnswers[3].value;
    result = checkFinalFraction(value, sum.n, sum.d);
    if (result.ok) {
      display = `${sum.n}/${sum.d} = ${displayFraction(value)}`;
      state.togetherAnswers.push({ value, display });
      const factor = gcdForFeedback(sum.n, sum.d);
      const message = step.correctFeedbackTemplate
        .replace('{from}', `${sum.n}/${sum.d}`)
        .replace('{to}', displayFraction(value))
        .replace('{factor}', String(factor));
      advanceTogether(message);
      return;
    }
    let message = step.wrongFeedback;
    if (result.reason === 'notSimplified') message = step.equivalentNotSimplified;
    if (result.reason === 'missing') message = state.lesson.ui.finalFractionMissing;
    showStepError(step, message);
  }
}

function showStepError(step, message) {
  $('#step-feedback').innerHTML = practiceStepFeedback(message, false);
  setTutorText(message);
}

function advanceTogether(message) {
  setTutorText(message);
  state.togetherIndex += 1;
  if (state.togetherIndex === state.lesson.together.steps.length) {
    state.maxUnlocked = Math.max(state.maxUnlocked, 3);
    setTutorText(state.lesson.together.completion);
  }
  render();
}

function collectIndependentStepValue(form, step) {
  if (step.kind === 'denominator') return readNumber(form, 'denominator');
  if (step.kind === 'equivalent') return readFraction(form, step.source);
  if (step.kind === 'sum') return readNumber(form, 'sumNumerator');
  if (step.kind === 'finalFraction') return readFraction(form, 'final');
  return null;
}

function checkIndependentStep(step, value) {
  const problem = state.independentProblem;
  const values = state.independentValues;

  if (step.kind === 'denominator') {
    const result = checkDenominator(value, problem);
    if (!result.ok) {
      const message = value ? step.wrongFeedback : state.lesson.ui.commonDenominatorMissing;
      return { ok: false, message };
    }
    const message = value === result.smallest
      ? fillTemplate(step.correctFeedbackTemplate, { value, smallest: result.smallest })
      : fillTemplate(step.largerFeedbackTemplate, { value, smallest: result.smallest });
    return { ok: true, message, value, display: `${state.lesson.ui.commonDenominatorLabel}: ${value}`, key: 'denominator' };
  }

  if (step.kind === 'equivalent') {
    const original = problem[step.source];
    const common = values.denominator;
    const result = common ? checkEquivalent(value, original, common) : { ok: false, reason: 'blocked' };
    if (!result.ok) {
      let message = step.wrongFeedback || state.lesson.ui.independentEquivalentBlocked;
      if (result.reason === 'denominator') message = step.wrongDenominator;
      if (result.reason === 'numerator') message = step.wrongNumerator;
      if (result.reason === 'missing') message = state.lesson.ui.independentEquivalentMissing;
      if (result.reason === 'blocked') message = state.lesson.ui.independentEquivalentBlocked;
      return { ok: false, message };
    }
    const fraction = displayFraction(value);
    const message = fillTemplate(step.correctFeedbackTemplate, { fraction, original: displayFraction(original) });
    return { ok: true, message, value, display: `${displayFraction(original)} = ${fraction}`, key: step.source };
  }

  if (step.kind === 'sum') {
    if (!value) return { ok: false, message: state.lesson.ui.sumMissing };
    const left = values.left;
    const right = values.right;
    if (!left || !right) return { ok: false, message: state.lesson.ui.independentAddBlocked };
    const expected = left.n + right.n;
    if (value !== expected) return { ok: false, message: step.wrongFeedback };
    const message = fillTemplate(step.correctFeedbackTemplate, {
      left: left.n, right: right.n, sum: value, denominator: values.denominator,
    });
    return { ok: true, message, value, display: `${left.n}/${left.d} + ${right.n}/${right.d} = ${value}/${values.denominator}`, key: 'sum' };
  }

  if (step.kind === 'finalFraction') {
    if (!value?.n || !value?.d) return { ok: false, message: state.lesson.ui.finalFractionMissing };
    if (values.sum === undefined || values.denominator === undefined) {
      return { ok: false, message: state.lesson.ui.independentFinalBlocked };
    }
    const result = checkFinalFraction(value, values.sum, values.denominator);
    if (!result.ok) {
      const message = result.reason === 'notSimplified'
        ? step.equivalentNotSimplified
        : (result.reason === 'missing' ? state.lesson.ui.finalFractionMissing : step.wrongFeedback);
      return { ok: false, message };
    }
    const fraction = displayFraction(value);
    const message = fillTemplate(step.correctFeedbackTemplate, { fraction });
    return { ok: true, message, value, display: `${values.sum}/${values.denominator} = ${fraction}`, key: 'final' };
  }

  return { ok: false, message: state.lesson.ui.independentFinalBlocked };
}

function handleIndependentSubmit(event) {
  event.preventDefault();
  if (state.independentPassed) return;

  const steps = getIndependentSteps();
  const step = steps[state.independentIndex];
  if (!step) return;

  const value = collectIndependentStepValue(event.currentTarget, step);
  const result = checkIndependentStep(step, value);

  // Keep the current entry so a learner can correct it without starting over.
  if (step.kind === 'denominator') state.independentValues.denominator = value;
  if (step.kind === 'equivalent') state.independentValues[step.source] = value;
  if (step.kind === 'sum') state.independentValues.sum = value;
  if (step.kind === 'finalFraction') state.independentValues.final = value;

  state.independentCurrentFeedback = { ok: result.ok, message: result.message };
  setTutorText(result.message);

  if (result.ok) {
    state.independentAnswers.push({
      key: result.key,
      value: result.value,
      display: result.display,
    });
    state.independentIndex += 1;
    state.independentCurrentFeedback = null;

    if (state.independentIndex >= steps.length) {
      state.independentPassed = true;
      state.maxUnlocked = 3;
      setTutorText(state.lesson.independent.completion);
    }
  }

  render();
  $('#independent-form')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function returnToPreviousIndependentLine() {
  if (state.independentIndex <= 0 || state.independentPassed) return;
  state.independentIndex -= 1;
  state.independentAnswers = state.independentAnswers.slice(0, state.independentIndex);
  state.independentValues = {};
  state.independentAnswers.forEach((answer) => {
    state.independentValues[answer.key] = answer.value;
  });
  state.independentCurrentFeedback = null;
  setTutorText(state.lesson.ui.previousLineMessage);
  render();
}

function startNewIndependentQuestion() {
  const nextQuestion = pickRandomQuestion(
    state.lesson.independent.questionBank,
    state.independentQuestionId,
  );
  if (!nextQuestion) return;

  state.independentProblem = structuredClone(nextQuestion.problem);
  state.independentQuestionId = nextQuestion.id;
  state.independentIndex = 0;
  state.independentAnswers = [];
  state.independentValues = {};
  state.independentCurrentFeedback = null;
  state.independentPassed = false;
  setTutorText(state.lesson.independent.newQuestionTutor);
  render();
  $('#independent-form')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  $('[name="denominator"]')?.focus({ preventScroll: true });
}

function bindGlobalEvents() {
  $('#stage-nav').addEventListener('click', (event) => {
    const button = event.target.closest('[data-stage]');
    if (!button || button.disabled) return;
    setStage(Number(button.dataset.stage));
  });
  $('#back-button').addEventListener('click', () => setStage(state.stage - 1));
  $('#next-button').addEventListener('click', () => {
    if (state.stage < 3) {
      state.maxUnlocked = Math.max(state.maxUnlocked, state.stage + 1);
      setStage(state.stage + 1);
    } else if (state.independentPassed) {
      state.stage = 0;
      state.maxUnlocked = 0;
      state.workedIndex = 0;
      state.togetherIndex = 0;
      state.togetherAnswers = [];
          state.independentPassed = false;
      state.independentIndex = 0;
      state.independentAnswers = [];
      state.independentValues = {};
      state.independentCurrentFeedback = null;
      state.independentProblem = state.lesson.independent.problem;
      state.independentQuestionId = 'starter';
      setTutorText(state.lesson.tutor.welcome);
      render();
    }
  });
  $('#speak-button').addEventListener('click', speakCurrentText);
  $('#stop-speech').addEventListener('click', stopSpeech);
  window.addEventListener('beforeunload', stopSpeech);
}

async function initialise() {
  try {
    const response = await fetch(contentUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load lesson content (${response.status}).`);
    state.lesson = await response.json();
    state.independentProblem = structuredClone(state.lesson.independent.problem);
    document.title = `${state.lesson.meta.name} — Adding fractions`;
    const audienceLabel = $('#audience-label');
    if (audienceLabel) audienceLabel.textContent = state.lesson.meta.audience;
    $('#tutor-name').textContent = state.lesson.tutor.name;
    setTutorText(state.lesson.tutor.welcome);
    if (!('speechSynthesis' in window)) {
      $('#speak-button').disabled = true;
      $('#speak-button').textContent = state.lesson.ui.voiceUnavailable;
    }
    bindGlobalEvents();
    render();
  } catch (error) {
    $('#lesson-content').innerHTML = `<p class="kicker">${escapeHtml(state.lesson?.ui?.lessonLoadKicker || 'LESSON NOT AVAILABLE')}</p><h1>${escapeHtml(state.lesson?.ui?.lessonLoadHeading || "We couldn't open the lesson.")}</h1><p class="lede">${escapeHtml(error.message)} ${escapeHtml(state.lesson?.ui?.lessonFileHelp || 'Check that the lesson content file is beside this page.')}</p>`;
  }
}

initialise();
