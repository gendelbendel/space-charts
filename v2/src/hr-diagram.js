// The Hertzsprung–Russell diagram, the color-map card's second view: every star with a cited
// luminosity, hotter to the left and brighter up, the main sequence as a band, and a line at
// the current temperature. Built once; render() only recolors the dots and moves the line, so a
// focused dot keeps its focus.
import { IAU_SUN, sphereLuminosity } from "./physics.js";
import { OBJECTS } from "./data/objects.js";
import { formatSci, screenColor } from "./format.js";
import { state, setTemperature } from "./state.js";
import { $ } from "./dom.js";

export const HR_STARS = OBJECTS.filter(o => o.L);

// The mean dwarf sequence from O5 V to M6 V, [T, log L/L☉]: Pecaut & Mamajek 2013 (ApJS 208, 9),
// in Mamajek's table, version 2022.04.16.
export const MAIN_SEQUENCE = [[41400, 5.54], [33300, 4.82], [20600, 3.43], [15700, 2.77], [9700, 1.58], [8100, 1.09], [7220, 0.86], [5770, 0.01], [4440, -0.76], [3850, -1.16], [3060, -2.52], [2810, -2.98]];
// The band is drawn this many dex either side of the mean sequence. Illustrative, not a fit.
export const BAND_DEX = 0.35;

// log L/L☉ of the mean sequence at T, interpolated in log T (NaN outside it).
export function mainSequenceLogL(T) {
  const i = MAIN_SEQUENCE.findIndex((_, k) => k && T >= MAIN_SEQUENCE[k][0] && T <= MAIN_SEQUENCE[k - 1][0]);
  if (i < 1) return NaN;
  const [[T0, l0], [T1, l1]] = [MAIN_SEQUENCE[i - 1], MAIN_SEQUENCE[i]];
  return l0 + ((l1 - l0) * Math.log(T0 / T)) / Math.log(T0 / T1);
}

// The plot spans 50,000 to 2,600 K and 10⁻³·⁵ to 10⁷ L☉ in the same 320-unit square as the color map.
const T_HOT = 50000, T_COOL = 2600, LOG_MIN = -3.5, LOG_MAX = 7;
const X0 = 46, X1 = 312, Y0 = 12, Y1 = 290;
const px = T => +(X0 + ((X1 - X0) * Math.log(T_HOT / T)) / Math.log(T_HOT / T_COOL)).toFixed(1);
const py = logL => +(Y1 - ((Y1 - Y0) * (logL - LOG_MIN)) / (LOG_MAX - LOG_MIN)).toFixed(1);

// Names shown beside their dots, and the side they go on.
const LABELS = { sun: "Sun", "proxima-centauri": "Proxima", betelgeuse: "Betelgeuse", rigel: "Rigel", deneb: "Deneb", "sirius-a": "Sirius" };
const LEFT = ["proxima-centauri", "betelgeuse", "rigel", "sirius-a"];

function hrHtml() {
  let grid = "";
  for (const [T, text] of [[40000, "40,000 K"], [20000, "20,000"], [10000, "10,000"], [5000, "5,000"], [3000, "3,000"]]) {
    grid += `<line x1="${px(T)}" y1="${Y0}" x2="${px(T)}" y2="${Y1}" class="grid"/><text x="${px(T)}" y="${Y1 + 14}" class="lbl" text-anchor="middle">${text}</text>`;
  }
  for (const [logL, text] of [[-2, "0.01"], [0, "1"], [2, "100"], [4, "10⁴"], [6, "10⁶"]]) {
    grid += `<line x1="${X0}" y1="${py(logL)}" x2="${X1}" y2="${py(logL)}" class="grid"/><text x="${X0 - 5}" y="${py(logL) + 3}" class="lbl" text-anchor="end">${text}</text>`;
  }
  const edge = dex => MAIN_SEQUENCE.map(([T, logL]) => `${px(T)},${py(logL + dex)}`);
  const band = [...edge(BAND_DEX), ...edge(-BAND_DEX).reverse()].join(" ");
  const stars = HR_STARS.map(({ slug, name, T, L }) => {
    const [x, y] = [px(T), py(Math.log10(L))];
    const label = LABELS[slug] ? `<text x="${LEFT.includes(slug) ? x - 7 : x + 7}" y="${y + 3}" class="lbl"${LEFT.includes(slug) ? ' text-anchor="end"' : ""}>${LABELS[slug]}</text>` : "";
    return `<g class="star" data-t="${T}" tabindex="0" role="button" aria-label="${name}"><circle cx="${x}" cy="${y}" r="9" fill="transparent"/><circle cx="${x}" cy="${y}" r="4" class="dot"/>${label}</g>`;
  }).join("");
  return `${grid}<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" fill="none" class="grid"/>
    <polygon points="${band}" class="band"/>
    <text class="lbl" transform="translate(${px(38000)} ${py(3.6)}) rotate(36)">Main sequence</text>
    <text x="${px(4700)}" y="${py(2.6)}" class="lbl" text-anchor="middle">Giants</text>
    <text x="${px(15000)}" y="${py(6.3)}" class="lbl" text-anchor="middle">Supergiants</text>
    <text class="lbl" transform="translate(11 ${(Y0 + Y1) / 2}) rotate(-90)" text-anchor="middle">Luminosity (Sun = 1)</text>
    <line id="hrCursor" y1="${Y0}" y2="${Y1}" class="cursor"/>${stars}`;
}

// One line, or three on the compact tiers (each span is a line there), like the color map's readout.
function hrReadout() {
  const star = HR_STARS.find(s => s.T === state.T);
  return star
    ? `${star.name}: <span>${formatSci(star.L)} L☉,</span> <span>${formatSci(star.R)} R☉</span>`
    : `A Sun-sized star: <span>${formatSci(sphereLuminosity(IAU_SUN.R, state.T) / IAU_SUN.L)} L☉</span>`;
}

export function renderHr() {
  const cursor = $("hrCursor");
  const inRange = state.T >= T_COOL && state.T <= T_HOT;
  cursor.style.display = inRange ? "" : "none";
  if (inRange) cursor.setAttribute("x1", px(state.T)), cursor.setAttribute("x2", px(state.T));
  for (const star of $("hr").querySelectorAll(".star")) {
    const T = +star.dataset.t;
    star.querySelector(".dot").style.fill = screenColor(T, state.model, state.light, state.wide).paint();
    star.ariaCurrent = T === state.T ? "true" : null;
  }
  $("cieReadout").innerHTML = hrReadout();
}

export function initHr() {
  const svg = $("hr");
  svg.innerHTML = hrHtml();
  const pick = e => {
    const star = e.target.closest(".star");
    if (star && (e.type === "click" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setTemperature(+star.dataset.t);
    }
  };
  svg.addEventListener("click", pick);
  svg.addEventListener("keydown", pick);
}
