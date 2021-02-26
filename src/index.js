const { createWorker } = require("tesseract.js");
const Otsu = require("./otsu");
const Filters = require("./filters");

let textworker = null;
let digitworker = null;
let f = new Filters();
let otsu = new Otsu();
let dstCanvas = document.getElementById("dstCanvas");
let dstCtx = dstCanvas.getContext("2d");
let sB = document.getElementById("startButton");

// sB.addEventListener("click", buttonStart());

async function buttonStart() {
  try {
    let originalImage = document.getElementById("originalImg");
    let zT = document.getElementById("zoneType");
    let tValue = document.getElementById("tValue");
    console.log(zT, tValue);
    // let imgData = f.getPixels(originalImage);
    // await load_allWorkers();
    // console.log("workers loaded");
    // let results = await getbestOtsu(imgData, tValue, zT, 5);
    // let bestImg = await otsuFilter(imgData, results.params);
    // console.log(results);
    // dstCtx.putImageData(
    //   bestImg,
    //   originalImage.clientWidth,
    //   originalImage.clientHeight
    // );
  } catch (e) {
    console.log("crashed in main");
    console.log(e);
  }
}

async function getbestOtsu(imgData, targetValue, zoneType, n_max) {
  let n_classes = 2;
  let params = {};
  let confidence = 0;
  let result = {};
  let result_dict = {};
  let bestConfidence = 0;
  let bestParams = {};
  let tmpCanvas = document.createElement("canvas");
  let tmpCtx = tmpCanvas.getContext("2d");

  if (zoneType !== "digit" || zoneType !== "text") {
    return;
  }
  for (let j = n_classes; j <= n_max; j += 1) {
    params = otsu.firstOtsu(imgData, j);
    let permutations = getFlips(j);
    let colorLists = convertList(permutations);
    for (let i = 0; i < colorLists.length; i += 1) {
      params.colors = colorLists[i];
      let imgDataFilt = await otsuFilter(imgData, params);
      tmpCtx.putImageData(imgDataFilt);
      if (zoneType === "text") {
        result = await ZoneLogic.textworker.recognize(tmpCanvas);
      } else {
        result = await ZoneLogic.digitworker.recognize(tmpCanvas);
      }
      result_dict = shapeZoneResult(result);
      confidence = result_dict.confidence;
      if (result_dict.value === targetValue) {
        if (confidence > 90) {
          bestConfidence = confidence;
          bestParams = params;
          break;
        } else if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestParams = params;
        } else {
          // do nothing
        }
      } else {
        // do nothing
      }
    }
    if (confidence > 90 && result_dict.value === targetValue) {
      break;
    }
  }
  return { params: bestParams, results: result_dict };
}

function getFlips(n) {
  if (n <= 0) {
    return [""];
  } else {
    const prev = getFlips(n - 1).flatMap((r) => [r + "W", r + "B"]);
    return prev;
  }
}

function shapeZoneResult(ocrprom) {
  const currtime = new Date();
  const toStringTime = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(currtime);
  const result_dict = {
    time: toStringTime,
    value: ocrprom ? ocrprom.data.text.replace("\n", "") : "",
    confidence: ocrprom ? ocrprom.data.confidence : 0,
  };
  return result_dict;
}

function convertList(colorPerm) {
  let colorList = [];
  for (let i = 0; i < colorPerm.length; i += 1) {
    let colors = [];
    let val = null;
    for (let j = 0; j < colorPerm[i].length; j += 1) {
      if (colorPerm[i][j] === "W") {
        val = 255;
      } else {
        val = 0;
      }
      colors.push(val);
    }
    colorList.push(colors);
  }
  return colorList;
}

async function load_allWorkers() {
  // Load text worker
  textworker = createWorker();
  digitworker = createWorker();

  await Promise.all([textworker.load(), digitworker.load()]);

  await Promise.all([
    textworker.loadLanguage("eng"),
    digitworker.loadLanguage("eng"),
  ]);

  await Promise.all([
    digitworker.initialize("eng"),
    textworker.initialize("eng"),
  ]);

  await Promise.all([
    textworker.setParameters({
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz! ",
      preserve_interword_spaces: "1",
    }),
    digitworker.setParameters({
      tessedit_char_whitelist: "0123456789Xx",
    }),
  ]);
  console.log("Workers Loaded");
}

async function killWorkers() {
  if (textworker && digitworker) {
    await textworker.terminate();
    await digitworker.terminate();
    console.log("workers terminated...");
  }
}

async function otsuFilter(imgData, params = null) {
  var dstData = imgData.data;

  if (params === null) {
    params = otsu.firstOtsu(imgData, 2);
  }

  const hist = otsu.histogram(imgData);
  const autoThresholds = otsu.otsu(hist, params.colors.length);

  imgData.threshold = autoThresholds;

  const thresholds = params.threshold || autoThresholds;
  const colors = params.colors;
  this.nclasses = colors.length;

  var colorTable = new Array(256);
  var j = 0;

  for (var i = 0; i < colorTable.length; i++) {
    if (j < thresholds.length && i >= thresholds[j]) j++;

    colorTable[i] = colors[j];
  }

  for (var i = 0; i < dstData.length; i += 4) {
    var luma =
      (11 * dstData[i] + 16 * dstData[i + 1] + 5 * dstData[i + 2]) >> 5;
    luma = colorTable[luma];

    dstData[i] = luma;
    dstData[i + 1] = luma;
    dstData[i + 2] = luma;
    dstData[i + 3] = 255;
  }
  return imgData;
}
