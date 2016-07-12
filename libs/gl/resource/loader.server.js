// server-side resource loader
// composition of smaller loaders
aPackage('nart.gl.resource.loader.server', () => {

	var FsLoader = aRequire('nart.gl.resource.loader.fs'),
		MessengerLoader = aRequire('nart.gl.resource.loader.messenger');

	// TODO: learn to find out resource grouping
	// i.e. if client requested for a model, send him model and also related shapes and textures
	var ServerLoader = function(messenger, channelName, directories, filenameFilterRegexp){
		if(!(this instanceof ServerLoader)) return new ServerLoader(messenger, channelName, directories, filenameFilterRegexp);
		// TODO: add cache
		// TODO: use some compression
		var fsLoader = new FsLoader(directories, filenameFilterRegexp);
		this.actualLoader = new MessengerLoader(messenger, channelName, (name, cb) => fsLoader.get(name, cb));
	}
	
	ServerLoader.prototype = {
		// this function is not really meant to be called
		// its expected that MessengerLoader will respond with resources requested by client
		// this method is here just to support the common resource loader interface
		get: function(name, cb){ this.actualLoader.get(name, cb) }
	}
	
	return ServerLoader;

});