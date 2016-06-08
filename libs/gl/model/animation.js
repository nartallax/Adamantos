aPackage('nart.gl.model.animation', () => {

	var Animation = function(model, parts, frames){
		this.model = model;
		
		this.parts = {};
		this.frameIntervals = [];
		
		this.realFrames = null;
		this.realFrameInterval = null;
		
		parts && this.setParts(parts);
		frames && frames.forEach(frame => this.addFrame(frame));
	};
	
	Animation.prototype = {
		setParts: function(parts){ parts.forEach(name => this.addPart(name)) },
		setFrames: function(frames){ frames.forEach(frame => this.addFrame(frame)) },
		
		addPart: function(name){
			this.model.getPart(name); // check existence
			
			this.parts[name] = Object.keys(this.parts).map(k => this.parts[k]) || [];
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
		
		getTransposedFramesIndex: function(){
			var result = {};
			Object.keys(this.parts).forEach(name => {
				var offset = 0, pvals = [];
				
				this.parts[name].forEach((v, findex) => {
					(v !== null) && pvals.push({time: offset, value: v});
					
					offset += this.frameIntervals[findex];
				})
				
				result[name] = pvals;
			});
				
			return result;
		},
		
		getPartObjectAt: function(index){ return this.model.parts[this.parts[index]] }
		
		getRealFrames: function(interval){
			checkInterval(interval);
			
			this.realFrames = [];
			var totalAnimationLength = this.frames.map(f => f.interval).reduce((a, b) => a + b, 0),
				tindex = this.getTransposedFramesIndex(),
				timeOffset = 0;
			
			var getPrevOrCurrentAt = (time, partArr) => {
				if(partArr.length === 0) return this.getPartObject(partIndex).positioning.getDefaultValue();
				partArr.reduce((a, b) => b.time > time? a: b)
			}
			
			var getNextAt = (time, partArr) => {
				if(partArr.length === 0) return this.getPartObjectAt(partIndex).positioning.getDefaultValue();
				partArr.reverse().reduce((a, b) => b.time <= time? a: b)
			}
			
			while(timeOffset < totalAnimationLength){
				var positions = {};
				this.parts.forEach((name, partIndex) => {
					var prev = getPrevOrCurrentAt(timeOffset, partIndex),
						next = getNextAt(timeOffset, partIndex);
					
					var startTime = prev.time, finishTime = next.time;
					if(finishTime <= startTime) finishTime += totalAnimationLength
					var spanLength = finishTime - startTime;
					
					positions[name] = this.parts[name].positioning.getPosition(prev.value, next.value, positions);
				});
			}
			
			
			
			
			var result = {};
			
			Object.keys(this.parts).forEach(name => {
			});
		},
		
		
		generateRealFrames: function(interval){
			this.realFrames = this.getRealFrames(interval);
			this.realFramesInterval = interval;
			
			
			
		},
	};

	return Animation;
});