aPackage('nart.util.countdown', () => {

	// счетчик. когда становится равен нулю - вызывает функцию (не более одного раза)
	var Countdown = function(count, onZero){
		if(!(this instanceof Countdown)) return new Countdown(count, onZero);
		
		var listeners = [];
		
		var numOrOne = c => (typeof(c) === 'number'? c: 1);
		
		// это все можно было бы вынести в прототип, и в инстанс класса записывать onZero и count
		// но я не стал, для удобства передачи этих функций в качестве обработчиков чего-либо
		var fireOnZero = () => { (listeners && listeners.forEach(f => f())), (listeners = null) };
		this.inc = c => { (count += numOrOne(c)) };
		this.dec = c => { ((count -= numOrOne(c)) <= 0) && fireOnZero() };
		this.listen = f => typeof(f) === 'function' && listeners && listeners.push(f)
		
		this.listen(onZero);
		
		if(count < 1) fireOnZero();
	}
	
	return Countdown;

})