
const inputBoxesEls = document.querySelectorAll(".input");
const labelEls = document.querySelectorAll(".label");
const dropDownMenu = document.querySelector(".ddMenu");
const optBtn = document.querySelectorAll(".opt-btn");
const lblUnit = document.querySelectorAll(".lbl-unit");
const messageEl = document.querySelector("#calc-message");
const formulaTextEl = document.querySelector("#formula-text");
const formulaNoteEl = document.querySelector("#formula-note");


let currentType = "boyle";
let currentVar = 1;


let values = [];


const boyleLabels = [
  "Initial Pressure",
  "Initial Volume",
  "Final Pressure",
  "Final Volume"
];
const charlesLabels = [
  "Initial Volume",
  "Initial Temperature",
  "Final Volume",
  "Final Temperature"
];
const gaylussacLabels = [
  "Initial Pressure",
  "Initial Temperature",
  "Final Pressure",
  "Final Temperature"
];
const avogadroLabels = [
  "Initial Volume",
  "Initial Number of Moles",
  "Final Volume",
  "Final Number of Moles"
];
const igeLabels = ["Pressure", "Volume", "Number of moles", "Temperature"];


const units = ["kpa", "L", "moles", "K"];

const scientificThreshold = 1e-3;
const scientificUpperThreshold = 1e4;
const formulaMap = {
  boyle: { formula: "P<sub>1</sub>V<sub>1</sub> = P<sub>2</sub>V<sub>2</sub>", note: "Pressure and volume change inversely at constant temperature." },
  charles: { formula: "V<sub>1</sub>/T<sub>1</sub> = V<sub>2</sub>/T<sub>2</sub>", note: "Volume and temperature change together at constant pressure." },
  gaylussac: { formula: "P<sub>1</sub>/T<sub>1</sub> = P<sub>2</sub>/T<sub>2</sub>", note: "Pressure and temperature change together at constant volume." },
  avogadro: { formula: "V<sub>1</sub>/n<sub>1</sub> = V<sub>2</sub>/n<sub>2</sub>", note: "Volume and moles change together at constant pressure and temperature." },
  ige: { formula: "PV = nRT", note: "Use the ideal gas law to connect pressure, volume, moles, and temperature." },
};

const showMessage = function (message) {
  messageEl.textContent = message;
  messageEl.hidden = !message;
};

const clearResult = function () {
  const resultField = inputBoxesEls[currentVar - 1];
  resultField.value = "";
};

const clearMessageIfReady = function () {
  showMessage("");
};

const updateFormulaCard = function (type) {
  const content = formulaMap[type] || formulaMap.boyle;
  formulaTextEl.innerHTML = content.formula;
  formulaNoteEl.textContent = content.note;
};

const isFiniteNumber = function (value) {
  return Number.isFinite(value);
};

const formatResult = function (value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  const absValue = Math.abs(value);
  if ((absValue > 0 && absValue < scientificThreshold) || absValue >= scientificUpperThreshold) {
    return value.toExponential(3);
  }
  return value.toFixed(3);
};

const setError = function (message) {
  clearResult();
  showMessage(message);
};

const validateInputs = function (type, resVar, arrEls) {
  const requiredIndices = [];
  for (let i = 0; i < arrEls.length; i++) {
    if (!arrEls[i].classList.contains("result")) {
      requiredIndices.push(i);
    }
  }

  for (const index of requiredIndices) {
    const rawValue = arrEls[index].value.trim();
    if (rawValue === "") {
      return { valid: false, message: "Please fill in all required fields." };
    }
    const numericValue = Number(rawValue);
    if (!isFiniteNumber(numericValue)) {
      return { valid: false, message: "Please enter valid finite numbers only." };
    }
    if (numericValue <= 0) {
      return { valid: false, message: "All values must be greater than 0." };
    }
    if (type === "ige" && index === 3 && numericValue <= 0) {
      return { valid: false, message: "Temperature in Kelvin must be greater than 0." };
    }
  }

  const fullValues = arrEls.map((item) => Number(item.value));
  if (type === "ige") {
    if (resVar === 1 && fullValues[1] === 0) {
      return { valid: false, message: "Division by zero is not allowed." };
    }
    if (resVar === 2 && fullValues[0] === 0) {
      return { valid: false, message: "Division by zero is not allowed." };
    }
    if (resVar === 3 && fullValues[3] === 0) {
      return { valid: false, message: "Division by zero is not allowed." };
    }
    if (resVar === 4 && fullValues[2] === 0) {
      return { valid: false, message: "Division by zero is not allowed." };
    }
  }

  return { valid: true };
};


const getLabels = function (type, index) {
  switch (type) {
    case "boyle":
      return boyleLabels[index];
    case "charles":
      return charlesLabels[index];
    case "gaylussac":
      return gaylussacLabels[index];
    case "avogadro":
      return avogadroLabels[index];
    case "ige":
      return igeLabels[index];
    default:
      return -1;
  }
};


const determineUnits = function (type, index) {
  if (type != "ige") {
    let unit1, unit2;
    switch (type) {
      case "boyle":
        unit1 = 1;
        unit2 = 0;
        break;
      case "charles":
        unit1 = 3;
        unit2 = 1;
        break;
      case "gaylussac":
        unit1 = 1;
        unit2 = 0;
        break;
      case "avogadro":
        unit1 = 2;
        unit2 = 1;
        break;
    }
    if ((index + 1) % 2 == 0) {
      lblUnit[index].textContent = units[unit1];
    } else {
      lblUnit[index].textContent = units[unit2];
    }
  } else {
    lblUnit[index].textContent = units[index];
  }
};

const getValues = function (arrEls, arrValues) {
  for (let i = 0; i < arrEls.length; i++) {
    if (arrEls[i].classList.contains("result")) {
      continue;
    }
    arrValues[i] = parseFloat(arrEls[i].value);
  }
};

const calcGasLaws = function (values, resVar, type) {
  if (type == "boyle") {
    switch (resVar) {
      case 1:
        return (values[2] * values[3]) / values[1];
      case 2:
        return (values[2] * values[3]) / values[0];
      case 3:
        return (values[0] * values[1]) / values[3];
      case 4:
        return (values[0] * values[1]) / values[2];
      default:
        return -1;
    }
  } else if (type == "ige") {
    const R = 8.31;
    switch (resVar) {
      case 1: //P
        return (values[2] * R * values[3]) / values[1];
      case 2: //V
        return (values[2] * R * values[3]) / values[0];
      case 3: //n
        return (values[0] * values[1]) / (R * values[3]);
      case 4: //T
        return (values[0] * values[1]) / (values[2] * R);
      default:
        return -1;
    }
  } else {
    switch (resVar) {
      case 1: //[0]
        return (values[2] * values[1]) / values[3];
      case 2: //[1]
        return (values[3] * values[0]) / values[2];
      case 3: //[2]
        return (values[3] * values[0]) / values[1];
      case 4: //[3]
        return (values[2] * values[1]) / values[0];
      default:
        return -1;
    }
  }
};

dropDownMenu.addEventListener("change", (event) => {
  for (let i = 1; i < inputBoxesEls.length + 1; i++) {
    document.getElementById("input-" + i).value = "";
    if (
      `${event.target.value}:` ==
      document.getElementById("label-" + i).textContent
    ) {
      currentVar = i;
      var elems = document.querySelectorAll(".result");
      elems.forEach(function (el) {
        el.classList.remove("result");
        el.readOnly = false;
        el.textContent = "";
      });
      inputBoxesEls[currentVar - 1].classList.add("result");
      inputBoxesEls[currentVar - 1].readOnly = true;
    }
  }
  clearMessageIfReady();
});

optBtn.forEach((item) => {
  item.addEventListener("click", () => {
    const type = item.className.substring(0, item.className.indexOf("-"));
    currentType = type;
    updateFormulaCard(type);
    for (let i = 0; i < labelEls.length; i++) {
      labelEls[i].textContent = `${getLabels(type, i)}:`;
      dropDownMenu.options[i].text = getLabels(type, i);
      dropDownMenu.options[i].value = getLabels(type, i);
      document.getElementById(`input-${i + 1}`).value = "";
      determineUnits(type, i);
    }
    [].forEach.call(document.querySelectorAll(".selected"), function (el) {
      el.classList.remove("selected");
    });
    item.classList.add("selected");
    clearMessageIfReady();
  });
});

updateFormulaCard(currentType);

inputBoxesEls.forEach((item) => {
  item.oninput = () => {
    const validation = validateInputs(currentType, currentVar, inputBoxesEls);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    getValues(inputBoxesEls, values);
    const rawResult = calcGasLaws(values, currentVar, currentType);
    if (!Number.isFinite(rawResult) || rawResult <= 0) {
      setError("The current values produce an invalid result.");
      return;
    }
    const result = formatResult(rawResult);
    if (result) {
      clearMessageIfReady();
      inputBoxesEls[currentVar - 1].value = result;
    } else {
      setError("The current values produce an invalid result.");
    }
  };
});

document.querySelector('.home-btn').addEventListener('click', function () {
  window.location.href = 'https://chemkit.vercel.app/';
});
