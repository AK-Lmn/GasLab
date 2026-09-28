import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateGasLaw,
  convertPressure,
  convertTemperature,
  convertVolume,
  GAS_CONSTANTS,
  solveIdealGas,
} from "../src/lib/gas-laws.js";

const closeTo = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);

test("ideal gas law solves P, V, n, and T", () => {
  const pressure = 101.325;
  const temperature = 298.15;
  const state = {
    pressure,
    volume: GAS_CONSTANTS.L_KPA_PER_MOL_K * temperature / pressure,
    moles: 1,
    temperature,
  };
  for (const key of Object.keys(state)) {
    const input = { ...state, [key]: undefined };
    closeTo(solveIdealGas(input), state[key], 1e-9);
  }
  assert.equal(GAS_CONSTANTS.L_KPA_PER_MOL_K, 8.31446);
});

test("Boyle's law solves every position", () => {
  const expected = [100, 2, 50, 4];
  expected.forEach((value, index) => {
    const inputs = [...expected];
    inputs[index] = undefined;
    closeTo(calculateGasLaw("boyle", inputs, index), value);
  });
});

for (const law of ["charles", "gaylussac", "avogadro"]) {
  test(`${law} ratio law solves every position`, () => {
    const expected = [2, 100, 6, 300];
    expected.forEach((value, index) => {
      const inputs = [...expected];
      inputs[index] = undefined;
      closeTo(calculateGasLaw(law, inputs, index), value);
    });
  });
}

test("rejects absolute zero and unsafe ideal-gas divisors", () => {
  for (const temperature of [0, -1, 1e-13]) {
    assert.throws(() => solveIdealGas({ pressure: undefined, volume: 1, moles: 1, temperature }), RangeError);
  }
  assert.throws(() => solveIdealGas({ pressure: undefined, volume: 0, moles: 1, temperature: 300 }), RangeError);
  assert.throws(() => solveIdealGas({ pressure: 0, volume: undefined, moles: 1, temperature: 300 }), RangeError);
  assert.throws(() => solveIdealGas({ pressure: 1, volume: 1, moles: 0, temperature: undefined }), RangeError);
  assert.throws(() => convertTemperature(-273.15, "C", "K"), RangeError);
});

test("pressure conversions round-trip across every supported unit", () => {
  const units = ["atm", "kPa", "bar", "mmHg", "Torr", "psi"];
  for (const from of units) for (const to of units) {
    closeTo(convertPressure(convertPressure(17.25, from, to), to, from), 17.25, 1e-12);
  }
  closeTo(convertPressure(1, "atm", "kPa"), 101.325, 1e-12);
});

test("volume conversions round-trip across every supported unit", () => {
  const units = ["L", "mL", "m3", "cm3"];
  for (const from of units) for (const to of units) {
    closeTo(convertVolume(convertVolume(17.25, from, to), to, from), 17.25, 1e-12);
  }
  assert.equal(convertVolume(1, "m³", "L"), 1000);
});

test("temperature conversions round-trip above absolute zero", () => {
  const units = ["K", "C", "F"];
  for (const from of units) for (const to of units) {
    const source = from === "K" ? 310.15 : from === "C" ? 37 : 98.6;
    closeTo(convertTemperature(convertTemperature(source, from, to), to, from), source, 1e-12);
  }
  closeTo(convertTemperature(32, "°F", "°C"), 0);
});
