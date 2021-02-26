import { ZONE_READER_STATUS } from "../../context/drawZone/constants";

let logic = null;
const { createWorker } = require("tesseract.js");
const timeseries = require("timeseries-analysis");
const { firstOtsu, histogram, otsu } = require("./otsu.js");
const pixelmatch = require("pixelmatch");
const Filters = require("./filters");
/**
 * Main class containing challenge text detection
 */
export class ZoneLogic {
  static textworker = null;
  static digitworker = null;
  /**
   * constructor for main class
   * @constructor
   * @param {Object} game_data - array of all bounding boxes with their coordinates, labels, types and thresholding parameters)
   * @param {Object[]} game_data.zones - Array of all available data zones in the game
   * @param {Object} game_data.zones[].bbox - zone coordinates
   * @param {Number} game_data.zones[].bbox.left - x value of bbox start (in % of total image width)
   * @param {Number} game_data.zones[].bbox.top - y value of bbox start (in % of total image height)
   * @param {Number} game_data.zones[].bbox.width - value of bbox width (in % of total image width)
   * @param {Number} game_data.zones[].bbox.height - value of bbox height (in % of total image height)
   * @param {String} game_data.zones[].label - zone label
   * @param {String} game_data.zones[].type - Type of data to read ('text' or 'digit')
   * @param {Object} game_data.zones[].params - Thresholding parameters
   * @param {String} game_data.zones[].params.version - String of the version of parameters
   * @param {Number[]} game_data.zones[].params.threshold - Values of thresholding cut-offs
   * @param {Number[]} game_data.zones[].params.colors - Values of color by class
   * @param {Boolean} game_data.zones[].params.invert - Boolean used to end up with black text on white background
   */
  constructor(game_data) {
    this.game_data = game_data;
    this.readZone = this.game_data.zones[0];
    this.nclasses = 2;
  }
  /**
   * Code to run text detection on target zones
   * @param {HTMLCanvasElement} canvas - canvas with the image
   * @param {HTMLCanvasElement} CropCanvas - canvas with crop of the bounding box
   * @param {Object} zone - Bounding box to read
   * @param {Object} zone.bbox - zone coordinates
   * @param {Number} zone.bbox.left - x value of bbox start (in % of total image width)
   * @param {Number} zone.bbox.top - y value of bbox start (in % of total image height)
   * @param {Number} zone.bbox.width - value of bbox width (in % of total image width)
   * @param {Number} zone.bbox.height - value of bbox height (in % of total image height)
   * @param {String} zone.label - zone label
   * @param {String} zone.type - Type of data to read ('text' or 'digit')
   * @param {Object} zone.params - Thresholding parameters
   * @param {Number[]} zone.params.threshold - Value of thresholding cut-off
   * @param {Number[]} zone.params.colors - Value of thresholding cut-off
   * @param {Boolean} zone.params.invert - Boolean used to end up with black text on white background
   * @return {Object} returns dictionnary containing read values
   */
  async runZone(canvas, CropCanvas, zone) {
    // Crop box
    if (!zone || !zone.bbox || (zone.type !== "image" && zone.type !== "digit" && zone.type !== "text")) return;
    var Filter = new Filters();
    var gctx = canvas.getContext("2d");
    var cropctx = CropCanvas.getContext("2d");
    var result = [];
    let imgDataFilt = null;
    let otsuTarget = null;
    try {
      otsuTarget = zone.params.targetValue;
    } catch {
      otsuTarget = null;
    }
    // Resize box
    const newBox = await this.convertBbox(zone.bbox, canvas);
    var imgData = await gctx.getImageData(newBox.left, newBox.top, newBox.width, newBox.height);
    // add canvas for crop image
    const cropCV = document.createElement("canvas");
    cropCV.setAttribute("id", `canvas_${zone.id}`);
    cropCV.width = newBox.width;
    cropCV.height = newBox.height;
    const cropCVctx = cropCV.getContext("2d");
    // =================================
    // Filter imgData
    console.log("zone: ", zone);
    if (zone.params.version === "2.0") {
      if (zone.type === "image" || !otsuTarget) {
        imgDataFilt = await this.otsuFilter(imgData, zone.params);
      } else {
        let otsuResults = await this.getbestOtsu(imgData, otsuTarget, zone, 5);
        imgDataFilt = await this.otsuFilter(imgData, otsuResults.params);
      }
    } else {
      imgDataFilt = await this.filterImgData(imgData, zone.params);
    }
    // Add Sharpening & Edge Thinning
    imgDataFilt = Filter.sharpen(imgDataFilt);

    // Resize CropCanvas to crop size + padding (20px on each side)
    CropCanvas.width = newBox.width;
    CropCanvas.height = newBox.height;

    // Fill Canvas in white
    cropctx.fillStyle = "#FFFFFF";
    cropctx.fillRect(0, 0, CropCanvas.width, CropCanvas.height);
    // Draw centered on CropCanvas
    await cropCVctx.putImageData(imgDataFilt, 0, 0);

    const imgCrop = cropCV.toDataURL(); // get imageDataURL
    // Run prediction on filtered canvas
    try {
      if (zone.type === "text") {
        result = await ZoneLogic.textworker.recognize(cropCV);
      } else if (zone.type === "digit") {
        result = await ZoneLogic.digitworker.recognize(cropCV);
      } else if (zone.type === "image") {
        let savedCanvas = document.getElementById("savedCanvas");
        let percMatch = this.compareImages(cropCV, savedCanvas);
        result = { data: { text: "", confidence: percMatch } };
      } else {
        console.log("Not a valid type");
      }
    } catch (error) {
      result = null;
      console.log(error);
    }
    // Shape result
    const result_dict = this.shapeZoneResult(result, zone);
    result_dict.threshold = imgDataFilt.threshold;
    result_dict.imgCrop = imgCrop;
    result_dict.zoneId = zone.id;
    console.log("result: ", result_dict);
    return result_dict;
  }

  /**
   * Code to shape ocr result into JSON object
   * @param {Array} ocrprom
   * @param {Object} zone - Bounding box to read
   * @param {Object} zone.bbox - zone coordinates
   * @param {Number} zone.bbox.left - x value of bbox start (in % of total image width)
   * @param {Number} zone.bbox.top - y value of bbox start (in % of total image height)
   * @param {Number} zone.bbox.width - value of bbox width (in % of total image width)
   * @param {Number} zone.bbox.height - value of bbox height (in % of total image height)
   * @param {String} zone.label - zone label
   * @param {String} zone.type - Type of data to read ('text' or 'digit')
   * @param {Object} zone.params - Thresholding parameters
   * @param {Number} zone.params.threshold - Value of thresholding cut-off
   * @param {Boolean} zone.params.invert - Boolean used to end up with black text on white background
   * @returns {Object} returns dictionnary of read results
   */
  shapeZoneResult(ocrprom, zone) {
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
      label: zone.label,
      value: ocrprom ? ocrprom.data.text.replace("\n", "") : "",
      confidence: ocrprom ? ocrprom.data.confidence : 0,
    };
    return result_dict;
  }

  async getbestOtsu(imgData, targetValue, zone, n_max) {
    let n_classes = 2;
    let params = {};
    let confidence = 0;
    let result = {};
    let result_dict = {};
    let bestConfidence = 0;
    let bestParams = {};
    let tmpCanvas = document.createElement("canvas");
    let tmpCtx = tmpCanvas.getContext("2d");

    if (zone.type !== "digit" || zone.type !== "text") {
      return;
    }
    for (let j = n_classes; j <= n_max; j += 1) {
      params = firstOtsu(imgData, j);
      let permutations = this.getFlips(j);
      let colorLists = this.convertList(permutations);
      for (let i = 0; i < colorLists.length; i += 1) {
        params.colors = colorLists[i];
        let imgDataFilt = await this.otsuFilter(imgData, params);
        tmpCtx.putImageData(imgDataFilt);
        if (zone.type === "text") {
          result = await ZoneLogic.textworker.recognize(tmpCanvas);
        } else {
          result = await ZoneLogic.digitworker.recognize(tmpCanvas);
        }
        result_dict = this.shapeZoneResult(result, zone);
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
    return { params: bestParams, confidence: bestConfidence };
  }

  getFlips(n) {
    if (n <= 0) {
      return [""];
    } else {
      const prev = this.getFlips(n - 1).flatMap((r) => [r + "W", r + "B"]);
      return prev;
    }
  }

  convertList(colorPerm) {
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

  compareImages(CropCanvas, targetCanvas) {
    let tctx = targetCanvas.getContext("2d");
    let CropCtx = CropCanvas.getContext("2d");
    let imgData = CropCtx.getImageData(0, 0, CropCtx.width, CropCtx.height);

    let tImgData = tctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);

    const numDiffPixels = pixelmatch(imgData.data, tImgData.data, null, imgData.width, imgData.height, {
      threshold: 0.1,
    });
    const percDiff = (numDiffPixels / (imgData.width * imgData.height)) * 100;
    // console.log("% diff: ", percDiff);
    let confidenceTrigger = 100 - percDiff;
    return confidenceTrigger;
  }
  /**
   * Code to apply custom thresholding on bounding-boxes
   * @param {ImageData} imgData - ImageData of the cropped box to read
   * @param {Object} params - Thresholding parameters
   * @param {Number} params.threshold - Value of thresholding cut-off
   * @param {Boolean} params.invert - Boolean used to end up with black text on white background
   * @returns {ImageData} returns thresholded ImageData
   */
  async filterImgData(imgData, params) {
    // var gctx = canvas.getContext("2d");
    // var imgData = gctx.getImageData(0, 0, canvas.width, canvas.height);
    const threshold = params.threshold;
    const invert = params.invert;
    var d = imgData.data;
    // threshold
    if (invert === true) {
      for (let i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        var v = 0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    } else {
      for (let i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        var v = 0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    }
    // await gctx.putImageData(imgData, 0, 0);
    return imgData;
  }

  /**
   * Code to apply OTSU thresholding on bounding-boxes
   * @param {ImageData} imgData -
   * @param {Object} params - Object containting thresholding parameters
   * @param {Number[]} params.threshold - Array of the thresholds
   * @param {Number[]} params.colors - Array of the colors by class
   * @returns {ImageData}
   */
  async otsuFilter(imgData, params = null) {
    var dstData = imgData.data;

    if (params === null) {
      params = firstOtsu(imgData, this.nclasses);
    }

    const hist = histogram(imgData);
    const autoThresholds = otsu(hist, params.colors.length);

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
      var luma = (11 * dstData[i] + 16 * dstData[i + 1] + 5 * dstData[i + 2]) >> 5;
      luma = colorTable[luma];

      dstData[i] = luma;
      dstData[i + 1] = luma;
      dstData[i + 2] = luma;
      dstData[i + 3] = 255;
    }
    return imgData;
  }

  /**
   * Code to convert bboxes from % of image size to coordinates based on canvas size
   * @param {Object} rectangle - zone coordinates
   * @param {Number} rectangle.left - x value of bbox start (in % of total image width)
   * @param {Number} rectangle.top - y value of bbox start (in % of total image height)
   * @param {Number} rectangle.width - value of bbox width (in % of total image width)
   * @param {Number} rectangle.height - value of bbox height (in % of total image height)
   * @param {HTMLCanvasElement} canvas
   * @returns {Object} returns dictionnary with bbox coordinates in pixel value
   */
  async convertBbox(rectangle, canvas) {
    const newW = canvas.width;
    const newH = canvas.height;
    var newBox = await {
      left: Math.round(rectangle.left * newW),
      top: Math.round(rectangle.top * newH),
      width: Math.round(rectangle.width * newW),
      height: Math.round(rectangle.height * newH),
    };
    return newBox;
  }
  /**
   * Code to run auto-regression on scores to detect outliers and smoothen results
   * TODO Not tested yet
   * @param {Array} data_ts - Timeseries data of the score reading
   * @returns {*} Smoothed data
   */
  async ARscore(data_ts) {
    // Remove NaN
    data_ts = data_ts.filter((value) => !Number.isNaN(value[1]));
    var t = new timeseries.main(data_ts);
    await t.smoother({ period: 5 }).save("smoothed");
    // Find the best settings for the forecasting:
    var bestSettings = await t.regression_forecast_optimize();
    const new_scores = await t.sliding_regression_forecast({
      sample: bestSettings.sample,
      degree: bestSettings.degree,
      method: bestSettings.method,
    });
    return new_scores;
  }
  /**
   * Code to load a text worker and a digit worker
   */
  static async load_allWorkers() {
    // Load text worker
    ZoneLogic.textworker = createWorker();
    ZoneLogic.digitworker = createWorker();

    await Promise.all([ZoneLogic.textworker.load(), ZoneLogic.digitworker.load()]);

    await Promise.all([ZoneLogic.textworker.loadLanguage("eng"), ZoneLogic.digitworker.loadLanguage("eng")]);

    await Promise.all([ZoneLogic.digitworker.initialize("eng"), ZoneLogic.textworker.initialize("eng")]);

    await Promise.all([
      ZoneLogic.textworker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz! ",
        preserve_interword_spaces: "1",
      }),
      ZoneLogic.digitworker.setParameters({
        tessedit_char_whitelist: "0123456789Xx",
      }),
    ]);
    console.log("Workers Loaded");
  }

  static async killWorkers() {
    if (ZoneLogic.textworker && ZoneLogic.digitworker) {
      await ZoneLogic.textworker.terminate();
      await ZoneLogic.digitworker.terminate();
      console.log("workers terminated...");
    }
  }
}
/**
 * Self-Invoking Start of Text Detection
 */

export function ZoneReader(game_data, setValueZoneReader, setReaderStatus) {
  game_data = JSON.parse(game_data);

  // Parameters
  const uploadWidth = 400; // Minimum width of the uploaded image

  let v = null;
  let timeout = Date.now() + 30000; // Add 30 sec timeout for video creation

  let imageCanvas = null;
  let imageCtx = null;
  let CropCanvas = null;
  let waitingSecs = 0;

  (async () => {
    logic = new ZoneLogic(game_data);
    // await logic.load_allWorkers();
    await detectVideo();
  })();

  /**
   *  Draws the video on the canvas, and send it if it changed
   */
  async function sendImageFromCanvas() {
    imageCtx.drawImage(v, 0, 0, v.videoWidth, v.videoHeight, 0, 0, imageCanvas.width, imageCanvas.height);
    const results = await logic.runZone(imageCanvas, CropCanvas, logic.readZone);

    if (setValueZoneReader) setValueZoneReader(results);
    if (setReaderStatus) setReaderStatus(ZONE_READER_STATUS.DONE);
    // logic.killWorkers();
    return results;
  }

  /**
   *  Starts the Scene Detection logic
   */
  async function startSceneDetection() {
    imageCanvas = document.getElementsByTagName("canvas")[0];
    imageCtx = imageCanvas.getContext("2d");
    CropCanvas = document.getElementsByTagName("canvas")[1];

    imageCanvas.width = uploadWidth;
    imageCanvas.height = imageCanvas.width * (v.videoHeight / v.videoWidth);

    const resultOneZone = await sendImageFromCanvas();
    return resultOneZone;
  }

  function prettyPrint(obj) {
    console.log(JSON.stringify(obj));
  }

  /**
   * Detects when video element is ready to run
   */
  function detectVideo() {
    try {
      if (setReaderStatus) setReaderStatus(ZONE_READER_STATUS.DETECTING);
      if (Date.now() >= timeout) {
        if (setReaderStatus) setReaderStatus(ZONE_READER_STATUS.EXPIRED);
        console.log("Timeout expired - Unable to load video");

        // Waiting for React App to add a video to the DOM
      } else if (document.getElementsByTagName("video").length === 0) {
        console.log("Waiting for video", ++waitingSecs);
        setTimeout(detectVideo, 1000);
        // Video detected - Starting scene detection
      } else {
        v = document.getElementsByTagName("video")[0];
        if (v.readyState >= 2) {
          v.play();
          startSceneDetection();
        } else {
          setTimeout(detectVideo, 1000);
        }
      }
    } catch (err) {
      prettyPrint(err);
    }
  }
}
