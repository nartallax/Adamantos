aPackage('nart.gl.texture.animated', () => {
	
	var proto = aRequire('nart.util.class').proto,
		SimpleTexture = aRequire('nart.gl.texture.simple'),
		Resource = aRequire('nart.gl.resource.resource');

	var AnimatedTexture = function(name, gl, bytesOfFrames, w, h, frameLengthMsec){
		if(!(this instanceof AnimatedTexture)) return new AnimatedTexture(gl, bytesOfFrames, w, h, frameLengthMsec);
		
		this.gl = gl;
		this.frames = bytesOfFrames.map(b => SimpleTexture.createFrame(gl, b, w, h));
		this.frameLengthMsec = frameLengthMsec || (1000 / 10);
		
		Resource.call(this, name);
	}
	
	AnimatedTexture.prototype = proto(SimpleTexture, {
		getFrame: function(time){
			return this.frames[~~((time / this.frameLengthMsec) % this.frames.length)];
		},
		
		free: function(){
			this.frames.foreach(f => this.gl.deleteTexture(f))
		}
	})
	
	return AnimatedTexture;

});