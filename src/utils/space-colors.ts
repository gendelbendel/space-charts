import { planck, normalize, integrate } from "./math";
import { partialRight } from "./partial";

function wavelengthToRGBA(wavelength: number) {
  let r, g, b, a: number;

  // calculate color based on wavelength
  if (wavelength >= 380 && wavelength < 440) {
    // violet to blue
    r = (-1 * (wavelength - 440)) / (440 - 380);
    g = 0;
    b = 1;
    a = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    // blue to cyan
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
    a = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    // cyan to green
    r = 0;
    g = 1;
    b = (-1 * (wavelength - 510)) / (510 - 490);
    a = 1;
  } else if (wavelength >= 510 && wavelength < 580) {
    // green to yellow
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
    a = 1;
  } else if (wavelength >= 580 && wavelength < 645) {
    // yellow to orange
    r = 1;
    g = (-1 * (wavelength - 645)) / (645 - 580);
    b = 0;
    a = 1;
  } else if (wavelength >= 645 && wavelength <= 780) {
    // orange to red
    r = 1;
    g = 0;
    b = 0;
    a = (780 - wavelength) / (780 - 645);
  } else {
    r = 0;
    g = 0;
    b = 0;
    a = 0;
  }

  // normalize values
  const max = Math.max(r, g, b);
  if (max > 1) {
    r /= max;
    g /= max;
    b /= max;
  }

  // convert to 8-bit values
  r = renormalizeRgbValue(r);
  g = renormalizeRgbValue(g);
  b = renormalizeRgbValue(b);
  a = renormalizeRgbValue(a);

  const rgba = "rgba(" + r + "," + g + "," + b + "," + a + ")";
  return rgba;
}

const renormalizeRgbValue = (val: number) => Math.round(255 * val);

function normalizeSpectralIntensityRGB(temp: number) {
  const partialTemp = partialRight(planck, temp);
  const redIntegrated = integrate(partialTemp, 620, 680, 10);
  const greenIntegrated = integrate(partialTemp, 500, 550, 10);
  const blueIntegrated = integrate(partialTemp, 430, 480, 10);

  const rgb = normalize([redIntegrated, greenIntegrated, blueIntegrated]);
  const rgbA = `rgba(${renormalizeRgbValue(rgb[0])}, ${renormalizeRgbValue(
    rgb[1]
  )}, ${renormalizeRgbValue(rgb[2])}, ${renormalizeRgbValue(1)})`;

  return rgbA;
}

export { wavelengthToRGBA, normalizeSpectralIntensityRGB };
