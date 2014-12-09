define(['webrtc/media'], function (media) {

  var exports = {};
  var messageName = function (channel, action) {
    return ['broadcaster', channel, action].join(':');
  };

  exports.openChannel = function (channel) {
    var socket = io(document.location.host),
      audioSig, audioStream, connInfo = {};

    // Set up local audio source
    media.initializeLocalMedia({ audio: true, video: false }).done(
      function (stream) {
        audioStream = stream;
        console.log("Microphone set up and waiting for speakers to connect...");
      },
      function (err) {
        console.log(err);
      }
    );

    // Now wait for remote "speakers" to connect
    socket.on(messageName(channel, 'description'), function (speakerDesc) {
      console.log("Speaker joined!");
      // Set up Peer Connection information
      var peerConn = new RTCPeerConnection({ "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] }); //{ "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] });

      // Generate broadcaster ICE candidate and send back
      peerConn.onicecandidate = function (broadcasterIce) {
        if (broadcasterIce.candidate) {
          console.log("Sending broadcaster ice");
          // Send broadcaster ICE candidate back to speaker
          socket.emit(messageName(channel, 'broadcaster-ice'), {
            candidate: broadcasterIce.candidate
          });
        }
      };

      // Add audio stream to connection before responding
      console.log("Stream add attempt 1");
      peerConn.addStream(audioStream);

      peerConn.setRemoteDescription(new RTCSessionDescription(speakerDesc.description),
        function () {
          // Respond back to request to peer connect
          peerConn.createAnswer(function (broadcastDescription) {
            peerConn.setLocalDescription(broadcastDescription, function () {
              // Send broadcaster description back to speaker
              socket.emit(messageName(channel, 'description-response'), {
                description: broadcastDescription
              });

              console.log("Stream add attempt 2");
              peerConn.addStream(audioStream);
            });
          });
        },
        // setRemoteDescription:err
        function (err) {
          console.log("setRemoteDescription error", err);
        },
        { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
      );

      socket.on(messageName(channel, 'speaker-ice'), function (speakerIce) {
        // Speaker requested to join and sends ICE info
        if (speakerIce.candidate) {
          console.log("Adding speaker ice");
          peerConn.addIceCandidate(new RTCIceCandidate(speakerIce.candidate));
        }
      });
    });
  };

  return exports;

});
