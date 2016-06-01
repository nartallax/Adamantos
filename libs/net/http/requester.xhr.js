aPackage('nart.net.http.requester.xhr', () => {
	
	var doRequest = (method, url, headers, body, cb, misc) => {
		var xhr = new XMLHttpRequest();
		
		if(misc.resultAsStream) throw 'Unsupported request option: resultAsStream';
		
		xhr.addEventListener('load', () => {
			
			var headers = {};
			xhr.getAllResponseHeaders().split(/[\n\r]+/).map(line => {
				var index = line.indexOf(':');
				if(index < 0) return; // wat
				
				var name = line.substr(0, index).replace(/(^\s+|\s+$)/g, ''),
					value = line.substr(index + 1).replace(/(^\s+|\s+$)/g, '');
					
				if(name in headers){
					if(!Array.isArray(headers[name])){
						headers[name] = [headers[name]];
					}
					headers[name].push(value);
				} else {
					headers[name] = value;
				}
			});
			
			
			var result = {
				code: xhr.status,
				headers: headers
			};
			
			if(misc.resultInBuffer){
				
				var reader = new FileReader();
				reader.addEventListener("loadend", function() {
					result.body = new Uint8Array(reader.result);
					cb(result);
				});
				
				reader.readAsArrayBuffer(xhr.response);
				/*
				result.body = new Uint8Array(xhr.response);
				cb(result);
				*/
			} else {
				result.body = xhr.responseText;
				cb(result);
			}
			
		});
		
		if(misc.resultInBuffer) xhr.responseType = 'blob';
		
		xhr.open(method, url);
		
		Object.keys(headers).forEach(name => xhr.setRequestHeader(name, headers[name]));
		
		body === null? xhr.send(): xhr.send(body);
	}
	
	return {
		post: (url, headers, body, cb, misc) => doRequest('POST', url, headers, body, cb, misc || {}),
		get: (url, headers, cb, misc) => doRequest('GET', url, headers, null, cb, misc || {})
	};

});