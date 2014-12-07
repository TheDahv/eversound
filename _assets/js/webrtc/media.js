define(['when'], function (w) {
  var m = {};

  /**
  * Normalized getUserMedia calls across browsers
  */
  m.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  /**
  * Given a set of constraints, ask to the browser to
  * initialize access to local device media. Return a promise for the eventual
  * object representing media access or a failure in the initialization
  *
  * @param {object} constraints configuration values for initializing media
  *   see http://tools.ietf.org/html/draft-alvestrand-constraints-resolution-00
  */
  m.initializeLocalMedia = function (contstraints) {
    var deferred = w.defer(), success, fail;

    success = function (localMediaStream) {
      return deferred.resolve(localMediaStream);
    };

    fail = function (err) {
      return deferred.reject(err);
    };

    m.getUserMedia(contstraints, success, fail);

    return deferred.promise;
  };

  return m;
});
