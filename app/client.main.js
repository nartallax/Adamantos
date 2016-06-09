aPackage('nart.adamantos.client.main', () => {

	var log = aRequire('nart.util.log'),
		Shape = aRequire('nart.gl.shape'),
		SimpleShape = aRequire('nart.gl.shape.simple'),
		TextureLoader = aRequire('nart.gl.texture.loader'),
		ShapeLoader = aRequire('nart.gl.shape.loader'),
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
		
		var afterResourcesLoaded = () => {
		
			log('Preloaded');
			var clones = [];
				
			var clz = shapeLoader.get('robot.humanoid.basic.torso.lower').clone();
			clz.z = -1.0;
			clz.x = 0;
			clz.rotX = 0.5;
			clz.highlightColor = [0.15, 0.15, 0.15];			
			board.addChild(clz);
			clones.push(clz);
			
			/*
			var flamebox = shapeLoader.get('boxxy.box').clone();
			flamebox.z = -10.0;
			flamebox.rotX = 0.5;
			board.addChild(flamebox);
			clones.push(flamebox);
			*/
			
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
			//setInterval(() => { console.log('FPS = ' + fps + ', ticks = ' + ticks), (fps = ticks = 0) }, 1000)
			
			setInterval(() => {
				ticks++;
				clones.forEach(c => c.rotY += 0.025)
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
			}, 5000);
			
			board
				.setAmbientColor([0.7, 0.7, 0.7])
				.start();
		
		}
		
		var texLoader = new TextureLoader(gl),
			shapeLoader = new ShapeLoader(gl, texLoader);
		
		texLoader.downloadAndAddPack('/get_texture_pack', () => {
			log("Received the texture pack.");
			
			shapeLoader.downloadAndAddPack('/get_shape_pack', () => {
				log("Received the shape pack.");
				
				afterResourcesLoaded();
			});
			
		});
	}

});