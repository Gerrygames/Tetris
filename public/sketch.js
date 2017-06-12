var blocks = [];
var currenttile = nexttile = null;
var players = [];
var powerups = [];
var lastpowerups = [];
var winner = false;
var locked = false;

var columns = 10;
var rows = 20;
var tilesize;
var control = -1;
var controltime = -1;
var controlinterval;
var speed = 500;
var speedmin = 250;
var weights = [0, 0, 0, 0, 0, 0];

var gameId;
var changed = false;
var username = null;

var state = "menu";
var factor = 1;
var nighttime = 0;
var pause = 0;
var memes = [];
var socket;

function setup() {
  gameId = getGameId();
  socket = io.connect(window.location.hostname + ':3201');
  socket.io.skipReconnect = true;
  socket.emit("login", gameId);
  socket.on("blocks", receiveBlocks);
  socket.on("logout", function(data) {
    delete players[data];
    windowResized();
  });
  socket.on("gamestate", function(data) {
    state = data;
    if (data=="ingame") start();
    else if (data=="menu") reset();
  });
  socket.on("upshifter", upshifter);
  socket.on("gameover", function(id) {
    var player = players[id];
    if (player) player.dead = true;
  });
  socket.on("username", function(data) {
    var player = players[data.id];
    player.name = data.name;
  });
  socket.on("powerup", function(data) {
    var powerup = new Powerup(data.type, data.from);
    applyPowerup(powerup);
  });

  createCanvas(windowWidth, windowHeight-4);
  var w = width*(columns/(columns*ceil(Object.keys(players).length/2)/2+columns+5));
  tilesize = min(w/columns, height/(rows+2));

  memes.push(loadSound("assets/milk.mp3"));
  memes.push(loadSound("assets/damn.mp3"));
}

function draw() {
  var time = millis();

  if (state=="menu") {
    background(51);
    stroke(255);
    strokeWeight(1);
    fill(255);
    textSize(25);
    textAlign(LEFT, TOP);
    textStyle(NORMAL);
    text("Connected Players:", 30, 30);
    text(username ? username : "Type to set username", 30, 60);
    if (winner) text("★", 50+textWidth(username ? username : "Type to set username"), 60);
    var row = 1;
    for (var id in players) {
      var player = players[id];
      text(player.getName(), 30, 60+30*row++);
      if (player.winner) text("★", 50+textWidth(player.getName()), 60+30*(row-1));
    }
    text("Press enter to start!", 30, 60+row*30+30);
  } else if (state=="ingame" || state=="gameover") {
    background(51);
    strokeWeight(3);
    var player = 0;
    for (var id in players) {
      players[id].show(tilesize*columns+5*tilesize+floor(player)*tilesize*columns/2, player-floor(player)==0.5 ? tilesize*rows/2 : 0, tilesize/2);
      player+=0.5;
    }
    if (currenttile!=null) {
      nexttile.preview(tilesize*columns+tilesize*2.4, tilesize*2.4);
      if (changed) sendBlocks();

      currenttile.show();

      if (nighttime-time>0) {
        fill(0);
        noStroke();
        rect(0, 0, tilesize*columns, tilesize*rows);
        fill(255);
        textSize(60);
        textAlign(CENTER, CENTER);
        text(((nighttime-time)/1000).toFixed(1), tilesize*columns/2, tilesize*rows/2);
      } else {
        for (var i = 0; i<blocks.length; i++) {
          blocks[i].show(0, 0, tilesize);
        }
      }

      if (isPaused()) {
        noStroke();
        fill(0, 0, 0, 150);
        rect(0, 0, columns*tilesize, rows*tilesize);
        fill(255);
        textSize(80);
        textAlign(CENTER, CENTER);
        text("❚❚", tilesize*columns/2, tilesize*rows/2-70);
        textSize(35);
        text(((pause-time)/1000).toFixed(1), tilesize*columns/2, tilesize*rows/2);
      }
    }

    textSize(15);
    textAlign(CENTER, TOP);
    noStroke();
    fill(255);
    text("Powerup multiplier: " + factor + "x", tilesize*columns+tilesize*2.5, tilesize*5.1);

    for (var i = lastpowerups.length; i>0; i--) {
      var powerup = lastpowerups[lastpowerups.length-i];
      powerup.show(tilesize*columns+tilesize/2, tilesize*4.5+i*1.5*tilesize, tilesize);
      textSize(15);
      textAlign(LEFT, CENTER);
      noStroke();
      fill(255);
      text(powerup.name, tilesize*columns+tilesize*1.7, tilesize*5+i*1.5*tilesize);
    }

    for (var i = 0; i<powerups.length; i++) {
      powerups[i].show(tilesize/2+i*tilesize, tilesize/2+tilesize*rows, tilesize);
    }

    if (state=="gameover") {
      push();
      textAlign(CENTER);
      noStroke();
      fill(216, 23, 23);
      textSize(70);
      textStyle(BOLD);
      text("Game Over", (columns*tilesize)/2, (rows*tilesize)/2);
      fill(216, 23, 23, 70);
      rect(0, 0, columns*tilesize, rows*tilesize);
      pop();
    }

    stroke(255);
    strokeWeight(3);
    line(tilesize*columns, 0, tilesize*columns+tilesize*5, 0);
    line(tilesize*columns, 0, tilesize*columns, tilesize*rows);
    line(tilesize*columns+5*tilesize, 0, tilesize*columns+5*tilesize, height);
    line(tilesize*columns, tilesize*5, tilesize*columns+5*tilesize, tilesize*5);
    line(0, tilesize*rows, tilesize*columns, tilesize*rows);
  }
}

function determineWinner() {
  for (var id in players) {
    var player = players[id];
    if (!player.dead) {
      player.winner = true;
      return;
    }
  }
  this.winner = true;
}

function reset() {
  determineWinner();
  state = "menu";
  blocks = [];
  powerups = [];
  lastpowerups = [];
  factor = 1;
  weights = [0, 0, 0, 0, 0, 0];
  changed = false;
  pause = 0;
  nighttime = 0;
  control = -1;
  controltime = -1;
  for (var id in players) {
    var player = players[id];
    player.dead = false;
    player.blocks = [];
  }
}

function start() {
  winner = false;
  for (var id in players) {
    var player = players[id];
    player.winner = false;
    player.dead = false;
    player.blocks = [];
  }
  state = "ingame";
  speed = 500;
  currenttile = new Tile();
  nexttile = new Tile();

  interval();
}

function shifter() {
  if (!currenttile.update()) {
    newtile();
  }
}

function interval() {
  if (locked || state!="ingame") return;
  locked = true;
  setTimeout(function() {
    if (!isPaused()) shifter();
    locked = false;
    interval();
  }, constrain(speed *= 0.999, speedmin, speed));
}

function newtile() {
  for (var i = 0; i<currenttile.blocks.length; i++) {
    var block = currenttile.blocks[i];
    block.x += currenttile.x;
    block.y += currenttile.y;
    blocks.push(block);
  }
  changed = true;
  currenttile = nexttile;
  nexttile = new Tile();
  if (currenttile.checkCollision(0, 0)) {
    state = "gameover";
    socket.emit('gameover', true);
    return;
  }
  checkRows();
}

function checkRows() {
  var deletedRows = 0;
  for (var row = 0; row<rows; row++) {
    var count = 0;
    for (var i = 0; i<blocks.length; i++) {
      if (blocks[i].y==row) count++;
    }
    if (count>=columns) {
      deletedRows++;
      deleteRow(row, true);
    }
  }
  if (deletedRows>0) {
    var r = floor(random(5-constrain(deletedRows, 1, 4)));
    if (r==0) {
      randomPowerup();
    }
  }

  if (deletedRows>=4) {
    var player = randomArrayElement(players);
    if (player) socket.emit('upshifter', {id: player.id, count: 1});
  }
}

function randomPowerup() {
  var possible = [];
  for (var i = 0; i<blocks.length; i++) {
    var block = blocks[i];
    if (!block.powerup) possible.push(block);
  }
  if (possible.length==0) return;
  var block = random(possible);
  block.powerup = new Powerup();
  sendBlocks();
}

function applyPowerup(powerup) {
  lastpowerups.push(powerup);
  while(lastpowerups.length>rows-5) lastpowerups.splice(0, 1);
  var type = powerup.type;
  if (type=="2x") {
    factor++;
  } else if (type=="upshifter") {
    upshifter(factor);
    factor = 1;
  } else if (type=="downshifter") {
    downshifter(factor, false);
    factor = 1;
  } else if (type=="sideshifter") {
    sideshifter();
  } else if (type=="bomb") {
    bomb();
  } else if (type=="atombomb") {
    blocks = [];
  } else if (type=="night") {
    nighttime = (nighttime>millis() ? nighttime : millis()) + 2500*factor;
    factor = 1;
  } else if (type=="gravity") {
    gravity();
  } else if (type=="zebra") {
    zebra();
  } else if (type=="pause") {
    pause = (pause>millis() ? pause : millis()) + 5000*factor;
    factor = 1;
  } else if (type=="meme") {
    randomArrayElement(memes).play();
  }
}

function deleteRow(row, snipepowerups) {
  for (var i = blocks.length-1; i>=0; i--) {
    var block = blocks[i];
    if (block.y==row) {
      blocks.splice(i, 1);
      if (snipepowerups, block.powerup && powerups.length<9) {
        powerups.push(block.powerup);
      }
    } else if (block.y<row) {
      block.y += 1;
    }
  }
  changed = true;
}

function zebra() {
  var n = floor(random(2));
  for (var i = 0; i<blocks.length; i++) {
    if (blocks[i].x % 2 == n) blocks.splice(i--, 1);
  }
}

function bomb(bombblock) {
  if (!bombblock) {
    //search bomb
    for (var i = 0; i<blocks.length; i++) {
      var block = blocks[i];
      if (block.powerup && block.powerup.type=="bomb") {
        blocks.splice(i--, 1);
        bomb(block);
      }
    }
  } else {
    //apply
    for (var i = 0; i<blocks.length; i++) {
      var block = blocks[i];
      var dist = Math.pow(bombblock.x - block.x) + Math.pow(bombblock.y - block.y);
      if (dist>8) continue;
      var x = constrain(block.x + floor(random(4)-2), 0, columns-1);
      var y = constrain(block.y + floor(random(4)-2), 0, rows-1);
      if (!getBlock(x, y)) {
        block.x = x;
        block.y = y;
        changed = true;
      }
    }
  }
}

function gravity() {
  for (var column = 0; column<columns; column++) {
    var columnblocks = [];
    for (var i = 0; i<blocks.length; i++) {
      var block = blocks[i];
      if (block.x==column) {
        columnblocks[block.y] = block;
      }
    }
    for (var i = rows-1; i>0; i--) {
      if (!columnblocks[i]) continue;
      var j = i+1;
      while (j<rows && !columnblocks[j]) {
        columnblocks[j] = columnblocks[j-1];
        delete columnblocks[j-1];
        j++;
      }
      columnblocks[j-1].y = j-1;
      changed = true;
    }
  }
  checkRows();
}

function sideshifter() {
  for (var row = 0; row<rows; row++) {
    var rowblocks = [];
    for (var i = 0; i<blocks.length; i++) {
      var block = blocks[i];
      if (block.y==row) {
        rowblocks[block.x] = block;
      }
    }
    for (var i = 1; i<columns; i++) {
      if (!rowblocks[i]) continue;
      var j = i-1;
      while (j>=0 && !rowblocks[j]) {
        rowblocks[j] = rowblocks[j+1];
        delete rowblocks[j+1];
        j--;
      }
      rowblocks[j+1].x = j+1;
      changed = true;
    }
  }
}

function downshifter(count, snipepowerups) {
  for (var i = rows-1; i>=rows-count; i--) {
    deleteRow(i, snipepowerups);
  }
  changed = true;
}

function upshifter(count) {
  for (var i = 0; i<blocks.length; i++) {
    blocks[i].y -= 1;
  }
  currenttile.y -= 1;
  var free = floor(random(columns));
  for (var i = 0; i<columns; i++) {
    if (i==free) continue;
    blocks.push(new Block(i, rows-1, randomArrayElement(colors)));
  }
  changed = true;
}

function sendBlocks() {
  changed = false;
  socket.emit("blocks", blocks);
}

function receiveBlocks(data) {
  var id = data.id;
  var blocks = data.blocks;
  var dead = data.dead;

  var player = players[id];

  if (!player) {
    var player = new Player(id, blocks, dead);
    players[id] = player;
    windowResized();
  } else {
    player.setBlocks(blocks);
    player.dead = dead;
  }
}

function getBlock(x, y) {
  for (var i = 0; i<blocks.length; i++) {
    var block = blocks[i];
    if (block.x==x && block.y==y) return block;
  }
  return null;
}

function isPaused() {
  return millis()-pause<0;
}

this.onkeypress = function(key) {
  if (state=="menu") {
    if (key.key==' ' || key.key.length>1) return;
    if (!username) username = key.key;
    else username += key.key;
    username = username.substring(0, 16);
    socket.emit('username', username);
  }
}

function keyPressed() {
  if (!controlinterval) startControlInterval();
  if (state=="menu") {
    if (keyCode==BACKSPACE) {
      if (username.length<=0) username = null;
      else username = username.substring(0, username.length-1);
      socket.emit('username', username);
    } else if (keyCode==13) {
      socket.emit('gamestate', "ingame");
    }
  } else if (state=="ingame") {
    if (keyCode==27) {
      powerups.splice(0, 1);
    } else if (keyCode>=49 && keyCode<=57) {
      var powerup = powerups[0];
      if (!powerup) return;
      if (keyCode==49) {
        if (isPaused()) return;
        powerups.splice(0, 1);
        applyPowerup(powerup);
      } else {
        var player = players[Object.keys(players)[keyCode-50]];
        if (!player || player.dead) return;
        powerups.splice(0, 1);
        socket.emit("powerup", {id: player.id, type: powerup.type});
      }
    } else {
      if (isPaused()) return;
      switch(keyCode) {
        case DOWN_ARROW: {
          currenttile.update();
          if (currenttile.checkCollision(0, 1)) newtile;
          break;
        }
        case LEFT_ARROW: {
          currenttile.left();
          break;
        }
        case RIGHT_ARROW: {
          currenttile.right();
          break;
        }
        case UP_ARROW: {
          currenttile.rotate();
          break;
        }
      }

      if (keyCode==32) {
        currenttile.fall();
        newtile();
      } else if (keyCode==UP_ARROW || keyCode==LEFT_ARROW || keyCode==RIGHT_ARROW || keyCode==DOWN_ARROW) {
        control = keyCode;
        controltime = millis();
      }
    }
  }
}

function keyReleased() {
  if (keyCode==control) control = -1;
}

function startControlInterval() {
  if (controlinterval) return;
  controlinterval = setInterval(function() {
    if (state!="ingame" || isPaused()) return;
    if (millis()-controltime<500) return;
    switch (control) {
      case DOWN_ARROW: {
        currenttile.update();
        if (currenttile.checkCollision(0, 1)) newtile;
        break;
      }
      case LEFT_ARROW: {
        currenttile.left();
        break;
      }
      case RIGHT_ARROW: {
        currenttile.right();
        break;
      }
      case UP_ARROW: {
        currenttile.rotate();
        break;
      }
    }
  }, 33);
}

function getGameId() {
  var params = getURLParams();
  var gameId = params.gameId;
  if (gameId==null) {
    gameId = floor(random(10000));
    addParameterToURL('gameId', gameId);
  }
  return gameId;
}

function weightedRandom(w) {
  w = w.slice(0);
  var count = 0;
  for (var i = 0; i<w.length; i++) {
    count += (w[i]+=1);
  }
  var r = floor(random(count));
  var i = 0;
  while(r>0) {
    r--;
    w[i]--;
    if (w[i]<=0) {
      i++;
    }
  }
  return i;
}

//touch controls
var touchstate = null;
var lastpos;

function touchStarted() {
  if (state=="menu") {
    if (touches.length==0) return false;
    socket.emit('gamestate', "ingame");
  } else if (state=="ingame") {
    var paused = isPaused();
    if (mouseX<=columns*tilesize && mouseY<rows*tilesize && !paused) {
      touchstate = "infield";
      lastpos = {x: mouseX, y: mouseY};
    } else if (mouseY>rows*tilesize && mouseX<tilesize*1.5 && mouseX>tilesize*0.5 && !paused) {
      powerups.splice(0, 1);
    } else if (mouseX>columns*tilesize+tilesize*5 && mouseY<rows*tilesize/2 && !paused) {
      var powerup = powerups[0];
      if (!powerup) return;
      var index = floor((mouseX-columns*tilesize-tilesize*5)/(tilesize*columns/2));
      var player = players[Object.keys(players)[index]];
      if (!player || player.dead) return;
      powerups.splice(0, 1);
      socket.emit("powerup", {id: player.id, type: powerup.type});
    }
  }
  return false;
}

function touchMoved() {
  if (touchstate=="infield") {
    var pos = {x: mouseX, y: mouseY};
    if (abs(pos.x-lastpos.x)>=tilesize) {
      if (pos.x>lastpos.x) {
        currenttile.right();
      } else {
        currenttile.left();
      }
      lastpos = {x: mouseX, y: mouseY};
    } else if (abs(pos.y-lastpos.y)>=tilesize*2.5) {
      if (pos.y<lastpos.y) {
        currenttile.rotate();
      } else {
        currenttile.fall();
      }
      lastpos = {x: mouseX, y: mouseY};
    }
  }
  return false;
}

function touchEnded() {
  touchstate = null;
  if (!isPaused() && lastpos!=null && mouseX==lastpos.x && mouseY==lastpos.y) {
      var powerup = powerups[0];
      if (!powerup) return;
      powerups.splice(0, 1);
      applyPowerup(powerup);
  }
  lastpos = null;
  return false;
}

//weired functions
function randomArrayElement(array) {
  var keys = Object.keys(array);
  return array[keys[Math.floor(keys.length * Math.random())]];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight-4);
  var w = width*(columns/(columns*ceil(Object.keys(players).length/2)/2+columns+5));
  tilesize = min(w/columns, height/(rows+2));
}

function addParameterToURL(key, value) {
  var url = location.href;
  url += (url.indexOf('?')!=-1 ? '&' : '?');
  url += key;
  url += '=';
  url += value;
  return location.href = url;
}
