// Helpful links
// - https://www.webrtc-experiment.com/docs/webrtc-for-beginners.html#waitUntilRemoteStreamStartsFlowing
define(function () {
  var exports = {};

  exports.visualizeAudio = function (canvasDOMId, context, stream) {
    var analyser, processorNode, canvas, canvasCtx, canvasWidth, canvasHeight,
      getAverageVolume;

    canvas       = document.getElementById(canvasDOMId);
    canvasCtx    = canvas.getContext("2d");
    canvasWidth  = canvas.width;
    canvasHeight = canvas.height;

    analyser = context.createAnalyser();
    analyser.timeSmoothingConstant = 0.3;
    analyser.fftSize = 1024;

    stream.connect(analyser);

    var processAudio = function () {
      requestAnimationFrame(function () {
        var array, average;

        array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        // clear current state
        canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        Array.prototype.forEach.call(array, function (freqValue, freqIndex) {
          var percent = freqValue / 256;
          var height = canvasHeight * percent;
          var offset = canvasHeight - height - 1;
          var barWidth = canvasWidth / analyser.frequencyBinCount;

          var hue = freqIndex / analyser.frequencyBinCount;

          canvasCtx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
          canvasCtx.fillRect(freqIndex * barWidth, offset, 1, 2);
        });

        // fire off next round of processing
        processAudio();
      });
    };
    processAudio();
  };

  return exports;
});
