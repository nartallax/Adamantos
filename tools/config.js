aPackage('nart.adamantos.tools.config', () => ({
	directories: {
		raw: { // right from editor, no other manipulations made
			texture: 'texture_sources',
			shape: 'shape_sources'
		},
		source: { // as game engine could consume
			texture: 'textures',
			shape: 'shapes',
			model: 'models'
		}
	},
	
	shapeMovingTool: {
		operations: [
			{ /* single operation with default paths */ }
			// ,{ raw: { texture: '...', shape: '...' }, source: { ... } }
		]
	},
	
	animatingTool: {
		port: 8082,
		socketPort: 8083
	}
}))