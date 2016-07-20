aPackage('nart.util.html.assembler', () => {
	"use strict";
	
	//TODO: add client compression/minification
	//TODO: use nart.util.script.assembler maybe?
	var Addict = aRequire('nart.meta.addict'),
		arrToMapKeys = aRequire('nart.util.clone').arrToMapKeys,
		escapeHtml = aRequire('nart.util.html').escapeHtml,
		fs = aRequire.node('fs'),
		format = aRequire('nart.util.formatter'),
		xmlEscape = aRequire('nart.util.html').escapeXml;
	
	var scriptTagFormat = format('<script type="text/javascript"$1$2>/*<![CDATA[*//*---->*/$3/*--*//*]]>*/</script>'),
		tagAttr = (k, v, force) => (!v && !force)? '': format(' $1="$2"')(xmlEscape(k), xmlEscape(v));
		
	
	var scriptTagOfText = (text, pkgName, fileName) => {
		return scriptTagFormat(tagAttr('data-package-name', pkgName), tagAttr('data-source-file', fileName), text);
	}
	var scriptTag = pkg => {
		var file = Addict.fileOf(pkg);
		return scriptTagOfText(fs.readFileSync(file), pkg, file);
	}
	//var styleTag = file => '<link rel="stylesheet" type="text/css" href="' + file + '">'
	var styleTag = file => `<style type="text/css" data-source-file="` + file + `">\n` + fs.readFileSync(file) + `\n</style>`;
	var faviconTag = file => {
		if(!file) return '';
		var b64 = new Buffer(fs.readFileSync(file)).toString('base64');
		return `<link rel="shortcut icon" data-source-file="` + file + `" type="image/png" href="data:image/png;base64,` + b64 + `">`
	}
	var titleTag = text => text? `<title>` + text + `</title>`: ''
	
	var fontTag = (() => {
		
		var fontMetaTypes = {
			'ttf': {mime: 'application/octet-stream', format: 'truetype'},
			'otf': {mime: 'font/opentype', format: 'opentype'},
			'woff':{mime: 'application/font-woff', format: 'woff'},
			'eot': {mime: 'application/vnd.ms-fontobject', format: 'eof'}
		};
		
		return (file, name) => {
			if(!file) return '';
			
			var t = ((file.replace(/\s+$/, '').match('[^.]+$') || [])[0] || '').toLowerCase();
			var metaType = fontMetaTypes[t];
			if(!metaType) throw 'Could not determine font type: unknown extension "' + t + '"';
			
			var b64 = new Buffer(fs.readFileSync(file)).toString('base64');
			
			return `<style type="text/css" data-source-file="` + file + `" data-font-name="` + name + `">
				@font-face {
					font-family: '` + name + `';
					src: url(data:` + metaType.mime + `;charset=utf-8;base64,` + b64 + `) format('` + metaType.format + `');
				}
			</style>`
		}
		
	})();
	
	var getHtml = function(){
		var scripts = '', styles = '', onload = '', fonts = [];
		
		for(var fontName in this.fonts){
			fonts.push(fontTag(this.fonts[fontName], fontName));
		}
		
		fonts = fonts.join('\n');
		
		if(this.mainPackageName){
			scripts = this.includedPackages.map(scriptTag).concat(this.rawScripts.map(text => scriptTagOfText(text))).join('\n');
			styles = this.css.map(styleTag).join('\n');
			
			var omnipresents = Addict.getOmnipresentList().map(name => '.registerOmnipresentPackageName(\'' + name + '\')').join('\n')
			
			onload = format('onload="Addict$1.main(() => aRequire(\'$2\')())"')(omnipresents, this.mainPackageName)
		}
		
		return `<!DOCTYPE html>
<html>
	<head>
		
		<!-- Written by Nartallax -->
		<meta charset="UTF-8">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
		<meta http-equiv="x-ua-compatible" content="ie=edge"/>
		
		` + titleTag(this.title) + `
		` + faviconTag(this.favicon) + `
		` + fonts + `
		
		` + styles + `
		` + scripts + `
		
	</head>
	<body ` + onload + `></body>
</html>
		`
	}
	
	var Client = function(){
		if(!(this instanceof Client)) return new Client();
		
		this.title = "";
		this.mainPackageName = '';
		this.css = [];
		this.fonts = {};
		this.favicon = '';
		this.rawScripts = [];
	}
	
	Client.prototype = {
		setTitle: function(t){ return this.title = escapeHtml(t + ''), this },
		setFavicon: function(file){ return this.favicon = file || '', this },
		setMainPackage: function(name){ 
			this.mainPackageName = name;
			var rawDeps = null;
			
			Addict.withEnvironment('browser', () => {
				rawDeps = Addict.dependencyListOf(name);
			});
			
			var deps = arrToMapKeys(rawDeps);
			
			deps[name] = true;
			deps['nart.meta.addict'] = true;
			deps = Object.keys(deps).sort((a, b) => a === 'nart.meta.addict'? -1: 1);
			
			this.includedPackages = deps;
			return this;
		},
		addCss: function(n){ return this.css.push(n), this },
		addFont: function(file, name){ return (this.fonts[name] = file), this },
		addScriptText: function(text){
			this.rawScripts.push(text)
		},
		getHtml: getHtml
	};

	return Client;
	
});