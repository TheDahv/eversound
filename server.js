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

app.get('*', sendFile("index"));

server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on %s:%s", server.address().address, server.address().port);
});

io = require('socket.io').listen(server);

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

io.sockets.on('connection', function (socket) {
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
});
