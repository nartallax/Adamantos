// подгрузчик ресурсов, умеющий их запрашивать откуда-нибудь и ждать их появления из какого-либо ивента
aPackage('nart.gl.resource.loader', () => {
	
	var Requester = aRequire('nart.net.http.requester');
	
	var RequestingResourceLoader = function(requestFunction, receiveEvent){
		if(!(this instanceof RequestingResourceLoader)) return new RequestingResourceLoader(requestFunction, receiveEvent);
		
		this.resourceWaiters = {}; // name -> [waiterFunction]
		
		this.requestFunction = requestFunction;
		receiveEvent(e => this.receiveResourceData(e.data.name, e.data.data));
	}
	
	RequestingResourceLoader.prototype = {
		get: function(name, cb){
			if(name in this.resourceWaiters){
				return this.resourceWaiters[name].push(cb);
			}
			
			this.resourceWaiters[name] = [cb];
			this.requestFunction(name);
		},
		
		receiveResourceData: function(name, data){
			var waiters = this.resourceWaiters[name] || [];
			delete this.resourceWaiters[name];
			
			waiters.forEach(w => w(data));
		}
	}
	
	return RequestingResourceLoader;
});