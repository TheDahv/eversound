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

  var createAndSendCandidate = function (socket, conn, channel) {
    conn.onicecandidate = function (evt) {
      console.log("Sending speaker ice...");
      socket.emit(messageName(channel, 'speaker-ice'), {
        "candidate": evt.candidate
      });
    };
  };

  var receiveCandidateResponse = function (socket, conn, channel) {
    socket.on(messageName(channel, 'broadcaster-ice'), function (broadcasterIce) {
      if (broadcasterIce.candidate) {
        console.log("Adding broadcaster ice");
        conn.addIceCandidate(new RTCIceCandidate(broadcasterIce.candidate));
      }
    });
  };

  exports.joinChannel = function (channel) {
    var socket = io(document.location.host),
      peerConn = new RTCPeerConnection(utils.serverConfig);

    createAndSendCandidate(socket, peerConn, channel);
    receiveCandidateResponse(socket, peerConn, channel);

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
