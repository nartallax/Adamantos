aPackage('nart.adamantos.config', () => {
	
	var heartbeatInterval = 5000;
	
	var config = {
		
		net: {
			frontend: { port: 8080 },
			socket: { port: 8081 },
			
			heartbeat: {
				interval: heartbeatInterval,
				timeout: heartbeatInterval * 6,
				poolSize: 10,
				lowerFilter: 0.5,
				higherFilter: 1.5,
				allowedTimeDerivation: 250
			}
		},
		
		// TODO: rewrite this to something more dynamic when introducing modular system
		paths: {
			shapes: './shapes',
			textures: './textures',
			models: './models',
			
			// right from editor, no other manipulations made
			// used mostly by various tools
			raw: {
				texture: 'texture_sources',
				shape: 'shape_sources'
			},
		}
		
	}
	
	
	return config;
	
});