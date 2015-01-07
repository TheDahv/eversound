/**
* WebRTC::AudioVisualizer Module
*
* A collection of functions that can visualize an incoming audio stream
* leveraging the Web Audio API.
*/

// Helpful links
// - https://www.webrtc-experiment.com/docs/webrtc-for-beginners.html#waitUntilRemoteStreamStartsFlowing
define(['../vendor/raphael/raphael-min'], function (Raphael) {
  var exports = {};

  // Audio Processing Constants
  var TIME_SMOOTHING_CONSTANT = 0.3,
      FFT_SIZE = 1024;

  /**
  * Visualizes the frequency data on the incoming sound stream in a
  * flat graph format. The processing occurs in a loop that is throttled
  * by the canvas animation frame rate.
  *
  * @param {string} canvasDOMId The ID name of the canvas element on which we
  *   will draw the visualization. Note, no preceding '#' is required
  * @param {AudioContext} context The Web Audio processing context
  * @param {AudioStream} stream A Web Audio stream of audio signal
  */
  exports.visualizeAudio = function (canvasDOMId, context, stream) {
    var analyser, canvas, canvasCtx, canvasWidth, canvasHeight;

    canvas       = document.getElementById(canvasDOMId);
    canvasCtx    = canvas.getContext("2d");
    canvasWidth  = canvas.width;
    canvasHeight = canvas.height;

    analyser = context.createAnalyser();
    analyser.timeSmoothingConstant = TIME_SMOOTHING_CONSTANT;
    analyser.fftSize = FFT_SIZE;

    stream.connect(analyser);

    var processAudio = function () {
      requestAnimationFrame(function () {
        var array;

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

  // Constants for audioRings
  var RING_ANIMATE_DURATION = 1500,
      RING_ANIMATE_EASING = 'ease-in-out',
      MIN_AMPLITUDE_THRESHOLD = 5,
      MAX_AMPLITUDE_THRESHOLD = 40,
      AMPLITUDE_SAMPLE_SIZE = 5;

  // Helpers for audioRings
  var removeElement = function () { this.remove(); };
  var sum = function (arrayLike) {
    return Array.prototype.reduce.call(arrayLike,
      function (total, item) {
        return total + item;
      },
      0
    );
  };

  /**
  * Sets up a visualization of expanding concentric rings, simulating
  * the average amplitude of a given signal at a point in time.
  *
  * Amplitude is derived by taking the average of the a set of samples
  * approximating the amplitude by averaging the set of frequencies values
  * for a signal at a point in time.
  *
  * The algorithm also looks across its sample data to determine if the trend
  * of amplitude samples is increasing or decreasing. Its effect is to only
  * emit visualizations when the sound is increasing, but not when the
  * sound fades or stops.
  *
  * @param {string} canvasDOMId The ID name of the canvas element on which we
  *   will draw the visualization. Note, no preceding '#' is required
  * @param {AudioContext} context The Web Audio processing context
  * @param {AudioStream} stream A Web Audio stream of audio signal
  */
  exports.audioRings = function (canvasDOMId, context, stream) {
    // Drawing area
    var paper = Raphael(canvasDOMId),
        paperWidth = paper.width,
        paperHeight = paper.height,
    // Audio processing
        analyser, processAudio;

    analyser = context.createAnalyser();
    analyser.timeSmoothingConstant = TIME_SMOOTHING_CONSTANT;
    analyser.fftSize = FFT_SIZE;

    stream.connect(analyser);

    // Define an audio loop worker, and immediately run it
    (processAudio = function (amplitudeSamplesBuffer) {
      requestAnimationFrame(function () {
        var array, averageAmplitude, sampleAverage;

        // Load current sound frequency data into array
        array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        // Calculate the average amplitude across the frequencies
        // and add it to our sample if it is loud enough
        averageAmplitude = sum(array) / array.length;
        if (averageAmplitude >= MIN_AMPLITUDE_THRESHOLD) {
          amplitudeSamplesBuffer.push(averageAmplitude);
        }

        // If we have enough sound in the buffer, create a circle whose radius
        // represents the amplitude of the sound,
        // but only if the sample has a general upward trend
        if (amplitudeSamplesBuffer.length >= AMPLITUDE_SAMPLE_SIZE) {
          // Louder sounds should have larger circles, etc.
          sampleAverage = (sum(amplitudeSamplesBuffer) / amplitudeSamplesBuffer.length) *
            MAX_AMPLITUDE_THRESHOLD / MIN_AMPLITUDE_THRESHOLD;

          // Simplistic, naive way to determine if our samples are increasing
          // or decreasing in volume
          if (amplitudeSamplesBuffer[0] < amplitudeSamplesBuffer[amplitudeSamplesBuffer.length - 1]) {
            // Draw the circle in the middle of the canvas and immediately animate it
            paper.circle(paperWidth / 2, paperHeight / 2, 1)
              .attr({
                fill: "#F00000",
                stroke: '#F00000'
              })
              .animate(
              {
                r: sampleAverage / 2,
                opacity: 0.25
              },
              RING_ANIMATE_DURATION,
              RING_ANIMATE_EASING,
              removeElement
            );
          }

          // Reset sample buffer
          amplitudeSamplesBuffer = [];
        }

        // Run the loop again
        processAudio(amplitudeSamplesBuffer);
      });

    // Immediately invoke processAudio with an empty samples buffer
    })([]);
  };

  return exports;
});
