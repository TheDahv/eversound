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

var getSockets = function (data) {
  return {
    name: data.data[0],
    data: data.data[1]
  };
  /*
  return Object.keys(data)
    .map(function (key) {
      var payload = data[key].data;
      return {
        name: payload[0] || '',
        data: payload[1] || {}
      };
    });
  */
};

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

io.sockets.on('connection', function (socket) {
  /*
  socket.on('message', function (message) {
    log("Got message: ", message);
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function (room) {
    var numClients = numSocketsInRoom(room);

    log('Room ' + room + ' has ' + numClients + ' client(s)');
    log('Request to create or join room ' + room);

    if (numClients === 0) {
      socket.join(room);
      socket.emit('created', room);
    } else if (numClients === 1) {
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room);
    } else {
      // max 2 clients
      socket.emit('full', room);
    }

    socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
    socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
  });
  */

  socket.on("*", function (data) {
    var conn = getSockets(data);

    var connInfo = getConnectionInfo(conn.name);
    console.log("Received socket connection from ", conn.name);
    //console.log(conn.data);
    if (/candidate/i.test(conn.name)) {
      console.log("CANDIDATE INFORMATION!!!");
    }

    var responseChannelName = [
      connInfo.type === 'speaker' ? 'broadcaster' : 'speaker',
      connInfo.channel,
      connInfo.action
    ].join(':');

    console.log("Forwarding on to ", responseChannelName);
    socket.broadcast.emit(responseChannelName, conn.data);

  });
});
