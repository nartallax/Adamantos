aPackage('nart.util.base64', () => {

	var utf8 = aRequire('nart.util.utf8');
	
	var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
		lastChar = alphabet.charAt(alphabet.length - 1);
	
	var abs = {};
	var getAlphabet = (symA, symB) => {
		if(abs[symA + symB]) return abs[symA + symB];
		var ab = abs[symA + symB] = alphabet.split('');
		
		if(symA) ab[ab.length - 3] = symA;
		if(symB) ab[ab.length - 2] = symB;
		
		return ab;
	}
	
	var maps = {};
	var getMap = (symA, symB) => {
		if(maps[symA + symB]) return maps[symA + symB];
		
		var result = maps[symA + symB] = {};
		result[symA] = alphabet.length - 3;
		result[symB] = alphabet.length - 2;
		for(var i = 0; i < alphabet.length; i++) result[alphabet.charAt(i)] = i;
		return result;
	}
	
	var ts = [
		(d, s) => (d[s] & 0xfc) >> 2,
		(d, s) => ((d[s] & 0x03) << 4) | (d[s + 1] >> 4),
		(d, s) => ((d[s + 1] & 0x0f) << 2) | (d[s + 2] >> 6),
		(d, s) => d[s + 2] & 0x3f
	]
	
	var us = [
		(d, s, a) => (a[d[s]] << 2) | ((a[d[s + 1]] & 0x30) >> 4),
		(d, s, a) => ((a[d[s + 1]] & 0x0f) << 4) | ((a[d[s + 2]] & 0x3c) >> 2),
		(d, s, a) => ((a[d[s + 2]] & 0x03) << 6) | a[d[s + 3]]
	]
	
	var encodeStr = (str, symA, symB) => encodeBytes(utf8.strToBytes(str), symA, symB),
		encodeBytes = (data, symA, symB) => {
			if(typeof(btoa) === 'function' && symA === undefined && symB === undefined){
				return btoa(String.fromCharCode.apply(null, data)); // faster, most of the time
			}
			
			var r = '', pos = -3, len = data.length, i, ab = getAlphabet();
			
			// 		3	2	1
			// 0	+	+	+
			// 1	+	+	+	
			// 2	+	+	-
			// 3	+	-	-
			
			while((pos += 3) < len) for(i = 0; i < 4 && (len - pos) >= i; i++) r += ab[ts[i](data, pos)]

			while(r.length % 4) r += ab[64];
			return r;
		},
		decodeStr = (input, symA, symB) => utf8.bytesToStr(decodeBytes(input, symA, symB)),
		decodeBytes = (d, symA, symB) => {
			var r = [], ab = getMap(symA, symB), l = d.length, i = -4, j;
			
			while(d.length % 4) d += '=';
			while((i += 4) < l) for(j = 0; j < 3; j++) r.push(us[j](d, i, ab))
				
			var eindex = d.indexOf('=')
			for(j = eindex > 0? d.length - eindex: 0; j > 0; j--) r.pop();
		
			return r
		}

	return {
		encodeStr: encodeStr,
		encodeBytes: encodeBytes,
		decodeStr: decodeStr,
		decodeBytes: decodeBytes
	}

})