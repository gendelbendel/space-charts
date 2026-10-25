// Objects with a temperature, shown as cards and used by the readout and star pages.
//   slug      stable id for URLs (/stars/<slug>/ later); never rename one
//   category  "star" | "brown-dwarf" | "everyday"
//   type      shown under the name
//   T         effective temperature in kelvin
//   note      shown on the card ("" for none)
// Optional: aliases (other names the readout accepts), source (citation for T).
export const OBJECTS = [
  { slug: "you", name: "You", category: "everyday", type: "Human body", T: 310, note: "Peak near 9.3 µm. Thermal cameras see you; eyes can't." },
  { slug: "wise-0855-0714", name: "WISE 0855−0714", category: "brown-dwarf", type: "Y4 brown dwarf", T: 285, note: "Coldest known brown dwarf. Estimates run 250–285 K." },
  { slug: "wise-0350-5658", name: "WISE 0350−5658", category: "brown-dwarf", type: "Y1 brown dwarf", T: 325, note: "Estimates run 310–390 K. v1 listed 1,600 K, which was wrong." },
  { slug: "draper-point", name: "Draper point", category: "everyday", type: "Reference", T: 798, note: "Where hot objects first visibly glow, as a faint grey." },
  { slug: "candle-flame", name: "Candle flame", category: "everyday", type: "Reference", T: 1850, note: "Candlelight's color temperature (glowing soot)." },
  { slug: "incandescent-bulb", name: "Incandescent bulb", category: "everyday", type: "Reference", T: 2700, note: "Tungsten filament.", aliases: ["Bulb", "Light bulb"] },
  { slug: "proxima-centauri", name: "Proxima Centauri", category: "star", type: "M5.5 V red dwarf", T: 3042, note: "Nearest star to the Sun." },
  { slug: "betelgeuse", name: "Betelgeuse", category: "star", type: "M1–2 Ia supergiant", T: 3600, note: "Varies between about 3,500 and 3,650 K." },
  { slug: "pollux", name: "Pollux", category: "star", type: "K0 III giant", T: 4586, note: "Sources vary from 4,586 to 4,865 K." },
  { slug: "capella-aa", name: "Capella Aa", category: "star", type: "G8 III giant", T: 4970, note: "" },
  { slug: "sun", name: "The Sun", category: "star", type: "G2 V", T: 5772, note: "IAU nominal value." },
  { slug: "alpha-centauri-a", name: "Alpha Centauri A", category: "star", type: "G2 V", T: 5790, note: "" },
  { slug: "procyon-a", name: "Procyon A", category: "star", type: "F5 IV–V", T: 6530, note: "" },
  { slug: "altair", name: "Altair", category: "star", type: "A7 V", T: 7600, note: "Spins so fast its poles are ~8,500 K and its equator ~6,900 K." },
  { slug: "deneb", name: "Deneb", category: "star", type: "A2 Ia supergiant", T: 8525, note: "" },
  { slug: "vega", name: "Vega", category: "star", type: "A0 V", T: 9600, note: "Historically the zero point of stellar brightness scales." },
  { slug: "sirius-a", name: "Sirius A", category: "star", type: "A1 V", T: 9940, note: "Brightest star in the night sky." },
  { slug: "rigel", name: "Rigel", category: "star", type: "B8 Ia supergiant", T: 12100, note: "" },
  { slug: "zeta-puppis", name: "Zeta Puppis", category: "star", type: "O4 I supergiant", T: 40000, note: "One of the hottest stars visible to the naked eye." },
];

export const SPECTRAL_CLASSES = [
  ["Y", 0, 500], ["T", 500, 1300], ["L", 1300, 2400], ["M", 2400, 3700], ["K", 3700, 5200],
  ["G", 5200, 6000], ["F", 6000, 7500], ["A", 7500, 10000], ["B", 10000, 30000], ["O", 30000, Infinity],
];

// What each class is, for the class chip, the slider letters and the FAQ.
// Temperature ranges are approximate and apply to dwarf (main-sequence) stars.
export const CLASS_INFO = {
  O: { name: "Blue stars", about: "The hottest, most massive and rarest stars. They burn out in a few million years.", examples: "Zeta Puppis, the stars of Orion's Belt (Alnitak, Mintaka)" },
  B: { name: "Blue-white stars", about: "Very luminous and short-lived. Many of the bright stars in winter constellations.", examples: "Rigel, Spica" },
  A: { name: "White stars", about: "Their spectra have the strongest hydrogen lines of any class.", examples: "Sirius A, Vega, Altair, Deneb" },
  F: { name: "Yellow-white stars", about: "A little hotter and bigger than the Sun.", examples: "Procyon A, Polaris" },
  G: { name: "Sun-like stars", about: "Our Sun is a G2 star. Close to white seen from space.", examples: "The Sun, Alpha Centauri A, Capella" },
  K: { name: "Orange stars", about: "Cooler and longer-lived than the Sun. Many bright giants are K stars.", examples: "Arcturus, Pollux, Alpha Centauri B" },
  M: { name: "Red dwarfs and red giants", about: "The most common stars: about three in four of our stellar neighbors are M dwarfs.", examples: "Proxima Centauri, Betelgeuse, Antares" },
  L: { name: "The smallest stars and brown dwarfs", about: "Dusty atmospheres. They glow a dull deep red and are brightest in the infrared.", examples: "Luhman 16 A" },
  T: { name: "Brown dwarfs", about: "Not massive enough to fuse hydrogen. Methane in their atmospheres.", examples: "Gliese 229 B" },
  Y: { name: "The coldest brown dwarfs", about: "Some are about as warm as a summer day. Found only by infrared telescopes.", examples: "WISE 0855−0714" },
};

// Reference marks under the slider, in priority order: when space is tight,
// later ones are hidden rather than overlapping earlier ones.
export const SLIDER_MARKS = [["Sun", 5772], ["You", 310], ["Draper", 798], ["Rigel", 12100], ["Betelgeuse", 3600], ["Zeta Puppis", 40000]];
