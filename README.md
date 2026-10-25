# What color is a star?

An interactive blackbody-radiation explorer. Pick a temperature to see the Planck spectrum, the color and brightness a human eye would actually see, where that color sits on the CIE 1931 color map, and the math behind it.

- **v2** (the current site, `/`): a dependency-free rewrite. It has three color models: the original simple one, CIE 1931 colorimetry, and colors of real stars from model spectra (Harre & Heller 2021, with the sRGB gamma correction applied). Brightness follows human vision, so cold objects go black instead of red. Each page ships as a single ~25 KB file.
- **v1** (`/v1/`): the original 2023 Create React App version, kept as it was.

## Running it

```bash
npm install
npm run build:v2          # v2 only -> build/
npm run build             # v1 into build/v1, then v2
python3 -m http.server 4173 --directory build
npm run test:v2           # physics and slider-scale tests
```

v1's dev server is `npm start`.

## Layout

- `v2/`: pages, partials, source, data and tests for the current site. See `CLAUDE.md` for a map.
- `src/`, `public/`: v1.
- `docs/v2/PLAN.md`: the v2 plan, including the v1 math audit, data sources, verified reference values and open questions.
- `docs/WHY.md`: why things are the way they are.

## Data sources

- CIE 1931 2° standard observer color matching functions (CIE, doi:10.25039/CIE.DS.xvudnb9b).
- Harre & Heller (2021), "Digital color codes of stars", *Astronomische Nachrichten*, arXiv:2101.06254.
- Hollands et al. (2026), "Any colour you like: the diverse chromaticities of white dwarfs", *RAS Techniques and Instruments*, doi:10.1093/rasti/rzag069.
