//Socket and Server stuff
var io = require('socket.io')(3201);

//Vars
var games = [];
var gamesBySocket = [];

//Protocol
io.sockets.on('connection', connection);

//handle connection
function connection(socket) {
  var game;
  var player;
  //handle disconnect, remove player and tell all clients
  socket.on('disconnect', function() {
    var game = gamesBySocket[socket.id];
    if (!game) return;
    delete gamesBySocket[socket.id];
    delete game.players[socket.id];
    if (game.getPlayerCount()==0) {
      delete games[games.indexOf(game)];
    } else {
      game.sendData('logout', socket.id);
      game.checkWinner();
    }
  });

  //handle login, broadcast login to other clients and send all data to new client
  socket.on('login', function(gameId) {
    game = games[gameId];
    if (!game) {
      game = games[gameId] = new Game(gameId);
    }
    player = new Player(socket, gameId);
    game.addPlayer(player);
    gamesBySocket[socket.id] = game;
    console.log("player logged in " + socket.id);
  });

  //Receive Blocks from client and broadcast to other clients
  socket.on('blocks', function(data) {
    if (!player) return;
    var outData = {
      id: socket.id,
      blocks: data,
      dead: player.dead
    }
    player.blocks = data;
    game.sendData('blocks', outData, socket.id);
  });

  //Start game packet
  socket.on('gamestate', function(state) {
    if (state=="ingame") game.startGame();
  });

  socket.on('upshifter', function(data) {
    game.players[data.id].socket.emit('upshifter', data.count);
  });

  socket.on('gameover', function() {
    game.setPlayerDead(socket.id);
  });

  socket.on('username', function(name) {
    game.setUsername(socket.id, name);
  });

  socket.on('powerup', function(data) {
    game.applyPowerup(data.id, data.type, socket.id);
  });
}

function Game(id, players) {
  this.id = id;
  this.players = players ? players : [];
  this.state = "menu";

  this.getPlayerCount = function() {
    return Object.keys(this.players).length;
  }

  this.setUsername = function(id, name) {
    var player = this.players[id];
    if (!player) return;
    player.name = name;
    this.sendData('username', {id: id, name: name}, id);
  }

  this.applyPowerup = function(id, t, f) {
    var player = this.players[id];
    if (!player || player.dead) return;
    player.emit('powerup', {type: t, from: f});
  }

  this.restart = function() {
    this.state = "menu";
    this.sendData('gamestate', 'menu');
    for (var id in this.players) {
      var player = this.players[id];
      player.dead = false;
      player.blocks = [];
      if (player.spectator) {
        player.spectator = false;
      }
      var outData = {
        id: player.socket.id,
        blocks: [],
        dead: false
      }
      this.sendData('blocks', outData, player.socket.id);
    }
  }

  this.checkWinner = function() {
    if (this.state!="ingame") return;
    var alive = 0;
    for (var id in this.players) {
      if (!this.players[id].dead) alive++;
    }
    if (alive<=1) {
      this.restart();
    }
  }

  this.setPlayerDead = function(id) {
    var player = this.players[id];
    if (!player) return;
    player.dead = true;
    this.sendData('gameover', id, id);
    this.checkWinner();
  }

  this.startGame = function() {
    if (this.running) return;
    this.state = "ingame";
    this.sendData('gamestate', "ingame");
  }

  this.sendData = function(type, data, exclude) {
    for (var id in this.players) {
      if (id==exclude) continue;
      this.players[id].emit(type, data);
    }
  }

  this.addPlayer = function(player) {
    this.players[player.socket.id] = player;

    var spectator = this.state=="ingame";

    var newPlayerOutData = {
      id: player.socket.id,
      blocks: null,
      dead: player.dead
    }

    for (var id in this.players) {
      if (id==player.socket.id) continue;
      var p = this.players[id];
      var outData = {
        id: p.socket.id,
        blocks: p.blocks,
        dead: p.dead
      }
      player.emit('blocks', outData);
      player.emit('username', {id: p.socket.id, name: p.name});
      if (!spectator) p.emit('blocks', newPlayerOutData);
    }

    if (spectator) {
      player.emit('gamestate', "gameover");
      player.dead = true;
      player.spectator = true;
    }
  }
}

function Player(socket, gameId, blocks) {
  this.socket = socket;
  this.gameId = gameId;
  this.blocks = blocks;
  this.dead = false;
  this.name = null;
  this.spectator = false;

  this.emit = function(type, data) {
    this.socket.emit(type, data);
  }
}
