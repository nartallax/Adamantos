aPackage('nart.gl.texture.animated', () => {
	
	var proto = aRequire('nart.util.class').proto,
		SimpleTexture = aRequire('nart.gl.texture.simple');

	var AnimatedTexture = function(gl, bytesOfFrames, w, h, frameLengthMsec){
		if(!(this instanceof AnimatedTexture)) return new AnimatedTexture(gl, bytesOfFrames, w, h);
		
		this.gl = gl;
		this.frames = bytesOfFrames.map(b => this.createFrame(b, w, h));
		this.frameLengthMsec = frameLengthMsec || (1000 / 10);
	}
	
	AnimatedTexture.prototype = proto(SimpleTexture, {
		getFrame: function(time){
			return this.frames[~~((time / this.frameLengthMsec) % this.frames.length)];
		}
	})
	
	return AnimatedTexture;

});