import { test } from "node:test";
import assert from "node:assert/strict";
import { ROUNDS, POOL, GAP_BANDS, guessPoints, guessRounds, hotterRounds, hotterIndex, sliderMiss, readChallenge, challengeQuery } from "../src/game.js";

// A seeded generator, so a failing deal can be replayed.
function seeded(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
}

test("the pool has enough distinct objects for a game without repeats", () => {
  assert.ok(POOL.length >= ROUNDS);
  assert.ok(POOL.every(o => o.T >= 1000 && o.T <= 45000));
});

test("a guess game deals ten different objects", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const rounds = guessRounds(seeded(seed));
    assert.equal(rounds.length, ROUNDS);
    assert.equal(new Set(rounds.map(([o]) => o.slug)).size, ROUNDS);
  }
});

// The point of scoring along the slider (roadmap P4.B): the same kelvin miss costs far more
// where color changes quickly than among the hottest stars, where it barely changes.
test("guesses score by slider distance, not kelvin", () => {
  assert.equal(guessPoints(5772, 5772), 100);
  assert.equal(guessPoints(5800, 5772), 100, "within 1% of the slider is perfect");
  assert.equal(guessPoints(100, 40000), 0);
  assert.ok(guessPoints(50000, 40000) > 90, "10,000 K off among O stars is a near miss");
  assert.ok(guessPoints(2850, 1850) < 70, "1,000 K off a candle costs much more");
  assert.equal(guessPoints(2000, 3000), guessPoints(3000, 2000));
});

test("points fall steadily with the miss", () => {
  let previous = 101;
  for (let T = 5772; T <= 100000; T *= 1.05) {
    const points = guessPoints(T, 5772);
    assert.ok(points <= previous && points >= 0, `${T} K`);
    previous = points;
  }
  assert.equal(previous, 0);
});

test("Which is hotter? pairs get closer each round and never tie", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const rounds = hotterRounds(seeded(seed));
    assert.equal(rounds.length, ROUNDS);
    rounds.forEach((pair, i) => {
      const gap = sliderMiss(pair[0].T, pair[1].T);
      assert.ok(gap >= GAP_BANDS[i][0] && gap <= GAP_BANDS[i][1], `seed ${seed} round ${i + 1}: gap ${gap.toFixed(3)}`);
      assert.notEqual(pair[0].T, pair[1].T);
      assert.equal(pair[hotterIndex(pair)].T, Math.max(pair[0].T, pair[1].T));
    });
  }
});

test("the hotter one is on either side", () => {
  const sides = hotterRounds(seeded(7)).concat(hotterRounds(seeded(8))).map(hotterIndex);
  assert.ok(sides.includes(0) && sides.includes(1));
});

test("a shared result round-trips, and junk falls back to a plain game", () => {
  assert.deepEqual(readChallenge(challengeQuery("hotter", 700)), { mode: "hotter", score: 700 });
  assert.deepEqual(readChallenge(""), { mode: "guess", score: null });
  assert.deepEqual(readChallenge("?mode=toString&score=1001"), { mode: "guess", score: null });
  assert.deepEqual(readChallenge("?score=12.5"), { mode: "guess", score: null });
  assert.deepEqual(readChallenge("?score=0"), { mode: "guess", score: 0 });
});
