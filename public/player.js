function Player(id, blocks, dead, name) {
  this.blocks = [];
  this.dead = dead;
  this.name = name;
  this.winner = false;

  this.setBlocks = function(blocks) {
    this.blocks = [];
    for (var i = 0; i<blocks.length; i++) {
      var block = blocks[i];
      var newblock = new Block(block.x, block.y, block.color);
      if (block.powerup) {
        newblock.powerup = new Powerup(block.powerup.type);
      }
      this.blocks.push(newblock);
    }
  }

  if (blocks) this.setBlocks(blocks);
  this.id = id;

  this.show = function(xoff, yoff, tilesize) {
    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(12);
    text(this.getName(), xoff+columns*tilesize/2, yoff+5);

    for (var i = 0; i<this.blocks.length; i++) {
      var block = this.blocks[i];
      if (block.y<0) continue;
      block.show(xoff, yoff, tilesize);
    }
    stroke(255);
    if (this.dead) {
      fill(216, 23, 23, 70);
    } else {
      noFill();
    }
    rect(xoff, yoff, columns*tilesize, rows*tilesize);
  }

  this.getName = function() {
    if (this.name) return this.name;
    else return "Player" + Object.keys(players).indexOf(this.id);
  }
}
