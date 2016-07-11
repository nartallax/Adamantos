/*
nartallax@gmail.com
*/

require(__dirname + "/../libs/meta/addict.js")
	.registerOmnipresentPrefix('nart.omnipresent')
	.addRoot('nart', __dirname + '/../libs')
	.addRoot('nart.adamantos.tools', __dirname)
	.main(() => {
		"use strict";
		
		var fs = aRequire.node('fs'),
			zlib = aRequire.node('zlib'),
			
			log = aRequire('nart.util.log'),
			err = aRequire('nart.util.err'),
			
			HttpServer = aRequire('nart.net.http.server'),
			SocketServer = aRequire('nart.net.socket.server'),
			SocketClient = aRequire('nart.net.socket.client.node'),
			Messenger = aRequire('nart.net.message.messenger'),
			ByteManip = aRequire('nart.util.byte.manipulator'),
			
			config = aRequire('nart.adamantos.tools.config'),
			//config = eval('(' + fs.readFileSync(__dirname + '/toolConfig.json', 'utf8') + ')'),
			toolName = ((__filename.match(/[^\\\/]+$/) || [])[0] || '').replace(/\.[^\.]+$/, ''),
			toolConfig = config[toolName],
			
			htmlAssembler = aRequire('nart.util.html.client'),
			TexturePacker = aRequire('nart.gl.texture.packer'),
			ShapePacker = aRequire('nart.gl.shape.packer');
			
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
				.setTitle('Animation tool')
				.setFavicon(__dirname + '/../violet_gem.png')
				.setMainPackage('nart.adamantos.tools.animating.frontpage');
				
			var text = client.getHtml();
				
			gzip(text, res => {
				html = res;
				log("Assembled and compressed client of " + client.includedPackages.length + ' packages.')
			});
		})();
		
		var getCompressedPackOf = (packerClass, dirPrefixMap, cb) => {
			var packer = new packerClass();
			packer.addSourceDirectories(dirPrefixMap, () => {
				packer.getPack(uncompressed => {
					gzip(uncompressed, cb);
				});
			});
		};
		
		var compressedTexturePack, compressedShapePack,
			texturesDirPath = __dirname + '/../' + config.directories.source.texture,
			shapesDirPath = __dirname + '/../' + config.directories.source.shape,
			modelsDirPath = __dirname + '/../' + config.directories.source.model,
			
			texPrefixMap = {}, shapePrefixMap = {};
			
		texPrefixMap[texturesDirPath] = '';
		getCompressedPackOf(TexturePacker, texPrefixMap, pack => {
			log('Built up and compressed texture pack.');
			compressedTexturePack = pack;
		})
		
		shapePrefixMap[shapesDirPath] = '';
		getCompressedPackOf(ShapePacker, shapePrefixMap, pack => {
			log('Built up and compressed shape pack.');
			compressedShapePack = pack;
		})

		new SocketServer(toolConfig.socketPort, s => {
			var c = SocketClient(s), ip = c.getIp();
			
			//c.disconnected.listen(() => log("Disconnected:", ip));
			/*
			c.messageReceived(e => {
				var data = e.data;
				console.log(data)
				for(var i = 0; i < data.length; i++){
					data[i] = data[i] ^ 0xff;
				}
				c.send(data);
			});
			*/
			var msgr = new Messenger(c, true);
			
			var testChannel = msgr.createChannel({
				name: 'test.channel',
				server: {
					request: bytes => {
						var str = bytes.getString();
						str = str + '|' + str;
						testChannel.client.response.writeAndSend(ByteManip.stringSize(str), (writer, cb) => {
							writer.putString(str);
							cb();
						});
					}
				},
				client: {
					response: bytes => {}//console.log(bytes.getString())
				}
			});
			
			//msgr.onStatsUpdate(e => console.log(e.data))
			msgr.onDisconnect(e => {
				console.log('Disconnected.')
				clearInterval(dataSendInterval);
			})
			msgr.onError(e => (console.log('Messenger error: '), console.log(e.data)))
			
			var dataSendInterval = setInterval(() => {
				var str = new Date().getTime() + '';
				testChannel.server.request.writeAndSend(ByteManip.stringSize(str), (writer, cb) => {
					writer.putString(str);
					cb();
				});
			}, 5000);
			
			log("Connected:", ip)
			
			return msgr;
		});
		
		log("Socket server listening on port " + toolConfig.socketPort);
		
		
		var httpServer = new HttpServer(toolConfig.port);
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
					switch((req.url.match(/[^\\\/]+/) || [])[0]){
						case 'get_texture_pack':		
							res.writeHead(200, { 
								'Content-Type': 'application/octet-stream', 
								'Content-Length': compressedTexturePack.length,
								'Content-Encoding': 'gzip'
							});
							res.write(compressedTexturePack);
							break;
						case 'get_shape_pack':
							res.writeHead(200, { 
								'Content-Type': 'application/octet-stream', 
								'Content-Length': compressedShapePack.length,
								'Content-Encoding': 'gzip'
							});
							res.write(compressedShapePack);
							break;
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
			});
			
			log("Animation tool listening on port " + toolConfig.port);
			
		});
	});