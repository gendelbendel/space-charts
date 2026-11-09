// The strongest absorption features of each spectral class, drawn as illustrative ticks on the
// chart (the curve itself stays a pure blackbody). [label, wavelengths in nm, classes it marks].
// Atomic lines are air wavelengths from the NIST Atomic Spectra Database
// (https://physics.nist.gov/asd), rounded to 0.1 nm: Hα 656.28, Hβ 486.13, Hγ 434.05,
// Ca II K 393.37 and H 396.85, Na I D2 588.99 and D1 589.59. Balmer lines peak in A stars,
// Ca II H & K and Na D in G and K stars. TiO is a molecule, so it isn't in the ASD: these are
// the band heads used to classify M stars (Gray & Corbally 2009, Stellar Spectral Classification).
// Only 705.4 nm, the γ (0,0) head, was checked, against Pavlenko et al. 2020, A&A 642, A77. The book
// wasn't available; the others match the α (2,0), (1,0), (0,0) and γ′ (0,0) bands' positions but
// weren't checked against a table of heads.
export const ABSORPTION_LINES = [
  ["Hγ", [434.0], "BAF"],
  ["Hβ", [486.1], "BAF"],
  ["Hα", [656.3], "BAF"],
  ["Ca II", [393.4, 396.8], "FGK"],
  ["Na D", [589.0, 589.6], "GKM"],
  ["TiO", [476.1, 495.4, 516.7, 615.9, 705.4], "M"],
];
