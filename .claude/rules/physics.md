---
paths:
  - "v2/src/physics.js"
  - "v2/src/data/**"
  - "v2/test/**"
---

# Physics and color data

- Constants are the exact 2019 SI values (h, c, k_B) plus CODATA 2018 σ and Wien's b. Never round them.
- `planck(nm, T)` takes nanometers and returns W·m⁻²·sr⁻¹·**m**⁻¹. The chart and the visible-fraction stat multiply by 1e-9 for per-nm. It returns 0 (never NaN) for non-positive inputs or when the exponent overflows.
- Every math change needs a test against a published value (Planckian locus, Stefan–Boltzmann, Wien), not against the code's previous output. (Why: `docs/WHY.md#the-math-is-checked-against-published-values`)
- `cie1931.js` is CIE 1931 2°, 380–780 nm at 5 nm. Changing it must keep the locus tests at ±0.0005. If you replace it with CIE's official CSV, diff the two first.
- Colors flow as linear sRGB until the very end: hue → `applyBrightness` (luminance, mesopic desaturation, overexposure to white) → `encodeSrgb` → hex. Never apply gamma twice, and never compute luminance from encoded values.
- Out-of-gamut colors (below ~1,500 K) get white added until no channel is negative. That keeps the hue. Don't clip channels instead.
- Hue functions clamp T to `HUE_T_FLOOR` (50 K), because the visible spectrum underflows to 0 below that. Brightness uses the real T, so cold objects still go black.
- Simple model = v1's method, byte for byte (the test enforces it). Don't improve it; it exists for comparison.
- `harre-heller-2021.js` is generated from the paper's text (Table 5, 105 rows). Never hand-edit it. Use its linear columns and apply the sRGB transfer function; the hex column is the paper's uncorrected value, kept for reference only. Outside 2,300–55,000 K, `starHue` returns `available: false` and callers fall back to CIE. (Why: `docs/WHY.md#real-star-colors-get-the-gamma-step`)
- `VISION` thresholds are approximate vision-science values. If you change them, check that 310 K renders `#000000` and 798 K renders achromatic in "Your eye" mode (both tested). (Why: `docs/WHY.md#cold-objects-render-black-not-red`)
- Star temperatures in `objects.js` are effective temperatures. Cite a source in the note when a value is disputed. WISE 0350−5658 is ~325 K, not v1's 1,600 K.
- Run `npm run test:v2` after any change here.
