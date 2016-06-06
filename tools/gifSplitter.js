/*
nartallax@gmail.com

tool that splits GIF into frames.
requires PNGJS for work, so dont forget to npm install it
*/

require(__dirname + "/../libs/meta/addict.js")
	.addRoot('nart', __dirname + '/../libs')
	.addRoot('', '.')
	.main(() => {
		"use strict";
		
		var PNG = aRequire.node('pngjs').PNG,
			fs = aRequire.node('fs'),
			mkDir = aRequire('nart.util.fs').mkDir,
			rmDir = aRequire('nart.util.fs').rmDir,
			path = aRequire.node('path'),
			
			readGif = aRequire('nart.gl.format.gif.reader');
			
		var inGif = process.argv[2],
			outDir = process.argv[3],
			mult = parseInt(process.argv[4]);
			
		if(!inGif || !outDir){
			return console.error('Expected arguments: input/file.gif output/directory/path');
		}
		
		if(Number.isNaN(mult)) mult = 1;
		
		var saveFrame = (w, h, num, frame, cb) => {
			console.log('Saving ' + num + ' frame...');
			
			var png = new PNG({
				filterType: 4,
				width: w * mult,
				height: h * mult
			});
			
			for(var bx = 0; bx < w; bx++){
				for(var by = 0; by < h; by++){
					for(var x = bx * mult; x < (bx + 1) * mult; x++){
						for(var y = by * mult; y < (by + 1) * mult; y++){

							png.data[(((y * w * mult) + x) * 4) + 0] = frame[(((by * w) + bx) * 4) + 0];
							png.data[(((y * w * mult) + x) * 4) + 1] = frame[(((by * w) + bx) * 4) + 1];
							png.data[(((y * w * mult) + x) * 4) + 2] = frame[(((by * w) + bx) * 4) + 2];
							png.data[(((y * w * mult) + x) * 4) + 3] = frame[(((by * w) + bx) * 4) + 3];
							
						}
					}
				}
			}
			
			png.pack().pipe(require('fs').createWriteStream(path.join(outDir, num + '.png'))).on('close', () => cb && cb());
		}
		
		//mkDir(outDir, () => {
			//rmDir(outDir, () => {
				mkDir(outDir, () => {
					
					console.log('Reading source file...');
					fs.readFile(inGif, (e, buf) => {
						if(e) return console.err(e.message);
						
						var gif = readGif(buf);
						
						var i = 0;
						var nextFrame = () => {
							var f = gif.frames[i++];
							if(!f) return console.log('Done.');
							saveFrame(gif.width, gif.height, i, f, nextFrame);
						}
						
						nextFrame();
					});
					
				});
			//})
		//});
	});