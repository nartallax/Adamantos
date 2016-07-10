// почти обычная очередь, но всегда содержит определенное количество значений
// всегда, когда на вход кладется новый элемент, с конца немедленно "выпадает" наиболее старый
aPackage('nart.util.queue.limited', () => {
	
	var LimitedQueue = function(size, initialValue){
		this.head = 0;
		this.els = [];
		while(size-->0) this.els.push(initialValue);
	};
	
	LimitedQueue.prototype = {
		size: function(){ return this.els.length },
		putGet: function(el){
			var old = this.els[this.head];
			this.els[this.head] = el
			this.head = (this.head + 1) % this.els.length;
			return old
		},
		getElements: function(){ return this.els; }
	}
	
	return LimitedQueue;
	
})