define(function () {
  var locationInfo, room, broadcasting = false;

  locationInfo = document.location.pathname.slice(1).split('/');
  room = locationInfo[0];
  broadcasting = locationInfo.length > 1 && locationInfo[1] == 'broadcasting';

  if (broadcasting) {
    document.querySelector('body').innerHTML = "Broadcasting in room " + room;
  } else {
    document.querySelector('body').innerHTML = "Speaker for room " + room;
  }
});
