aPackage('nart.gl.util', () => {
	"use strict";
	
	var glob = typeof(window) === 'undefined'? {}: window;

	var graphicsOf = display => {
		var result;

		try {
			result = display.getContext("experimental-webgl");
			result.viewportWidth = display.scrollWidth;
			result.viewportHeight = display.scrollHeight;
		} catch (e) {}
		
		return result;
	}

	var createDisplayAt = parentNode => {
		parentNode = parentNode || document.body;

		var d = document.createElement("canvas");
		
		var w = parentNode.scrollWidth;
		var h = parentNode.scrollHeight;
		
		d.width = w;
		d.height = h;
		
		d.setAttribute('width', w);
		d.setAttribute('height', h);
		
		parentNode.appendChild(d);
		return d;
	}
	
	var reqAnimFrame = glob.requestAnimationFrame? cb => glob.requestAnimationFrame(cb):
		glob.webkitRequestAnimationFrame? cb => glob.webkitRequestAnimationFrame(cb):
		glob.mozRequestAnimationFrame? cb => glob.mozRequestAnimationFrame(cb):
		glob.oRequestAnimationFrame? cb => glob.oRequestAnimationFrame(cb):
		glob.msRequestAnimationFrame? cb => glob.msRequestAnimationFrame(cb):
		cb => setTimeout(cb, 1000/60);

	var bufferOf = function(gl, smth, itemSize, bufferType, arrayType){
		if(!Array.isArray(smth)) return smth;
		
		var result = gl.createBuffer();

		result.numItems = Math.round(smth.length / itemSize);
		result.itemSize = itemSize;
		
		gl.bindBuffer(bufferType, result);
		gl.bufferData(bufferType, smth instanceof arrayType? smth: new arrayType(smth), gl.STATIC_DRAW);
		
		return result;
	}
	
	return {
		graphicsOf: graphicsOf,
		createDisplayAt: createDisplayAt,
		bufferOf: bufferOf,
		onNextScreenFrame: reqAnimFrame
	};
	
});