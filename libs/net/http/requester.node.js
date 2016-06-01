aPackage('nart.net.http.requester.node', () => {

	var http = aRequire.node('http'),
		https = aRequire.node('https'),
		urlParser = aRequire.node('url'),
		encoding = aRequire.node("encoding");
	
	var optsFor = (method, url, headers, body) => {
		var headers = headers || {};
		var sp = urlParser.parse(url, true);
		
		var result = {
			url: url,
			protocol: sp.protocol,
			host: sp.hostname, 
			port: sp.port || (sp.protocol === 'https:'? 443: null),
			path: sp.path,
			method: method.toUpperCase().replace(/(^[^A-Z]+|[^A-Z]+$)/),
			headers: headers
		};
		
		if(body){
			result.headers['Content-Length'] = Buffer.byteLength(body)
			result.body = body;
		}
		
		return result;
	}
	
	var contentTypeFromHeaders = hs => {
		for(var i in hs) if(i.toLowerCase() === 'content-type'){
			var sp = hs[i].split(';').filter(p => p.match(/^\s*charset\s*=\s*/)? true: false)
			if(sp.length > 0) return sp[0].replace(/(^\s*charset\s*=\s*|\s+$|-)/g, '');
		}
	}
	
	var processRequest = (opts, cb, misc) => {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		
		var lib = opts.protocol === 'https:'? https: http;
		var req = lib.request(opts, res => {
			if(~~(res.statusCode / 100) === 3 && misc.followRedirects){
				var loc = res.headers[Object.keys(res.headers).filter(k => k.toLowerCase() === 'location')[0]];
				if(!loc) {
					return cb && cb(null, new Error('Could not follow redirect from ' + opts.url + ' : no Location header supplied.'))
				}
				
				if(misc.clearHeadersOnRedirect) opts.headers = {};
				if(misc.clearBodyOnRedirect) ('body' in opts) && (opts.body = '');
				if(misc.resetMethodOnRedirect) opts.method = 'GET';
				
				misc.visitedUrls || (misc.visitedUrls = []);
				var isCircular = misc.visitedUrls.filter(u => u === opts.url).length > 0;
				misc.visitedUrls.push(opts.url);
				if(isCircular){
					// вообще, вот так вот слать нахер при обнаружении одного только совпадения - неправильно
					// ведь, например, могли измениться куки, и на повторный запрос (с другими куками) сервер среагировал бы по-другому
					// но это нечастый случай, так что я пока забью его обрабатывать
					return cb && cb(null, new Error('Could not fetch ' + opts.url + ' : circular redirect detected.'))
				}
				
				return opts.method === 'POST'?
					Requester.post(loc, opts.headers, opts.body, cb, misc):
					Requester.get(loc, opts.headers, cb, misc);
			}
			
			var result = {
				statusCode: res.statusCode,
				headers: res.headers,
				body: ''
			};
			
			var buffers = [];
			var enc = contentTypeFromHeaders(res.headers) || 'utf8';
			
			if(misc.resultAsStream) return cb && cb(res);
			
			//res.setEncoding('utf8');
			res.on('data', chunk => buffers.push(chunk));
			res.on('end', () => {
				var body = Buffer.concat(buffers);
				
				if(!misc.noEncodingConversion){
					body = enc.replace(/[\s\-]+/, '').toLowerCase() === 'utf8'? body: encoding.convert(body, 'utf8', enc);
					enc = 'utf8';
				}
				
				if(!misc.resultInBuffer){
					body = body.toString(enc);
				}
				
				result.body = body;
				cb && cb(result)
			})
		});
		
		if('body' in opts){
			req.write(opts.body || '');
		}
		
		req.end();
	}
	
	var Requester = {
		post: (url, headers, body, cb, misc) => processRequest(optsFor('POST', url, headers, body), cb, misc || {}),
		get: (url, headers, cb, misc) => processRequest(optsFor('GET', url, headers), cb, misc || {})
	};

	return Requester;

});