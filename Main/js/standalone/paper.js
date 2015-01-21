// some generic stuff

// prevent default device touch move
document.body.ontouchmove = function(event){
    event.preventDefault();
};

function isTouchDevice() {
  return 'ontouchstart' in window || 'onmsgesturechange' in window; // works on ie10
}

var isMobile = isTouchDevice() && screen.width <= 768;

// show input buttons on mobile device
if (isMobile) {
  document.querySelectorAll('.buttons')[0].style.display = 'block';
}


// set some defaults
project.currentStyle = {
     //strokeColor: 'black',
     strokeWidth: 4,
     strokeCap: 'round'
};


// Circle packing is based on:
// http://jacksonkr.com/content/html5-canvas-circle-packing

// circle settings
var spreadStop = 30;
var maxSize = isMobile ? 30 : 60;
var circleCount = isMobile ? 15 : 40;

// no touchy
var spreadCounter = 0;
var circleArray = [];


function CirclePacking(canvas) {
  this.canvas = canvas;
  //this._ctx = this.canvas.getContext("2d");
  this._circles = [];
  this._dragCircle = null;
  this.CENTER = {x:this.canvas.width, y:this.canvas.height};
  
  var self = this;

  // maybe try RAF instead of setInterval
  var intervalID = setInterval(function(){
    
    self.enterFrame();

    // once we've hit the spreadStop
    // draw to screen
    if (++spreadCounter === spreadStop) {
       clearInterval(intervalID);
       drawCirclesToCanvas(self);
    }

  }, 1); // just get through it as fast as possible

}

function drawCirclesToCanvas(self) {

  var circle;
  
  for(var i = self._circles.length - 1; i >= 0; --i) {
    var obj = self._circles[i];
    
    circle = new Path.Circle(new Point(obj.x, obj.y), obj.size);
    circle.fillColor = '#e6ead9'; // default untouched circle colour

    // push each circle behind the snake
    circle.sendToBack();

    // circle array holds all the circles
    // and is used to compare intersections with snake
    circleArray.push(circle);
  
  }
}

CirclePacking.prototype.addCircle = function(obj) {
  this._circles.push(obj);
}


CirclePacking.prototype.enterFrame = function() {

  //this._ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  v = new Vector3D();
  
  // Push them away from each other
  for(var i = this._circles.length - 1; i >= 0 ; --i) {
    var ci = this._circles[i];
    
    for (var j = i + 1; j < this._circles.length; j++) {
      var cj = this._circles[j];
      
      var dx = cj.x - ci.x;
      var dy = cj.y - ci.y;
      var r = ci.size + cj.size;
      var d = (dx*dx) + (dy*dy);
      
      
      if ( d < (r * r) ) {
        v.x = dx;
        v.y = dy;
        v.normalize();
        
        v.scaleBy((r - Math.sqrt(d)) * 0.5);
        
        cj.x += v.x;
        cj.y += v.y;
        ci.x -= v.x;
        ci.y -= v.y;
        
      }

    }
  }
}

function Circle(cp, x, y, size) {
  this._cp = cp;
  this.x = x || 0;
  this.y = y || 0;
  this.size = size || 10;
}

function Vector3D(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Vector3D.prototype = {
  get length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }
}

Vector3D.prototype.normalize = function(len) {
  if(len === undefined) len = 1.0;
  var s = len/this.length;
  this.scaleBy(s, s, s);
}

Vector3D.prototype.scaleBy = function(x, y, z) {
  if(y === undefined) y = x;
  if(z === undefined) z = x;

  this.x *= x;
  this.y *= y;
  this.z *= z;
}


// add circles into the circle packer
var cp = new CirclePacking(document.getElementById('canvas'));
var innerWidthHalf = window.innerWidth / 2;
var innerHeightHalf = window.innerHeight / 2;
var size;

for(var i = 0; i < circleCount; i++){
  
  size = Math.random() * maxSize + 10; // add 10 so we don't get tiny circles
  cp.addCircle(new Circle(cp, Math.random() + innerWidthHalf, Math.random() + innerHeightHalf, size));

}

// end circle packing

// start snake

var cruisingSpeed = 5;
var speed = cruisingSpeed;
var canStretch = true;

var snakeBody;
var headPathCombined;
var eye;
var head;

var snake = new function() {
  
  var center = view.center;
  var size = 500; // snake length
  var partLength = 1;
  snakeBody = new Path();
  
  for (var i = 0; i < size; i++) {
      snakeBody.add(center - [i * partLength, 0]);
  }

  eye = new Path.Circle({
    //center: [6, 1],
    radius: 2,
    //fillColor: 'black',
    strokeColor: '#274b73' // darker version on the main blue
  });
    
    
    var headTop = new Path();
    headTop.add(16, 6);
    
    var toPoint = new Point(-8, 6);
    headTop.curveTo(2, toPoint);
   
    var headBottom = headTop.clone();
   
    headBottom.scale(1, -1).translate(0, 4);
   
    headPathCombined = new CompoundPath({
    
      children: [
        headTop,
        headBottom
      ],
      fillColor: 'white',
      strokeColor: '#2c62a0'
    
    });


   
    var headSymbol = new Symbol(headPathCombined);
    head = new PlacedSymbol(headSymbol);

    var eyeSymbol = new Symbol(eye);
    var newEye = new PlacedSymbol(eyeSymbol);
     
     // initial page load starting points
    var vector = new Point({
        angle: 0.01, // needs a non-zero, otherwise problems with gradient
        length: 1
    });
    
    var maxSteer = 4.75;
    var friction = 1;
    var steering = 1.5;
    var maxSpeed = 14;
    var minSpeed = 2.5;
    var position = center;
    var lastRotation = 0;
    
    
    return {
      left: function() {
           if (speed >= 0.01) {
                if (speed < 3 && speed >= 0) {
                     vector.angle -= (speed * 2);
                } else if (speed < 0) {
                     vector.angle -= (speed / 2);
                } else {
                     vector.angle -= maxSteer * steering;
                }
                speed *= friction;
           }
      },

      right: function() {
           if (speed >= 0.01) {
                if (speed < 3 && speed >= 0) {
                     vector.angle += (speed * 2);
                } else if (speed < 0) {
                     vector.angle += (speed / 2);
                } else {
                     vector.angle += maxSteer * steering;
                }
                speed *= friction;
           }
      },
     
      forward: function() {
           speed += 0.3;
           speed = Math.min(maxSpeed, speed);
      },

      returnSpeed: function() {
        speed -= 0.3;
        
        if (speed < cruisingSpeed) {
          speed = cruisingSpeed;
        }

      },

      reverse: function() {
           speed -= 0.3;
           if (speed < minSpeed)
                speed = minSpeed;
      },

      draw: function() {
           var vec = vector.normalize(Math.abs(speed));
           //speed = speed * friction;
           position += vec;
           var lastPoint = snakeBody.firstSegment.point = position;
           var lastVector = vec;
           var segments = snakeBody.segments;
           for (var i = 0, l = segments.length; i < l; i++) {
                var segment = segments[i];
                var vector2 = lastPoint - segment.point;
                var rotLength = 0;
                var rotated = lastVector.normalize(rotLength);
                lastPoint = segment.point = lastPoint + lastVector.normalize(-partLength - vec.length / 10);
                segment.point += rotated;

                // the head
                if (i === 1) {
                    // insert the eye and head at the top of the path
                    newEye.position = position;
                    head.position = position;

                    var rotation = vector2.angle;
                    head.rotate(rotation - lastRotation);
                    lastRotation = rotation;
                }
                lastVector = vector2;
           }
           snakeBody.smooth();
           this.constrain();
      },

      constrain: function() {
          var bounds = snakeBody.bounds;
          var size = view.size;
          if (!bounds.intersects(view.bounds)) {
                if (position.x < -bounds.width)
                     position.x = size.width + bounds.width;
                if (position.y < -bounds.height)
                     position.y = size.height + bounds.height;
                if (position.x > size.width + bounds.width)
                     position.x = -bounds.width;
                if (position.y > size.height + bounds.height)
                     position.y = -bounds.height;
                snakeBody.position = position;
          }
      }
    }
    
};

function onKeyDown(e) {

  if (e.key === 'up') {
  
    if (canStretch) {
        canStretch = false;
        headPathCombined.scale(1.4, 1);
    }

  }

  // Prevent the arrow keys from scrolling the window:
  return !(/left|right|up|down/.test(e.key));

}

function onKeyUp(e) {
    
  if (e.key === 'up') {
      headPathCombined.scale(0.72, 1);
      canStretch = true;
  }
    
}

// cache the buttons
var leftButton = document.getElementById('left');
var rightButton = document.getElementById('right');
var forwardButton = document.getElementById('forward');
var backButton = document.getElementById('back');

// these vars store which buttons are currently being held down
var leftDown = false;
var rightDown = false;
var forwardDown = false;
var backDown = false;

var circleColors = [
  '#6dbe45',
  '#9ea32f',
  '#cada31',
  '#04b9f0',
  '#1e88a0',
  '#dc9521',
  '#f94295'
  
];


var circleCountCheck = 0;

function onFrame(e) {

  // check if the snake head bounds intersects with a circle
  // if so, change the circle fill colour
  // there must be a more efficient way of doing this seeing as this is on every frame

  for (var i = 0; i < circleArray.length; i++ ) {

    if (head.bounds.intersects(circleArray[i].bounds) && circleArray[i].isColored === undefined) {
      // grab a random colour from the circle colour array
      circleArray[i].fillColor = circleColors[Math.round(Math.random() * (circleColors.length - 1))];
      
      circleCountCheck ++;
      // mark the circle as coloured
      // this prevents repeditively recolouring the circle each frame
      circleArray[i].isColored = true;
      
      if (circleCountCheck === circleCount) {
        //console.log('all coloured, maybe do something?');
        document.body.classList.add('complete');
      }
    }
    
  }

  


  snakeBody.strokeColor = {
    gradient: {
      stops: [
        ['#2c62a0', 0],
        ['#2c62a0', 0.22],
        ['#09989c', 0.23],
        ['#09989c', 0.40],
        ['#d9d400', 0.41],
        ['#d9d400', 0.52],
        ['#ef3282', 0.53],
        ['#ef3282', 0.58],
        ['#642671', 0.59],
        ['#642671', 0.68],
        ['#e8594b', 0.69],
        ['#e8594b', 1]
      ]
    },
      origin: snakeBody.bounds.left,
      destination: snakeBody.bounds.bottom
  };



  /*eye.strokeColor = {
  hue: e.count / 10 + 220, // to get closer to starting point blue
  saturation: 0.7,
  brightness: 0.6
  };*/




  leftButton.ontouchstart = function() {
    leftDown = true;
  }
  leftButton.ontouchend = function() {
    leftDown = false;
  }
  rightButton.ontouchstart = function() {
    rightDown = true;
  }
  rightButton.ontouchend = function() {
    rightDown = false;
  }
  forwardButton.ontouchstart = function() {
    forwardDown = true;
  }
  forwardButton.ontouchend = function() {
    forwardDown = false;
  }
  backButton.ontouchstart = function() {
    backDown = true;
  }
  backButton.ontouchend = function() {
    backDown = false;
  }


  // keyboard controls || touch controls
  if (Key.isDown('left') || leftDown) {
    snake.left();
  }
  if (Key.isDown('right') || rightDown) {
    snake.right();
  }
  if (Key.isDown('up') || forwardDown) {
    snake.forward();
  }
  if (Key.isDown('down') || backDown) {
    snake.reverse();
  }

  // if not accellerating, and not breaking, then return to default speed
  if (!forwardDown && !backDown && !Key.isDown('up') && !Key.isDown('down')) {
    snake.returnSpeed();
  }
     
  snake.draw();

}