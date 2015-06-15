/**
 * Created by Gaplo917 on 14/6/15.
 */
(function(){
	function LuckyWheel(stage) {
		var self = this;

		// super class
		this.Container_constructor();

		var config = {
			size:300 * 3, // size in px
			framerate:60,
			numOfSector: 20, // number of
			slowEndEffect : 1, // 0 = off , 1 = on
			physics:{
				angular:{
					// degree per second
					acceleration : 1,
					deceleration : 3,
					initialAcceleration : 4, // will be used to accelerate to Half of maxSpeed
					maxSpeed : 360
				}
			}

		};

		var deltaDegree = 0;

		this.init = function (x,y) {
			stage.clear();
			// Draw sectors
			var angle = 0;
			while (angle < 360) {
				self.addSector({
					angle:angle,
					config:config
				}, function (sector) {
					// add to parent
					self.addChild(sector);

					angle = sector.endAngle;
				});

			}
			// reposition the rotating center and the position
			self.set({
				regX : config.size,
				regY : config.size,
				x : config.size / 2 + x,
				y : config.size / 2 + y
			});

			// Draw a stop line
			var stopLine = new createjs.Shape();
			stopLine.graphics.s(createjs.Graphics.getRGB(0xFF0000)).setStrokeStyle(2);
			stopLine.graphics.moveTo(self.x, 0 + y);
			stopLine.graphics.lineTo(self.x, 100 + y);

			// Add the wheel to stage
			stage.addChild(self);

			stage.addChild(stopLine);

			// draw the pie
			stage.update();

			return self;
		};

		this.addSector = function (opts,cb) {
			var angle = opts.angle;

			var sectorContainer = new createjs.Container(),
				sectorAngle = 360 / config.numOfSector,
				startAngle = 0,
				endAngle = Math.min(360, sectorAngle) * Math.PI/180,
				shape = new createjs.Shape().set({x:config.size, y:config.size}),
				id = Math.floor(angle / sectorAngle),
				color = Math.random() * 0xFFFFFF,
				textColor = 0x000000,
				text = new createjs.Text(id, Math.min(50 * 3 ,sectorAngle *3) + "px Arial", createjs.Graphics.getRGB( textColor));

			shape.graphics.f(createjs.Graphics.getRGB(color));
			shape.graphics.beginStroke(createjs.Graphics.getRGB(color - 0x000000)).setStrokeStyle(1);
			shape.graphics.moveTo(0,0);
			shape.graphics.arc(0,0,config.size/2,startAngle,endAngle);


			// rotate to vertical
			shape.rotation = -1 * (sectorAngle/2) - 90 ;

			// hard tuning on relative position
			text.x = config.size * 2.94 / 3;
			text.y = config.size * 1.7 / 3;
			text.regX = Math.min(50 * 3 ,sectorAngle *3)/5;

			//add the children to the sector container
			sectorContainer.addChild(text);
			sectorContainer.addChildAt(shape,0);

			// config the container center & rotation
			sectorContainer.set({
				id : id,
				x : config.size,
				y : config.size,
				regX : config.size,
				regY : config.size,
				rotation: angle + sectorAngle/2,
				startAngle : angle,
				endAngle : angle + sectorAngle
			});

			// significantly increase performace by using cache
			sectorContainer.cache(0,0,config.size * 2,config.size * 2);

			if(typeof cb === "function") cb(sectorContainer);

			return angle + sectorAngle;

		};

		this.event = {
			acceleration : function () {
				var ANGULAR = config.physics.angular,
					MAX_SPEED = ANGULAR.maxSpeed / config.framerate,
					ACC = ANGULAR.acceleration / config.framerate,
					INITAL_ACC = ANGULAR.initialAcceleration / config.framerate;

				deltaDegree = (deltaDegree + ACC) > MAX_SPEED ?
					MAX_SPEED :
				deltaDegree + ACC;

				// add initial acceleration
				deltaDegree = deltaDegree < MAX_SPEED / 2 ?
				deltaDegree + INITAL_ACC - ACC :
					deltaDegree;

				self.rotation = (self.rotation + deltaDegree) % 360;
			},
			deceleration : function () {
				var angular = config.physics.angular,
					MAX_SPEED = angular.maxSpeed / config.framerate,
					DEC = config.slowEndEffect && deltaDegree < MAX_SPEED / 8 ?
					angular.deceleration/ config.framerate / 20 :
					angular.deceleration / config.framerate;

				deltaDegree = (deltaDegree - DEC) > 0 ? deltaDegree - DEC : 0;
				self.rotation = (self.rotation + deltaDegree) % 360;

				if(deltaDegree <= 0){

					var found = _.find(self.children, function (sector) {
						var normalized = self.rotation * -1;
						normalized = normalized < 0 ? 360 + normalized : normalized;
						return normalized >= sector.startAngle && normalized < sector.endAngle;
					});
					// set the found to the uppest layer
					self.setChildIndex(found,self.children.length - 1);

					//remove deceleration tick
					createjs.Ticker.removeEventListener("tick", self.event.deceleration);

					// show some effect on the found object
					_.each(found.children, function (child) {
						if(child.text !== undefined) alert("恭喜你中了「" + child.text+ "」");
					});

					stage.dispatchEvent("END");
				}
			}
		};


		this.getConfig = function () {
			return config;
		};

		this.setConfig = function (cfg) {
			config = _.extend(config,cfg);
		};

		return this;
	}
	// extend the wheel to a createjs container
	createjs.extend(LuckyWheel, createjs.Container);

	window.LuckyWheel = createjs.promote(LuckyWheel, "Container");
}());