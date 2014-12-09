document.body.ontouchmove = function(event){
    event.preventDefault();
};

function isTouchDevice() {
  return 'ontouchstart' in window || 'onmsgesturechange' in window; // works on ie10
}

var isMobile = isTouchDevice() && screen.width <= 768;

if (isMobile) {
  document.querySelectorAll('.buttons')[0].style.display = 'block';
}


// set some defaults
project.currentStyle = {
     //strokeColor: 'black',
     strokeWidth: 4,
     strokeCap: 'round'
};

var defaultSpeed = 5;

var speed = defaultSpeed;
var canStretch = true;

var path;
var headPathCombined;
var eye;

var snake = new function() {
     var center = view.center;
     var size = 300;
     var partLength = 1;
     path = new Path();
     for (var i = 0; i < size; i++) {
          path.add(center - [i * partLength, 0]);
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
    var head = new PlacedSymbol(headSymbol);

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
            
            if (speed < defaultSpeed) {
              speed = defaultSpeed;
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
               var lastPoint = path.firstSegment.point = position;
               var lastVector = vec;
               var segments = path.segments;
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
               path.smooth();
               this.constrain();
          },

          constrain: function() {
              var bounds = path.bounds;
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
                    path.position = position;
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

function onFrame(e) {


  path.strokeColor = {
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
      origin: path.bounds.left,
      destination: path.bounds.right
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