aPackage('nart.gl.model.animation', () => {

	var Animation = function(model){
		this.model = model;
		
		this.parts = {};
		this.frameIntervals = [];
		
		this.realFrames = null;
		this.realFrameInterval = null;
	};
	
	Animation.prototype = {
		addPart: function(name){
			this.model.getPart(name); // check existence
			
			this.parts[name] = (Object.keys(this.parts).map(k => this.parts[k])[0] || []).map(f => null);
		},
		removePart: function(name){
			delete this.parts[name];
		},
		renamePart: function(oldName, newName){
			this.parts[newName] = this.parts[oldName];
			delete this.parts[oldName];
		},
		
		checkFrameValues: function(values){
			var partsCount = Object.keys(this.parts).length;
			if(values.length !== partsCount){
				throw new Error('Expected length of frame to be ' + partsCount + ', got ' + values.length + ' instead; frame length must be equal to parts count.');
			}
		},
		checkInterval: function(ival){
			if(typeof(ival) !== 'number' || Number.isNaN(ival) || ival < 1){
				throw new Error('Incorrect value of timing between frames: ' + ival);
			}
		},
		checkRealFramesGenerated: function(){
			if(!this.realFrames){
				throw new Error('Real frames not generated. Use generateRealFrames(interval) first.');
			}
		},
		
		addFrame: function(values, interval, index){
			this.checkFrameValues(values);
			this.checkInterval(interval);
			
			var adder = typeof(index) === 'number'? (arr, val) => arrVal.splice(index, 0, val): arr.push(val)
			
			Object.keys(this.parts).forEach((name, index) => adder(this.parts[name], values[index]));
			adder(this.frameIntervals, interval);
		},
		removeFrame: function(index){
			var remover = typeof(index) === 'number'? arr => arr.splice(index, 1): arr => arr.pop();
				
			Object.keys(this.parts).forEach(name => remover(this.parts[name]));
			remover(this.frameIntervals);
		},
		setFrameValues: function(index, values){
			this.checkFrameValues(values);
			
			Object.keys(this.parts).forEach((name, pindex) => this.parts[name][index] = values[pindex]);
		},
		setFrameInterval: function(index, interval){
			this.checkInterval(interval);
			this.frameIntervals[index] = interval;
		},
		
		getSortedParts: function(){
			Object.keys(this.parts)
				.map(name => ({ name: name, part: this.parts[name] }))
				.sort((a, b) => {
					var orderA = this.model.getPart(a.name).getProcessingOrder(this.model.parts),
						orderB = this.model.getPart(b.name).getProcessingOrder(this.model.parts);
						
					return orderA > orderB? 1: orderA < orderB? -1: 0;
				})
		},
		
		getRealFrames: function(interval){
			this.checkInterval(interval);
			
			var result = {}, timeOffset = 0,
				parts = this.getSortedParts(),
				frameIntervals = this.frameIntervals.map((time, index) => {time: time, index: index}),
				revFrameIntervals = this.frameIntervals.reverse().map((time, index) => {time: time, index: index}),
			
			var getPrevOrCurrentAt = (time, partArr, partName) => {
				if(partArr.length === 0) return this.model.parts[partName].positioning.getDefaultValue();
				var bestTime = frameIntervals.reduce((a, b) => b.time > time? a: b)
				return { value: partArr[bestTime.index], time: bestTime.time }
			}
			
			var getNextAt = (time, partArr, partName) => {
				if(partArr.length === 0) return this.model.parts[partName].positioning.getDefaultValue();
				var bestTime = revFrameIntervals.reduce((a, b) => b.time <= time? a: b)
				return { value: partArr[bestTime.index], time: bestTime.time }
			}
			
			Object.keys(this.parts).forEach(name => result[name] = []);
			
			while(timeOffset < totalAnimationLength){
				var positions = {};
				
				parts.forEach((pair, partIndex) => {
					var name = pair.name,
						part = pair.part,
						prev = getPrevOrCurrentAt(timeOffset, part, name),
						next = getNextAt(timeOffset, part, name);
					
					var startTime = prev.time, finishTime = next.time;
					if(finishTime <= startTime) finishTime += totalAnimationLength
					var spanLength = finishTime - startTime;
					
					var realPos = this.parts[name].positioning.getPosition(prev.value, next.value, (timeOffset - startTime) / spanLength, positions);
					result[name].push(positions[name] = realPos);
				});
				
				timeOffset += interval;
			}

			return result;
		},
		
		
		generateRealFrames: function(interval){
			this.realFrames = this.getRealFrames(interval);
			this.realFramesInterval = interval;
			
			
			
		},
	};

	return Animation;
});