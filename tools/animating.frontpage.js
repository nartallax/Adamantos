aPackage('nart.adamantos.tools.animating.frontpage', () => {
	'use strict';

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
	
	var shapeContainer, display, board, shapeIndex = 0, texLoader, shapeLoader;
		
	// действия с шейпами
	// id шейпа = его порядковый номер в списке
	var removeShape = num => {
		var sh = getShape(num);
		shapeContainer.removeChild(sh);
	}
	var actualizeShape = num => {
		var sh = getShape(num), data = sh.getData(), bId = sh.boardId;
		
		bId && (board.removeChild(bId));
		
		var bShape;
		try {
			bShape = shapeLoader.get(data.shapeName);
		} catch(e){
			console.log(e);
			return;
		}
		
		board.addChild(bShape);
		bShape.x = data.x;
		bShape.y = data.y;
		bShape.z = data.z;
		
		sh.boardId = bShape.id;
	}
	var addShape = () => {
		var shapeTag = tag('div', { style: 'position: relative; border: 1px solid #999; margin: 3px 0px' }), 
			shapeNum = shapeIndex++,
			update = () => setTimeout(() => actualizeShape(shapeNum), 1);
		
		var input = (style, placeholder, type, onclick) => tag('input', {
			type: type || 'text', style: style, placeholder: placeholder, onchange: update, onkeypress: update, onclick: onclick || (() => {})
		});
		
		shapeTag.appendChild(shapeTag.partNameInput = input('display: block; width: 100%', 'part_name_goes_here'));
		shapeTag.appendChild(shapeTag.shapeNameInput = input('display: block; width: 100%', 'shape.name.goes.here'));
		shapeTag.appendChild(shapeTag.animationTypeInput = tag('select', { value: 'absolute', onchange: update, children: [
				tag('option', {value: 'absolute', text: 'absolute'}),
				tag('option', {value: 'bone', text: 'bone'}),
		]}));
		shapeTag.appendChild(shapeTag.xInput = input('width: 50px', 'x', 'number'));
		shapeTag.appendChild(shapeTag.yInput = input('width: 50px', 'y', 'number'));
		shapeTag.appendChild(shapeTag.zInput = input('width: 50px', 'z', 'number'));
		shapeTag.appendChild(shapeTag.deleteButton = tag('input', {
			type:'button', value: 'delete', style:'position: absolute; right: 0px; bottom: 0px;', 
			onclick: () => removeShape(shapeNum)
		}));
		shapeTag.num = shapeNum;
		
		shapeTag.getData = () => ({
			shapeName: shapeTag.shapeNameInput.value || '',
			partName: shapeTag.partNameInput.value || '',
			animationType: shapeTag.animationTypeInput.value,
			
			x: parseFloat(shapeTag.xInput.value || '0'),
			y: parseFloat(shapeTag.yInput.value || '0'),
			z: parseFloat(shapeTag.zInput.value || '0')
		});
		
		shapeContainer.appendChild(shapeTag);
	}
	var getShape = num => {
		var chs = shapeContainer.children;
		for(var i = 0; i < chs.length; i++){
			if(chs[i].num === num) return chs[i];
		}
	}
	
		
	var createInitialContainers = () => {
		var shapeContWrap = tag('div', {
			style: 'position: absolute; left: 0px; bottom: 0px; right: 0px; top: 20px',
			children: [
				(shapeContainer = tag('div', {
					style: 'position: absolute; top: 0px; left: 0px; right: 0px; bottom: 35px; border: 1px solid #999; overflow-y: auto; overflow-x: hidden'
				})),
				tag('input', {type: 'button', value: 'add shape', onclick: addShape, style: 'position: absolute; bottom: 5px; right: 5px; height: 25px;'})
			]
		});
		
		var wrap = tag('div', {
			style: 'position: absolute; left: 0px; bottom: 0px; top: 0px; width: 30%;',
			children: [shapeContWrap]
		});
		
		document.body.appendChild(wrap);
	}
		
	return () => {
		log('Started.');
		
		resetCss();
		createInitialContainers();
		board = Board(createDisplay());
		
		
		
		var gl = board.gl;
		
		texLoader = new TextureLoader(gl);
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

				mouseX = e.offsetX;
				mouseY = e.offsetY;
			}
			
			board.setAmbientColor([0.7, 0.7, 0.7]).start();
		
		}
	}

});