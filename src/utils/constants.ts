const appDefaults = {
  minimumTemperature: 230,
  maximumTemperature: 20000,
  defaultTemperature: 5700, // The sun's temperature
  temperatureStepAmount: 10,
};

const physics = {
  h: 6.626e-34, // Planck's constant (J*s)
  c: 2.998e8, // speed of light (m/s)
  k: 1.381e-23, // Boltzmann constant (J/K)
};

export { appDefaults, physics };
