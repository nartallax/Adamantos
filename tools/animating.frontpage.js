aPackage('nart.adamantos.tools.animating.frontpage', () => {
	'use strict';

	var log = aRequire('nart.util.log'),
		Shape = aRequire('nart.gl.shape'),
		SimpleShape = aRequire('nart.gl.shape.simple'),
		TextureLoader = aRequire('nart.gl.texture.loader'),
		ShapeLoader = aRequire('nart.gl.shape.loader'),
		ByteManip = aRequire('nart.util.byte.manipulator'),
		
		Board = aRequire('nart.gl.board'),
		
		toolConfig = aRequire('nart.adamantos.tools.config').animatingTool,
		
		SocketClient = aRequire('nart.net.socket.client.browser'),
		Messenger = aRequire('nart.net.message.messenger');
		
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
	var input = (style, placeholder, update, type, onclick) => tag('input', {
		type: type || 'text', style: style, placeholder: placeholder, onchange: update, onkeypress: update, onclick: onclick || (() => {})
	});
	var addXYZInputs = (wrap, update, placeholderPrefix, dataPrefix) => {
		placeholderPrefix = placeholderPrefix || ''
		dataPrefix = dataPrefix || '';
		
		var subwrap = tag('div'),
			x = input('width: 50px', placeholderPrefix + 'x', update),
			y = input('width: 50px', placeholderPrefix + 'y', update),
			z = input('width: 50px', placeholderPrefix + 'z', update);
					
		subwrap.appendChild(x);
		subwrap.appendChild(y);
		subwrap.appendChild(z);
		wrap.appendChild(subwrap);
		
		return d => {
			d[dataPrefix? dataPrefix + 'X': 'x'] = parseFloat(x.value.replace(',', '.') || '0');
			d[dataPrefix? dataPrefix + 'Y': 'y'] = parseFloat(y.value.replace(',', '.') || '0');
			d[dataPrefix? dataPrefix + 'Z': 'z'] = parseFloat(z.value.replace(',', '.') || '0');
			return d;
		};
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
		window.display = display = tag("canvas", {style:'position: absolute; right: 0px; left: 30%; top: 0px; bottom: 0px; height: 100%; width: 70%'});
		
		display.setAttribute('width', display.width = document.body.scrollWidth);
		display.setAttribute('height', display.height = document.body.scrollHeight);
		
		document.body.appendChild(display);
		
		return display;
	}
	
	var activeColor = [0.3, 0.3, 0.3], hoverColor = [0.15, 0.15, 0.15], defaultHighlight = [0, 0, 0];
	var shapeContainer, animationContainer, display, board, shapeIndex = 0, texLoader, shapeLoader;
		
	var lockPointer = () => {
		display.requestPointerLock? display.requestPointerLock():
		display.webkitRequestPointerLock? display.webkitRequestPointerLock():
		display.mozRequestPointerLock? display.webkitRequestPointerLock(): null;
	}
	var unlockPointer = () => {
		document.exitPointerLock? document.exitPointerLock():
		document.webkitExitPointerLock? document.webkitExitPointerLock():
		document.mozExitPointerLock? document.webkitExitPointerLock(): null;
	}
		
	// действия с шейпами
	var removeShape = num => {
		var sh = getShape(num);
		board.removeChild(sh.boardId);
		shapeContainer.removeChild(sh);
	}
	var actualizeShape = num => {
		var sh = getShape(num), data = sh.getData(), bId = sh.boardId;
		
		board.removeChild(sh.boardId);
		
		var bShape;
		try {
			bShape = shapeLoader.get(data.shapeName);
		} catch(e){
			console.log(e);
			return;
		}
		
		board.addChild(bShape);
		sh.boardId = bShape.id;
		
		switch(data.animationType){
			case 'absolute':
				bShape.setPosition(data.x, data.y, data.z);
				bShape.setRotationX(data.rotX);
				bShape.setRotationY(data.rotY);
				bShape.setRotationZ(data.rotZ);
				break;
			case 'bone':
			default: throw new Error('Unknown animation type: "' + data.animationType + '"');
		}
	}
	var addShape = () => {
		var shapeTag = tag('div', { style: 'position: relative; border: 1px solid #999; margin: 3px 0px' }), 
			shapeNum = shapeIndex++,
			update = () => setTimeout(() => actualizeShape(shapeNum), 1);
		
		var createFieldsForType = () => {
			var type = shapeTag.animationTypeInput.value, wrap = shapeTag.typeInputWrap;
			
			wrap.innerHTML = '';
		
			switch(type){
				case 'absolute':
					var addXYZ = addXYZInputs(wrap, update),
						addRot = addXYZInputs(wrap, update, 'rot ', 'rot');
						
					wrap.populateWithValues = d => addXYZ(addRot(d));
					break;
				case 'bone':
					var addMults = addXYZInputs(wrap, update, 'mult ', 'mult'),
						addShifts = addXYZInputs(wrap, update, 'shift ', 'shift'),
						parentName = input('display: block; width: 150px', 'attach_to_this_part', update),
						defaultValue = input('display: block; width: 150px', 'default value', update);
						
					wrap.appendChild(parentName);
					wrap.appendChild(defaultValue);
						
					wrap.populateWithValues = d => {
						d.parent = parentName.value;
						d.defaultValue = parseFloat(defaultValue.value) || 0;
						return addMults(addShifts(d));
					}
					break;
				default: throw new Error('Unknown animation type: "' + type + '"');
			}
		}
		
		shapeTag.appendChild(shapeTag.partNameInput = input('display: block; width: 100%', 'part_name_goes_here', update));
		shapeTag.appendChild(shapeTag.shapeNameInput = input('display: block; width: 100%', 'shape.name.goes.here', update));
		shapeTag.appendChild(shapeTag.animationTypeInput = tag('select', { value: 'absolute', onchange: createFieldsForType, children: [
				tag('option', {value: 'absolute', text: 'absolute'}),
				tag('option', {value: 'bone', text: 'bone'}),
		]}));
		shapeTag.appendChild(shapeTag.typeInputWrap = tag('div', {style: 'display: inline-block'}));
		shapeTag.appendChild(shapeTag.deleteButton = tag('input', {
			type:'button', value: 'delete', style:'position: absolute; right: 0px; bottom: 0px;', 
			onclick: () => removeShape(shapeNum)
		}));
		shapeTag.num = shapeNum;
		
		shapeTag.getData = () => shapeTag.typeInputWrap.populateWithValues({
			shapeName: shapeTag.shapeNameInput.value || '',
			partName: shapeTag.partNameInput.value || '',
			animationType: shapeTag.animationTypeInput.value
		});
		
		createFieldsForType();
		
		shapeContainer.appendChild(shapeTag);
	}
	var getShape = num => {
		var chs = shapeContainer.children;
		for(var i = 0; i < chs.length; i++){
			if(chs[i].num === num) return chs[i];
		}
	}
	
	var addAnimation = () => {
		
	}
	
	var distance = function(/* vararg */){
		var res = arguments[0];
		for(var i = 1; i < arguments.length; i++){
			res = Math.sqrt((res * res) + (arguments[i] * arguments[i]))
		}
		return res;
	}
	var listenToUserInput = () => {		
		var min = (a, b) => a < b? a: b,
			max = (a, b) => a < b? b: a;
		var mouseMovement = (e, old) => ({
			x: 'movementX' in e? e.movementX: 'mozMovementX' in e? e.mozMovementX: 'webkitMovementX' in e? e.webkitMovementX: old.x - e.screenX,
			y: 'movementY' in e? e.movementY: 'mozMovementY' in e? e.mozMovementY: 'webkitMovementX' in e? e.webkitMovementY: old.x - e.screenY
		})
		
		var stopTheEvent = e => (
			(e.preventDefault && e.preventDefault()), 
			(e.stopImmediatePropagation && e.stopImmediatePropagation()),
			(e.returnValue = false),
			(e.stopPropagation && e.stopPropagation()),
			false
		);
		
		var mouseIsAttached = false,
			dragStartCursor,
			mouseListener = e => {
				var d = mouseMovement(e, dragStartCursor),
					dist = distance(board.cam.x, board.cam.z, board.cam.y - (board.cam.yShift || 0));
				
				var rotX = board.cam.rotX + ((-d.x / 5) * (Math.PI / 180)),
					rotY = board.cam.rotY + ((-d.y / 5) * (Math.PI / 180));
				
				rotY = max(min(rotY, Math.PI / 2), - Math.PI / 2);
				
				board.cam.rotX = rotX;
				board.cam.rotY = rotY;
				
				board.cam.z = dist * Math.cos(rotX) * Math.cos(rotY);
				board.cam.x = dist * Math.sin(rotX) * Math.cos(rotY);
				
				
				board.cam.y = (board.cam.yShift || 0) + (dist * (-Math.sin(rotY)));
				
				return stopTheEvent(e);
			}
		
		display.oncontextmenu = display.onmousedown = e => {
			document.onmousemove = mouseListener;
			dragStartCursor = { x: e.screenX, y: e.screenY };
			lockPointer();
			mouseIsAttached = true;
			return stopTheEvent(e);
		}
		
		document.onmouseup = e => {
			if(mouseIsAttached){
				unlockPointer();
				document.onmousemove = null;
				mouseIsAttached = false;
				return stopTheEvent(e);
			}
		}
		
		display.onwheel = e => {
			var add = (e.wheelDelta > 0? -1: 1) * 0.05
			var mult = 1 + add;
			
			if(e.ctrlKey){
				var dist = distance(board.cam.x, board.cam.z, board.cam.y - (board.cam.yShift || 0))
				var shift = dist * add;
				
				board.cam.yShift = (board.cam.yShift || 0) + shift;
				board.cam.y += shift;
			} else {
				board.cam.x *= mult;
				board.cam.y = ((board.cam.y - (board.cam.yShift || 0)) * mult) + (board.cam.yShift || 0);
				board.cam.z *= mult;
			}
			
			return stopTheEvent(e);
		}
	}
	
	var resetCam = () => {
		var dist = distance(3, 3, 3),
			rotX = (45 * Math.PI) / 180,
			rotY = -(45 * Math.PI) / 180
		
		board.cam.rotX = rotX;
		board.cam.rotY = rotY;
		
		board.cam.z = dist * Math.cos(rotX) * Math.cos(rotY);
		board.cam.x = dist * Math.sin(rotX) * Math.cos(rotY);
		
		board.cam.y = dist * (-Math.sin(rotY));
		
		board.cam.yShift = 0;
	}
	var createInitialContainers = () => {
		var activeTab = null, activeTabBtn = null;
		
		var activateTabFn = (tab, button) => {
			tab.style.display = 'none';
			button.style.background = '#ccc';
			button.style.cursor = 'pointer';
			
			return () => {
				activeTab && (activeTab.style.display = 'none');
				activeTabBtn && (activeTabBtn.style.background = '#ccc');
				tab.style.display = 'block';
				button.style.background = '#fff';
				activeTab = tab;
				activeTabBtn = button;
			}
		}
		
		var tabTag = (inner, lower) => {
			inner.style.position = 'absolute';
			inner.style.top = inner.style.left = inner.style.right = '0px';
			inner.style.bottom = '35px';
			inner.style.border = '1px solid #999';
			inner.style.overflowY = 'auto';
			inner.style.overflowX = 'hidden';
			return tag('div', {
				style: 'position: absolute; left: 0px; bottom: 0px; right: 0px; top: 20px',
				children: [
					inner,
					tag('div', {
						style: 'position: absolute; left: 0px; bottom: 0px; height: 35px; right: 0px; text-align: right',
						children: Array.isArray(lower)? lower: [lower]
					})
				]
			});
		}
		
		var tabBtn = (tab, text) => {
			var res = tag('div', { text: text, style: 'font-weight: bold; height: 20px; display: inline-block; width: auto; padding: 0px 3px; border: 1px solid #999; border-width: 0px 1px' });
			var fn = activateTabFn(tab, res);
			res.onclick = fn;
			return res;
		}
		
		var shapeContWrap = tabTag(
			shapeContainer = tag('div'),
			tag('input', {type: 'button', value: 'add shape', onclick: addShape, style: 'margin: 5px; height: 25px;'})
		)
		
		var animContWrap = tabTag(
			animationContainer = tag('div'),
			tag('input', {type: 'button', value: 'add animation', onclick: addAnimation, style: 'margin: 5px; height: 25px;'})
		)
		
		var wrap = tag('div', {
			style: 'position: absolute; left: 0px; bottom: 0px; top: 0px; width: 30%; background: #ccc',
			children: [
				shapeContWrap, 
				animContWrap,
				tag('div', {style:'position: absolute; top: 0px; left: 0px; right: 0px; height: 20px', children: [
					(activeTabBtn = tabBtn(shapeContWrap, 'shapes')),
					tabBtn(animContWrap, 'animations')
				]})
			]
		});
		
		activeTabBtn.onclick();
		
		document.body.appendChild(wrap);
	}
		
	var establishConnection = cb => {
		SocketClient.connect('ws://' + window.location.hostname + ':' + toolConfig.socketPort, socket => {
			log('Connection established.');
			
			var msgr = new Messenger(socket, false);
			
			var testChannel = msgr.createChannel({
				name: 'test.channel',
				server: {
					request: bytes => {
						var str = bytes.getString();
						//console.log('RECEIVED: ' + str);
						str = str + '|' + str;
						testChannel.client.response.writeAndSend(ByteManip.stringSize(str), (writer, cb) => {
							writer.putString(str);
							cb();
						});
					}
				},
				client: {
					response: bytes => console.log(bytes.getString())
				}
			});
			
			msgr.onStatsUpdate(e => console.log(JSON.stringify(e.data)))
			
			msgr.onError(e => (log('Messenger error: '), console.log(e.data.error)));
			
			cb && cb(socket);
		});
	}
		
	return () => {
		log('Started.');
		
		resetCss();
		createInitialContainers();
		board = Board(createDisplay());
		
		resetCam();
		listenToUserInput();
		
		texLoader = new TextureLoader(board.gl);
		shapeLoader = new ShapeLoader(board.gl, texLoader);
		var msgr = null;
		establishConnection(msgr => {
			window.msgr = msgr = msgr;
			
			texLoader.downloadAndAddPack('/get_texture_pack', () => {
				log("Received the texture pack.");
				
				shapeLoader.downloadAndAddPack('/get_shape_pack', () => {
					log("Received the shape pack.");
					
					afterResourcesLoaded();
				});
				
			});
		});
		
		var afterResourcesLoaded = () => {
		
			log('Preloaded');

			/*
			var mouseX = 0, mouseY = 0;
			
			var highlighted = undefined;
			
			var lighten = id => board.children[id].setHighlightColor(hoverColor);
			var darken = id => board.children[id].setHighlightColor(defaultHighlight);
			
			board.afterTick.listen(d => {
				var id;
				
				shapeUnderCursorId = id = board.childAt(mouseX, mouseY);
				
				if(id === highlighted) return;
				
				highlighted === undefined || darken(highlighted)
				id === undefined || lighten(id)
				
				highlighted = id;
				
			});
			
			
			display.onmousemove = e => {

				mouseX = e.offsetX;
				mouseY = e.offsetY;
			}
			*/
			
			board.setAmbientColor([1, 1, 1]);
			board.addChild(shapeLoader.get('sample'));
			board.start();
		
		}
	}

});