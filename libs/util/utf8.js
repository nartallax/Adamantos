aPackage('nart.util.utf8', () => {

	return {
		strToBytes: str => {
			var utf8 = [], i = -1, len = str.length, code;
			while(++i < len) {
				code = str.charCodeAt(i);
				if (code < 0x80)
					utf8.push(code);
				else if (code < 0x800)
					utf8.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
				else if (code < 0xd800 || code >= 0xe000)
					utf8.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
				else
					utf8.push(0xef, 0xbf, 0xbd);
			}
			return utf8;
		},
		bytesToStr: bytes => {
			var result = '', i = 0, len = bytes.length, code;
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

})