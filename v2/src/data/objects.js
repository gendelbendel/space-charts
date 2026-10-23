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

// Reference marks under the slider, in priority order: when space is tight,
// later ones are hidden rather than overlapping earlier ones.
export const SLIDER_MARKS = [["Sun", 5772], ["You", 310], ["Draper", 798], ["Rigel", 12100], ["Betelgeuse", 3600], ["Zeta Puppis", 40000]];
