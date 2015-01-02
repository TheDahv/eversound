define(
  ['webrtc/utils', 'webrtc/media', 'webrtc/audiovisualizer', 'webrtc/connections'],
  function (utils, media, visualizer, connections) {

  var exports = {};
  var messageName = function (channel, action) {
    return ['broadcaster', channel, action].join(':');
  };

  exports.openChannel = function (channel) {
    var socket = io(document.location.host), audioStream;

    // Set up local audio source
    media.initializeLocalMedia({ audio: true, video: false }).done(
      function (stream) {
        console.log("Microphone set up and waiting for speakers to connect...");

        // Set library variable so peer connection handlers can
        // access it
        audioStream = stream;

        var audioContext = new AudioContext();
        var streamSource = audioContext.createMediaStreamSource(stream);

        visualizer.audioRings('audioRings', audioContext, streamSource);
      },
      function (err) {
        console.log(err);
      }
    );

    // Now wait for remote "speakers" to connect
    socket.on(messageName(channel, 'description'), function (speakerDesc) {
      console.log("Speaker joined!");
      // Set up Peer Connection information
      var peerConn = new RTCPeerConnection(utils.serverConfig);

      // Generate broadcaster ICE candidate and send back
      connections.handleLocalCandidate(socket, messageName(channel, 'broadcaster-ice'), peerConn);
      connections.handleRemoteCandidate(socket, messageName(channel, 'speaker-ice'), peerConn);

      // Add audio stream to connection before responding
      peerConn.addStream(audioStream);

      connections.handleOffer(peerConn, speakerDesc)
        .then(connections.createAnswer(socket, messageName(channel, 'description-response')))
        .done(
          function () {
            console.log("Broadcaster peer connection set up complete!");
          },
          function (err) {
            console.log("Broadcaster peer connection set up failed", err);
          }
        );

    });
  };

  return exports;

});
