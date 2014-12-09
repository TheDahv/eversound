define(function () {
  var exports = {};
  var messageName = function (channel, action) {
    return ['speaker', channel, action].join(':');
  };

  exports.createAndSendCandidate = function (socket, conn, channel) {
    conn.onicecandidate = function (evt) {
      socket.emit(messageName(channel, 'candidate'), {
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
      { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
    );
  };

  exports.joinChannel = function (channel) {
    var socket = io(document.location.host),
      peerConn = new RTCPeerConnection({ "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] }); //{ "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] });

    peerConn.onicecandidate = function (evt) {
      console.log("Sending speaker ice...");
      socket.emit(messageName(channel, 'speaker-ice'), {
        "candidate": evt.candidate
      });
    };

    //exports.createAndSendCandidate(socket, peerConn, channel);
    exports.receiveCandidateResponse(socket, peerConn, channel);
    exports.createAndSendOffer(socket, peerConn, channel);

    peerConn.onaddstream = function (event) {
      console.log("Got a stream!");
      console.log(event);

      var stream = event.stream;
      var audioContext = new AudioContext();
      var streamSource = audioContext.createMediaStreamSource(stream);
      streamSource.connect(audioContext.destination);
    };
  };

  return exports;

});
