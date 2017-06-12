var poweruptypes = ["2x", "bomb", "upshifter", "downshifter", "sideshifter", "atombomb", "night", "gravity", "pause", "meme"];
var powerupweights = [2,   1,      3,           3,             1,             0,          2,       0,         3,       2];

function Powerup(type, from) {
  var r = weightedRandom(powerupweights);
  this.type = type ? type : poweruptypes[r];
  this.from = from;
  this.name = this.from ? players[this.from].getName() : username ? username : "You";

  this.show = function(x, y, tilesize) {
    stroke(0);
    strokeWeight(3);
    fill(255);
    rect(x, y, tilesize, tilesize);

    textAlign(CENTER, CENTER);
    textSize(tilesize/1.2);
    noStroke();
    fill(0);

    switch(this.type) {
      case "2x": {
        textSize(tilesize/1.5);
        text("+1", x+tilesize/2, y+tilesize/2);
        break;
      }
      case "bomb": {
        textSize(tilesize/1.45);
        text("💣", x+tilesize/2, y+tilesize/2);
        break;
      }
      case "upshifter": {
        text("⇧", x+tilesize/2, y+tilesize/2);
        break;
      }
      case "downshifter": {
        text("⇩", x+tilesize/2, y+tilesize/2);
        break;
      }
      case "sideshifter": {
        text("⇦", x+tilesize/2, y+tilesize/2);
        break;
      }
      case "atombomb": {
        textSize(tilesize/1.1);
        text("☢", x+tilesize/2, y+tilesize/2);
        break;
      }
      case "night": {
        push();
        translate(x+tilesize/2-tilesize/20, y+tilesize/2+tilesize/20);
        rotate(-QUARTER_PI);
        fill(0);
        textSize(tilesize);
        text("☾", 0, 0);
        pop();
        break;
      }
      case "zebra": {
        var n = 4;
        var size = (tilesize/(2*n+1));
        for (var i = 0; i<n; i++) {
          rect(x+size*(2*i+1), y+tilesize/6, size, 4*tilesize/6);
        }
        break;
      }
      case "pause": {
        var n = 2;
        var size = (tilesize/(2*n+1));
        for (var i = 0; i<n; i++) {
          rect(x+size*(2*i+1), y+tilesize/4, size, 2*tilesize/4);
        }
        break;
      }
      case "gravity": {
        push();
        translate(x+tilesize/2, y+tilesize/2);
        rotate(PI);
        textSize(tilesize);
        text("⇪", 0, 0);
        pop();
        break;
      }
      case "meme": {
        textStyle(BOLD);
        textSize(tilesize/3.3);
        text("( ͡° ͜ʖ ͡°)", x+tilesize/2, y+tilesize/2);
        break;
      }
    }
  }
}
