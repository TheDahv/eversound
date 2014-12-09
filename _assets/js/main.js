define(['broadcaster', 'speaker'], function (broadcaster, speaker) {
  var locationInfo, room, broadcasting = false;

  locationInfo = document.location.pathname.slice(1).split('/').slice(1);
  room = locationInfo[0];
  broadcasting = locationInfo.length > 1 && locationInfo[1] == 'broadcasting';

  if (broadcasting) {
    document.querySelector('body').innerHTML = "Broadcasting in room " + room;
    broadcaster.openChannel(room);
  } else {
    speaker.joinChannel(room);
  }

  return;
});
