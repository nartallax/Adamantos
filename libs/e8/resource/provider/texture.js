aPackage('nart.e8.resource.provider.texture', () => {
	
	var readGif = aRequire('nart.gl.format.gif.reader'),
		SimpleTexture = aRequire('nart.gl.texture.simple'),
		AnimatedTexture = aRequire('nart.gl.texture.animated');
	
	var TextureProvider = aRequire('nart.e8.resource.provider.client')
		.inheritWithChannelAndFabric('core.resource.texture', (textureData, textureName, cb) => {
			var tex = readGif(textureData.getBuffer(), textureData.getPosition());
			
			return tex.frames.length === 1?
				SimpleTexture(this.gl, tex.frames[0], tex.width, tex.height): 
				AnimatedTexture(this.gl, tex.frames, tex.width, tex.height);
		}, function(cacheTimeout, messenger, gl){
			this.gl = gl;
		});
	
	return TextureProvider;
	
})