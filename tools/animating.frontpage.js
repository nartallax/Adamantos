aPackage('nart.adamantos.tools.animating.frontpage', () => {

	var log = aRequire('nart.util.log'),
		Shape = aRequire('nart.gl.shape'),
		SimpleShape = aRequire('nart.gl.shape.simple'),
		TextureLoader = aRequire('nart.gl.texture.loader'),
		ShapeLoader = aRequire('nart.gl.shape.loader'),
		Board = aRequire('nart.gl.board');
		
	var tag = (name, attrs) => {
		attrs = attrs || {};
		var result = document.createElement(name);
		
		if('class' in attrs) {
			result.className = attrs['class'];
			delete attrs['class'];
		}
		
		if('style' in attrs) {
			result.style.cssText = attrs['style'];
			delete attrs['style'];
		}
		
		if('text' in attrs){
			result.textContent = attrs.text;
			delete attrs.text;
		}
		
		if('children' in attrs){
			attrs.children.forEach(ch => result.appendChild(typeof(ch) === 'string'? tag('span', {text: ch}): ch))
			delete attrs.children;
		}
		
		for(var i in attrs) {
			if(i.startsWith('on')){
				result[i] = attrs[i] // directly assigned event listeners
			} else {
				result.setAttribute(i, attrs[i]);
			}
		}
		return result;
	}
		
	var commonStyle = 'border: 0px; margin: 0px; padding: 0px; width: 100%; height: 100%; position: absolute; background: #ccc; overflow: hidden';
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
		display = tag("canvas", {style:'position: absolute; right: 0px; left: 30%; top: 0px; bottom: 0px; height: 100%; width: 70%'});
		
		display.setAttribute('width', display.width = document.body.scrollWidth);
		display.setAttribute('height', display.height = document.body.scrollHeight);
		
		document.body.appendChild(display);
		
		return display;
	}
		
	var shapeContainer, display;
		
	var addShape, changeShapeType, removeShape;
		
	var createInitialContainers = () => {
		shapeContainer = tag('div', {
			style: 'position: absolute; left: 0px; bottom: 0px; right: 0px; top: 0px',
			children: [
				tag('input', {type: 'button', value: 'add shape', onclick: () => addShape()})
			]
		});
		
		var wrap = tag('div', {
			style: 'position: absolute; left: 0px; bottom: 0px; top: 0px; width: 30%;',
			children: [shapeContainer]
		});
		
		document.body.appendChild(wrap);
	}
		
	return () => {
		log('Started.');
		
		resetCss();
		createInitialContainers();
		var board = Board(createDisplay());
		
		
		
		var gl = board.gl;
		
		var texLoader = new TextureLoader(gl),
			shapeLoader = new ShapeLoader(gl, texLoader);
		
		texLoader.downloadAndAddPack('/get_texture_pack', () => {
			log("Received the texture pack.");
			
			shapeLoader.downloadAndAddPack('/get_shape_pack', () => {
				log("Received the shape pack.");
				
				afterResourcesLoaded();
			});
			
		});
		
		var afterResourcesLoaded = () => {
		
			log('Preloaded');

			var clones = [];
				
			var clz = shapeLoader.get('robot.humanoid.basic.torso.lower');
			clz.z = -1.0;
			clz.x = 0;
			clz.rotX = 0.5;
			board.addChild(clz);
			clones.push(clz);
			setInterval(() => { clz.rotY += 0.025 }, 1000 / 60);
			
			var mouseX = 0, mouseY = 0;
			
			var highlighted = undefined;
			var highlightColor = [0.3, 0.3, 0.3], defaultHighlight = [0, 0, 0];
			
			var lighten = id => board.children[id].setHighlightColor(highlightColor);
			var darken = id => board.children[id].setHighlightColor(defaultHighlight);
			
			board.afterTick.listen(d => {
				var id;
				
				id = board.childAt(mouseX, mouseY);
				
				if(id === highlighted) return;
				
				highlighted === undefined || darken(highlighted)
				id === undefined || lighten(id)
				
				highlighted = id;
				
			});
			
			display.onmousemove = e => {
				//console.log(e);
				mouseX = e.offsetX;
				mouseY = e.offsetY;
			}
			
			board.setAmbientColor([0.7, 0.7, 0.7]).start();
			
			addShape = (id, name) => {
				var s;
				try {
					s = shapeLoader.get(id);
				} catch(e){
					console.log(e);
					alert(e);
				}
				
				board.addChild(s);
			}
		
		}
	}

});