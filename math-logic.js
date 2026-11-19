export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function lcm(a, b) {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a <= 0 || b <= 0) return null;
  return Math.abs(a * b) / gcd(a, b);
}

export function positiveInteger(value, max = 10000) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= max ? number : null;
}

export function isEquivalent(a, b) {
  return Boolean(a && b && Number.isSafeInteger(a.n) && Number.isSafeInteger(a.d)
    && Number.isSafeInteger(b.n) && Number.isSafeInteger(b.d)
    && a.n > 0 && a.d > 0 && b.n > 0 && b.d > 0
    && a.n * b.d === b.n * a.d);
}

export function isSimplest(value) {
  return Boolean(value && Number.isSafeInteger(value.n) && Number.isSafeInteger(value.d)
    && value.n > 0 && value.d > 0 && gcd(value.n, value.d) === 1);
}

export function isCommonDenominator(value, denominatorA, denominatorB) {
  return Boolean(Number.isSafeInteger(value) && value > 0 && value <= 10000
    && value % denominatorA === 0 && value % denominatorB === 0);
}

export function simplifyFraction(value) {
  if (!value || !Number.isSafeInteger(value.n) || !Number.isSafeInteger(value.d) || value.n <= 0 || value.d <= 0) return null;
  const factor = gcd(value.n, value.d);
  return { n: value.n / factor, d: value.d / factor };
}

export function isEquivalentWithDenominator(candidate, original, commonDenominator) {
  return Boolean(candidate && candidate.d === commonDenominator && isEquivalent(candidate, original));
}

export function isSimplestEquivalent(candidate, expected) {
  return isEquivalent(candidate, expected) && isSimplest(candidate);
}

/** Choose a random practice question, avoiding the question currently on screen. */
export function pickRandomQuestion(questions, currentId, random = Math.random) {
  if (!Array.isArray(questions) || questions.length === 0) return null;
  const alternatives = questions.filter((question) => question.id !== currentId);
  const pool = alternatives.length ? alternatives : questions;
  const sample = Number(random());
  const safeSample = Number.isFinite(sample) ? Math.min(0.999999999, Math.max(0, sample)) : 0;
  return pool[Math.floor(safeSample * pool.length)];
}
