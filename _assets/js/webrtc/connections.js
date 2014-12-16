define(['webrtc/utils', 'when'], function (utils, w) {
  var exports = {};

  exports.createOffer = function (socket, conn, channel) {
    var deferred = w.defer();

    conn.createOffer(
      function (desc) {
        conn.setLocalDescription(desc, function () {
          deferred.resolve({
            "socket"  : socket,
            "conn"    : conn,
            "channel" : channel,
            "desc"    : desc
          });
        });
      },
      deferred.reject,
      utils.speakerOfferConfig
    );

    return deferred.promise;
  };

  exports.sendOffer = function (socketChannel) {
    return function (descriptionInfo) {
      var deferred = w.defer(),
        socket = descriptionInfo.socket,
        channel = descriptionInfo.channel,
        desc = descriptionInfo.desc;

      socket.emit(socketChannel, {
        "description": desc
      });

      deferred.resolve(descriptionInfo);

      return deferred.promise;
    };
  };

  exports.handleOffer = function (conn, desc) {
    var deferred = w.defer();

    conn.setRemoteDescription(new RTCSessionDescription(desc.description),
      // success
      function () {
        deferred.resolve(conn);
      },
      // fail
      deferred.reject
    );

    return deferred.promise;
  };

  exports.createAnswer = function (socket, socketChannel) {
    return function (conn) {
      var deferred = w.defer();

      // Respond back to request to peer connect
      conn.createAnswer(
        // success
        function (description) {
          conn.setLocalDescription(description, function () {
            // Send broadcaster description back to speaker
            socket.emit(socketChannel, {
              "description": description
            });
            deferred.resolve();
          });
        },
        // fail
        deferred.reject
      );

      return deferred.promise;
    };
  };

  exports.handleRemoteDescription = function (socketChannel) {
    return function (descriptionInfo) {
      var deferred = w.defer(),
          socket   = descriptionInfo.socket,
          channel  = descriptionInfo.channel,
          conn     = descriptionInfo.conn;

      socket.on(socketChannel, function (desc) {
        conn.setRemoteDescription(new RTCSessionDescription(desc.description),
          // success
          function () {
            console.log("Offers and answers all done!");
            deferred.resolve();
          },
          // fail
          function (err) {
            console.log("Error handling description response from broadcaster", err);
            deferred.reject(err);
          }
        );
      });

      return deferred.promise;
    };
  };

  exports.handleLocalCandidate = function (socket, socketChannel, conn) {
    conn.onicecandidate = function (ice) {
      if (ice.candidate) {
        console.log("Sending candidate on channel:", socketChannel);
        socket.emit(socketChannel, {
          candidate: ice.candidate
        });
      }
    };
  };

  exports.handleRemoteCandidate = function (socket, socketChannel, conn) {
    socket.on(socketChannel, function (ice) {
      if (ice.candidate) {
        console.log("Received remote candidate on channel:", socketChannel);
        conn.addIceCandidate(new RTCIceCandidate(ice.candidate));
      }
    });
  };

  return exports;

});
