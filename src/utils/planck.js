import constants from "./constants";

function planck(wavelength, temperature) {
  const lambda = wavelength * 1e-9; // convert wavelength from nm to m
  const numerator = (2 * constants.h * constants.c ** 2) / lambda ** 5;
  const denominator =
    Math.exp(
      (constants.h * constants.c) / (lambda * constants.k * temperature)
    ) - 1;
  const spectralRadiance = numerator / denominator; // spectral radiance (W/m^2/sr/m)
  return spectralRadiance;
}

function calculateTabulatedCurve(
  temperature,
  minWavelength,
  maxWavelength,
  step
) {
  const wavelengths = [];
  const spectralRadianceValues = [];
  for (
    let wavelength = minWavelength;
    wavelength <= maxWavelength;
    wavelength += step
  ) {
    wavelengths.push(wavelength);
    spectralRadianceValues.push(planck(wavelength, temperature));
  }
  return [wavelengths, spectralRadianceValues];
}

export { calculateTabulatedCurve, constants, planck };
