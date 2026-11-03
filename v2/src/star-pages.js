// What each /stars/<slug>/ page says about itself. The page's script uses only the titles, to
// keep the tab's title in step when the address moves to another object's page.
import { OBJECTS } from "./data/objects.js";
import { formatK } from "./format.js";

export const SITE = "https://space-charts.vercel.app";

export const MAIN_TITLE = "What Color Is a Star?";
export const MAIN_HEAD = {
  title: MAIN_TITLE,
  description: "Pick a temperature and see the light a blackbody gives off, the color your eye would actually see, and the math behind it.",
  ogImage: "/preview.webp",
  headLinks: "",
};

// Names that don't read right after "What color is": anything that isn't a proper name.
const TITLES = {
  you: "What color are you?",
  sun: "What color is the Sun?",
  "draper-point": "What color is the Draper point?",
  "candle-flame": "What color is a candle flame?",
  "incandescent-bulb": "What color is an incandescent bulb?",
  "warm-white-led": "What color is a warm-white LED?",
  "neutral-white-led": "What color is a neutral-white LED?",
  daylight: "What color is daylight?",
  "stove-element": "What color is a stove element?",
  "basaltic-lava": "What color is lava?",
  "molten-steel": "What color is molten steel?",
  "welding-arc": "What color is a welding arc?",
  lightning: "What color is lightning?",
  recombination: "What color was the universe when it turned transparent?",
  cmb: "What color is the cosmic microwave background?",
};

const escapeAttr = text => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export const starTitle = o => TITLES[o.slug] ?? `What color is ${o.name}?`;
export const starPath = o => `/stars/${o.slug}/`;
export const starImage = o => `/og/${o.slug}.jpg`;

export function starDescription(o) {
  const facts = `${o.name}: ${o.type}, ${formatK(o.T)} K.`;
  return o.note ? `${facts} ${o.note}` : `${facts} See the color your eye would see, and why.`;
}

export const starHead = o => ({
  title: escapeAttr(starTitle(o)),
  description: escapeAttr(starDescription(o)),
  ogImage: SITE + starImage(o),
  headLinks: `\n<meta property="og:url" content="${SITE + starPath(o)}">\n<meta name="twitter:card" content="summary_large_image">\n<link rel="canonical" href="${SITE + starPath(o)}">`,
});

export const sitemapXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${["/", "/play/", ...OBJECTS.map(starPath)].map(path => `  <url><loc>${SITE + path}</loc></url>`).join("\n")}
</urlset>
`;
