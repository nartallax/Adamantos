aPackage('nart.util.formatter', () => {

	var formatterByRegexFunction = regex => str => {
		var parts = str.split(regex),
			phCount = ~~(parts.length / 2);
			
		for(var i = 1; i < parts.length; i += 2){
			parts[i] = parseInt(parts[i] - 1);
		}
		
		return function(){
			var result = '';
			for(var i = 0; i < parts.length - 1; i += 2){
				result += parts[i] + arguments[parts[i + 1]];
			}
			
			return result + parts[parts.length - 1];
		}
	}
	
	var bucksFormatter = formatterByRegexFunction(/\$(\d+)/)
	
	bucksFormatter.bucks = bucksFormatter;
	
	return bucksFormatter;

});