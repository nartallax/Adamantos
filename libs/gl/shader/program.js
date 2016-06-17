aPackage('nart.gl.shader.program', () => {
	"use strict";
	
	var ShaderProgram = function(gl, shaderPack){
		if(!(this instanceof ShaderProgram)) return new ShaderProgram(gl, shaderPack);

		this.program = gl.createProgram();
		this.shaderPack = shaderPack;
		this.gl = gl;
		
		shaderPack.shaders.forEach(s => gl.attachShader(this.program, s))
		gl.linkProgram(this.program);

		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error("Failed to link shader program.")
		
		shaderPack.bindVariables(this.program);
	}
	
	ShaderProgram.prototype = {
		activate: function(){ return (this.gl.activeShaderProgram === this) || this.gl.useProgram((this.gl.activeShaderProgram = this).program) },
		clear: function(b){ return this.shaderPack.clear(b) },
		draw: function(time, s, b){ return this.shaderPack.draw(time, s, b) }
	}
	
	return ShaderProgram;
	
});