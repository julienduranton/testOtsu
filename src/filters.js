/**
 * Module containing the different filters and pre-processing functions
 */
class Filters {
  constructor() {
    this.tmpCanvas = document.createElement("canvas");
    this.tmpCtx = this.tmpCanvas.getContext("2d");
    this.maxSum = 0;
    this.thresholds = [];
  }

  /**
   *
   * @param {*} filter
   * @param {ImageData} imgData
   * @param {*} var_args
   */
  filterImage = function (filter, imgData, var_args) {
    var args = [imgData];
    for (var i = 2; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    return filter.apply(null, args);
  };
  /**
   *
   * @param {ImageData} pixels
   * @param {*} args
   */
  grayscale = function (pixels, args) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      // CIE luminance for the RGB
      // The human eye is bad at seeing red and blue, so we de-emphasize them.
      var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    return pixels;
  };
  /**
   *
   * @param {ImageData} pixels
   * @param {Number} adjustment
   */
  brightness = function (pixels, adjustment) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      d[i] += adjustment;
      d[i + 1] += adjustment;
      d[i + 2] += adjustment;
    }
    return pixels;
  };

  /**
   *
   * @param {ImageData} pixels
   * @param {Number} threshold
   */
  threshold = function (pixels, threshold) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      var v = 0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    return pixels;
  };

  createImageData = function (w, h) {
    return this.tmpCtx.createImageData(w, h);
  };

  /**
   *
   * @param {ImageData} pixels
   * @param {Number[]} weights
   * @param {*} opaque
   */
  convolute = function (pixels, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side / 2);
    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;
    // pad output by the convolution matrix
    var w = sw;
    var h = sh;
    var output = this.createImageData(w, h);
    var dst = output.data;
    // go through the destination image pixels
    var alphaFac = opaque ? 1 : 0;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var sy = y;
        var sx = x;
        var dstOff = (y * w + x) * 4;
        // calculate the weighed sum of the source image pixels that
        // fall under the convolution matrix
        var r = 0,
          g = 0,
          b = 0,
          a = 0;
        for (var cy = 0; cy < side; cy++) {
          for (var cx = 0; cx < side; cx++) {
            var scy = sy + cy - halfSide;
            var scx = sx + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              var srcOff = (scy * sw + scx) * 4;
              var wt = weights[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
              a += src[srcOff + 3] * wt;
            }
          }
        }
        dst[dstOff] = r;
        dst[dstOff + 1] = g;
        dst[dstOff + 2] = b;
        dst[dstOff + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  sharpen = function (pixels) {
    let output = this.convolute(pixels, [0, -1, 0, -1, 5, -1, 0, -1, 0]);
    return output;
  };

  convoluteFloat32 = function (pixels, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side / 2);

    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;

    var w = sw;
    var h = sh;
    var output = {
      width: w,
      height: h,
      data: new Float32Array(w * h * 4),
    };
    var dst = output.data;

    var alphaFac = opaque ? 1 : 0;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var sy = y;
        var sx = x;
        var dstOff = (y * w + x) * 4;
        var r = 0,
          g = 0,
          b = 0,
          a = 0;
        for (var cy = 0; cy < side; cy++) {
          for (var cx = 0; cx < side; cx++) {
            var scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
            var scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
            var srcOff = (scy * sw + scx) * 4;
            var wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
            a += src[srcOff + 3] * wt;
          }
        }
        dst[dstOff] = r;
        dst[dstOff + 1] = g;
        dst[dstOff + 2] = b;
        dst[dstOff + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  /**
   *
   * @param {ImageData} image
   */
  sobel = function (image) {
    var grayscale = this.filterImage(this.grayscale, image);
    // Note that ImageData values are clamped between 0 and 255, so we need
    // to use a Float32Array for the gradient values because they
    // range between -255 and 255.
    var vertical = this.convoluteFloat32(grayscale, [-1, 0, 1, -2, 0, 2, -1, 0, 1]);
    var horizontal = this.convoluteFloat32(grayscale, [-1, -2, -1, 0, 0, 0, 1, 2, 1]);
    var final_image = this.createImageData(vertical.width, vertical.height);
    for (var i = 0; i < final_image.data.length; i += 4) {
      // make the vertical gradient black
      var v = Math.abs(vertical.data[i]);
      final_image.data[i] = v;
      // make the horizontal gradient green
      var h = Math.abs(horizontal.data[i]);
      final_image.data[i + 1] = h;
      // and mix in some blue for aesthetics
      final_image.data[i + 2] = (v + h) / 4;
      final_image.data[i + 3] = 255; // opaque alpha
    }
    return final_image;
  };
  /**
   *
   * @param {*} img
   */
  getPixels = function (img) {
    var c = this.getCanvas(img.width, img.height);
    var ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height);
  };

  getCanvas = function (w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };

  histogram(image) {
    // Create the histogram
    var histogram = new Array(256);
    histogram.fill(0);

    for (var i = 0; i < image.data.length; i += 4) {
      var luma = (11 * image.data[i] + 16 * image.data[i + 1] + 5 * image.data[i + 2]) >> 5;
      histogram[luma]++;
    }

    // Since we use sum tables add one more to avoid unexistent colors.
    for (var j = 0; j < histogram.length; j++) histogram[j]++;

    return histogram;
  }

  buildTables(histogram) {
    // Create cumulative sum tables.
    var P = new Array(histogram.length + 1);
    var S = new Array(histogram.length + 1);
    P[0] = 0;
    S[0] = 0;

    var sumP = 0;
    var sumS = 0;

    for (var i = 0; i < histogram.length; i++) {
      sumP += histogram[i];
      sumS += i * histogram[i];
      P[i + 1] = sumP;
      S[i + 1] = sumS;
    }

    // Calculate the between-class variance for the interval u-v
    var H = new Array(histogram.length * histogram.length);
    H.fill(0);

    for (var u = 0; u < histogram.length; u++)
      for (var v = u + 1; v < histogram.length; v++)
        H[v + u * histogram.length] = Math.pow(S[v] - S[u], 2) / (P[v] - P[u]);

    return H;
  }

  for_loop(H, u, vmax, level, levels, index) {
    var classes = index.length - 1;

    for (var i = u; i < vmax; i++) {
      index[level] = i;

      if (level + 1 >= classes) {
        // Reached the end of the for loop.

        // Calculate the quadratic sum of al intervals.
        var sum = 0;

        for (var c = 0; c < classes; c++) {
          u = index[c];
          var v = index[c + 1];
          var s = H[v + u * levels];
          sum += s;
        }

        if (this.maxSum < sum) {
          // Return calculated threshold.
          this.thresholds = index.slice(1, index.length - 1);
          this.maxSum = sum;
        }
      } else {
        // Start a new for loop level, one position after current one.
        this.for_loop(H, i + 1, vmax + 1, level + 1, levels, index);
      }
    }
  }

  otsu(histogram, classes) {
    this.maxSum = 0;
    this.thresholds = new Array(classes - 1);
    this.thresholds.fill(0);
    var H = this.buildTables(histogram);
    var index = new Array(classes + 1);
    index[0] = 0;
    index[index.length - 1] = histogram.length - 1;

    this.for_loop(H, 1, histogram.length - classes + 1, 1, histogram.length, index);

    return this.thresholds;
  }

  drawResultInverted(thresholds, classes, colorList) {
    // var src = srcImgData;
    // var dst = this.tmpCanvas;
    // dst.width = src.width;
    // dst.height = src.height;
    // var ctx = dst.getContext("2d");
    // ctx.drawImage(src, 0, 0, dst.width, dst.height);
    // var imageData = ctx.getImageData(0, 0, dst.width, dst.height);
    // var dstData = imageData.data;
    var newColors = new Array(classes);

    if (colorList && colorList.length === classes) {
      newColors = colorList;
    } else {
      for (var i = 0; i < classes; i++) {
        newColors[i] = Math.round((255 * i) / (classes - 1));
      }
    }
    var colorTable = new Array(256);
    var j = 0;

    for (var k = 0; k < colorTable.length; k++) {
      if (j < thresholds.length && k >= thresholds[j]) j++;

      colorTable[k] = newColors[j];
    }

    // for (var p = 0; p < dstData.length; p += 4) {
    //   var luma =
    //     (11 * dstData[p] + 16 * dstData[p + 1] + 5 * dstData[p + 2]) >> 5;
    //   luma = colorTable[luma];

    //   dstData[p] = luma;
    //   dstData[p + 1] = luma;
    //   dstData[p + 2] = luma;
    //   dstData[p + 3] = 255;
    // }

    // ctx.putImageData(imageData, 0, 0); //, 0, 0, dst.width, dst.height);
    return newColors;
  }

  firstOtsu(imgData, nclasses) {
    var colorList = null;
    var hist = this.histogram(imgData);
    var thresholds = this.otsu(hist, nclasses);
    const newColors = this.drawResultInverted(thresholds, nclasses, colorList);
    const params = { threshold: thresholds, colors: newColors };
    const dstImgData = this.otsuFilter(imgData, params);
    return dstImgData;
  }

  /**
   * Code to apply OTSU thresholding on bounding-boxes
   * @param {ImageData} imgData -
   * @param {Object} params - Object containting thresholding parameters
   * @param {Number[]} params.threshold - Array of the thresholds
   * @param {Number[]} params.colors - Array of the colors by class
   * @returns {ImageData}
   */
  otsuFilter(imgData, params) {
    var dstData = imgData.data;

    const thresholds = params.threshold;
    const colors = params.colors;

    var colorTable = new Array(256);
    var j = 0;

    for (var k = 0; k < colorTable.length; k++) {
      if (j < thresholds.length && k >= thresholds[j]) j++;

      colorTable[k] = colors[j];
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
}

module.exports = Filters;
