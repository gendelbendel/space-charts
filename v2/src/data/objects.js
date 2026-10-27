// Objects with a temperature, shown as cards and used by the readout and star pages.
//   slug      stable id for URLs (/stars/<slug>/ later); never rename one
//   category  "star" | "brown-dwarf" | "everyday" | "cosmic" (see CATEGORIES)
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
  { slug: "warm-white-led", name: "Warm-white LED", category: "everyday", type: "Lamp rating", T: 2700, aliases: ["warm white", "led"], note: "A correlated color temperature: the LED matches a 2,700 K blackbody's color without being hot.", source: "ANSI C78.377-2017, nominal CCT 2,700 K" },
  { slug: "neutral-white-led", name: "Neutral-white LED", category: "everyday", type: "Lamp rating", T: 4000, aliases: ["neutral white", "cool white"], note: "Common in offices and kitchens.", source: "ANSI C78.377-2017, nominal CCT 4,000 K" },
  { slug: "daylight", name: "Daylight (D65)", category: "everyday", type: "Lamp rating, screen white", T: 6500, aliases: ["d65", "daylight led"], note: "D65 is the white point of sRGB screens. It's measured daylight, not a blackbody: its correlated temperature is about 6,504 K.", source: "CIE standard illuminant D65 (ISO 11664-2), CCT ≈ 6,504 K" },
  { slug: "stove-element", name: "Stove element", category: "everyday", type: "Coil on high", T: 1140, aliases: ["stove", "hob"], note: "A cherry-red nichrome coil, about 870 °C.", source: "Nichrome coil at full power, about 1,600 °F (870 °C)" },
  { slug: "basaltic-lava", name: "Basaltic lava", category: "everyday", type: "Kīlauea, Hawaiʻi", T: 1440, aliases: ["lava"], note: "Erupts at about 1,170 °C.", source: "USGS Hawaiian Volcano Observatory: Kīlauea lava erupts at about 1,170 °C" },
  { slug: "molten-steel", name: "Molten steel", category: "everyday", type: "Tapped from the furnace", T: 1920, aliases: ["steel"], note: "Poured at about 1,650 °C.", source: "Basic oxygen steelmaking: tapped at about 1,650–1,700 °C" },
  { slug: "welding-arc", name: "Welding arc", category: "everyday", type: "TIG arc core", T: 20000, aliases: ["welding", "arc"], note: "Its light is mostly spectral lines, not a blackbody glow, so its real color differs.", source: "Spectroscopy of pulsed TIG arcs: 17,500–20,000 K (Trans. JWRI 39(2):193)" },
  { slug: "lightning", name: "Lightning", category: "everyday", type: "Air in the channel", T: 30000, note: "For a few microseconds, five times hotter than the Sun's surface.", source: "NOAA National Weather Service: about 50,000 °F (~28,000 K), often quoted as 30,000 K" },
  { slug: "recombination", name: "When the universe turned transparent", category: "cosmic", type: "Recombination", T: 3000, aliases: ["last scattering"], note: "About 380,000 years after the Big Bang. The CMB is this light today, stretched by a factor of about 1,100.", source: "Planck 2018 results VI: last scattering at z ≈ 1,090, about 370,000–380,000 years" },
  { slug: "cmb", name: "Cosmic microwave background", category: "cosmic", type: "The Big Bang's afterglow", T: 2.72548, aliases: ["cmb"], note: "The most perfect blackbody ever measured. It peaks near 1 mm, in microwaves.", source: "Fixsen 2009, ApJ 707, 916: 2.72548 ± 0.00057 K" },
  { slug: "bellatrix", name: "Bellatrix", category: "star", type: "B2 III giant", T: 22570, note: "Orion's left shoulder.", source: "Gies & Lambert 1992, ApJ 387, 673" },
  { slug: "saiph", name: "Saiph", category: "star", type: "B0.5 Ia supergiant", T: 26700, note: "Orion's right knee.", source: "de Burgos et al. 2024, A&A 687, A228 (IACOB X)" },
  { slug: "alnitak", name: "Alnitak", category: "star", type: "O9.7 Ib supergiant", T: 31000, note: "East end of Orion's Belt. A multiple star; this is its brightest member.", source: "de Burgos et al. 2024, A&A 687, A228 (IACOB X), zeta Ori A" },
  { slug: "alnilam", name: "Alnilam", category: "star", type: "B0 Ia supergiant", T: 27100, note: "The middle of Orion's Belt.", source: "de Burgos et al. 2024, A&A 687, A228 (IACOB X)" },
  { slug: "mintaka", name: "Mintaka", category: "star", type: "O9.5 II bright giant", T: 30300, note: "West end of Orion's Belt, almost on the celestial equator.", source: "de Burgos et al. 2024, A&A 687, A228 (IACOB X)" },
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

// Headings for the objects list, in display order.
export const CATEGORIES = [["star", "Stars"], ["brown-dwarf", "Brown dwarfs"], ["everyday", "Everyday light"], ["cosmic", "Cosmic"]];

// Orion's seven brightest stars, for the "Orion, in true color" map: J2000 position
// in degrees and V magnitude, from SIMBAD. `label` is the side the name goes on.
// Only the build uses this (the map is prerendered), so it stays out of the script.
export const ORION = [
  { slug: "betelgeuse", ra: 88.7929, dec: 7.4071, V: 0.42, label: "right" },
  { slug: "bellatrix", ra: 81.2828, dec: 6.3497, V: 1.64, label: "right" },
  { slug: "alnitak", ra: 85.1897, dec: -1.9426, V: 1.77, label: "left" },
  { slug: "alnilam", ra: 84.0534, dec: -1.2019, V: 1.69, label: "right" },
  { slug: "mintaka", ra: 83.0017, dec: -0.2991, V: 2.41, label: "above" },
  { slug: "saiph", ra: 86.9391, dec: -9.6696, V: 2.06, label: "left" },
  { slug: "rigel", ra: 78.6345, dec: -8.2016, V: 0.13, label: "right" },
];
