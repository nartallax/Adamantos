aPackage('nart.gl.texture.provider', () => {
	
	var TextureProvider = aRequire('nart.gl.resource.provider.client')
		.inheritWithChannelAndFabric('core.resource.texture');
	
	return TextureProvider;
	
})