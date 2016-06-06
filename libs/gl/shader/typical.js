aPackage('nart.gl.shader.typical', () => {
	"use strict";

	var ShaderPack = aRequire('nart.gl.shader.pack'),
		mat4 = aRequire('nart.gl.external.matrix').mat4,
		mat3 = aRequire('nart.gl.external.matrix').mat3;
	
	var clear = function(b){
		
		this.setFramebuffer(null);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		
		mat4.identity(b.modelViewMatrix);
		
		this.projectionMatrix.set(b.projectionMatrix)
		
		b.ambientColorBuffer && this.ambientColor.set(b.ambientColorBuffer);
	}
	
	var drawWithMatrix = (time, t, s, m) => {
		var gl = t.gl;
		
		t.withTranslatedMatrix(t.viewMatrix, m, s, m => {
			t.highlightColor.set(s.highlightColor || [0, 0, 0]);
			
			var prims = s.getPrimitives(time);
			for(var i = 0; i < prims.length; i++){
				var p = prims[i];
				t.vertexPosition.set(p.vertex);
				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, p.texture.getFrame(time));
			
				t.textureIndex.set(p.textureIndex);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.vertexIndex);
				
				gl.drawElements(gl.TRIANGLES, p.vertex.numItems, gl.UNSIGNED_SHORT, 0);
			}
			/*
			if(s.childShapes){
				var c = s.childShapes;
				for(var i in c) drawWithMatrix(t, c[i], m);
			} else {
				t.vertexPosition.set(s.vertex);
				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, s.texture.getFrame());
				
				t.highlightColor.set(s.highlightColor || [0, 0, 0]);
			
				t.textureIndex.set(s.textureIndex);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, s.vertexIndex);
				
				gl.drawElements(gl.TRIANGLES, s.vertexIndex.numItems, gl.UNSIGNED_SHORT, 0);
			}
			*/
		})
	}
	
	var draw = function(time, s, b){ 
		drawWithMatrix(time, this, s, b.modelViewMatrix) 
	}
	
	return (gl, params) => new ShaderPack(gl, `
		attribute vec3 aVertexPosition;
		
		attribute vec2 aTextureCoord;

		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;
		
		uniform vec3 uAmbientColor;
		uniform vec3 uHighlightColor;
		
		varying vec2 vTextureCoord;
		varying vec3 vLightWeighting;

		void main() {
			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
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
		{name: 'viewMatrix', innerName: 'uMVMatrix', isUniform: true, width: 4, isMatrix: true},
		{name: 'ambientColor', innerName: 'uAmbientColor', isUniform: true, width: 3,},
		{name: 'highlightColor', innerName: 'uHighlightColor', isUniform: true, width: 3},
		
		// TODO: make many directional lights possible
		//{name: 'lightingDirection', innerName: 'uLightingDirection', isUniform: true, width: 3},
		//{name: 'lightingColor', innerName: 'uDirectionalColor', isUniform: true, width: 3}
	], clear, draw);
	
});