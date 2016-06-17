// fragment shader + vertex shader + description of interface + draw logic
aPackage('nart.gl.shader.pack', () => {
	"use strict";
	
	var mixedProto = aRequire('nart.util.class').proto,
		mat4 = aRequire('nart.gl.external.matrix').mat4;
	
	var getCountingBufferName = desc => (desc.filter(b => b.isCounting)[0] || {}).name
	
	// TODO: refactor, too much params
	var Buffer = function(gl, name, program, bufferType){ 
		this.gl = gl;
		this.name = name;
		this.index = this.getIndexFunction().call(gl, program, name);
		//console.log(name + ' -> ' + this.index);
		this.bufferType = bufferType;
		gl.enableVertexAttribArray(this.index);
	}
	
	Buffer.create = (gl, name, program, params) => {
		params = params || {};
		return params.isCounting? new CountingAttributeBuffer(gl, name, program, params.bufferType || gl.ARRAY_BUFFER):
			params.isUniform? new UniformBuffer(gl, name, program, params.bufferType || gl.ARRAY_BUFFER, params.width || 1, params.isMatrix, params.elementType || 'f'):
			new AttributeBuffer(gl, name, program, params.bufferType || gl.ARRAY_BUFFER);
			
	}
	
	var UniformBuffer = function(gl, name, program, bufferType, width, isMatrix, elementType){
		Buffer.call(this, gl, name, program, bufferType);
		var setFuncName = 'uniform' + (isMatrix? 'Matrix': '') + width + elementType + 'v';
		var setFunc = gl[setFuncName];
		this.set = isMatrix?
			b => setFunc.call(gl, this.index, false, b):
			b => setFunc.call(gl, this.index, b);
	}
	
	UniformBuffer.prototype = mixedProto(Buffer, {
		getIndexFunction: function(){ return this.gl.getUniformLocation }
	});
		
	var AttributeBuffer = function(gl, name, program, bufferType){
		Buffer.call(this, gl, name, program, bufferType)
	}
	
	AttributeBuffer.prototype = mixedProto(Buffer, {
		getIndexFunction: function(){ return this.gl.getAttribLocation },
		set: function(data){
			this.gl.bindBuffer(this.bufferType, data);
			this.gl.vertexAttribPointer(this.index, data.itemSize, this.gl.FLOAT, false, 0, 0);
		}
	});
		
	var CountingAttributeBuffer = function(gl, name, program, bufferType){
		AttributeBuffer.call(this, gl, name, program, bufferType);
		this.count = 0;
	}
	
	CountingAttributeBuffer.prototype = mixedProto(AttributeBuffer, {
		set: function(data){
			this.itemCount = data.numItems;
			AttributeBuffer.prototype.set.call(this, data);
		}
	});
	
	var ShaderPack = function(gl, vertexCode, fragmentCode, description, clear, draw, modelMatrixLocationName){
		if(!(this instanceof ShaderPack)) return new ShaderPack(gl, vertexCode, fragmentCode, description)
			
		this.vertexShader = shaderOf(gl, gl.VERTEX_SHADER, vertexCode)
		this.fragmentShader = shaderOf(gl, gl.FRAGMENT_SHADER, fragmentCode)
		this.shaders = [this.vertexShader, this.fragmentShader]
		this.description = description
		this.gl = gl
		this.countingBufferName = getCountingBufferName(description)
		
		this.innerDraw = draw
		this.clear = clear
		this.modelMatrixLocationName = modelMatrixLocationName;
	}
	
	var shaderOf = (gl, type, code) => {
		var shader = gl.createShader(type);
		
		gl.shaderSource(shader, code);
		gl.compileShader(shader);
		
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw "Failed to compile shader code:\n" + code
		
		return shader;
	}
	
	var currentFramebuffer = null;
	ShaderPack.prototype = {
		bindVariables: function(program){
			this.description.forEach(b => this[b.name] = Buffer.create(this.gl, b.innerName, program, b))
		},
		
		setFramebuffer: function(b){
			if(b === currentFramebuffer) return;
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, b);
		},
		
		draw: function(time, shape){
			// TODO: there is 3 possible ways of storing/defining the position of the shape:
			// 1. store only coords and rotations, form the matrix every time it is needed
			// 2. store coords, rotations and formed matrix, altering it as needed
			// 3. (?) storing coords, passing them to shader and working with them on shader side
			// its completely unclear for me what will perform better
			// when I will opt everything, this is the thing to think of
			this[this.modelMatrixLocationName].set(shape.getMatrix());
			this.innerDraw(time, shape);
		}
	};
	
	
	return ShaderPack;
	
});