import { physics } from "./constants";

const planck = (wavelength: number, temperature: number) => {
  const lambda = wavelength * 1e-9; // convert wavelength from nm to m
  const numerator = (2 * physics.h * physics.c ** 2) / lambda ** 5;
  const denominator =
    Math.exp((physics.h * physics.c) / (lambda * physics.k * temperature)) - 1;
  const spectralRadiance = numerator / denominator; // spectral radiance (W/m^2/sr/m)
  return spectralRadiance;
};

function normalize(values: number[]) {
  const maxVal = Math.max(...values);
  return values.map((val) => val / maxVal);
}

function integrate(
  f: { (arg0: number): number },
  a: number,
  b: number,
  n: number
) {
  let dx = (b - a) / n;
  let sum = 0.5 * (f(a) + f(b));
  for (let i = 1; i < n; i++) {
    let x = a + i * dx;
    sum += f(x);
  }
  return sum * dx;
}

export { integrate, normalize, planck };
