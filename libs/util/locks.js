// сервис блокировок
// гарантирует, что заявки на локи будут обработаны в порядке их поступленияs
aPackage('nart.util.locks', () => {
	"use strict";
	
	var locks = {}, listeners = {};

	var lock = name => locks[name] = true;
	var unlock = name => {
		delete locks[name];
		var lsers = listeners[name] || [];
		
		while(lsers.length){
			lsers.shift().call(null);
			if(locks[name]) return;
		}
		
		delete listeners[name];
	}

	var listenUnlock = (name, listener) => {
		
		if(!listeners[name]) listeners[name] = [];
			listeners[name].push(listener);
		
		if(!locks[name]){
			lock(name);
			setTimeout(() => unlock(name), 1);
		}
	}

	var acquireLock = (name, callback) => {
		listenUnlock(name, () => {
			lock(name);
			callback();
		})
	};

	var withLock = (name, callback) => acquireLock(name, () => callback(() => unlock(name)))
	
	return {
		acquire: acquireLock,
		free: unlock,
		wait: listenUnlock,
		with: withLock,
		have: name => (name in locks)
	};
	
})