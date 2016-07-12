aPackage('nart.util.collections', () => {

	var ThreadLimiter = aRequire('nart.util.limiter.thread');

	return {
		
		eachAsync: (arr, action, after, simLimit) => {
			var count = arr.length;
			if(count < 1) return setImmediate(after);
			var haveLimit = typeof(simLimit) === 'number' && simLimit > 0;
			
			var dec = () => ((--count) === 0) && setImmediate(after)
			
			if(!haveLimit){
				
				arr.forEach(item => action(item, dec))
				
			} else {
				
				var limiter = new ThreadLimiter(simLimit),
					i = 0;
				
				limiter.onThreadAvailable(() => {
					if(i >= arr.length) return;
					var item = arr[i++];
					limiter.enqueue(cb => action(item, cb), dec);
				})
				
			}
		},
		
		mapAsync: (arr, mapper, after) => {
			var result = [],
				cb = () => after(result),
				count = arr.length;
			
			if(arr.length < 1) return setImmediate(cb);
			
			arr.forEach(item => mapper(item, mapRes => {
				result.push(mapRes);
				count--;
				if(count === 0) setImmediate(cb);
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