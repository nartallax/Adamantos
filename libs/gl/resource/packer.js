// абстрактный класс упаковщика каких-нибудь ресурсов

// терминология:
// source - одна единица данных (одна модель/текстура/итд) в виде каких-либо исходников (.gif, .obj итд)
// packed - одна единица данных, упакованная для пересылки (буфер)
// pack - много данных, упакованных для пересылки, склеенных последовательно
// usable - одна единица данных, готовых к использованию как контента (массивы пикселей/точек/итд)
// path - путь к source-файлу, готовому к чтению
// name - уникальное имя единицы данных, может быть получено из path, но не наоборот

// методика использования:
// 1. инстанциировать нужный packer
// 2. набить его данными (source/pack)
// 3. получить данные в нужном формате (pack/usable)
// т.о. имплементация упаковщика должна уметь только конвертировать source -> packed и packed -> usable

// бинарный формат упакованных данных:
// pack: последовательность packed
// packed: name:string data_byte_length:uint data_bytes:binary
// more detailed and formal description: nart.util.byte.manipulator
aPackage('nart.gl.resource.packer', () => {
	
	var eachFileRecursiveIn = aRequire('nart.util.fs').eachFileRecursiveIn,
		eachAsync = aRequire('nart.util.collections').eachAsync,
		Path = aRequire.node('path'),
		fs = aRequire.node('fs'),
		splitPath = aRequire('nart.util.fs').splitPath,
		err = aRequire('nart.util.err'),
		utf8 = aRequire('nart.util.utf8'),
		
		ByteManipulator = aRequire('nart.util.byte.manipulator');

		
	var Packer = function(){
		if(!(this instanceof Packer)) return new Packer();
		
		this.sourcePaths = [];
		this.sourceBuffers = {};
		
		this.readers = [];
		this.packedOffsets = {}; // name: {reader: number of reader, offset: offset of the data in the reader}
	}
	
	Packer.pathToName = (texturePath, prefixPath, prefixName) => {
		texturePath = texturePath.replace(/\.[^.\\\/]+$/, '');
		
		// no fake separators allowed
		if(texturePath.indexOf('.') > 0) return null;
		
		var parts = splitPath(texturePath);
		
		if(prefixPath) parts = parts.slice(splitPath(prefixPath).length);
		prefixName = (prefixName || '').split('.').filter(f => f);
		
		return prefixName.concat(parts).join('.');
	};
	
	Packer.prototype = {
		
		getAddeableFilesFilter: () => (/.*/),
		
		addSourceDirectories: function(dirPrefixMap, cb){
			if(Array.isArray(dirPrefixMap)){
				var map = {};
				dirPrefixMap.forEach(k => map[k] = '');
				dirPrefixMap = map;
			}
			
			eachAsync(Object.keys(dirPrefixMap), (dirPath, cb) => {
				this.addSourceDirectory(dirPath, dirPrefixMap[dirPath], cb);
			}, cb);
			
			return this;
		},
		
		addSourceDirectory: function(directoryPath, prefix, cb){
			if(!cb && typeof(prefix) === 'function'){
				cb = prefix;
				prefix = '';
			}
			
			var files = [], filter = this.getAddeableFilesFilter();
				
			eachFileRecursiveIn(directoryPath, path => path.toLowerCase().match(filter) && files.push(path), () => {
				eachAsync(files, (file, cb) => {
					var name = Packer.pathToName(file, directoryPath, prefix);
					if(!name) return cb();
					this.sourcePaths.push(file);
				}, cb);
			});
			
			return this;
		},
		
		addSourceBuffer: function(buffer, name){
			this.sourceBuffers[name] = buffer;
		},
		
		addPack: function(buffer){
			var readerNum = this.readers.length,
				reader = this.readers[readerNum] = new ByteManipulator(buffer);
			while(!reader.finished()) {
				var name = reader.getString();
					
				this.packedOffsets[name] = {reader: readerNum, offset: reader.pos};
					
				reader.advance(reader.getUint());
			}
		},
		
		// все известные имена
		getNames: function(){
			return this.sourcePaths.map(Packer.pathToName).concat(Object.keys(this.sourceBuffers)).concat(Object.keys(this.packedOffsets));
		},
		
		// тут есть такая вилка
		// есть две возможности собрать пак из компонентов (в частности, из файлов)
		// 1. 
		// 		читать каждый файл в буффер, 
		//		прогонять через sourceToPacked, 
		//		сохранять результат в массив, 
		//		потом все разом concat в один большой буффер
		// 2.
		//		читать каждый файл по отдельности, 
		//		получать его длину через sourcePackedLength, 
		//		потом выделить один большой буффер и писать с помощью sourceToPacked сразу в него
		// первая должна быть быстрее, но вторая более экономна по памяти
		// я использую 2, т.к. память чаще лимитирует, чем скорость, но, возможно, стоит переписать на 1
		
		getPackLength: function(){
			return this.sourcePaths.
		},
		
		getPack: function(){
			var buffers = [];
		},
		
		
		sourcePackedLength: reader => { throw new Error('Not implemented: sourcePackedLength'); },
		
		sourceToPacked: (reader, writer) => { throw new Error('Not implemented: sourceToPacked'); },
		packedToUsable: reader => { throw new Error('Not implemented: packedToUsable'); },
	};
	
	return Packer;
	
});