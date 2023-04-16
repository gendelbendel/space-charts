function planck(wavelength, temperature) {
  const h = 6.626e-34; // Planck's constant (J*s)
  const c = 2.998e8; // speed of light (m/s)
  const k = 1.381e-23; // Boltzmann constant (J/K)
  const lambda = wavelength * 1e-9; // convert wavelength from nm to m
  const numerator = (2 * h * c ** 2) / lambda ** 5;
  const denominator = Math.exp((h * c) / (lambda * k * temperature)) - 1;
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

export default calculateTabulatedCurve;
