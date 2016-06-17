aPackage('nart.gl.shader.typical', () => {
	"use strict";

	var ShaderPack = aRequire('nart.gl.shader.pack');
	
	var clear = function(b){
		
		this.setFramebuffer(null);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		
		this.projectionMatrix.set(b.projectionMatrix)
		this.viewMatrix.set(b.viewMatrix)
		
		this.ambientColor.set(b.ambientColorBuffer || [0, 0, 0]);
	}
	
	var draw = function(time, shape){ 
		var gl = this.gl;
	
		this.highlightColor.set(shape.highlightColor || [0, 0, 0]);
			
		var prims = shape.getPrimitives(time);
		for(var i = 0; i < prims.length; i++){
			var p = prims[i];
			this.vertexPosition.set(p.vertex);
			
			// TODO: make use of 1-9 textures (maybe there is no need to load them every time)?
			// the idea is that when repeated amounts of same models are drawn the textures could be reused
			// through that less calls to bindTexture is required; it could increase performance
			// unsure about that, need benchmark
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, p.texture.getFrame(time));
		
			this.textureIndex.set(p.textureIndex);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.vertexIndex);
			
			gl.drawElements(gl.TRIANGLES, p.vertex.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}
	
	return (gl, params) => new ShaderPack(gl, `
		attribute vec3 aVertexPosition;
		
		attribute vec2 aTextureCoord;

		// TODO: for now, only 3 matrices are used
		// one for camera position, other for model position and one more for camera definition (near/far bounds, viewport width etc)
		// it's enough to do everything i want quite comfortable
		// yet existing working algo is somehow uneffective
		// for example, when we need to move group of models at once, we need to move each one separately
		// this could be re-done with one more matrix, for group offset/rotation
		// but this is only one case; maybe later, when I better realize what I really want, i'll make use of more matrices
		
		uniform mat4 uVMatrix;
		uniform mat4 uMMatrix;
		uniform mat4 uPMatrix;
		
		uniform vec3 uAmbientColor;
		uniform vec3 uHighlightColor;
		
		varying vec2 vTextureCoord;
		varying vec3 vLightWeighting;

		void main() {
			gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
			vTextureCoord = aTextureCoord;
			
			// no ligting
			//vLightWeighting = vec3(1.0, 1.0, 1.0);
			
			vLightWeighting = uAmbientColor + uHighlightColor;
		}
		`,`
		precision mediump float;
		
		varying vec2 vTextureCoord;
		varying vec3 vLightWeighting;
		
		uniform sampler2D uSampler;

		void main() {
			vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
			gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
			
			if(gl_FragColor.a < 0.5)
				discard;
			
			// no lighting
			//gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
		}						
		`, [
		{name: 'textureIndex', innerName: 'aTextureCoord'},
		{name: 'vertexPosition', innerName: 'aVertexPosition', isCounting: true},
		{name: 'projectionMatrix', innerName: 'uPMatrix', isUniform: true, width: 4, isMatrix: true},
		{name: 'viewMatrix', innerName: 'uVMatrix', isUniform: true, width: 4, isMatrix: true},
		{name: 'modelMatrix', innerName: 'uMMatrix', isUniform: true, width: 4, isMatrix: true},
		{name: 'ambientColor', innerName: 'uAmbientColor', isUniform: true, width: 3,},
		{name: 'highlightColor', innerName: 'uHighlightColor', isUniform: true, width: 3},
		
	], clear, draw, 'modelMatrix');
	
});