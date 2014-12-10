// Helpful links
// - https://www.webrtc-experiment.com/docs/webrtc-for-beginners.html#waitUntilRemoteStreamStartsFlowing
// - http://stackoverflow.com/questions/24287054/chrome-wont-play-webaudio-getusermedia-via-webrtc-peer-js
// - http://servicelab.org/2013/07/24/streaming-audio-between-browsers-with-webrtc-and-webaudio/
define(['webrtc/utils', 'webrtc/audiovisualizer'], function (utils, visualizer) {
  var exports = {};
  var messageName = function (channel, action) {
    return ['speaker', channel, action].join(':');
  };

  exports.createAndSendCandidate = function (socket, conn, channel) {
    conn.onicecandidate = function (evt) {
      console.log("Sending speaker ice...");
      socket.emit(messageName(channel, 'speaker-ice'), {
        "candidate": evt.candidate
      });
    };
  };

  exports.receiveCandidateResponse = function (socket, conn, channel) {
    socket.on(messageName(channel, 'broadcaster-ice'), function (broadcasterIce) {
      if (broadcasterIce.candidate) {
        console.log("Adding broadcaster ice");
        conn.addIceCandidate(new RTCIceCandidate(broadcasterIce.candidate));
      }
    });
  };

  exports.createAndSendOffer = function (socket, conn, channel) {
    conn.createOffer(
      // success
      function (desc) {
        conn.setLocalDescription(desc, function () {
          socket.emit(messageName(channel, "description"), {
            "description": desc
          });
        });

        socket.on(messageName(channel, "description-response"), function (desc) {
          conn.setRemoteDescription(new RTCSessionDescription(desc.description),
            function () {
              console.log("Offers and answers all done!");
            },
            // setRemoteDescription:fail
            function (err) {
              console.log("Error handling description response from broadcaster", err);
            }
          );
        });
      },
      // fail
      function (err) {
        console.log("Error creating speaker offer: ", err);
      },
      utils.speakerOfferConfig
    );
  };

  exports.joinChannel = function (channel) {
    var socket = io(document.location.host),
      peerConn = new RTCPeerConnection(utils.serverConfig);

    exports.createAndSendCandidate(socket, peerConn, channel);
    exports.receiveCandidateResponse(socket, peerConn, channel);
    exports.createAndSendOffer(socket, peerConn, channel);

    peerConn.onaddstream = function (event) {
      console.log("Got a stream!");

      var player = new Audio();
      attachMediaStream(player, event.stream);
      player.play();
    };
  };

  return exports;

});
