# GasLab

GasLab is a dependency-free browser calculator for Boyle's, Charles', Gay-Lussac's, Avogadro's, and ideal gas laws. Its pure calculation engine lives in `src/lib/gas-laws.js`; the DOM adapter remains in `script.js`.

The ideal-gas engine uses `R = 8.31446 L·kPa/(mol·K)` (also exported as `8.31446 J/(mol·K)` and `0.082057 L·atm/(mol·K)`). It rejects non-finite and effectively zero values, and requires absolute temperature to be greater than `0 K`.

## Supported conversions

| Quantity | Units | Basis |
| --- | --- | --- |
| Pressure | atm, kPa, bar, mmHg, Torr, psi | 1 atm = 101.325 kPa; 1 bar = 100 kPa; 1 Torr = 1/760 atm; 1 psi = 6894.757293168 Pa |
| Volume | L, mL, m³ (`m³`, `m^3`, or `m3`), cm³ (`cm³`, `cm^3`, or `cm3`) | 1 L = 1000 mL = 1000 cm³ = 0.001 m³ |
| Temperature | K, °C (`°C` or `C`), °F (`°F` or `F`) | K = °C + 273.15; K = (°F − 32) × 5/9 + 273.15 |

## Local verification

Requires Node.js 20 or newer.

```sh
npm ci
npm run lint
npm run typecheck
npm test
```

Open `index.html` through a local static-file server to use the browser UI.
