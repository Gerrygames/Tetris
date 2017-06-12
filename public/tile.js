var colors = ['#42ebf4', '#4156f4', '#ef821c', '#f2ee26', '#7eef32', '#cc32ef', '#fc0000'];

function Tile() {
  this.x = floor(columns / 2);
  this.y = 0;

  this.variant = weightedRandom(weights);
  for (var i = 0; i<weights.length; i++) {
    if (i==this.variant) weights[i] = 0;
    else weights[i]++;
  }
  this.blocks = [];

  var color = colors[this.variant];
  this.blocks.push(new Block(0, 0, color));
  switch(this.variant) {
    case 0: {
      this.blocks.push(new Block(-1, 0, color));
      this.blocks.push(new Block(-2, 0, color));
      this.blocks.push(new Block(1, 0, color));
      break;
    }
    case 1: {
      this.blocks.push(new Block(1, 0, color));
      this.blocks.push(new Block(-1, 0, color));
      this.blocks.push(new Block(-1, -1, color));
      break;
    }
    case 2: {
      this.blocks.push(new Block(-1, 0, color));
      this.blocks.push(new Block(1, 0, color));
      this.blocks.push(new Block(1, -1, color));
      break;
    }
    case 3: {
      this.blocks.push(new Block(0, -1, color));
      this.blocks.push(new Block(1, 0, color));
      this.blocks.push(new Block(1, -1, color));
      break;
    }
    case 4: {
      this.blocks.push(new Block(1, 0, color));
      this.blocks.push(new Block(0, 1, color));
      this.blocks.push(new Block(-1, 1, color));
      break;
    }
    case 5: {
      this.blocks.push(new Block(0, -1, color));
      this.blocks.push(new Block(-1, 0, color));
      this.blocks.push(new Block(1, 0, color));
      break;
    }
    case 6: {
      this.blocks.push(new Block(-1, 0, color));
      this.blocks.push(new Block(0, 1, color));
      this.blocks.push(new Block(1, 1, color));
      break;
    }
  }

  this.preview = function(cx, cy) {
    stroke(0);
    var maxy = miny = maxx = minx = 0;
    for (var i = 0; i<this.blocks.length; i++) {
      var block = this.blocks[i];
      if (block.x<minx) minx = block.x;
      if (block.x>maxx) maxx = block.x;
      if (block.y<miny) miny = block.y;
      if (block.y>maxy) maxy = block.y;
    }

    var w = (maxx-minx+1)*tilesize;
    var h = (maxy-miny+1)*tilesize;

    var xoff = this.x-(w/2+minx*tilesize);
    var yoff = this.y-(h/2+miny*tilesize);

    for (var i = 0; i<this.blocks.length; i++) {
      var block = this.blocks[i];
      var y = this.blocks[i].y*tilesize + yoff + cy;
      var x = this.blocks[i].x*tilesize + xoff + cx;
      fill(block.color);
      rect(x, y, tilesize, tilesize);
    }
  }

  this.show = function() {
    stroke(0);
    for (var i = 0; i<this.blocks.length; i++) {
      var block = this.blocks[i];
      var y = this.y + this.blocks[i].y;
      var x = this.x + this.blocks[i].x;
      fill(block.color);
      rect(x*tilesize, y*tilesize, tilesize, tilesize);
    }
  }

  this.checkCollision = function(xOff, yOff) {
    for (var i = 0; i<this.blocks.length; i++) {
      var y = this.y + this.blocks[i].y + yOff;
      var x = this.x + this.blocks[i].x + xOff;

      if (y >= rows || x >= columns || x<0) return true;

      for (var j = 0; j<blocks.length; j++) {
        if (blocks[j].x == x && blocks[j].y == y) return true;
      }
    }
    return false;
  }

  this.rotate = function() {
    if (this.variant==3) return;
    for (var i = 0; i<this.blocks.length; i++) {
      var block = this.blocks[i];
      var x = block.x;
      var y = block.y;
      block.x = -y;
      block.y = x;
    }
    if (this.checkCollision(0, 0)) {
      for (var i = 0; i<this.blocks.length; i++) {
        var block = this.blocks[i];
        var x = block.x;
        var y = block.y;
        block.x = y;
        block.y = -x;
      }
      return false;
    } else {
      return true;
    }
  }

  this.fall = function() {
    while (!this.checkCollision(0, 1)) this.y += 1;
  }

  this.left = function() {
    if (this.checkCollision(-1, 0)) return false;
    this.x += -1;
    return true;
  }

  this.right = function() {
    if (this.checkCollision(1, 0)) return false;
    this.x += 1;
    return true;
  }

  this.update = function() {
    if (this.checkCollision(0, 1)) return false;
    this.y += 1;
    return true;
  }
}
