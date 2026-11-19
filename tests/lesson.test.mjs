import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  gcd,
  lcm,
  isEquivalent,
  isSimplest,
  isCommonDenominator,
  isEquivalentWithDenominator,
  isSimplestEquivalent,
  simplifyFraction,
  positiveInteger,
  pickRandomQuestion,
} from '../math-logic.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const lesson = JSON.parse(fs.readFileSync(path.join(here, '..', 'lesson-content.json'), 'utf8'));

test('lesson contains the four required stages in order', () => {
  assert.deepEqual(lesson.navigation.stages.map(stage => stage.id), ['explain', 'watch', 'together', 'independent']);
  assert.equal(lesson.meta.audience, 'Ages 13–16');
});

test('worked example 2/3 + 1/4 is mathematically correct', () => {
  const { left, right } = lesson.workedExample.problem;
  const common = lcm(left.d, right.d);
  const leftTop = left.n * (common / left.d);
  const rightTop = right.n * (common / right.d);
  const result = simplifyFraction({ n: leftTop + rightTop, d: common });
  assert.equal(common, 12);
  assert.deepEqual({ n: leftTop, d: common }, { n: 8, d: 12 });
  assert.deepEqual({ n: rightTop, d: common }, { n: 3, d: 12 });
  assert.deepEqual(result, { n: 11, d: 12 });
});

test('together example accepts the intended working and simplifies 4/6 to 2/3', () => {
  const { left, right } = lesson.together.problem;
  const common = lcm(left.d, right.d);
  const a = { n: left.n * (common / left.d), d: common };
  const b = { n: right.n * (common / right.d), d: common };
  const sum = { n: a.n + b.n, d: common };
  assert.equal(common, 6);
  assert.deepEqual(a, { n: 3, d: 6 });
  assert.deepEqual(b, { n: 1, d: 6 });
  assert.deepEqual(sum, { n: 4, d: 6 });
  assert.deepEqual(simplifyFraction(sum), { n: 2, d: 3 });
});

test('the starter independent question 2/5 + 1/10 simplifies to 1/2', () => {
  const { left, right } = lesson.independent.problem;
  const common = lcm(left.d, right.d);
  const a = { n: left.n * (common / left.d), d: common };
  const b = { n: right.n * (common / right.d), d: common };
  assert.equal(common, 10);
  assert.deepEqual(a, { n: 4, d: 10 });
  assert.deepEqual(b, { n: 1, d: 10 });
  assert.deepEqual(simplifyFraction({ n: a.n + b.n, d: common }), { n: 1, d: 2 });
});

test('independent practice has a varied question bank with correct answers', () => {
  const bank = lesson.independent.questionBank;
  assert.ok(bank.length >= 12);
  assert.equal(new Set(bank.map(question => question.id)).size, bank.length);
  for (const question of bank) {
    const { left, right } = question.problem;
    assert.notEqual(left.d, right.d);
    assert.ok(left.n > 0 && left.n < left.d);
    assert.ok(right.n > 0 && right.n < right.d);
    const common = lcm(left.d, right.d);
    const sum = {
      n: left.n * (common / left.d) + right.n * (common / right.d),
      d: common,
    };
    const simplified = simplifyFraction(sum);
    assert.ok(simplified && simplified.n > 0 && simplified.d > 0);
  }
});

test('random question picker does not immediately repeat the current question', () => {
  const bank = lesson.independent.questionBank;
  const current = bank[0].id;
  assert.notEqual(pickRandomQuestion(bank, current, () => 0).id, current);
  assert.equal(pickRandomQuestion(bank, 'not-in-bank', () => 0).id, bank[0].id);
  assert.equal(pickRandomQuestion([], current), null);
});

test('independent practice content is written as line-by-line templates', () => {
  assert.equal(lesson.independent.steps.length, 5);
  assert.ok(lesson.independent.steps.every(step => step.questionTemplate && step.hint));
  assert.ok(lesson.independent.promptTemplate.includes('{left}'));
});

test('checker accepts equivalent fractions such as 6/8 for 3/4 when denominator 8 is requested', () => {
  assert.equal(isEquivalent({ n: 6, d: 8 }, { n: 3, d: 4 }), true);
  assert.equal(isEquivalentWithDenominator({ n: 6, d: 8 }, { n: 3, d: 4 }, 8), true);
  assert.equal(isEquivalentWithDenominator({ n: 6, d: 8 }, { n: 3, d: 4 }, 12), false);
  assert.equal(isEquivalentWithDenominator({ n: 5, d: 8 }, { n: 3, d: 4 }, 8), false);
});

test('checker accepts any valid shared denominator and rejects invalid ones', () => {
  assert.equal(isCommonDenominator(6, 2, 6), true);
  assert.equal(isCommonDenominator(12, 2, 6), true);
  assert.equal(isCommonDenominator(8, 2, 6), false);
  assert.equal(isCommonDenominator(0, 2, 6), false);
});

test('final answer must be equivalent and in simplest form', () => {
  assert.equal(isEquivalent({ n: 2, d: 3 }, { n: 4, d: 6 }), true);
  assert.equal(isSimplest({ n: 2, d: 3 }), true);
  assert.equal(isSimplest({ n: 4, d: 6 }), false);
  assert.equal(isSimplestEquivalent({ n: 2, d: 3 }, { n: 4, d: 6 }), true);
  assert.equal(isSimplestEquivalent({ n: 4, d: 6 }, { n: 4, d: 6 }), false);
});

test('numeric input rejects zero, decimals, negatives and oversized values', () => {
  assert.equal(positiveInteger('12'), 12);
  assert.equal(positiveInteger('0'), null);
  assert.equal(positiveInteger('-2'), null);
  assert.equal(positiveInteger('2.5'), null);
  assert.equal(positiveInteger('10001'), null);
});

test('lesson copy and answer rules are stored outside the interface code', () => {
  assert.ok(lesson.explain.blocks.length >= 3);
  assert.ok(lesson.workedExample.steps.length >= 4);
  assert.ok(lesson.together.steps.every(step => step.question && step.hint));
  assert.ok(lesson.independent.steps.every(step => step.questionTemplate && step.hint));
  assert.match(lesson.answerRules.commonDenominator, /common multiple/i);
  assert.match(lesson.answerRules.finalFraction, /lowest terms/i);
});

test('phone-first page loads local lesson content without remote assets', () => {
  const html = fs.readFileSync(path.join(here, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(here, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(here, '..', 'styles.css'), 'utf8');
  assert.match(html, /name="viewport"/);
  assert.match(html, /<script type="module" src="app\.js"><\/script>/);
  assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//i);
  assert.match(app, /fetch\(contentUrl/);
  assert.match(app, /new-independent-question/);
  assert.match(app, /independentIndex/);
  assert.match(app, /pickRandomQuestion/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
