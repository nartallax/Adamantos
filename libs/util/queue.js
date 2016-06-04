// обыкновенная очередь, FIFO
aPackage('nart.util.queue', () => {
	
	var Queue = function(){
		this.els = {};
		this.head = 0; // меньшее значение. указывает на элемент, который будет взят следующим
		this.tail = 0; // большее значение. указывает на пустую ячейку, в которую будет помещен новый элемент
	};
	
	Queue.prototype = {
		size: function(){ return this.tail - this.head },
		isEmpty: function(){ return this.size() < 1 },
		enqueue: function(el){ this.els[this.tail++] = el },
		dequeue: function(){ 
			var el = this.els[this.head];
			delete this.els[this.head];
			this.head++;
			return el;
		}
	}
	
	return Queue;
	
})