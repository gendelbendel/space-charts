import { T_MIN, T_MAX } from "./physics.js";

// How temperature maps onto the slider: piecewise linear in log(temperature)
// between these knots ([kelvin, position 0–1]). Most of the bar goes to
// 2,400–12,000 K (M through late B stars), where colors change the most; the
// cold end and the hottest stars are squeezed. Chosen by the owner from three
// candidates on 2026-10-25 (see docs/WHY.md#the-slider-favors-the-temperatures-where-color-changes).
export const SLIDER_KNOTS = [[T_MIN, 0], [1000, 0.08], [2400, 0.22], [12000, 0.8], [30000, 0.95], [T_MAX, 1]];

export function makeScale(knots) {
  const points = knots.map(([T, f]) => [Math.log(T), f]);
  const last = points.length - 1;
  const toFraction = T => {
    const x = Math.log(Math.min(Math.max(T, T_MIN), T_MAX));
    let i = 1;
    while (i < last && x > points[i][0]) i++;
    const [x0, f0] = points[i - 1], [x1, f1] = points[i];
    return f0 + ((x - x0) / (x1 - x0)) * (f1 - f0);
  };
  const toT = f => {
    const clamped = Math.min(Math.max(f, 0), 1);
    let i = 1;
    while (i < last && clamped > points[i][1]) i++;
    const [x0, f0] = points[i - 1], [x1, f1] = points[i];
    return Math.exp(x0 + ((clamped - f0) / (f1 - f0)) * (x1 - x0));
  };
  return { toFraction, toT };
}
