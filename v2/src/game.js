// The rules of the guess-the-temperature game (/play/), with no DOM access so the tests can use them.
import { OBJECTS } from "./data/objects.js";
import { sliderScale } from "./slider-marks.js";

export const ROUNDS = 10;
export const MODES = { guess: "Guess the temperature", hotter: "Which is hotter?" };

// Real objects that glow in color for a dark-adapted eye: from a stove coil to the hottest stars.
export const POOL = OBJECTS.filter(o => o.T >= 1000 && o.T <= 45000);

// Misses are measured along the slider, not in kelvin. The slider gives most of its length to the
// temperatures where color changes, so 10,000 K off at 40,000 K costs less than 1,000 K off at 2,000 K.
export const sliderMiss = (guessT, targetT) => Math.abs(sliderScale.toFraction(guessT) - sliderScale.toFraction(targetT));
export const PERFECT_WITHIN = 0.01;
export const ZERO_AT = 0.25;
export const guessPoints = (guessT, targetT) => Math.round(100 * Math.min(1, Math.max(0, (ZERO_AT - sliderMiss(guessT, targetT)) / (ZERO_AT - PERFECT_WITHIN))));

function shuffle(items, random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One object per round, never the same one twice in a game.
export const guessRounds = (random = Math.random) => shuffle(POOL, random).slice(0, ROUNDS).map(o => [o]);

// Each round's pair is between GAP_BANDS[i][0] and [1] apart on the slider: easy to tell apart at
// first, then closer. 0.05 is still about 900 K around the Sun and 1,500 K around Sirius.
export const GAP_BANDS = Array.from({ length: ROUNDS }, (_, i) => {
  const min = 0.3 - (0.25 * i) / (ROUNDS - 1);
  return [min, 2 * min];
});

export function hotterRounds(random = Math.random) {
  const pairs = POOL.flatMap((a, i) => POOL.slice(i + 1).map(b => [a, b])).map(pair => [pair, sliderMiss(pair[0].T, pair[1].T)]);
  const used = new Set();
  return GAP_BANDS.map(([min, max]) => {
    const inBand = pairs.filter(([, gap]) => gap >= min && gap <= max).map(([pair]) => pair);
    const fresh = inBand.filter(pair => !pair.some(o => used.has(o)));
    const pair = shuffle(fresh.length ? fresh : inBand, random)[0];
    pair.forEach(o => used.add(o));
    return random() < 0.5 ? pair : [pair[1], pair[0]];
  });
}

export const hotterIndex = ([a, b]) => (a.T > b.T ? 0 : 1);

// A shared result reopens the game in its mode, as a score to beat: ?mode=hotter&score=700.
export function readChallenge(search) {
  const query = new URLSearchParams(search);
  const mode = Object.hasOwn(MODES, query.get("mode")) ? query.get("mode") : "guess";
  const score = query.has("score") ? Number(query.get("score")) : NaN;
  return { mode, score: Number.isInteger(score) && score >= 0 && score <= 100 * ROUNDS ? score : null };
}
export const challengeQuery = (mode, score) => "?" + new URLSearchParams({ mode, score });

export function rating(score) {
  if (score >= 900) return "Spectroscopist's eye.";
  if (score >= 700) return "Sharp eye.";
  if (score >= 500) return "Getting warmer.";
  return "Stars are tricky.";
}
