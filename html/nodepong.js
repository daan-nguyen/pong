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
        }
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        }
}());

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
}

// between comparer
Number.prototype.between = function(first,last){
    return (first < last ? this >= first && this <= last : this >= last && this <= first);
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
			_collisionSide,
			_noCollision;
		
		if (opt) {
			_x = opt.x;
			_y = opt.y;
			_lastx = opt.x;
			_lasty = opt.y;
			_xv = opt.xv;
			_yv = opt.yv;
			_rad = opt.rad;
			_colour = opt.colour;
			_noCollision = (function() {
				return (opt.noCollision) ? opt.noCollision : false;
			})(_noCollision);
		}
		
		//public
		this.x = function(val) {
			if (!val) return _x;
			else { 
				_lastx = _x;
				_x = val;
			}
			return this;
		}
		
		this.y = function(val) {
			if (!val) return _y;
			else {
				_lasty = _y;
				_y = val;
			}
			return this;
		}
		
		this.xv = function(val) {
			if (!val) return _xv;
			else _xv = val;
			return this;
		}
		
		this.yv = function(val) {
			if (!val) return _yv;
			else _yv = val;
			return this;
		}
		
		this.rad = function(val) {
			if (!val) return _rad;
			else _rad = val;
			return this;
		}
		
		this.colour = function(val) {
			if (!val) return _colour;
			else _colour = val;
			return this;
		}

		this.lastx = function() {
			return _lastx;
		}

		this.lasty = function() {
			return _lasty;
		}

		var capSpeed = function(v) {
			return (v > nodepong.env.maxSpeed) ? nodepong.env.maxSpeed : v;
		}

		var applyBounceFactor = function(v) {
			return capSpeed(v * nodepong.env.bounceFactor);
		}

		var boundaryCollision = function() {
			var t = nodepong.env.outerWallThickness;

			// hit top boundary
			if (_y <= 0 + t + _rad) {
				_y = 0 + t + _rad;
				_yv *= -1;
				_yv = applyBounceFactor(_yv);
				_xv = applyBounceFactor(_xv);
				return true;
			// hit bottom boundary
			} else if (_y >= nodepong.$canvas.height() - t - _rad) {
				_y = nodepong.$canvas.height() - t - _rad;
				_yv *= -1;
				_yv = applyBounceFactor(_yv);
				_xv = applyBounceFactor(_xv);
				return true;
			}

			return false;
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
					// of the infinite line + including radius of ball, this makes
					// sure the ball bounces off it's surface and not it's centre
					return (p.x.between(o.x() - _rad, o.x() + o.width() + _rad) && 
							p.y.between(o.y() - _rad, o.y() + o.height() + _rad)) ? p : false;
				}
			}

			return false;
		}

		this.checkCollision = function() {
			if (!boundaryCollision()) {

				// form the line formula for ball path
				var m = (this.y() - this.lasty()) / (this.x() - this.lastx()); // line gradient
				var b = this.y() - m * this.x();

				for (var i=0; i<nodepong.gameState.length; i++) {
					var o = nodepong.gameState[i];

					// don't check against itself or objects that are not set to collide
					if (this != o && !o.noCollision()) {

						// intersection against wall objects
						if (o instanceof nodepong.Wall) {
							// x point = (y-b)/m
							// y point = m*x + b
							// wall lines are always vertical or horizontal, only need to use 1 formula to calculate intersect
							// against particular wall. x formula for horizontal walls and y forumla for vertical walls
							var intersection = {};
							intersection.top = validateIntersectionPoint(calculateXIntersection(o.y(), m, b), o);
							intersection.bottom = validateIntersectionPoint(calculateXIntersection(o.y() + o.height(), m, b), o);
							intersection.left = validateIntersectionPoint(calculateYIntersection(o.x(), m, b), o);
							intersection.right = validateIntersectionPoint(calculateYIntersection(o.x() + o.width(), m, b), o);


							var impactSide, distanceToIntersect = 9999999;
							var isIntersecting = (intersection.top || intersection.bottom || intersection.left || intersection.right) ? true : false;

							//console.log(intersection);
							if (isIntersecting) {
								for (var n in intersection) {
									if (intersection[n]) {
										var intersectLength = nodepong.util.pythag(this.lastx(), this.lasty(), intersection[n].x, intersection[n].y);
										//console.log('len: ' + intersectLength + ' n: ' + n);

										if (intersectLength <= distanceToIntersect) {
											distanceToIntersect = intersectLength;
											impactSide = n;
										}
									}

								}

								_collisionSide = impactSide;
								this.handleCollision(o);
							}
							
						} else if (o instanceof nodepong.Ball) { // intersection with other ball

						}
					}

				}

			}
		}

		this.handleCollision = function(o) {

			switch(_collisionSide) {
				case 'top': 
					this.y(o.y() - this.rad());
					this.yv(-this.yv());
					break;
				case 'bottom':
					this.y(o.y() + o.height() + this.rad());
					this.yv(-this.yv());
					break;
				case 'left':
					this.x(o.x() - this.rad());
					this.xv(-this.xv());
					break;
				case 'right':
					this.x(o.x() + o.width() + this.rad());
					this.xv(-this.xv());
					break
			}

			this.xv(applyBounceFactor(this.xv()));
			this.yv(applyBounceFactor(this.yv()));

			_collisionSide = _UNDEFINED;
		}
		
		this.noCollision = function(val) {
			if (!val) return _noCollision;
			else _noCollision = val;
		}

		this.isOutOfBounds = function() {
			var o = this;
			var t = nodepong.env.outerWallThickness;

			// Factor in wall thickness as we consider anything beyond the edge
			// of the interior wall to be 'out of bounds'. This is to resolve cases
			// whereby the ball ends up inside the wall and avoids hit detection
			// and a 'will be out of bounds' check.
			if (o.x().between(0 + t, nodepong.$canvas.width() - t) &&
				o.y().between(0 + t, nodepong.$canvas.height() - t)) { 
				return false;
			}

			// means it is out of bounds here
			if (o.x() <= 0 + t) {
				nodepong.players.p2.score += 1;
			} else if (o.x() >= nodepong.$canvas.width() - t) {
				nodepong.players.p1.score += 1;
			}

			return true;
		}

		this.draw = function() {
			nodepong.ctx.beginPath();
			nodepong.ctx.arc(this.x(), this.y(), this.rad(), 0, Math.PI*2, true);
			nodepong.ctx.closePath();
			nodepong.ctx.fillStyle = this.colour();
			nodepong.ctx.fill();

		}
	}
	
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
			_colour,
			_noCollision;
		
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
			_noCollision = (function() {
				return (opt.noCollision) ? opt.noCollision : false;
			})(_noCollision);
		}
	
		// public
		this.x = function(val) {
			if (!val) return _x;
			else { 
				_lastx = _x;
				_x = val;
			}
			return this;
		}
		
		this.y = function(val) {
			if (!val) return _y;
			else {
				_lasty = _y;
				_y = val;
			}
			return this;
		}
		
		this.height = function(val) {
			if (!val) return _height;
			else _height = val;
			return this;
		}
		
		this.width = function(val) {
			if (!val) return _width;
			else _width = val;
			return this;
		}
		
		this.colour = function(val) {
			if (!val) return _colour;
			else _colour = val;
			return this;
		}

		this.xv = function() {
			return _x - _lastx;
		}
		
		this.yv = function() {
			return _y - _lasty;
		}

		this.noCollision = function(val) {
			if (!val) return _noCollision;
			else _noCollision = val;
		}

		this.draw = function() {
			nodepong.ctx.fillStyle = this.colour();
			nodepong.ctx.fillRect(this.x(), this.y(), this.width(), this.height());
		}
		
	}

	return cls;
	
})();

nodepong.env = (function(parent) {
	var my = parent.env = parent.env || {}

	// vars
	my.outerWallThickness = 20;
	
	// player vars
	my.paddleLength = 100;
	my.paddleWidth = my.outerWallThickness;

	// ball vars
	my.ballRadius = 10;
	my.startSpeed = 200;
	my.maxSpeed = 500;
	my.bounceFactor = 1.1; // 10% speed increase off each bounce
	my.spinFactor = 20;

	my.physicsLoopDelay = 15;

	return my;
})(nodepong || {});

//nodepong
nodepong = (function(parent) {
	var my = nodepong || {}
	
	my.ctx = document.getElementById('canvas').getContext('2d');
	my.$canvas = $('#canvas');	
	my.gameState = [];
	my.players = {}

	my.init = function() {

		nodepong.util.clear();
		var time = (new Date()).getTime();
		
		createField();
		my.createBall();
		createPlayers();

		bindGameKeys();

		nodepong.animation.startPhysicsLoop();
		nodepong.animation.startAnimateLoop();
	}

	var createField = function() {
		
		var wallThickness = nodepong.env.outerWallThickness;

		// game boundaries
		var wallTop = new my.Wall({
			x: 0, y: 0, width: nodepong.$canvas.width(), height: wallThickness, noCollision: true
		});
		
		var wallBottom = new my.Wall({
			x: 0, y: nodepong.$canvas.height() - wallThickness, width: nodepong.$canvas.width(), height: wallThickness, noCollision: true
		});

		nodepong.gameState.push(wallTop);
		nodepong.gameState.push(wallBottom);

	}

	my.createBall = function() {
		
		var radius = nodepong.env.ballRadius;
		var gameBall = new nodepong.Ball({
			x: nodepong.$canvas.width()/2,
			y: nodepong.$canvas.height()/2,
			xv: 0,
			yv: 0,
			rad: radius,
			colour: 'red'
		});

		nodepong.gameState.push(gameBall);
	}

	var createPlayers = function() {
		
		var w = nodepong.env.paddleWidth;
		var h = nodepong.env.paddleLength;

		var p1 = new nodepong.Wall({
			x: 20 - w/2,
			y: nodepong.$canvas.height()/2 - h/2,
			height: h,
			width: w
		});

		var p2 = new nodepong.Wall({
			x: nodepong.$canvas.width() - 20 - w/2,
			y: nodepong.$canvas.height()/2 - h/2,
			height: h,
			width: w
		})

		
		nodepong.players.p1 = {paddle: p1, score: 0, up: false, down: false};
		nodepong.players.p2 = {paddle: p2, score: 0, up: false, down: false};
		nodepong.gameState.push(p1);
		nodepong.gameState.push(p2);
	}

	var bindGameKeys = function() {

		// ball launch on click
		nodepong.$canvas.click(function(e) {
			var p = {x: e.pageX - $(this).offset().left,
					 y: e.pageY - $(this).offset().top};

			for (var i=0; i<nodepong.gameState.length; i++) {
				var o = nodepong.gameState[i];

				if (o instanceof nodepong.Ball) {
					var h = nodepong.util.pythag(o.x(), o.y(), p.x, p.y);
					var rsum = o.rad() * o.rad();

					if (rsum >= h && o.xv() == 0 && o.yv() == 0) {
						var xvSign = (Math.floor(Math.random()*10) >= 5) ? 1 : -1;
						var yvSign = (Math.floor(Math.random()*10) >= 5) ? 1 : -1;
						o.xv(Math.floor((Math.random()*nodepong.env.startSpeed)+nodepong.env.startSpeed/2)*xvSign);
						o.yv(Math.floor((Math.random()*nodepong.env.startSpeed)+nodepong.env.startSpeed/2)*yvSign);
					}
				}
			}
		});

		// arrow down - 40, arrow up - 38
		// w - 87, s - 83
		var customMouseMove = 'mousemove.nodepong';
		nodepong.$canvas.mouseenter(function(e) {
			$(this).on(customMouseMove, function(e) {
				var y = e.pageY - $(this).offset().top - nodepong.env.paddleLength/2,
					t = nodepong.env.outerWallThickness;

				y = (y < 0 + t) ? 0 + t : y;
				y = (y + nodepong.env.paddleLength > nodepong.$canvas.height() - t) ? 
					nodepong.$canvas.height() - t - nodepong.env.paddleLength : y;

				nodepong.players.p1.paddle.y(y);
				nodepong.players.p2.paddle.y(y);

			});
		}).mouseleave(function(e) {
			$(this).off(customMouseMove);
		});

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
	
	
	$(document).ready(function() {
		//bindTestEvents();
		my.init();
	});
	
	return my;
})(nodepong || {});

nodepong.animation = (function(parent) {
	var my = parent.animation = parent.animation || {}

	var _physicsLoopRunning = false,
		_animateLoopRunning = false;

	my.startPhysicsLoop = function() {
		_physicsLoopRunning = true;

		var time = (new Date()).getTime();
		physicsLoop(time);
	}

	my.stopPhysicsLoop = function() {
		_physicsLoopRunning = false;
	}

	var physicsLoop = function(lastTime) {
		if (!_physicsLoopRunning) return;

		var date = new Date(),
			time = date.getTime(),
			delta = time - lastTime;

		//console.log(delta);

		for (var i=0; i<nodepong.gameState.length; i++) {
			var o = nodepong.gameState[i];

			if (o instanceof nodepong.Ball) {
				if (o.isOutOfBounds()) {
					nodepong.gameState.remove(i);
					nodepong.createBall();
				}

				var x = o.x() + (o.xv()/1000)*delta;
				var y = o.y() + (o.yv()/1000)*delta;
				o.x(x);
				o.y(y);

				if (!o.noCollision()) {
					//check collisions
					o.checkCollision();
				}
			}
		}

		setTimeout(function() {
			physicsLoop(time);
		}, nodepong.env.physicsLoopDelay);
	}

	my.startAnimateLoop = function() {
		_animateLoopRunning = true;

		var time = (new Date()).getTime();

		requestAnimationFrame(function() {
			animate(time);
		});
	}

	var animate = function(lasttime) {
		if (!_animateLoopRunning) return;

		var time = (new Date()).getTime(),
			delta = time - lasttime;

		requestAnimationFrame(function() {
			animate(time);
		});

		nodepong.util.clear();
		drawScores();

		// draw game objects
		for (var i=0; i<nodepong.gameState.length; i++) {
			nodepong.gameState[i].draw();
		}

		drawFpsCounter(delta)
	}
	
	var drawScores = function() {
		// player 1 score
		nodepong.ctx.fillStyle = 'black';
		nodepong.ctx.textBaseline = 'top';
		nodepong.ctx.font = "60px 'Press Start 2P'"
		nodepong.ctx.textAlign = 'left';
		nodepong.ctx.fillText(nodepong.players.p1.score, 40, 30);

		//player 2 score
		nodepong.ctx.textAlign = 'right';
		nodepong.ctx.fillText(nodepong.players.p2.score, nodepong.$canvas.width() - 40, 30);
	}

	var drawFpsCounter = function(delta) {
		// fps counter
		nodepong.ctx.fillStyle = 'white';
		nodepong.ctx.font = "8px 'Press Start 2P'"
		nodepong.ctx.textAlign = 'left';
		nodepong.ctx.fillText('FPS: ' + Math.floor(1000/delta), 5, nodepong.$canvas.height() - 13);
	}

	return my;
})(nodepong);

//nodepong.util
nodepong.util = (function(parent) {
	var my = parent.util = parent.util || {}
	
	my.clear = function() {
		nodepong.ctx.clearRect(0, 0, nodepong.$canvas.width(), nodepong.$canvas.height());
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