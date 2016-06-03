/*
nartallax@gmail.com
*/

require("./libs/meta/addict.js")
	.addRoot('nart', './libs')
	.addRoot('nart.adamantos', './app')
	.addRoot('', '.')
	.main(() => {
		"use strict";
		
		var fs = aRequire.node('fs'),
			zlib = aRequire.node('zlib'),
			
			log = aRequire('nart.util.log'),
			err = aRequire('nart.util.err'),
			
			SocketServer = aRequire('nart.net.socket.server'),
			JsonServer = aRequire('nart.net.http.server.json'),
			HttpServer = aRequire('nart.net.http.server'),
			
			Client = aRequire('nart.net.socket.client.node'),
			Messenger = aRequire('nart.net.message.messenger'),
			config = aRequire('config'),
			htmlAssembler = aRequire('nart.util.html.client'),
			TexturePacker = aRequire('nart.gl.texture.packer');
			
		var gzip = function(input, cb){
			zlib.gzip(input instanceof Buffer? input: Buffer.from(input, 'utf8'), {
				chunkSize: 16 * 1024,
				memLevel: 9,
				level: zlib.Z_BEST_COMPRESSION,
				strategy: zlib.Z_FIXED
			}, err(cb));
		};
	
		log("Server starting.");
		
		var html = null;
		(() => {
			var client = new htmlAssembler()
				.setTitle('Adamantos')
				.setFavicon('./textures/violet_gem.png')
				.setMainPackage('nart.adamantos.client.main');
				
			var text = client.getHtml();
			console.log('BLEN = ' + Buffer.from(text, 'utf8').length);
				
			gzip(text, res => {
				html = res;
				log("Assembled and compressed client of " + client.includedPackages.length + ' packages.')
			});
		})();
		
		var compressedTexturePack = null;
		var texturePacker = new TexturePacker();
		texturePacker.addDirectories({'./textures': ''}, () => {
			 gzip(texturePacker.getPack(), pack => {
				 log('Built up and compressed texture pack.');
				 compressedTexturePack = pack;
			 });
		})
		
		new SocketServer(config.server.socket.port, s => {

			var c = ClientWrapper(RawClient(s)), ip = c.getIp()
			
			c.unhandledMessageReceived.listen(e => log("Failed to handle message:", e.data.processingError))
			c.disconnected.listen(() => log("Disconnected:", ip))
			c.initializeHeartbeat(config.heartbeatRate);
			
			log("Connected:", ip)
			
			return c
		});
		log("Socket server listening on port " + config.server.socket.port);
		
		var httpServer = new HttpServer(config.server.http.port, config.server.http.host, config.server.http.maxConnections);
		httpServer.start(() => {
			
			log("HTTP server listening on port " + config.server.http.port);
		
			var jServ = new JsonServer(httpServer, {
				// JSON api description here
			});
			
			jServ.orElse((req, res) => {
				var acceptedCompressions = (req.headers[Object.keys(req.headers).filter(h => h.toLowerCase() === 'accept-encoding')[0]] || '').split(/[\s,]+/);
				var canGzip = acceptedCompressions.filter(c => c.toLowerCase() === 'gzip').length > 0;
				
				if(!canGzip){
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.write("Your browser do not support gzip compression.");
				} else {
					switch(jServ.functionNameFromRequest(req)){
						// TODO: move to ws-api
						case 'get_texture_pack':						
							res.writeHead(200, { 
								'Content-Type': 'application/octet-stream', 
								'Content-Length': compressedTexturePack.length,
								'Content-Encoding': 'gzip'
							});
							res.write(compressedTexturePack);
							break;
						case 'get_model_pack':
							
						default:
							res.writeHead(200, { 
								'Content-Type': 'text/html',
								'Content-Length': html.length,
								'Content-Encoding': 'gzip'
							});
							res.write(html);
							break;
					}
				}
				res.end();
			}).onError(ev => {
				log(ev.data.error)
				ev.data.response.writeHead(500, { 'Content-Type': 'text/plain' });
				ev.data.response.write("Internal server error happened.");
				ev.data.response.end();
			});
			
			log("JSON api initialized and ready to serve.");
			
		});
	});