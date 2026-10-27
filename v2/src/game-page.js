// The game page (/play/): ten rounds of "Guess the temperature" or "Which is hotter?".
// Colors are the main page's defaults: CIE 1931 at the brightness a dark-adapted eye sees.
import { MODES, ROUNDS, guessRounds, hotterRounds, hotterIndex, guessPoints, readChallenge, challengeQuery, rating } from "./game.js";
import { createSliderMarks, sliderScale, tToSlider, sliderToT } from "./slider-marks.js";
import { formatK, screenColor } from "./format.js";
import { discPaint } from "./stage.js";
import { copyText } from "./share.js";
import { state } from "./state.js";
import { $ } from "./dom.js";

const START_T = Math.round(sliderScale.toT(0.5));
const STORE_KEY = "space-charts:play";
const challenge = readChallenge(location.search);
const game = { mode: challenge.mode, rounds: [], round: 0, score: 0, answer: null, results: [] };

// Best score and games played per mode. Storage can be missing or blocked, so every access is guarded.
function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {};
  } catch {
    return {};
  }
}
function saveRecord(mode, score) {
  const records = loadRecords();
  const record = records[mode] ?? { best: 0, played: 0 };
  records[mode] = { best: Math.max(record.best, score), played: record.played + 1 };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(records));
  } catch {
    // Private windows can refuse storage; the game still works, it just forgets.
  }
  return { ...records[mode], previousBest: record.best };
}

const paintFor = T => screenColor(T, "cie", "eye", state.wide);
const label = o => `${o.name} · ${formatK(o.T)} K`;
const finished = () => game.answer && game.round === ROUNDS - 1;
const challenged = () => challenge.score !== null && challenge.mode === game.mode;
const guessT = () => sliderToT(+$("guess").value);

function newGame(mode = game.mode) {
  Object.assign(game, { mode, rounds: mode === "guess" ? guessRounds() : hotterRounds(), round: 0, score: 0, answer: null, results: [] });
  $("guess").value = tToSlider(START_T);
  render();
}

function answer(pick) {
  if (game.answer) return;
  const objects = game.rounds[game.round];
  if (game.mode === "guess") {
    const T = guessT();
    game.answer = { T, points: guessPoints(T, objects[0].T) };
  } else {
    const right = pick === hotterIndex(objects);
    game.answer = { pick, right, points: right ? 100 : 0 };
  }
  game.score += game.answer.points;
  game.results.push({ objects, ...game.answer });
  if (finished()) game.record = saveRecord(game.mode, game.score);
  render();
}

function next() {
  if (!game.answer) return answer();
  if (finished()) return newGame();
  game.round++;
  game.answer = null;
  $("guess").value = tToSlider(START_T);
  render();
}

function share() {
  const url = location.origin + location.pathname + challengeQuery(game.mode, game.score);
  const text = `I scored ${game.score} of ${100 * ROUNDS} at "${MODES[game.mode]}". Can you beat it?`;
  if (navigator.share) navigator.share({ title: document.title, text, url }).catch(e => e.name === "AbortError" || copyText(url, "Link copied"));
  else copyText(url, "Link copied");
}

function paintDisc(i, T) {
  const disc = $(`disc${i}`);
  const look = T === null ? { background: "none", boxShadow: "none" } : discPaint(paintFor(T));
  disc.style.background = look.background;
  disc.style.boxShadow = look.boxShadow;
  disc.classList.toggle("empty", T === null);
}

function setCaption(i, top, bottom) {
  $(`cap${i}`).firstChild.textContent = top;
  $(`cap${i}`).lastChild.textContent = bottom;
}

function resultText() {
  const objects = game.rounds[game.round];
  const { answer: a } = game;
  if (!a) {
    const ask = game.mode === "guess" ? "Slide to your guess and lock it in." : "Which one is hotter? Tap it.";
    return game.round === 0 && challenged() ? `<strong>A friend scored ${challenge.score} of ${100 * ROUNDS}.</strong> Can you beat it? ${ask}` : ask;
  }
  if (game.mode === "guess") {
    const off = a.T === objects[0].T ? "Spot on." : `You were ${formatK(Math.abs(a.T - objects[0].T))} K ${a.T > objects[0].T ? "high" : "low"}.`;
    return `<strong>${objects[0].name}: ${formatK(objects[0].T)} K.</strong> ${off} +${a.points} points.`;
  }
  const [hot, cold] = hotterIndex(objects) === 0 ? objects : [objects[1], objects[0]];
  return `<strong>${a.right ? "Right!" : "Not quite."}</strong> ${hot.name} (${formatK(hot.T)} K) is hotter than ${cold.name} (${formatK(cold.T)} K).`;
}

function endText() {
  const { score, record } = game;
  const versus = !challenged() ? "" : score > challenge.score ? ` You beat their ${challenge.score}!` : score === challenge.score ? ` A tie with their ${challenge.score}.` : ` Their ${challenge.score} still stands.`;
  const best = score > record.previousBest && record.played > 1 ? " A new best!" : ` Best: ${record.best}.`;
  return `<strong>${score} of ${100 * ROUNDS}. ${rating(score)}</strong>${best}${versus}`;
}

function recapRow({ objects, T, points, right }) {
  const dot = o => `<span class="dot" style="background:${paintFor(o.T).paint()}"></span>`;
  if (game.mode === "guess") {
    const [o] = objects;
    return `<li>${dot(o)}<span class="r-name">${o.name}</span><span class="r-meta">${formatK(o.T)} K · you said ${formatK(T)} K</span><b>+${points}</b></li>`;
  }
  return `<li>${objects.map(dot).join("")}<span class="r-name">${objects.map(o => o.name).join(" vs ")}</span><span class="r-meta">${objects.map(o => `${formatK(o.T)} K`).join(" vs ")}</span><b>${right ? "✓" : "✗"}</b></li>`;
}

function render() {
  const { mode, round, answer: a } = game;
  const objects = game.rounds[round];
  $("game").dataset.mode = mode;
  document.querySelectorAll("#modes button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  $("roundNo").textContent = `Round ${round + 1}/${ROUNDS}`;
  $("score").textContent = `Score ${game.score}`;
  const record = loadRecords()[mode];
  $("best").textContent = challenged() ? `To beat ${challenge.score}` : record ? `Best ${record.best}` : "";

  if (mode === "guess") {
    paintDisc(0, objects[0].T);
    paintDisc(1, a ? a.T : null);
    setCaption(0, a ? objects[0].name : "Mystery glow", a ? `${formatK(objects[0].T)} K` : "? K");
    setCaption(1, "Your guess", a ? `${formatK(a.T)} K` : "");
  } else {
    objects.forEach((o, i) => {
      paintDisc(i, o.T);
      setCaption(i, a ? o.name : i ? "Right" : "Left", a ? `${formatK(o.T)} K${i === hotterIndex(objects) ? " · hotter" : ""}` : "");
    });
  }
  [0, 1].forEach(i => {
    const disc = $(`disc${i}`);
    disc.disabled = mode === "guess" || !!a;
    disc.classList.toggle("picked", mode === "hotter" && a?.pick === i);
  });
  $("guess").disabled = !!a;
  $("guessValue").textContent = `${formatK(a?.T ?? guessT())} K`;
  layoutMarks(a?.T ?? guessT());

  $("result").innerHTML = finished() ? endText() : resultText();
  $("next").textContent = !a ? "Lock in guess" : finished() ? "Play again" : round === ROUNDS - 2 ? "Last round" : "Next round";
  $("next").classList.toggle("away", mode === "hotter" && !a);
  $("shareResult").hidden = !finished();
  $("recap").innerHTML = game.results.map(recapRow).join("");
  $("recapEmpty").hidden = game.results.length > 0;
}

const layoutMarks = createSliderMarks({
  classRow: $("classTicks"),
  markRow: $("markTicks"),
  scale: sliderScale,
  onPick: T => {
    if (game.answer) return;
    $("guess").value = tToSlider(T);
    render();
  },
});

$("guess").addEventListener("input", render);
$("guess").addEventListener("keydown", e => e.key === "Enter" && answer());
$("next").addEventListener("click", next);
$("shareResult").addEventListener("click", share);
[0, 1].forEach(i => $(`disc${i}`).addEventListener("click", () => answer(i)));
$("modes").addEventListener("click", e => {
  const button = e.target.closest("button");
  if (button && button.dataset.mode !== game.mode) newGame(button.dataset.mode);
});
newGame();
