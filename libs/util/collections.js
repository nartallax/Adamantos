aPackage('nart.util.collections', () => {

	return {
		
		eachAsync: (arr, action, after) => {
			if(arr.length < 1) return setTimeout(after, 1);
			
			var count = arr.length;
			arr.forEach(item => action(item, () => {
				count--;
				if(count === 0) setTimeout(after, 1);
			}))
		},
		
		mapAsync: (arr, mapper, after) => {
			var result = [],
				cb = () => after(result),
				count = arr.length;
			
			if(arr.length < 1) return setTimeout(cb, 1);
			
			arr.forEach(item => mapper(item, mapRes => {
				result.push(mapRes);
				count--;
				if(count === 0) setTimeout(cb, 1);
			}));
			
		},
		
		reverse: arr => {
			var res = [];
			for(var i = 0; i < arr.length; i++) res[arr.length - 1 - i] = arr[i];
			return res;
		},
		
		// все переданные аргументы - плотные массивоподобные структуры (имеют length)
		// копируются в один массив, последовательно
		copyMergeArrayLike: function(){
			var res = [];
			for(var i = 0; i < arguments.length; i++){
				var arr = arguments[i];
				for(var j = 0; j < arr.length; j++){
					res.push(arr[j]);
				}
			}
			return res;
		},
		
		distinct: (arr, keyOf) => {
			keyOf = keyOf || (a => a);
			var keys = {}, result = [];
			
			arr.forEach(el => {
				var key = keyOf(el) + '';
				if(key in keys) return;
				keys[key] = true;
				result.push(el);
			});
			
			return result;
		}
		
	}

})