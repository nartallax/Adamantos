// подгрузчик ресурсов
// умеет загружать и интерпретировать ресурс-паки
// создает из одиночных ресурсов объекты, которые могут быть использованы движком
aPackage('nart.gl.resource.loader', () => {
	
	var Requester = aRequire('nart.net.http.requester');
	
	var ResourceLoader = function(createPacker){
		if(!(this instanceof ResourceLoader)) return new ResourceLoader();
		
		this.resources = {};
		this.createPacker = createPacker;
	}
	
	ResourceLoader.prototype = {
		get: function(name){ 
			if(!(name in this.resources)){
				throw new Error('No resource defined: "' + name + '"');
			}
			return this.resources[name];
		},
		
		addPack: function(packBytes, cb){
			var packer = this.createPacker();
			packer.addPack(packBytes);
			var result = packer.getUsables(result => {
				Object.keys(result).forEach(name => this.resources[name] = this.usableToEngineObject(result[name]));
				
				cb();
			});
		},
		
		downloadAndAddPack: function(url, cb){
			Requester.get(url, {}, res => this.addPack(res.body, cb), { resultInBuffer: true });
		},
		
		usableToEngineObject: function(usable){
			throw new Error('Not implemented: usableToEngineObject');
		}
		
	}
	
	return ResourceLoader;
});