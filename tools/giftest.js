/*
nartallax@gmail.com

tool to test the GIF reader impl
*/
	
require(__dirname + "/../libs/meta/addict.js")
	.addRoot('nart', __dirname + '/../libs')
	.main(() => {
		"use strict";
		
		var doRead = aRequire('nart.gl.format.gif.reader'),
			fs = require('fs'),
			path = require('path');
		
		var gifPath = path.join(__dirname, 'test_gif.gif'),
			ethalonPath = path.join(__dirname, 'test_gif.json');
		
		fs.readFile(ethalonPath, 'utf8', (e, text) => {
			e && console.log(e);
			
			var ethalon = text.replace(/(^[\s\t\r\n]+|[\s\t\r\n]+$)/g, '');
			fs.readFile(gifPath, (e, buf) => {
				e && console.log(e);
				var data = doRead(buf);
			
				var frameChecksum = f => {
					var res = 0;
					for(var i = 0; i < f.length; i++){
						res += f[i];
					}
					return res;
				}
				
				data.frames = data.frames.map(frameChecksum)
				
				var success = JSON.stringify(data) === ethalon;
			
				console.log('w = ' + data.width + '; h = ' + data.height + '; fnum = ' + data.frames.length + '; ' + (success? 'test passed': 'test FAILED'));
			});
		});
		
		
	});