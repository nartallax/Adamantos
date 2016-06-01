/*
nartallax@gmail.com
*/

require("./libs/meta/addict.js")
	.addRoot('nart', './libs')
	.addRoot('nart.adamantos', './app')
	.addRoot('', '.')
	.main(() => {
		"use strict";
		
		var log = aRequire('nart.util.log'),
			fs = aRequire.node('fs'),
			SocketServer = aRequire('nart.net.socket.server'),
			JsonServer = aRequire('nart.net.http.server.json'),
			HttpServer = aRequire('nart.net.http.server'),
			Client = aRequire('nart.net.socket.client.node'),
			Messenger = aRequire('nart.net.message.messenger'),
			config = aRequire('config'),
			htmlAssembler = aRequire('nart.util.html.client'),
			TexturePacker = aRequire('nart.gl.texture.packer');
	
		log("Server starting.");
		
		var html = (() => {
			var client = new htmlAssembler()
				.setTitle('Adamantos')
				//.setFavicon('./favicon.png')
				//.addFont('../fonts/opensans.woff', 'Open Sans')
				.setMainPackage('nart.adamantos.client.main');
				
			var html = client.getHtml();
			
			log("Assembled client of " + client.includedPackages.length + ' packages.')
			
			return html
		})();
		
		var texturePack = null,
			compressedTexturePack = null;
		var texturePacker = new TexturePacker();
		texturePacker.addDirectories({'./textures': ''}, () => {
			 texturePacker
				.getBuffer(pack => texturePack = pack)
				.getGzippedBuffer(pack => {
					log('Texture pack assembled.');
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
				switch(jServ.functionNameFromRequest(req)){
					// TODO: move to ws-api
					case 'get_texture_pack':
						var acceptedCompressions = (req.headers[Object.keys(req.headers).filter(h => h.toLowerCase() === 'accept-encoding')[0]] || '').split(/[\s,]+/)
						if(acceptedCompressions.filter(c => c.toLowerCase() === 'gzip').length > 0){
							res.writeHead(200, { 
								'Content-Type': 'application/octet-stream', 
								'Content-Length': compressedTexturePack.length,
								'Content-Encoding': 'gzip'
							});
							res.write(compressedTexturePack);
						} else {
							res.writeHead(200, { 
								'Content-Type': 'application/octet-stream', 
								'Content-Length': texturePack.length
							});
							res.write(texturePack);
						}
						break;
					default:
						res.writeHead(200, { 'Content-Type': 'text/html' });
						res.write(html);
						break;
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