/**
* WebRTC::Connections Module
*
* This module abstracts away and simplifies the basic steps in a
* peer-to-peer connection handshake. It also wraps operations in promises
* to simplify sequencing and error handling
*/
define(['webrtc/utils', 'when'], function (utils, w) {
  var exports = {};

  /**
  * Given a signaling channel and an RTCPeerConnection object, configure
  * and create an offer to send to a peer.
  *
  * The information generated, as well as the original connection objects,
  * will be added to the promise resolution so that steps later on in the chain
  * can access them.
  *
  * @param {socket.io} socket The signaling socket to pass through the chain
  *   of operations
  * @param {RTCPeerConnection} conn The local connection object
  * @return A promise for an object containing the created offer along with
  *   the connection information, or a promise for a creation error
  */
  exports.createOffer = function (socket, conn) {
    var deferred = w.defer();

    conn.createOffer(
      function (desc) {
        conn.setLocalDescription(desc, function () {
          deferred.resolve({
            "socket"  : socket,
            "conn"    : conn,
            "desc"    : desc
          });
        });
      },
      deferred.reject,
      utils.speakerOfferConfig
    );

    return deferred.promise;
  };

  /**
  * Creates and returns a handler for sending an RTC offer object once it is
  * created. The resulting function is a closure over the
  * socket channel name to be used by the connection object later
  *
  * The closure takes the local offer object and sends it through the socket
  * on the appropriate channel when it is generated
  *
  * @param {string} socketChannel The name of the signalling channel on which
  *   to pass the offer
  * @param {object} descriptionInfo The local description object created as
  *   a result of calling `createOffer`
  * @return The outer function returns the closure. The closure returns a
      promise for the local offer object once it is sent
  */
  exports.sendOffer = function (socketChannel) {
    return function (descriptionInfo) {
      var deferred = w.defer(),
        socket = descriptionInfo.socket,
        desc = descriptionInfo.desc;

      socket.emit(socketChannel, {
        "description": desc
      });

      deferred.resolve(descriptionInfo);

      return deferred.promise;
    };
  };

  /**
  * When a remote offer is received on the signaling channel, add it to the
  * local RTCPeerConnection object before passing it through the processing chain
  *
  * @param {RTCPeerConnection} conn The local connection on which we are adding
  *   the remote connection offer
  * @param {object} desc The raw signaled JSON data for the
  *   RTCSessionDescription of our remote peer connection
  * @return A promise for the original connection object, or an error in adding
  *   the peer connection description object
  */
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

  /**
  * Creates and returns a handler that knows how to interact with the signaling
  * channel.
  *
  * The resulting function creates a local offer on the given RTCPeerConnection
  * object and then signals it back on the signaling channel.
  *
  * @param {socket.io} socket The signaling socket object
  * @param {string} socketChannel The name of the signaling channel
  * @return A promise with no data, representing the successful completion of
  *   the peer connection response and the end of the handshake chain
  */
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

  /**
  * Creates and returns a handler for responding to a peer connection .
  * The resulting function listens on a specific channel on the socket waiting
  * for description objects from the remote peer connections.
  *
  * @param {string} socketChannel The name of the channel to listen to on the socket
  * @param {bool} listenOnce Optional. Whether the socket should continue
  *   listening for remote description objects after the first is received.
  *   Defaults to false.
  * @param {object} descriptionInfo The description object for the remote peer connection
  * @return The outer function returns a closure that then returns a promise
  *   that represents the successful completion of the processing chain,
  *   or an error if the processing failed
  */
  exports.handleRemoteDescription = function (socketChannel, listenOnce) {
    if (typeof listenOnce === 'undefined') {
      listenOnce = false;
    }
    return function (descriptionInfo) {
      var deferred = w.defer(),
          socket   = descriptionInfo.socket,
          conn     = descriptionInfo.conn,
          socketFn = listenOnce ? 'once' : 'on';

      socket[socketFn](socketChannel, function (desc) {
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

  /**
  * Registers a handler on the peer connection object to register local
  * ICE candidates when they become available and forward them to the remote
  * peer on the signaling channel
  *
  * @param {socket.io} socket The socket object for the signaling channel
  * @param {string} socketChannel The name of the signaling channel
  * @param {RTCPeerConnection} The local RTCPeerConnection object
  */
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

  /**
  * Configures the socket to listen on a channel on which it expects
  * ICE candidates from the remote peer. Each received ICE candidate is added
  * to the local RTCPeerConnection object
  *
  * @param {socket.io} socket The socket object for the signaling channel
  * @param {string} socketChannel The name of the signaling channel
  * @param {RTCPeerConnection} The local RTCPeerConnection object
  * @param {bool} listenOnce Optional. Whether to stop listening for ICE
  *   candidates once the first is received. Defaults to false.
  */
  exports.handleRemoteCandidate = function (socket, socketChannel, conn, listenOnce) {
    var socketFn;
    if (typeof listenOnce === 'undefined') {
      listenOnce = false;
    }
    socketFn = listenOnce ? 'once' : 'on';
    socket[socketFn](socketChannel, function (ice) {
      if (ice.candidate) {
        console.log("Received remote candidate on channel:", socketChannel);
        conn.addIceCandidate(new RTCIceCandidate(ice.candidate));
      }
    });
  };

  return exports;

});
