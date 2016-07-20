/*
nartallax@gmail.com
*/

require(__dirname + "/../libs/meta/addict.js")
	.registerOmnipresentPrefix('nart.omnipresent')
	.addRoot('nart', __dirname + '/../libs')
	.addRoot('nart.adamantos', __dirname + '/../app')
	.addRoot('nart.adamantos.tools', __dirname)
	.main(() => {
		"use strict";
		
		var fs = aRequire.node('fs'),
			log = aRequire('nart.util.log'),
			config = aRequire('nart.adamantos.config'),
			
			ClientSeeder = aRequire('nart.adamantos.client.seeder'),
			MessengerSupplier = aRequire('nart.adamantos.messenger.supplier.server');
			
		log("Server starting.");
		
		ClientSeeder('nart.adamantos.tools.animating.frontpage', 'Animation tool', seeder => {
			seeder.http(config.net.frontend.port, port => log('Frontpage available at port ' + port));
		});
		
		MessengerSupplier(config.paths, config.net.heartbeat, supp => supp.webSocket(config.net.socket.port, port => log('Socket available at port ' + port)));
		
		/*
		var getCompressedPackOf = (packerClass, dirPrefixMap, cb) => {
			var packer = new packerClass();
			packer.addSourceDirectories(dirPrefixMap, () => {
				packer.getPack(uncompressed => {
					gzip(uncompressed, cb);
				});
			});
		};
		
		var compressedTexturePack, compressedShapePack,
			texturesDirPath = __dirname + '/../' + config.directories.source.texture,
			shapesDirPath = __dirname + '/../' + config.directories.source.shape,
			modelsDirPath = __dirname + '/../' + config.directories.source.model,
			
			texPrefixMap = {}, shapePrefixMap = {};
		*/
		/*
		texPrefixMap[texturesDirPath] = '';
		getCompressedPackOf(TexturePacker, texPrefixMap, pack => {
			log('Built up and compressed texture pack.');
			compressedTexturePack = pack;
		})
		
		shapePrefixMap[shapesDirPath] = '';
		getCompressedPackOf(ShapePacker, shapePrefixMap, pack => {
			log('Built up and compressed shape pack.');
			compressedShapePack = pack;
		})
		*/

	});