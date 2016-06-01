/*
	http-сервер, позволяющий организовать взаимодействие через POST-запросы, в теле которых - JSON
	оборачивает http-сервер: любая сущность с ивентом onRequest
	
	api: мапа вида имя_ручки -> (коллбек, данные) => { ... }
	коллбек - данные, которые будут конвертированы в JSON и отправлены, одним куском
	данные - распаршенный JSON из тела запроса
	
	при несовпадении типа запроса, или при отсутствии ручки дергается orElse
*/
aPackage('nart.net.http.server.json', () => {
	"use strict";
	
	var url = aRequire.node('url'),
		Event = aRequire('nart.util.event');
	
	var JsonWrap = function(server, api){
		if(!(this instanceof JsonWrap)) return new JsonWrap(server, api)
			
		this.api = api;
		
		this.server = server;
		
		this.orElse();
		
		this.onError = new Event();
		
		return this.server.onRequest.listen((req, res) => this.processRequest(req, res)), this
	}
	
	JsonWrap.prototype = {
		functionNameFromRequest: req => ((url.parse(req.url, true).pathname.match(/\/[^\/]+\/?$/) || [])[0] || '').replace(/(^\/|\/$)/g, ""),
		functionByName: function(name){ return this.api[(name || '').trim()] },
		orElse: function(orElse){ return (this.defaultRequestHandler = (orElse || ((req, res) => {}))), this },
		processRequest: function(e){
			var req = e.data.request, res = e.data.response;
			
			var func = this.functionByName(this.functionNameFromRequest(req));
			
			if((req.method || '').trim().toLowerCase() !== 'post' || !func) {
				try {
					return this.defaultRequestHandler(req, res);
				} catch(e){
					return this.onError.fire({error: e, request: req, responce: res});
				}
			}
			
			this.server.withRequestBody(req, data => {
				try {
					data = JSON.parse(data);
				} catch(e) {
					return this.onError.fire({error: e, request: req, responce: res});
				}
				
				func(data, result => {
					res.writeHead(200, { 'Content-Type': 'text/json' });
					try {
						result = JSON.stringify(result);
					} catch (e){
						return this.onError.fire({error: e, request: req, responce: res});
					}
					res.write(result);
					res.end();
				})
			});
		}
	}
	
	return JsonWrap;
	
});