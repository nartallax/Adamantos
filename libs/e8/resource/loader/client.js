// client-side resource loader
// composition of smaller loaders
aPackage('nart.e8.resource.loader.client', () => {

	var FsLoader = aRequire('nart.e8.resource.loader.fs');

	var ClientLoader = function(messenger, channelName){
		// TODO: caches required!
		this.actualLoader = new MessengerLoader(messenger, channelName);
	}
	
	ClientLoader.prototype = {
		get: function(name, cb){ this.actualLoader.get(name, cb) }
	}
	
	return ClientLoader;

});