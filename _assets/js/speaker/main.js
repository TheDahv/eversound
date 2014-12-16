// Helpful links
// - https://www.webrtc-experiment.com/docs/webrtc-for-beginners.html#waitUntilRemoteStreamStartsFlowing
// - http://stackoverflow.com/questions/24287054/chrome-wont-play-webaudio-getusermedia-via-webrtc-peer-js
// - http://servicelab.org/2013/07/24/streaming-audio-between-browsers-with-webrtc-and-webaudio/
define(
  ['webrtc/utils', 'webrtc/audiovisualizer', 'webrtc/connections'],
  function (utils, visualizer, connections) {

  var exports = {};
  var messageName = function (channel, action) {
    return ['speaker', channel, action].join(':');
  };

  exports.joinChannel = function (channel) {
    var socket = io(document.location.host),
      peerConn = new RTCPeerConnection(utils.serverConfig),
      speakerAudio;

    connections.handleLocalCandidate(socket, messageName(channel, 'speaker-ice'), peerConn);
    connections.handleRemoteCandidate(socket, messageName(channel, 'broadcaster-ice'), peerConn);

    connections.createOffer(socket, peerConn, channel)
      .then(connections.sendOffer(messageName(channel, "description")))
      .then(connections.handleRemoteDescription(messageName(channel, "description-response"), true))
      .done(
        // success
        function () {
          console.log("Speaker peer connection set up complete!");
        },
        // fail
        function (err) {
          console.log("Speaker peer connection set up failed", err);
        }
      );

    peerConn.onaddstream = function (event) {
      console.log("Got a stream!");

      // Implementation notes for audio output and processing
      // WebRTC -> WebAudio API does not work correctly in Chrome
      // See the following:
      // * https://code.google.com/p/chromium/issues/detail?can=2&q=121673&colspec=ID%20Pri%20M%20Iteration%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified&id=121673
      // * http://stackoverflow.com/questions/24287054/chrome-wont-play-webaudio-getusermedia-via-webrtc-peer-js

      // Normally, we would create an audioNode from the stream and connect
      // it to an audio context destination
      // Because we cannot create a functioning source node from the stream
      // we instead add it to an Audio DOM node
      var player = new Audio();
      attachMediaStream(player, event.stream);
      player.play();

      // Due to our WebRTC -> WebAudio issues, visualizations
      // will not work in Chrome
      var ctx = new AudioContext();
      var src = ctx.createMediaStreamSource(event.stream);
      visualizer.visualizeAudio('audioSignal', ctx, src);
      visualizer.audioRings('audioRings', ctx, src);
    };
  };

  return exports;

});
