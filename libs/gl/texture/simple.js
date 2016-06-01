aPackage('nart.gl.texture.simple', () => {

	var SimpleTexture = function(gl, bytes, w, h){
		if(!(this instanceof SimpleTexture)) return new SimpleTexture(gl, bytes, w, h);
			
		this.gl = gl;
		this.texture = this.createFrame(bytes, w, h);
	}
	
	SimpleTexture.prototype = {
		getFrame: function(){
			return this.texture;
		},
		
		createFrame: function(bytes, w, h, tex, colorMode){
			var gl = this.gl;
			
			colorMode = gl[colorMode || 'RGBA'];
			tex = tex || gl.createTexture();
			
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			//gl.pixelStorei(gl.UNPACK_ALIGNMENT, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, colorMode, w, h, 0, colorMode, gl.UNSIGNED_BYTE, bytes);
			
			// difference: stretching vs pixelization
			//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			gl.generateMipmap(gl.TEXTURE_2D); // only needed for LINEAR_MIPMAP_NEAREST
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			return tex;
		}
	}
	
	return SimpleTexture;

});