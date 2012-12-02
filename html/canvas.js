// requestAnimationFrame shim
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

// between comparer
Number.prototype.between = function(first,last){
    return (first < last ? this >= first && this <= last : this >= last && this <= first);
}

// Min comparer
Number.prototype.min = function(a) {
	return (a < this ? a : this);
}

var _UNDEFINED;

//objects classes
nodepong = {}

nodepong.Ball = (function(opt) {
	
	var cls = function(opt) {
	
		var _x, 
			_y,
			_lastx,
			_lasty,
			_xv, 
			_yv,
			_rad,
			_colour,
			_collisionSide;
		
		if (opt) {
			_x = opt.x;
			_y = opt.y;
			_lastx = opt.x;
			_lasty = opt.y;
			_xv = opt.xv;
			_yv = opt.yv;
			_rad = opt.rad;
			_colour = opt.colour;
		}
		
		//public
		this.x = function(val) {
			if (!val) return _x;
			else { 
				_lastx = _x;
				_x = val;
			}
			return this;
		};
		
		this.y = function(val) {
			if (!val) return _y;
			else {
				_lasty = _y;
				_y = val;
			}
			return this;
		};
		
		this.xv = function(val) {
			if (!val) return _xv;
			else _xv = val;
			return this;
		};
		
		this.yv = function(val) {
			if (!val) return _yv;
			else _yv = val;
			return this;
		};
		
		this.rad = function(val) {
			if (!val) return _rad;
			else _rad = val;
			return this;
		};
		
		this.colour = function(val) {
			if (!val) return _colour;
			else _colour = val;
			return this;
		};

		this.lastx = function() {
			return _lastx;
		}

		this.lasty = function() {
			return _lasty;
		}
		
		var calculateXIntersection = function(y, m, b) {
			var intersectx = (y-b)/m;
			return {x: intersectx, y: y};
		}

		var calculateYIntersection = function(x, m, b) {
			var intersecty = m*x+b;
			return {x: x, y: intersecty};
		}

		var validateIntersectionPoint = function(p, o) {
			// first validate the intersection falls along the current line segment
			// of this object
			var isOnLineSegment = (p.x.between(_x, _lastx) && p.y.between(_y, _lasty)) ? true : false;

			//console.log('intersection point: ' + p)

			if (isOnLineSegment) {
				if (o instanceof nodepong.Wall) {
					// validate intersection is on a valid wall vertex, not part
					// of the infinite line
					return (p.x.between(o.x(), o.x() + o.width()) && p.y.between(o.y(), o.y() + o.height())) ? p : false;
				}
			}

			return false;
		}

		this.isColliding = function() {
			o1 = this;
			var oob = this.isOutOfBounds();

			// form the line formula for ball path
			var m = (o1.y() - o1.lasty()) / (o1.x() - o1.lastx()); // line gradient
			var b = o1.y() - m * o1.x();

			// check line for intersection against all other game objects
			for (var i=0; i<nodepong.gameState.length; i++) {
				var o2 = nodepong.gameState[i];

				// don't check against itself
				if (o1 != o2) {

					// intersection against wall objects
					if (o2 instanceof nodepong.Wall) {
						// x point = (y-b)/m
						// y point = m*x + b
						// wall lines are always vertical or horizontal, only need to use 1 formula to calculate intersect
						// against particular wall. x formula for horizontal walls and y forumla for vertical walls
						var intersection = {};
						intersection.top = validateIntersectionPoint(calculateXIntersection(o2.y(), m, b), o2);
						intersection.bottom = validateIntersectionPoint(calculateXIntersection(o2.y() + o2.height(), m, b), o2);
						intersection.left = validateIntersectionPoint(calculateYIntersection(o2.x(), m, b), o2);
						intersection.right = validateIntersectionPoint(calculateYIntersection(o2.x() + o2.width(), m, b), o2);


						var impactSide, distanceToIntersect = 9999999;
						var isIntersecting = (intersection.top || intersection.bottom || intersection.left || intersection.right) ? true : false;

						console.log(intersection);
						if (isIntersecting) {
							for (var n in intersection) {
								if (intersection[n]) {
									var intersectLength = nodepong.util.pythag(o1.lastx(), o1.lasty(), intersection[n].x, intersection[n].y);
									console.log('len: ' + intersectLength + ' n: ' + n);
									console.log(o1);

									if (intersectLength <= distanceToIntersect) {
										distanceToIntersect = intersectLength;
										impactSide = n;
									}
								}

							}

							_collisionSide = impactSide;
							o1.handleCollision(o2);
						}
						
					} else if (o2 instanceof nodepong.Ball) { // intersection with other ball

					}
				}

			}

	
		};
		
		this.handleCollision = function(o2) {
			o1 = this;
			if (o2 instanceof nodepong.Ball) {
				// handle ball-ball collision
			} else if (o2 instanceof nodepong.Wall) {
				
				console.log('colliding with: ' + _collisionSide);

				switch(_collisionSide) {
					case 'top': 
						o1.y(o2.y() - o1.rad());
						o1.yv(-o1.yv());
						break;
					case 'bottom':
						o1.y(o2.y() + o2.height() + o1.rad());
						o1.yv(-o1.yv());
						break;
					case 'left':
						o1.x(o2.x() - o1.rad());
						o1.xv(-o1.xv());
						break;
					case 'right':
						o1.x(o2.x() + o2.width() + o1.rad());
						o1.xv(-o1.xv());
						break
				}

				_collisionSide = null;
				
				// if (o1.yv() > 0 && o1.y() >= (o2.y() - o1.rad()) && o1.y() <= o2.y()) { //going down, impact top
				// 	o1.y(o2.y() - o1.rad());
				// 	o1.yv(-o1.yv());
				// } else // going up, impact bottom
				// if (o1.yv() < 0 && o1.y() <= (o2.y() + o2.height() + o1.rad()) && o1.y() >= (o2.y() + o2.height())) {
				// 	o1.y(o2.y() + o2.height() + o1.rad());
				// 	o1.yv(-o1.yv());
				// } else // going left, impact right
				// if (o1.xv() < 0 && o1.x() <= (o2.x() + o2.width() + o1.rad())) {
				// 	o1.x(o2.x() + o2.width() + o1.rad());
				// 	o1.xv(-o1.xv());
				// } else //going right, impact left
				// if (o1.xv() > 0 && o1.x() >= (o2.x() - o1.rad())) {
				// 	o1.x(o2.x() - o1.rad());
				// 	o1.xv(-o1.xv());
				// }
				
				// apply bounce acceleration
				var ba = nodepong.env.bounceAcceleration;
				o1.xv(nodepong.util.capSpeed(ba*o1.xv()));
				o1.yv(nodepong.util.capSpeed(ba*o1.yv()));
			}
		};
		
		this.isOutOfBounds = function() {
			var o = this;
			var t = nodepong.walls.top.height();

			// Factor in wall thickness as we consider anything beyond the edge
			// of the interior wall to be 'out of bounds'. This is to resolve cases
			// whereby the ball ends up inside the wall and avoids hit detection
			// and a 'will be out of bounds' check.
			if (o.x() < 0 + t || o.x() > nodepong.$canvas.width() - t 
			|| o.y() < 0  + t|| o.y() > nodepong.$canvas.height() - t) {
				return true;
			}
			return false;
		};

		this.draw = function() {
			nodepong.ctx.beginPath();
			nodepong.ctx.arc(this.x(), this.y(), this.rad(), 0, Math.PI*2, true);
			nodepong.ctx.closePath();
			nodepong.ctx.fillStyle = this.colour();
			nodepong.ctx.fill();
		};
	};
	
	return cls;
	
})();

nodepong.Wall = (function(opt) {
	
	var cls = function(opt) {
		var _x,
			_y,
			_lastx,
			_lasty,
			_height,
			_width,
			_colour;
		
		if (opt) {
			_x = opt.x,
			_y = opt.y,
			_lastx = opt.x,
			_lasty = opt.y,
			_height = opt.height;
			_width = opt.width;
			_colour = (function() {
				return (opt.colour) ? opt.colour : 'black';
			})(_colour);
		}
	
		// public
		this.x = function(val) {
			if (!val) return _x;
			else { 
				_lastx = _x;
				_x = val;
			}
			return this;
		};
		
		this.y = function(val) {
			if (!val) return _y;
			else {
				_lasty = _y;
				_y = val;
			}
			return this;
		};
		
		this.height = function(val) {
			if (!val) return _height;
			else _height = val;
			return this;
		};
		
		this.width = function(val) {
			if (!val) return _width;
			else _width = val;
			return this;
		};
		
		this.colour = function(val) {
			if (!val) return _colour;
			else _colour = val;
			return this;
		};

		this.xv = function() {
			return _x - _lastx;
		};
		
		this.yv = function() {
			return _y - _lasty;
		};

		this.draw = function() {
			nodepong.ctx.fillStyle = this.colour();
			nodepong.ctx.fillRect(this.x(), this.y(), this.width(), this.height());
		}
		
	}

	return cls;
	
})();

nodepong.env = (function(parent) {
	var my = parent.env = parent.env || {};

	my.framerate = 60;
	my.framerateConstant = Math.floor(1000/my.framerate);

	
	my.bounceAcceleration = 1.3;
	my.startSpeed = 300;
	my.speedCap = 800;
	my.spinMultiplier = 2.0;
	
	return my;
})(nodepong || {});

//nodepong
nodepong = (function(parent) {
	var my = nodepong || {};
	
	my.ctx = document.getElementById('canvas').getContext('2d');
	my.$canvas = $('#canvas');
	my.gameState = [];
	my.player;
	my.walls = {};
	
	my.init = function() {
		nodepong.util.clear();
		var time = (new Date()).getTime();
		nodepong.animation.animate(time);
		// nodepong.animation.initGameStateLoop();
	};

	var createBoundary = function() {
		// game boundaries
		var wallThickness = 5;
		var wallTop = new my.Wall({
			x: 0, y: 0, width: nodepong.$canvas.width(), height: wallThickness
		});
		
		var wallBottom = new my.Wall({
			x: 0, y: nodepong.$canvas.height() - wallThickness, width: nodepong.$canvas.width(), height: wallThickness
		});
		
		var wallLeft = new my.Wall({
			x: 0, y:0, width: wallThickness, height: nodepong.$canvas.height()
		});
		
		var wallRight = new my.Wall({
			x: nodepong.$canvas.width() - wallThickness, y: 0, width: wallThickness, height: nodepong.$canvas.height()
		});
		
		my.gameState.push(wallLeft);
		my.gameState.push(wallRight);
		my.gameState.push(wallTop);
		my.gameState.push(wallBottom);

		my.walls.top = wallTop;
		my.walls.bottom = wallBottom;
		my.walls.left = wallLeft;
		my.walls.right = wallRight;

	}
	
	var bindTestEvents = function() {
		
		my.$canvas.click(function(e) {
			if (e.which == 1) {
				var xvSign = (Math.floor(Math.random()*10) >= 5) ? 1 : -1;
				var yvSign = (Math.floor(Math.random()*10) >= 5) ? 1 : -1;
				
				var rgb = 'rgb('+Math.floor(Math.random()*255)+','
							+Math.floor(Math.random()*255)+','
							+Math.floor(Math.random()*255)+')';
				
				var myball = new my.Ball({
					x: e.pageX - $(this).offset().left, 
					y: e.pageY - $(this).offset().top,
					xv: Math.floor((Math.random()*nodepong.env.startSpeed)+nodepong.env.startSpeed/2)*xvSign,
					yv: Math.floor((Math.random()*nodepong.env.startSpeed)+nodepong.env.startSpeed/2)*yvSign,
					rad: 10,
					colour: rgb
				});
				my.gameState.push(myball);
			} else if (e.which == 2) {
				var wh = Math.floor((Math.random()*80)+20);
				var ww = Math.floor((Math.random()*80)+20);
				var vert = (Math.floor(Math.random()*10) >= 5) ? true : false;
				
				if (vert) ww = 20;
				else wh = 20;
				
				var myWall = new my.Wall({
					x: e.pageX - $(this).offset().left - ww/2,
					y: e.pageY - $(this).offset().top - wh/2,
					width: ww,
					height: wh
				});
				
				my.gameState.push(myWall);
			}
		});
	}
	
	var setupPlayer = function(num) {
		
		var ph = 100, pw = 20;
		var p = new my.Wall({
			x: 10,
			y: nodepong.$canvas.height()/2 - ph/2,
			width: pw,
			height: ph
		})
		
		num = (!num) ? 0 : num;
		
		my.gameState.push(p);		
		my.player = p;
		my.gameState.remove(num);
		var mouseMoveEvent = 'mousemove.nodepong';
		
		nodepong.$canvas.mouseenter(function() {
			$(this).on(mouseMoveEvent, function(e) {
				var p = nodepong.player;
				nodepong.util.updatePaddlePosition(e.pageY - $(this).offset().top - p.height()/2);
			});
		}).mouseout(function() {
			$(this).off(mouseMoveEvent);
		});
	}
	
	$(document).ready(function() {
		createBoundary();
		bindTestEvents();
		//setupPlayer();
		my.init();

		$('#clearCanvas').click(function() {
			nodepong.gameState = [];
			nodepong.util.clear();
		});
	});
	
	return my;
})(nodepong || {});

nodepong.animation = (function(parent) {
	var my = parent.animation = parent.animation || {};

	my.animate = function(lasttime) {
		var state = nodepong.gameState;
		
		var date = new Date(),
			time = date.getTime(),
			delta = time - lasttime;

		requestAnimationFrame(function() {
			nodepong.animation.animate(time);
		});
		
		nodepong.util.clear();
		update(delta);
	
		for (var i=0; i<state.length; i++) {
			var o = state[i];
			o.draw();
		}
		
		
	};

	my.initGameStateLoop = function() {
		update(nodepong.env.framerateConstant);
	};
	
	var update = function(delta) {
		
		var state = nodepong.gameState;
		// all of our animation objects will have x, xv etc
		for (var i=0; i<state.length; i++) {
			var o = state[i];
			
			// 30fps == 33ms/frame
			// 60fps == 16ms/frame
			if (o instanceof nodepong.Ball) {
			
				// check if out of bounds
				if (o.isOutOfBounds()) {
					console.log('Ball out of bounds, removing.');
					console.log('Previous: ' + o.x() + ' : ' + o.y());
					state.remove(i);
					//return;
				} else {
					// apply next frame position
					var framesDelta = delta/nodepong.env.framerateConstant;
					var x = (Math.floor(o.x() + (o.xv()/nodepong.env.framerate*framesDelta)));
					var y = (Math.floor(o.y() + (o.yv()/nodepong.env.framerate*framesDelta)));
					
					console.log('Previous: ' + o.x() + ' : ' + o.y() + ' Next: ' + x + ' : ' + y);

					o.x(x);
					o.y(y);

					if (o.isOutOfBounds()) console.log('WARNING: Next frame out of bounds!');

					// perform collision check
					o.isColliding();
				}

			}
		}
	
		// setTimeout(function() {
		// 	update(delta);
		// }, nodepong.env.framerateConstant);
	};
	
	return my;
})(nodepong);

//nodepong.util
nodepong.util = (function(parent) {
	var my = parent.util = parent.util || {};
	
	my.updatePaddlePosition = function(pos) {
		nodepong.player.y(pos);
	}
	
	my.removeWall = function(wall) {
		
	}
	
	my.clear = function() {
		nodepong.ctx.clearRect(0, 0, nodepong.$canvas.width(), nodepong.$canvas.height());
	}
	
	my.capSpeed = function(v) {
		return (v >= nodepong.env.speedCap) ? nodepong.env.speedCap : v;
	}
	
	my.pythag = function(x1, y1, x2, y2) {
		var x = x2 - x1;
		var y = y2 - y1;
		var h = x*x + y*y
		
		// return squared value, we don't sqroot because it's exp and unneeded
		// for our use
		return h;
	}
	
	return my;
})(nodepong || {});