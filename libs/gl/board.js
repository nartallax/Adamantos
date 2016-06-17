// Board is, basically, a scene
// an storage of graphical elements, also capable of drawing these elements
aPackage('nart.gl.board', () => {
	"use strict";
	
	var ShaderProgram = aRequire('nart.gl.shader.program'),
		ShaderPack = aRequire('nart.gl.shader.pack'),
		TypicalShaderPack = aRequire('nart.gl.shader.typical'),
		PickingShaderPack = aRequire('nart.gl.shader.picking'),
		Event = aRequire('nart.util.event'),
		onNextScreenFrame = aRequire('nart.gl.util').onNextScreenFrame,
		mat4 = aRequire('nart.gl.external.matrix').mat4,
		msec = aRequire('nart.util.time').milliseconds;
			
	var Board = function(canvas){
		if(!(this instanceof Board)) return new Board(canvas);
		
		this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		this.display = canvas;
		
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK);
		
		this.shaderProgram = new ShaderProgram(this.gl, TypicalShaderPack(this.gl))
		this.pickingShaderProgram = new ShaderProgram(this.gl, PickingShaderPack(this.gl))
		
		this.projectionMatrix = mat4.create();
		this.viewMatrix = mat4.create();
		
		this.cam = {x: 0, y: 0, z: 0, rotX: 0, rotY: 0}
		
		this.isRunning = false;
		this.children = {};
		
		this.afterTick = new Event();
		this.viewportActualizationFrequency = 60;
		this.ticksPassed = 0;
		this.startTime = msec();
	};

	Board.prototype = {
		actualizeViewport: function(){
			this.gl.viewportWidth = this.display.scrollWidth;
			this.gl.viewportHeight = this.display.scrollHeight;
			
			if(this.display.height !== this.display.scrollHeight){
				this.display.height = this.display.scrollHeight
				this.display.setAttribute("height", this.display.scrollHeight)
			}
			
			if(this.display.width !== this.display.scrollWidth){
				this.display.width = this.display.scrollWidth
				this.display.setAttribute("width", this.display.scrollWidth)
			}
		
			this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
			mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.projectionMatrix);
		},
		
		drawWithProgram: function(p){
			return this.clearWithProgram(p).drawChildrenWithProgram(p)
		},
		drawChildrenWithProgram: function(s){
			s.activate();
			var timeOffset = msec() - this.startTime, c = this.children;
			Object.keys(c).forEach(id => s.draw(timeOffset, c[id]))
		},
		clearWithProgram: function(p){
			p.activate();
			
			mat4.identity(this.viewMatrix);
			mat4.rotate(this.viewMatrix, -this.cam.rotY, [1, 0, 0]);
			mat4.rotate(this.viewMatrix, -this.cam.rotX, [0, 1, 0]);
			mat4.translate(this.viewMatrix, [-this.cam.x, -this.cam.y, -this.cam.z]);
			
			((this.ticksPassed % this.viewportActualizationFrequency) === 0) && this.actualizeViewport();
			
			p.clear(this);
		
			return this;
		},
		
		start: function(){ return this.isRunning? this: (this.isRunning = true, this.onTick(), this) },
		stop: function(){ return this.isRunning = false, this },
		
		onTick: function(){
			if(!this.isRunning) return;
			onNextScreenFrame(() => this.onTick());
			
			this.drawWithProgram(this.shaderProgram);
			
			this.ticksPassed++;
			
			this.afterTick.fire();
		},
		
		addChild: function(shape){ this.children[shape.id] = shape},
		removeChild: function(shape){ delete this.children[shape? shape.id || shape: shape] },
		
		setAmbientColor: function(b){ this.ambientColorBuffer = b, this }, 
		
		childAt: function(x, y){
			var gl = this.gl;
			
			var color = new Uint8Array(4);
			
			this.drawWithProgram(this.pickingShaderProgram)
			
			this.gl.readPixels(x, this.gl.viewportHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
			
			var id = (color[0] << 16) | (color[1] << 8) | color[2]
			
			return this.pickingShaderProgram.shaderPack.idMap[id];
			
			return undefined;
		},
	};

	return Board;

});