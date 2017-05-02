aPackage('nart.util.utf8', () => {

	var utf8 = {
		byteLength: str => {
			var res = 0, i = -1, len = str.length;
			while(++i < len) {
				code = str.charCodeAt(i);
				res += code < 0x80? 1: code < 0x800? 2: 3;
			}
			
			return res;
		},
		
		strToBytes: (str, res, start) => {
			res = res || new Uint8Array(utf8.byteLength(str));
			var i = -1, pos = start || 0, len = str.length, code;
			while(++i < len) {
				code = str.charCodeAt(i);
				if (code < 0x80){
					res[pos++] = code;
				} else if (code < 0x800){
					res[pos++] = 0xc0 | (code >> 6);
					res[pos++] = 0x80 | (code & 0x3f);
				} else if (code < 0xd800 || code >= 0xe000){
					res[pos++] = 0xe0 | (code >> 12);
					res[pos++] = 0x80 | ((code >> 6) & 0x3f);
					res[pos++] = 0x80 | (code & 0x3f);
				} else {
					res[pos++] = 0xef;
					res[pos++] = 0xbf;
					res[pos++] = 0xbd;
				}
			}
			return res;
		},
		
		bytesToStr: (bytes, start, end) => {
			var result = '', i = start || 0, len = end || (bytes.length - i), code;
			while(i < len) {
				code = bytes[i];
				if (code < 0x80) {
					i += 1;
				}else if((code & 0xe0) === 0xc0){
					code = ((code & 0x1f) << 6) | (bytes[i+1] & 0x3f);
					i += 2;
				} else if((code & 0xe0) === 0xe0){
					code = ((code & 0x1f) << 12) | ((bytes[i+1] & 0x7f) << 6) | (bytes[i+2] & 0x7f);
					i += 3;
				} else {
					code = 0xfffe;
					i += 3;
				}
				result += String.fromCharCode(code);
			}
			return result;
		}
	}
	
	return utf8;

})