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
		mat4 = aRequire('nart.gl.external.matrix').mat4;
			
	var Board = function(canvas){
		if(!(this instanceof Board)) return new Board(canvas);
		
		this.gl = canvas.getContext("webgl")// || canvas.getContext("experimental-webgl");
		this.display = canvas;
		
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK);
		
		this.shaderProgram = new ShaderProgram(this.gl, TypicalShaderPack(this.gl))
		this.pickingShaderProgram = new ShaderProgram(this.gl, PickingShaderPack(this.gl))
		
		this.projectionMatrix = mat4.create();
		this.modelViewMatrix = mat4.create();
		
		this.isRunning = false;
		this.children = {};
		
		this.afterTick = new Event();
		this.viewportActualizationFrequency = 60;
		this.ticksPassed = 0;
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
			//if(this.ticksPassed === 0) this.clearWithProgram(p)
			return this.clearWithProgram(p).drawChildrenWithProgram(p)
			
		},
		drawChildrenWithProgram: function(s){
			s.activate();
			var c = this.children, m = this.modelViewMatrix, pm = this.projectionMatrix;
			for(var i in c) s.draw(c[i], this);
		},
		clearWithProgram: function(p){
		
			p.activate();
			
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
		
		addChild: function(shape){ return this.children[shape.id] = shape, this },
		removeChild: function(shape){ delete this.children[shape.id]; return this },
		
		setAmbientColor: function(b){
			return this.ambientColorBuffer = b, this//(bufferOf(this.gl, b, 3, this.gl.ARRAY_BUFFER, Float32Array) || null), this
		}, 
		setLightDirection: function(b){
			return this.lightDirection = b, this
		}, 
		setLightColor: function(b){
			return this.lightColor = b, this
		},
		
		childAt: function(x, y){
			var gl = this.gl;
			
			var color = new Uint8Array(4);
			
			this.drawWithProgram(this.pickingShaderProgram)
			
			this.gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
			
			var id = (color[0] << 16) | (color[1] << 8) | color[2]
			
			return this.pickingShaderProgram.shaderPack.idMap[id];
		},
	};

	return Board;

});