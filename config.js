aPackage('config', () => { return {
	server: {
		socket: {
			port: 8080
		},
		http: {
			port: 8081,
			maxConnections: 0x1ff,
			host: 'localhost'
		}
	},
	
	paths: {
		frontendPage: "./index.html",
		userDir: "./users/"
	},
	
	heartbeatRate: 5000
	
}})