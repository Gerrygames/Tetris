function Block(x, y, color, powerup) {
  this.x = x;
  this.y = y;
  this.color = color;
  this.powerup = powerup;

  this.show = function(xoff, yoff, tilesize) {
    if (this.powerup) {
      this.powerup.show(xoff+this.x*tilesize, yoff+this.y*tilesize, tilesize);
    } else {
      stroke(0);
      fill(this.color);
      rect(xoff+this.x*tilesize, yoff+this.y*tilesize, tilesize, tilesize);
    }
  }
}
