// штука, которая умеет исполнять не более N асинхронных запросов одновременно
aPackage('nart.util.limiter.thread', () => {

	var Queue = aRequire('nart.util.queue'),
		Event = aRequire('nart.util.event');

	var ThreadLimiter = function(limit){
		this.limit = limit;
		this.runningCount = 0;
		this.queue = new Queue();
		this.onThreadAvailable = new Event(() => this.checkThreadAvailable());
		
		setTimeout(() => this.checkThreadAvailable(), 1);
	}
	
	ThreadLimiter.prototype = {
		/* just alias */
		run: function(body, after){ this.enqueue(body, after) },
		tryDequeue: function(){
			if(!this.haveThreadAvailable() || this.queue.isEmpty()){
				return this.checkThreadAvailable();
			}
			
			var el = this.queue.dequeue();
			this.runningCount++;
			this.checkThreadAvailable();
			el.body(() => {
				el.after && el.after();
				this.runningCount--;
				this.tryDequeue();
			})
		},
		enqueue: function(body, after){
			this.queue.enqueue({body: body, after: after})
			this.tryDequeue();
		},
		haveThreadAvailable: function(){ return this.runningCount < this.limit },
		checkThreadAvailable: function(){ 
			if(this.haveThreadAvailable()) this.onThreadAvailable.fire()
		}
	}
	
	return ThreadLimiter;

})