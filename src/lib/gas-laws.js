/** Pure calculation and unit-conversion utilities for GasLab. */

export const GAS_CONSTANTS = Object.freeze({
  L_ATM_PER_MOL_K: 0.082057,
  J_PER_MOL_K: 8.31446,
  L_KPA_PER_MOL_K: 8.31446,
});

// Values this close to zero are unsafe divisors and physically meaningless here.
export const MIN_POSITIVE_VALUE = 1e-12;

const pressureInPa = Object.freeze({
  atm: 101325,
  kPa: 1000,
  kpa: 1000,
  bar: 100000,
  mmHg: 133.322387415,
  Torr: 101325 / 760,
  psi: 6894.757293168,
});

const volumeInLitres = Object.freeze({
  L: 1,
  mL: 1e-3,
  m3: 1000,
  "m^3": 1000,
  "m³": 1000,
  cm3: 1e-3,
  "cm^3": 1e-3,
  "cm³": 1e-3,
});

function finite(value, name) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
  return value;
}

function positive(value, name) {
  finite(value, name);
  if (value <= MIN_POSITIVE_VALUE) {
    throw new RangeError(`${name} must be greater than zero.`);
  }
  return value;
}

function unitFactor(table, unit, quantity) {
  const factor = table[unit];
  if (factor === undefined) throw new RangeError(`Unsupported ${quantity} unit: ${unit}.`);
  return factor;
}

export function convertPressure(value, from, to) {
  finite(value, "Pressure");
  return value * unitFactor(pressureInPa, from, "pressure") /
    unitFactor(pressureInPa, to, "pressure");
}

export function convertVolume(value, from, to) {
  finite(value, "Volume");
  return value * unitFactor(volumeInLitres, from, "volume") /
    unitFactor(volumeInLitres, to, "volume");
}

export function convertTemperature(value, from, to) {
  finite(value, "Temperature");
  const toKelvin = {
    K: (temperature) => temperature,
    C: (temperature) => temperature + 273.15,
    "°C": (temperature) => temperature + 273.15,
    F: (temperature) => (temperature - 32) * 5 / 9 + 273.15,
    "°F": (temperature) => (temperature - 32) * 5 / 9 + 273.15,
  }[from];
  const fromKelvin = {
    K: (temperature) => temperature,
    C: (temperature) => temperature - 273.15,
    "°C": (temperature) => temperature - 273.15,
    F: (temperature) => (temperature - 273.15) * 9 / 5 + 32,
    "°F": (temperature) => (temperature - 273.15) * 9 / 5 + 32,
  }[to];
  if (!toKelvin || !fromKelvin) {
    throw new RangeError(`Unsupported temperature conversion: ${from} to ${to}.`);
  }
  const kelvin = toKelvin(value);
  positive(kelvin, "Temperature in Kelvin");
  return fromKelvin(kelvin);
}

/**
 * Solve PV=nRT. Inputs use kPa, L, mol, and K; exactly one property is omitted.
 */
export function solveIdealGas({ pressure, volume, moles, temperature }) {
  const missing = [pressure, volume, moles, temperature].filter((value) => value === undefined);
  if (missing.length !== 1) throw new TypeError("Exactly one ideal-gas variable must be omitted.");

  if (pressure === undefined) {
    return positive(moles, "Moles") * GAS_CONSTANTS.L_KPA_PER_MOL_K *
      positive(temperature, "Temperature in Kelvin") / positive(volume, "Volume");
  }
  if (volume === undefined) {
    return positive(moles, "Moles") * GAS_CONSTANTS.L_KPA_PER_MOL_K *
      positive(temperature, "Temperature in Kelvin") / positive(pressure, "Pressure");
  }
  if (moles === undefined) {
    return positive(pressure, "Pressure") * positive(volume, "Volume") /
      (GAS_CONSTANTS.L_KPA_PER_MOL_K * positive(temperature, "Temperature in Kelvin"));
  }
  return positive(pressure, "Pressure") * positive(volume, "Volume") /
    (positive(moles, "Moles") * GAS_CONSTANTS.L_KPA_PER_MOL_K);
}

/** Solve a1/b1 = a2/b2, used by Charles, Gay-Lussac, and Avogadro. */
export function solveRatio(values, solveIndex) {
  if (!Array.isArray(values) || values.length !== 4 || solveIndex < 0 || solveIndex > 3) {
    throw new TypeError("Four values and a solve index from 0 to 3 are required.");
  }
  values.forEach((value, index) => {
    if (index !== solveIndex) positive(value, `Value ${index + 1}`);
  });
  const [a1, b1, a2, b2] = values;
  return [a2 * b1 / b2, b2 * a1 / a2, b2 * a1 / b1, a2 * b1 / a1][solveIndex];
}

/** Solve a1*b1 = a2*b2 (Boyle's law). */
export function solveBoyle(values, solveIndex) {
  if (!Array.isArray(values) || values.length !== 4 || solveIndex < 0 || solveIndex > 3) {
    throw new TypeError("Four values and a solve index from 0 to 3 are required.");
  }
  values.forEach((value, index) => {
    if (index !== solveIndex) positive(value, `Value ${index + 1}`);
  });
  const [p1, v1, p2, v2] = values;
  return [p2 * v2 / v1, p2 * v2 / p1, p1 * v1 / v2, p1 * v1 / p2][solveIndex];
}

export function calculateGasLaw(type, values, solveIndex) {
  if (type === "boyle") return solveBoyle(values, solveIndex);
  if (["charles", "gaylussac", "avogadro"].includes(type)) return solveRatio(values, solveIndex);
  if (type === "ige") {
    const ideal = ["pressure", "volume", "moles", "temperature"];
    const input = Object.fromEntries(ideal.map((key, index) => [key, index === solveIndex ? undefined : values[index]]));
    return solveIdealGas(input);
  }
  throw new RangeError(`Unsupported gas law: ${type}.`);
}
