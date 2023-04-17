import { planck } from "./planck";

// takes wavelength in nm and returns an rgb value
function wavelengthToRGB(wavelength) {
  let r, g, b, factor;
  if (wavelength >= 380 && wavelength <= 439) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength <= 489) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength <= 509) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength <= 579) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength <= 644) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  } else {
    r = 0;
    g = 0;
    b = 0;
  }

  if (wavelength >= 380 && wavelength <= 419) {
    factor = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
  } else if (wavelength >= 420 && wavelength <= 700) {
    factor = 1;
  } else if (wavelength >= 701 && wavelength <= 780) {
    factor = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
  } else {
    factor = 0;
  }

  let red = r > 0 ? Math.round(255 * Math.pow(r * factor, 0.8)) : 0;
  let green = g > 0 ? Math.round(255 * Math.pow(g * factor, 0.8)) : 0;
  let blue = b > 0 ? Math.round(255 * Math.pow(b * factor, 0.8)) : 0;

  return [red, green, blue];
}

function wavelengthToRGBA(wavelength) {
  var r, g, b, a;

  if (wavelength < 380 || wavelength > 780) {
    // wavelength is outside the visible spectrum
    r = 0;
    g = 0;
    b = 0;
    a = 0;
  } else {
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
    }
  }

  // normalize values
  var max = Math.max(r, g, b);
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

function integrate(f, a, b, n) {
  let dx = (b - a) / n;
  let sum = 0.5 * (f(a) + f(b));
  for (let i = 1; i < n; i++) {
    let x = a + i * dx;
    sum += f(x);
  }
  return sum * dx;
}

function normalize(values) {
  const maxVal = Math.max(...values);
  return values.map((val) => val / maxVal);
}

function renormalizeRgbValue(val) {
  return Math.round(255 * val);
}

function partialRight(fn) {
  // A reference to the Array#slice method.
  var slice = Array.prototype.slice;
  // Convert arguments object to an array, removing the first argument.
  var args = slice.call(arguments, 1);

  return function () {
    // Invoke the originally-specified function, passing in all just-
    // specified arguments, followed by any originally-specified arguments.
    return fn.apply(this, slice.call(arguments, 0).concat(args));
  };
}

function normalizeSpectralIntensityRGB(temp) {
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

export { wavelengthToRGB, wavelengthToRGBA, normalizeSpectralIntensityRGB };
