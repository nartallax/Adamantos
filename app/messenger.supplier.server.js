// a part of code that is responsible to handle all incoming connections
// this is also where all the basic channels are defined
aPackage('nart.adamantos.messenger.supplier.server', () => {

	var log = aRequire('nart.util.log'),
	
		SocketServer = aRequire('nart.net.socket.server'),
		SocketClient = aRequire('nart.net.socket.client.node'),
		Messenger = aRequire('nart.net.message.messenger');

	var Supplier = function(paths, heartbeat, cb){
		if(!(this instanceof Supplier)) return new Supplier(paths, heartbeat, cb);
		this.paths = paths;
		this.heartbeat = heartbeat;
		setImmediate(() => cb && cb(this))
	}
	
	Supplier.prototype = {
		supplyWithDefaultModules: function(msgr, cb){
			var ip = msgr.client.getIp();
			
			log("Connected" + (ip? ': ' + ip: ''))
			msgr.onDisconnect(e => log('Disconnected' + (ip? ': ' + ip: '')))
			msgr.onError(e => log('Messenger error: ', e.data))
			
			setImmediate(() => cb && cb(msgr));
		},
		
		webSocket: function(port, cb, onConnection){
			this.socketServer = new SocketServer(port, s => {
				this.supplyWithDefaultModules(new Messenger(new SocketClient(s), true), onConnection);
				/*
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
				
				
				var dataSendInterval = setInterval(() => {
					var str = new Date().getTime() + '';
					testChannel.server.request.writeAndSend(ByteManip.stringSize(str), (writer, cb) => {
						writer.putString(str);
						cb();
					});
				}, 5000);
				*/
			}, () => cb && cb(port));
		}
	}
	
	return Supplier;

});