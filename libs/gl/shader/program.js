aPackage('nart.gl.shader.program', () => {
	"use strict";
	
	var activeShaderProgram = null;
	
	// TODO: learn to store uniform matrices (vertex normals, ambient light) on GPU side for performance
	var ShaderProgram = function(gl, shaderPack){
		if(!(this instanceof ShaderProgram)) return new ShaderProgram(gl, shaderPack);

		this.program = gl.createProgram();
		this.shaderPack = shaderPack;
		this.gl = gl;
		
		shaderPack.shaders.forEach(s => gl.attachShader(this.program, s))
		gl.linkProgram(this.program);

		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw "Failed to link shader program."
		
		shaderPack.bindVariables(this.program);
	}
	
	ShaderProgram.prototype = {
		activate: function(){ return (activeShaderProgram === this) || this.gl.useProgram((activeShaderProgram = this).program) },
		clear: function(b){ return this.shaderPack.clear(b) },
		draw: function(s, b){ return this.shaderPack.draw(s, b) }
	}
	
	return ShaderProgram;
	
});