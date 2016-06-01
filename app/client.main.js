aPackage('nart.adamantos.client.main', () => {

	var log = aRequire('nart.util.log'),
		Shape = aRequire('nart.gl.shape'),
		SimpleShape = aRequire('nart.gl.shape.simple'),
		//TextureLoader = aRequire('nart.gl.texture.loader'),
		PackedTextureLoader = aRequire('nart.gl.texture.loader.packed'),
		Board = aRequire('nart.gl.board');

	var commonStyle = 'border: 0px; margin: 0px; padding: 0px; width: 100%; height: 100%; position: fixed; background: #ccc; overflow: hidden';
	var resetCss = () => {
		var everything = document.querySelectorAll('*')
		for(var i = 0; i < everything.length; i++){
			var node = everything[i],
				name = node.tagName.toLowerCase();
			if(name === 'script' || name === 'style' || name === 'meta' || name === 'title') continue;
			node.style.cssText = commonStyle;
		}
	}
		
	var createDisplay = () => {
		var d = document.createElement("canvas");
		
		var w = document.body.scrollWidth;
		var h = document.body.scrollHeight;
		
		d.width = w;
		d.height = h;
		
		d.setAttribute('width', w);
		d.setAttribute('height', h);
		
		document.body.appendChild(d);
		
		resetCss();
		return d;
	}
		
	return () => {
		log('Started.');
		
		// TODO: handle insufficient caps
		var board = Board(createDisplay());
		var gl = board.gl;
		
		Shape.defaultGl = gl;
		
		
		var afterTexturesLoaded = () => {
		
			log('Preloaded');
		
			var cube = (() => SimpleShape({
					vertex: (() => { return [
						-1,	-1,	-1,
						-1,	-1,	1,
						-1,	1, -1,
						-1,	1, 1,
						1, -1, -1,
						1, -1, 1,
						1, 1, -1,
						1, 1, 1
					]})(), 
					textureIndex: (() => { return [
						  // Front face
						  0.0, 0.0,
						  1.0, 0.0,
						  0.0, 1.0,
						  1.0, 1.0,

						  // Back face
						  1.0, 0.0,
						  0.0, 0.0,
						  1.0, 1.0,
						  0.0, 1.0,

						  // Top face
						  0.0, 1.0,
						  0.0, 0.0,
						  1.0, 0.0,
						  1.0, 1.0,

						  // Bottom face
						  1.0, 1.0,
						  0.0, 1.0,
						  0.0, 0.0,
						  1.0, 0.0,

						  // Right face
						  1.0, 0.0,
						  1.0, 1.0,
						  0.0, 1.0,
						  0.0, 0.0,

						  // Left face
						  0.0, 0.0,
						  1.0, 0.0,
						  1.0, 1.0,
						  0.0, 1.0,
						]})(),
					vertexIndex: (() => { return [
						2, 1, 0, 
						2, 3, 1,
						2, 0, 4,
						2, 6, 4,
						//6, 4, 5,
						//6, 7, 5,
						//7, 5, 1,
						//7, 3, 1,
						5, 0, 4,
						0, 1, 5
					]})(), 
					highlightColor: [0.15, 0.15, 0.15],
					z: -10.0, rotX: 0.5, textureName: "crate"}))();
			/*
			(() => SimpleShape({
					vertex: (() => { return[
						// Front face
						  -1.0, -1.0,  1.0,
						   1.0, -1.0,  1.0,
						   1.0,  1.0,  1.0,
						  -1.0,  1.0,  1.0,

						  // Back face
						  -1.0, -1.0, -1.0,
						  -1.0,  1.0, -1.0,
						   1.0,  1.0, -1.0,
						   1.0, -1.0, -1.0,

						  // Top face
						  -1.0,  1.0, -1.0,
						  -1.0,  1.0,  1.0,
						   1.0,  1.0,  1.0,
						   1.0,  1.0, -1.0,

						  // Bottom face
						  -1.0, -1.0, -1.0,
						   1.0, -1.0, -1.0,
						   1.0, -1.0,  1.0,
						  -1.0, -1.0,  1.0,

						  // Right face
						   1.0, -1.0, -1.0,
						   1.0,  1.0, -1.0,
						   1.0,  1.0,  1.0,
						   1.0, -1.0,  1.0,

						  // Left face
						  -1.0, -1.0, -1.0,
						  -1.0, -1.0,  1.0,
						  -1.0,  1.0,  1.0,
						  -1.0,  1.0, -1.0,
					]})(), 
					textureIndex: (() => { return [
						  // Front face
						  0.0, 0.0,
						  1.0, 0.0,
						  1.0, 1.0,
						  0.0, 1.0,

						  // Back face
						  1.0, 0.0,
						  1.0, 1.0,
						  0.0, 1.0,
						  0.0, 0.0,

						  // Top face
						  0.0, 1.0,
						  0.0, 0.0,
						  1.0, 0.0,
						  1.0, 1.0,

						  // Bottom face
						  1.0, 1.0,
						  0.0, 1.0,
						  0.0, 0.0,
						  1.0, 0.0,

						  // Right face
						  1.0, 0.0,
						  1.0, 1.0,
						  0.0, 1.0,
						  0.0, 0.0,

						  // Left face
						  0.0, 0.0,
						  1.0, 0.0,
						  1.0, 1.0,
						  0.0, 1.0,
						]})(),
					vertexIndex: (() => { return [
						0, 1, 2,      0, 2, 3,    // Front face
						4, 5, 6,      4, 6, 7,    // Back face
						8, 9, 10,     8, 10, 11,  // Top face
						12, 13, 14,   12, 14, 15, // Bottom face
						16, 17, 18,   16, 18, 19, // Right face
						20, 21, 22,   20, 22, 23  // Left face
					]})(), 
					//highlightColor: [0.15, 0.15, 0.15],
					z: -15.0, rotX: 0.5, textureName: "crate"}))();
					*/
					
					
			var clones = [cube];
			board.addChild(cube);
			/*
			var clones = [];
			for(var i = 0; i < 11; i++){
				for(var j = 0; j < 11; j++){
					for(var k = 0; k < 5; k++){
						var c = cube.clone(); 
						c.z = (-4 - j) * 6;
						c.x = (i - 5) * 4;
						c.y = (j + k - 3) * 3;
						c.rotY = i * 0.05;
						board.addChild(c);
						clones.push(c)
					}
				}
			}
			*/
			
			var fps = 0, ticks = 0;
			setInterval(() => { console.log('FPS = ' + fps + ', ticks = ' + ticks), (fps = ticks = 0) }, 1000)
			
			setInterval(() => {
				ticks++;
				clones.forEach(c => c.rotY += 0.025)
				//cube.rotY += 0.025;
				//c2.rotY -= 0.025;
				//c2.z -= 0.01;
			}, 1000 / 60);
			
			var mouseX = 0, mouseY = 0;
			
			var highlighted = undefined;
			var highlightColor = [0.3, 0.3, 0.3], defaultHighlight = [0, 0, 0];
			
			var lighten = id => board.children[id].setHighlightColor(highlightColor);
			var darken = id => board.children[id].setHighlightColor(defaultHighlight);
			
			board.afterTick.listen(d => {
				fps++;
				
				var id;
				
				//id = board.childAt(mouseX, mouseY);
				
				if(id === highlighted) return;
				
				highlighted === undefined || darken(highlighted)
				id === undefined || lighten(id)
				
				highlighted = id
				
			});
			
			document.body.onmousemove = e => {
				mouseX = e.clientX;
				mouseY = e.clientY;
			}
			
			if(true) setTimeout(() => {
				console.log('stopping');
				board.stop();
			}, 90000);
			
			board
				//.addChild(cube)
				//.addChild(c2)
				//.addChild(c1)
				.setAmbientColor([0.7, 0.7, 0.7])
				//.setLightDirection([1, 1.0, 1])
				//.setLightColor([0.8, 0.8, 0.8])
				.start();
		
		}
		
		var texLoader = new PackedTextureLoader(gl);
		
		SimpleShape.defaultTextureLoader = texLoader;
		
		//texLoader.preloadTexturePack('/get_texture_pack', afterTexturesLoaded);
		texLoader.downloadPack('/get_texture_pack', () => {
			log("Downloaded texture pack, unpacking...")
			texLoader.extractPacks(() => {
				log("Unpacked the texture pack.");
				afterTexturesLoaded();
			});
		});
		
		//SimpleShape.defaultTextureLoader = new TextureLoader(gl).preloadAll(["get_single_texture?crate.gif"], afterTexturesLoaded);
	}

});