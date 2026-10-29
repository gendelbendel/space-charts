import { test } from "node:test";
import assert from "node:assert/strict";
import { OBJECTS, CATEGORIES, ORION } from "../src/data/objects.js";
import { wienPeakNm } from "../src/physics.js";
import { skyPosition, dotDiameter } from "../src/orion.js";
import { HR_STARS, BAND_DEX, mainSequenceLogL } from "../src/hr-diagram.js";

// Slugs become URLs (/stars/<slug>/, roadmap P5.A), so they must be unique and
// safe to use as a path segment without escaping.
test("object slugs are unique, lowercase and URL-safe", () => {
  const slugs = OBJECTS.map(o => o.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug");
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug "${slug}"`);
});

test("every object has a known category and a usable temperature", () => {
  for (const o of OBJECTS) {
    assert.ok(CATEGORIES.some(([c]) => c === o.category), `${o.name}: unknown category "${o.category}"`);
    assert.ok(Number.isFinite(o.T) && o.T > 0, `${o.name}: bad temperature`);
    assert.equal(typeof o.note, "string", `${o.name}: note must be a string ("" for none)`);
  }
});

// The list shows one heading per category, so an empty category would leave a
// heading with nothing under it.
test("every category has objects", () => {
  for (const [category, heading] of CATEGORIES) assert.ok(OBJECTS.some(o => o.category === category), `no objects under "${heading}"`);
});

const bySlug = slug => OBJECTS.find(o => o.slug === slug);

// Fixsen 2009 (ApJ 707, 916) measured the CMB at 2.72548 ± 0.00057 K; its
// spectrum peaks at 1.063 mm per unit wavelength.
test("the CMB is Fixsen's temperature and peaks at 1.063 mm", () => {
  assert.equal(bySlug("cmb").T, 2.72548);
  assert.ok(Math.abs(wienPeakNm(bySlug("cmb").T) / 1e6 - 1.063) < 0.0005);
});

// The "When the universe turned transparent" card says ~3,000 K, stretched by
// ~1,100 into today's CMB. Planck 2018 (results VI, Table 2) puts last
// scattering at z* = 1089.92, so the light then was T_CMB × (1 + z*) ≈ 2,976 K.
test("the recombination card matches the CMB stretched by Planck 2018's redshift", () => {
  const atRecombination = bySlug("cmb").T * (1 + 1089.92);
  assert.ok(Math.abs(bySlug("recombination").T / atRecombination - 1) < 0.02);
  assert.equal(Math.round((1 + 1089.92) / 100) * 100, 1100);
});

// The Orion map (roadmap P3.D). Positions (J2000, degrees) and V magnitudes are
// SIMBAD's, retrieved 2026-10-26 through its TAP service (basic.ra/dec, allfluxes.V).
// Temperatures: de Burgos et al. 2024 (A&A 687, A228, IACOB X) for the hot
// supergiants, Gies & Lambert 1992 (ApJ 387, 673) for Bellatrix; Betelgeuse and
// Rigel keep the values the page already had. A typo in any of them fails here.
const SIMBAD_ORION = {
  betelgeuse: { ra: 88.79293899, dec: 7.40706400, V: 0.42, T: 3600 },
  rigel: { ra: 78.63446707, dec: -8.20163836, V: 0.13, T: 12100 },
  bellatrix: { ra: 81.28276356, dec: 6.34970326, V: 1.64, T: 22570 },
  saiph: { ra: 86.93912017, dec: -9.66960492, V: 2.06, T: 26700 },
  alnitak: { ra: 85.18969443, dec: -1.94257359, V: 1.77, T: 31000 },
  alnilam: { ra: 84.05338894, dec: -1.20191914, V: 1.69, T: 27100 },
  mintaka: { ra: 83.00166706, dec: -0.29909511, V: 2.41, T: 30300 },
};

test("Orion's stars match SIMBAD and their cited temperatures", () => {
  assert.deepEqual(ORION.map(s => s.slug).sort(), Object.keys(SIMBAD_ORION).sort());
  for (const star of ORION) {
    const published = SIMBAD_ORION[star.slug];
    assert.ok(Math.abs(star.ra - published.ra) < 1e-4 && Math.abs(star.dec - published.dec) < 1e-4, `${star.slug}: position`);
    assert.equal(star.V, published.V, `${star.slug}: V magnitude`);
    const record = bySlug(star.slug);
    assert.equal(record?.T, published.T, `${star.slug}: temperature`);
    assert.equal(record.category, "star");
  }
});

// The map should look like the sky: Betelgeuse at the upper left and Rigel at the
// lower right (north up, east left), and distances on it within 0.5% of the
// great-circle separations computed from SIMBAD's coordinates (Betelgeuse to
// Rigel is 18.6°). A flipped axis or a missing cos(dec) fails this.
test("the Orion map keeps the sky's orientation and angular distances", () => {
  const rad = Math.PI / 180;
  const separation = (a, b) => Math.acos(Math.sin(a.dec * rad) * Math.sin(b.dec * rad) + Math.cos(a.dec * rad) * Math.cos(b.dec * rad) * Math.cos((a.ra - b.ra) * rad)) / rad;
  const [bx, by] = skyPosition(SIMBAD_ORION.betelgeuse);
  const [rx, ry] = skyPosition(SIMBAD_ORION.rigel);
  assert.ok(bx < rx && by < ry, "Betelgeuse should be up and to the left of Rigel");
  assert.ok(Math.abs(separation(SIMBAD_ORION.betelgeuse, SIMBAD_ORION.rigel) - 18.6) < 0.05);
  const stars = Object.values(SIMBAD_ORION);
  for (const a of stars) for (const b of stars) {
    if (a === b) continue;
    const [ax, ay] = skyPosition(a), [cx, cy] = skyPosition(b);
    assert.ok(Math.abs(Math.hypot(ax - cx, ay - cy) / separation(a, b) - 1) < 0.005);
  }
});

// Dots are sized so their area follows the light we receive. Pogson's magnitude
// scale defines 5 magnitudes as a factor of exactly 100 in flux, so Rigel (V 0.13)
// should get 100^(2.28 / 5) = 8.17 times Mintaka's (V 2.41) area.
test("Orion's dot areas follow Pogson's magnitude scale", () => {
  assert.ok(Math.abs((dotDiameter(0) / dotDiameter(5)) ** 2 - 100) < 1e-9);
  assert.ok(Math.abs((dotDiameter(0.13) / dotDiameter(2.41)) ** 2 - 8.17) < 0.01);
});

// The HR diagram (roadmap P3.B). Luminosity and radius in solar units, as published
// (the sources are listed above OBJECTS in objects.js). A typo in any of them fails here.
const PUBLISHED_L_R = {
  "proxima-centauri": [0.00151, 0.146], betelgeuse: [87100, 764], pollux: [38.4, 8.97], "capella-aa": [78.7, 11.98],
  sun: [1, 1], "alpha-centauri-a": [1.5059, 1.2234], "procyon-a": [7.049, 2.043], altair: [10.6, 1.79],
  deneb: [196000, 203], vega: [47.2, 2.57], "sirius-a": [25.4, 1.711], rigel: [120000, 74.1],
  "zeta-puppis": [376000, 12.5], bellatrix: [7410, 5.6], saiph: [60300, 13.5], alnitak: [250000, 22.8],
  alnilam: [271000, 27.6], mintaka: [190000, 13.1],
};

test("every star, and nothing else, has its published luminosity and radius", () => {
  for (const o of OBJECTS) {
    if (o.category !== "star") {
      assert.equal(o.L ?? o.R, undefined, `${o.name}: only stars are on the HR diagram`);
      continue;
    }
    assert.deepEqual([o.L, o.R], PUBLISHED_L_R[o.slug], `${o.name}: L and R`);
  }
  assert.equal(HR_STARS.length, Object.keys(PUBLISHED_L_R).length);
});

// Each star's L, R and T come from different measurements, so L = R²(T/T☉)⁴ holds only
// roughly (Alnitak is the furthest off, at 0.58). A factor-of-ten slip in any one value
// breaks it by far more than a factor of two.
test("each star's luminosity roughly matches its radius and temperature by Stefan–Boltzmann", () => {
  for (const { name, T, L, R } of HR_STARS) {
    const ratio = L / (R ** 2 * (T / 5772) ** 4);
    assert.ok(ratio > 0.5 && ratio < 2, `${name}: L / R²(T/T☉)⁴ = ${ratio.toFixed(2)}`);
  }
});

// The band is drawn around Pecaut & Mamajek's mean dwarf sequence. Its G2 V row (5,770 K)
// should be the Sun (log L = 0), and the stars should fall where their published luminosity
// classes put them: dwarfs (class V) in the band, giants (III) and supergiants (I) above it.
test("the main-sequence band holds the dwarfs and lies below the giants and supergiants", () => {
  assert.ok(Math.abs(mainSequenceLogL(5772)) < 0.02);
  const offBand = slug => {
    const { T, L } = bySlug(slug);
    return Math.log10(L) - mainSequenceLogL(T);
  };
  for (const slug of ["sun", "proxima-centauri", "alpha-centauri-a", "sirius-a", "vega", "altair"]) {
    assert.ok(Math.abs(offBand(slug)) <= BAND_DEX, `${slug} should be in the band (${offBand(slug).toFixed(2)} dex)`);
  }
  for (const slug of ["pollux", "capella-aa", "betelgeuse", "deneb", "rigel", "saiph", "alnilam"]) {
    assert.ok(offBand(slug) > BAND_DEX, `${slug} should be above the band (${offBand(slug).toFixed(2)} dex)`);
  }
});
