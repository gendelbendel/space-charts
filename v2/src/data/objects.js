// [name, type, effective temperature (K), note]
export const OBJECTS = [
  ["You", "Human body", 310, "Peak near 9.3 µm. Thermal cameras see you; eyes can't."],
  ["WISE 0855−0714", "Y4 brown dwarf", 285, "Coldest known brown dwarf. Estimates run 250–285 K."],
  ["WISE 0350−5658", "Y1 brown dwarf", 325, "Estimates run 310–390 K. v1 listed 1,600 K, which was wrong."],
  ["Draper point", "Reference", 798, "Where hot objects first visibly glow, as a faint grey."],
  ["Candle flame", "Reference", 1850, "Candlelight's color temperature (glowing soot)."],
  ["Incandescent bulb", "Reference", 2700, "Tungsten filament."],
  ["Proxima Centauri", "M5.5 V red dwarf", 3042, "Nearest star to the Sun."],
  ["Betelgeuse", "M1–2 Ia supergiant", 3600, "Varies between about 3,500 and 3,650 K."],
  ["Pollux", "K0 III giant", 4586, "Sources vary from 4,586 to 4,865 K."],
  ["Capella Aa", "G8 III giant", 4970, ""],
  ["The Sun", "G2 V", 5772, "IAU nominal value."],
  ["Alpha Centauri A", "G2 V", 5790, ""],
  ["Procyon A", "F5 IV–V", 6530, ""],
  ["Altair", "A7 V", 7600, "Spins so fast its poles are ~8,500 K and its equator ~6,900 K."],
  ["Deneb", "A2 Ia supergiant", 8525, ""],
  ["Vega", "A0 V", 9600, "Historically the zero point of stellar brightness scales."],
  ["Sirius A", "A1 V", 9940, "Brightest star in the night sky."],
  ["Rigel", "B8 Ia supergiant", 12100, ""],
  ["Zeta Puppis", "O4 I supergiant", 40000, "One of the hottest stars visible to the naked eye."],
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
