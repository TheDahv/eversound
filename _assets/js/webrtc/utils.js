define(function () {
  var exports = {};

  exports.serverConfig = {
    iceServers: [
      { "url": "stun:stun.l.google.com:19302"},
      { "url": "stun:stun.services.mozilla.com" },
      { "url": "stun:23.21.150.121"}
    ]
  };

  exports.speakerOfferConfig = {
    "offerToReceiveAudio": true,
    "offerToReceiveVideo": false
  };


  return exports;
});
