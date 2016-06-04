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
		
		this.sourcePaths = {}; // name -> path
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
			
			var files = [], filter = this.getSourceFileNameFilter();
				
			eachFileRecursiveIn(directoryPath, path => path.toLowerCase().match(filter) && files.push(path), () => {
				eachAsync(files, (file, cb) => (this.addSourceFile(file, directoryPath, prefix), cb()), cb);
			});
			
			return this;
		},
		
		addSourceFile: function(file, dirPrefix, namePrefix){
			var name = Packer.pathToName(file, dirPrefix, namePrefix);
			if(!name) throw new Error('Filename could not be converted to name: "' + file + '"');
			this.sourcePaths[name] = file;
		},
		
		addSourceBuffer: function(buffer, name){
			this.sourceBuffers[name] = buffer;
		},
		
		addPack: function(buffer){
			var readerNum = this.readers.length,
				reader = this.readers[readerNum] = new ByteManipulator(buffer);
				
			while(!reader.finished()) {
				var name = reader.getString(),
					len = reader.getUint();
					
				this.packedOffsets[name] = {reader: readerNum, offset: reader.pos, length: len};
					
				reader.advance(len);
			}
		},
		
		// все известные имена
		getNames: function(){
			return Object.keys(this.sourcePaths)
				.concat(Object.keys(this.sourceBuffers), Object.keys(this.packedOffsets))
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
		// я использую 2й, т.к. память чаще лимитирует, чем скорость загрузки, но, возможно, стоит переписать на 1й
		
		eachSourceFile: function(body, after){
			eachAsync(Object.keys(this.sourcePaths), 
				(name, cb) => body(this.sourcePaths[name], cb, name),
				after, 25); // no more than 25 files processed simultaneously
		},
		
		eachSourceFileAsBuffer: function(body, after){
			this.eachSourceFile((file, cb, name) => {
				fs.readFile(file, err(buffer => body(buffer, cb, name)));
			}, after);
		},
		
		lengthOfSourceFiles: function(cb){
			var result = 0;
			this.eachSourceFileAsBuffer((buffer, cb) => {
				result += this.sourcePackedLength(new ByteManipulator(buffer));
				cb();
			}, () => cb(result));
		},
		
		// get reader of packed resource that is already added to this packer
		getPackedReader: function(name){
			var off = this.packedOffsets[name];
			var reader = this.readers[off.reader];
			reader.moveTo(off.offset);
			return reader;
		},
		
		getPackLength: function(cb){
			this.lengthOfSourceFiles(result => {
				
				Object.keys(this.sourceBuffers).forEach(name => result += this.sourcePackedLength(this.sourceBuffers[name]));
				Object.keys(this.packedOffsets).forEach(name => {
					var reader = this.getPackedReader(name);
					reader.advance(-4);
					result += reader.readUint();
				});
				
				this.getNames().forEach(name => result += 4 + 2 + utf8.byteLength(name)); // место для заголовков
				
				cb(result);
			});
		},
		
		getPack: function(cb){
			this.getPackLength(totalLength => {
				var writer = ByteManipulator.alloc(totalLength);
				
				var writeFromReader = (name, reader) => {
					writer.putString(name);
					
					reader.advance(-4);
					var len = reader.getUint();
					writer.putUint(len);
					
					writer.transfer(reader, len);
				};
				
				var writeSource = (name, sourceBuffer) => {
					writer.putString(name);
					var sourceReader = new ByteManipulator(sourceBuffer);
					var bufLen = this.sourcePackedLength(sourceReader);
					writer.putUint(bufLen);
					
					sourceReader.moveTo(0);
					this.sourceToPacked(sourceReader, writer);
				};
				
				this.eachSourceFileAsBuffer((buffer, cb, name) => {
					writeSource(name, buffer);
					cb();
				}, () => {
					
					Object.keys(this.sourceBuffers).forEach(name => writeSource(name, this.sourceBuffers[name]));
					Object.keys(this.packedOffsets).forEach(name => writeFromReader(name, this.getPackedReader(name)));
					
					
					cb(writer.getBuffer());
				});
				
			});
		},
		
		getUsables: function(cb){
			var result = {};
			
			Object.keys(this.packedOffsets).forEach(name => {
				result[name] = this.packedToUsable(this.getPackedReader(name));
			});
			
			var addSourceBuf = (name, sourceBuf) => {
				var len = this.sourcePackedLength(sourceBuf);
				var intermediate = ByteManipulator.alloc(len);
				this.sourceToPacked(new ByteManipulator(sourceBuf), intermediate);
				intermediate.moveTo(0);
				result[name] = this.packedToUsable(intermediate);
			};
			
			Object.keys(this.sourceBuffers).forEach(name => addSourceBuf(name, this.sourceBuffers[name]));
			
			this.eachSourceFileAsBuffer((buf, cb, name) => (addSourceBuf(name, buf), cb), () => {
				cb(result)
			});
		},
		
		
		// methods to be overriden in child classes
		getSourceFileNameFilter: () => (/.*/),
		
		sourcePackedLength: reader => { 
			//throw new Error('Not implemented: sourcePackedLength'); 
			return reader.bytesToEnd(); // packed length === source.length
		},
		
		sourceToPacked: (reader, writer) => { 
			//throw new Error('Not implemented: sourceToPacked'); 
			return writer.transferBytes(reader); // no packing, packed data === source data
		},
		packedToUsable: reader => { 
			throw new Error('Not implemented: packedToUsable'); 
		},
	};
	
	return Packer;
	
});