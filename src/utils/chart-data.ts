import { planck } from "./math";

const calculateTabulatedCurve = (
  temperature: number,
  minWavelength: number,
  maxWavelength: number,
  step: number
) => {
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
};

export { calculateTabulatedCurve };
