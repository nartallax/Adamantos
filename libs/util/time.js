aPackage('nart.util.time', () => {
	'use strict';

	var leftPad = (str, ch, len) => {
		str = str + '';
		return str.length >= len? str: new Array(len - str.length + 1).join(ch) + str;
	}
	var twoDigits = n => leftPad(n, '0', 2)
	var dateToString = (d, zeroBased) => {
		var date = leftPad(d.getFullYear() + (zeroBased? -1900: 0), '0', 4) + '.' 
				+ twoDigits(d.getMonth() + (zeroBased? 0: 1)) + '.' 
				+ twoDigits(d.getDate() + (zeroBased? -1: 0)),
			
			time = twoDigits(d.getHours() - (zeroBased? getZoneShift(): 0)) + ':' 
				+ twoDigits(d.getMinutes()) + ':' 
				+ twoDigits(d.getSeconds());
			
		return date + ' ' + time
	}
	var nowString = () => dateToString(new Date());
	
	var parseRangedInt = (value, max, min, deflt) => {
		deflt = typeof(deflt) === 'number'? deflt: min;
		var res = parseInt(value || (deflt + '')) || deflt;
		return (typeof(res) === 'number' && !Number.isNaN(res) && res >= min && res <= max)? res: deflt;
	}
	var parseToUnixtime = (str, zeroBased) => {
		var sp = str.split(' '),
			dateStr = sp[0] || '',
			timeStr = sp[1] || '';
			
		sp = dateStr.replace(/(^\D+|\D+$)/, '').split(/\D+/);
		var year = parseRangedInt(sp[0], 99999, 0),
			month = parseRangedInt(sp[1], 12, 1),
			day = parseRangedInt(sp[2], 31, 1);
			
		sp = timeStr.replace(/(^\D+|\D+$)/, '').split(/\D+/);
		var hours = parseRangedInt(sp[0], 23, 0),
			minutes = parseRangedInt(sp[1], 59, 0),
			seconds = parseRangedInt(sp[2], 59, 0);
			
		return time.unixtime(new Date(year, month - 1, day, hours, minutes, seconds));
		//year === 0 && month === 1 && day === 1 && hours === 0 && minutes === 0 && seconds === 0? 0: 
			
	}
	
	var getZoneShift = () => {
		var d = new Date(1970, 0, 1, 0, 0, 0),
			h = d.getHours(),
			uh = d.getUTCHours(),
			diff = Math.abs(h - uh);
			
		return - (diff > 12? diff - 24: diff < -12? diff + 24: diff);
	};
	
	var time = {
		getZoneShift: getZoneShift,
		milliseconds: () => Date.now(),
		unixtime: d => Math.floor((d || new Date()).getTime() / 1000),
		unixtimeToDate: (u, zeroBased) => time.millisecondsToDate(u * 1000, zeroBased),
		millisecondsToDate: (m, zeroBased) => {
			var d = new Date(m)
			if(zeroBased) d.setYear(d.getYear() - 70)
			return d;
		},
		formatDate: dateToString,
		formatUnixtime: (u, zeroBased) => dateToString(time.unixtimeToDate(u, zeroBased), zeroBased),
		formatMilliseconds: (m, zeroBased) => dateToString(time.millisecondsToDate(m, zeroBased), zeroBased),
		nowString: nowString,
		parseToUnixtime: parseToUnixtime
	}

	return time;
});