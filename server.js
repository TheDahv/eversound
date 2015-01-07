var express = require('express');
var app = express();
var server;
var io;

app.use(express.static(__dirname + '/public'));

sendFile = function (fileName) {
  if (/.+\.html$/.test(fileName) === false) {
    fileName = fileName + ".html";
  }

  return function (req, res) {
    res.sendFile(fileName, { root: __dirname });
  };
};

app.get('/channels/:room/:broadcaster?', sendFile("index"));

server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on %s:%s", server.address().address, server.address().port);
});

io = require('socket.io').listen(server);
io.use(require('socketio-wildcard')());

var DEFAULT_NAMESPACE = '/';
var numSocketsInRoom = function (room) {
  return Object.keys(
    (io.nsps[DEFAULT_NAMESPACE].adapter.rooms[room] || {})
  ).length;
};

var log = function () {
  var i = 0, array = [">>> Message from server: "];
  for (i = 0; i < arguments.length; i++) {
    array.push(arguments[i]);
  }
  socket.emit('log', array);
};

/**
* A convenience helper function to extract the incoming message's
* channel name and data payload
*
* @param {data} The incoming socket connection object
* @return {object} The interesting name and payload data for the socket connection
*/
var getSockets = function (data) {
  return {
    name: data.data[0],
    data: data.data[1]
  };
};

/**
* The communication strategy for this application is to send messages on
* channels in the format {Actor(Broadcaster|Speaker)}:{Channel Name}:{Action}
*
* This function breaks apart the single string into an object that is easier
* to work with
*
* @param {string} connName Colon-delimited string of the incoming channel
* @return {object} The connection information encoded in the channel name
*/
var getConnectionInfo = function (connName) {
  var parts = connName.split(':'), parts, connInfo;

  if (parts.length < 3) {
    return {}
  }

  return {
    type    : parts[0] || '',
    channel : parts[1] || '',
    action  : parts[2] || ''
  }
};

/**
* Signaling Channel
*
* Listens for incoming connections specifying actors, actions, and channel
* names in their connection name
*
* Plays the role of the signaling server by forwarding messages on to
* peer connections for a given channel.
*/
io.sockets.on('connection', function (socket) {
  // Listen for socket connections on all channels
  socket.on("*", function (data) {
    // Get the interesting name and data information for this connection
    var conn = getSockets(data);

    // Extract the incoming command information based on the connection
    // channel name
    var connInfo = getConnectionInfo(conn.name);
    console.log("Received socket connection from ", conn.name);

    // Build a reply to this connection by flipping the incoming actor name
    // so that we can forward the message along to the recepient listening
    // for the same action on the same channel
    var responseChannelName = [
      connInfo.type === 'speaker' ? 'broadcaster' : 'speaker',
      connInfo.channel,
      connInfo.action
    ].join(':');

    console.log("Forwarding on to ", responseChannelName);
    socket.broadcast.emit(responseChannelName, conn.data);
  });
});
