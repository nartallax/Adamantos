// some boilerplate code of client assembling and http server setup
aPackage('nart.adamantos.client.seeder', () => {
	
	var HttpServer = aRequire('nart.net.http.server'),
		htmlAssembler = aRequire('nart.util.html.client'),
		
		zlib = aRequire.node('zlib'),
		err = aRequire('nart.util.err');
	
	var gzip = function(input, cb){
		zlib.gzip(input instanceof Buffer? input: Buffer.from(input, 'utf8'), {
			chunkSize: 16 * 1024,
			memLevel: 9,
			level: zlib.Z_BEST_COMPRESSION,
			strategy: zlib.Z_FIXED
		}, err(cb));
	};
	
	var Seeder = function(rootPackage, title, cb){
		if(!(this instanceof Seeder)) return new Seeder(rootPackage, title, cb);
		
		this.html = null;
		var client = new htmlAssembler()
			.setTitle(title)
			.setFavicon(__dirname + '/../violet_gem.png')
			.setMainPackage(rootPackage);
			
		var text = client.getHtml();
			
		gzip(text, res => {
			this.html = res;
			cb(this, client.includedPackages.length);
		});
	}
	
	Seeder.prototype = {
		http: function(port, cb){
			var httpServer = this.httpServer = new HttpServer(port);
			httpServer.start(() => {
				
				httpServer.onRequest(e => {
					var req = e.data.request,
						res = e.data.response;
					var acceptedCompressions = (req.headers[Object.keys(req.headers).filter(h => h.toLowerCase() === 'accept-encoding')[0]] || '').split(/[\s,]+/);
					var canGzip = acceptedCompressions.filter(c => c.toLowerCase() === 'gzip').length > 0;
					
					if(!canGzip){
						res.writeHead(400, { 'Content-Type': 'text/plain' });
						res.write("Your browser do not support gzip compression.");
					} else {
						res.writeHead(200, { 
							'Content-Type': 'text/html',
							'Content-Length': this.html.length,
							'Content-Encoding': 'gzip'
						});
						res.write(html);
					}
					res.end();
				});
				
				cb && cb(port);
				
			});
		}
	}
	
	return Seeder;
	
});