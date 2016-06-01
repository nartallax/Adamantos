aPackage('nart.util.clone', () => {
	"use strict";
	
	var cloneArray = arr => {
		var res = [], i = -1, l = arr.length;
		while((++i) < l) res[i] = arr[i];
		return res;
	}

	var cloneMap = m => {
		var res = {};
		for(var i in m) res[i] = m[i];
		return res;
	}
	
	var arrToMapKeys = arr => {
		var res = {};
		for(var i = 0; i < arr.length; i++) res[arr[i]] = true;
		return res;
	}
	
	return {
		array: cloneArray,
		map: cloneMap,
		arrToMapKeys: arrToMapKeys	
	}
	
});