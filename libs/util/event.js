aPackage('nart.util.event', () => {
	"use strict";
	
	var id = -0xffffffff;
	var getId = () => id++;
	
	var Event = function(onSubscribed){
		// this breaks instanceof
		// allowing fancy thing like smth.onEvent(e => { ... })
		if(this instanceof Event) return Event(onSubscribed);
		
		var result = newListener => (result.listen(newListener), result)
		
		for(var i in Event.prototype) result[i] = Event.prototype[i];
		
		result.start();
		result.onSubscribed = onSubscribed;
		
		return result;
	};
	
	Event.prototype = {
		listen: function(l){
			if(!this.active) throw 'Could not listen to inactive event.'
			var id = l.eventListenerId || (l.eventListenerId = getId())
			this.listeners[id] || (this.listeners[id] = l)
			this.onSubscribed && this.onSubscribed(l);
			return this;
		},
		unlisten: function(l){
			if(!this.active) return; // its okay to unsubscribe from dead event
			if(l.eventListenerId) delete this.listeners[l.eventListenerId];
			return this;
		},
		fire: function(d){
			if(!this.active) throw 'Could not fire inactive event.';
			for(var i in this.listeners) this.listeners[i]({data: d});
		},
		stop: function(){
			if(!this.active) throw 'Could not stop inactive event.'
			delete this.listeners;
			this.active = false;
		},
		start: function(){
			if(this.active) throw 'Could not start event that is already active.'
			this.listeners = {};
			this.active = true;
		},
		subscriberCount: function(){ return Object.keys(this.listeners).length }
	}
	
	return Event;
});