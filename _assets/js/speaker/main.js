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
      peerConn = new RTCPeerConnection(utils.serverConfig);

    connections.handleLocalCandidate(socket, messageName(channel, 'speaker-ice'), peerConn);
    connections.handleRemoteCandidate(socket, messageName(channel, 'broadcaster-ice'), peerConn);

    connections.createOffer(socket, peerConn, channel)
      .then(connections.sendOffer(messageName(channel, "description")))
      .then(connections.handleRemoteDescription(messageName(channel, "description-response")))
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

      var player = new Audio();
      attachMediaStream(player, event.stream);
      player.play();
    };
  };

  return exports;

});
