aPackage('nart.omnipresent.collections', () => {
	"use strict";
	
	var ThreadLimiter = aRequire('nart.util.limiter.thread');
	
	// for consistency with other languages
	// proven to have same performance as original (at least in V8)
	Array.prototype.foreach = Array.prototype.forEach;
	
	Array.prototype.eachAsync = function(action, after, simLimit){
		var count = this.length + 1,
			dec = () => ((--count) <= 0) && setImmediate(after)
		dec();
		
		if(typeof(simLimit) === 'number' && simLimit > 0){
			var limiter = new ThreadLimiter(simLimit), i = 0;
			
			limiter.onThreadAvailable(() => {
				(i < this.length) && limiter.enqueue(cb => action(this[i++], cb), dec);
			})
		} else this.forEach(item => action(item, dec))
	
	}
	
	Array.prototype.mapAsync = function(mapper, after, threadLimit){
		var result = [];
		this.eachAsync(
			(el, cb) => mapper(el, mapped => cb(result.push(mapped))),
			() => after(result),
			threadLimit
		);
	}
	
	Array.prototype.toMap = function(keyOf, valueOf){
		var result = {};
		keyOf?
			valueOf? this.forEach(i => result[keyOf(i)] = valueOf(i)): this.forEach(i => result[keyOf(i)] = true):
			valueOf? this.forEach(i => result[i] = valueOf(i)): this.forEach(i => result[i] = true)
		return result
	}
	
	Array.prototype.distinct = function(keyOf){
		var map = this.toMap(keyOf, i => i)
		return Object.keys(map).map(key => map[key]);
	}
	
	Array.prototype.sortBy = function(mapper, desc){
		var ruler = desc? -1: 1,
			comparator = (a, b) => ((a = mapper(a)), (b = mapper(b)), a > b? ruler: a < b? -ruler: 0)
		return this.sort(comparator);
	}
	
});