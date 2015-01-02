define(
  ['webrtc/utils', 'webrtc/media', 'webrtc/audiovisualizer', 'webrtc/connections', 'when'],
  function (utils, media, visualizer, connections, w) {

  var exports = {};
  var messageName = function (channel, action) {
    return ['broadcaster', channel, action].join(':');
  };

  exports.openChannel = function (channel) {
    var socket = io(document.location.host);
    media.initializeLocalMedia({ audio: true, video: false })
      .then(function (stream) {
        // Set up local audio source
        console.log("Microphone set up and waiting for speakers to connect...");

        var audioContext = new AudioContext();
        var streamSource = audioContext.createMediaStreamSource(stream);

        visualizer.audioRings('audioRings', audioContext, streamSource);

        return stream;
      })
      .then(function (stream) {
        var deferred = w.defer();

        // Now wait for remote "speakers" to connect
        socket.on(messageName(channel, 'description'), function (speakerDesc) {
          deferred.resolve({
            speakerDesc: speakerDesc,
            stream: stream
          });
        });

        return deferred.promise;
      })
      .then(function (data) {
        console.log("Speaker joined!");
        // Set up Peer Connection information
        var peerConn = new RTCPeerConnection(utils.serverConfig);

        // Generate broadcaster ICE candidate and send back
        connections.handleLocalCandidate(socket, messageName(channel, 'broadcaster-ice'), peerConn);
        connections.handleRemoteCandidate(socket, messageName(channel, 'speaker-ice'), peerConn);

        // Add audio stream to connection before responding
        peerConn.addStream(data.stream);

        return connections.handleOffer(peerConn, data.speakerDesc);
      })
      .then(connections.createAnswer(socket, messageName(channel, 'description-response')))
      .done(
        function () {
          console.log("Broadcaster peer connection set up complete!");
        },
        function (err) {
          console.log("Broadcaster peer connection set up failed", err);
        }
      );
  };

  return exports;

});
