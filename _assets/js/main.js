define(['broadcaster', 'speaker'], function (broadcaster, speaker) {
  var locationInfo, room, broadcasting = false;

  // Determine which channel the client is attempting to join
  locationInfo = document.location.pathname.slice(1).split('/').slice(1);
  room = locationInfo[0];
  // Determine if this browser is connecting as a broadcaster or as a speaker
  broadcasting = locationInfo.length > 1 && locationInfo[1] == 'broadcasting';

  if (broadcasting) {
    broadcaster.openChannel(room);
  } else {
    speaker.joinChannel(room);
  }

  return;
});
