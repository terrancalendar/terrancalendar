var unix_leap_seconds = [78796800, 94694400, 126230400, 157766400, 189302400, 220924800, 252460800, 283996800, 315532800, 362793600, 394329600, 425865600, 489024000, 567993600, 631152000, 662688000, 709948800, 741484800, 773020800, 820454400, 867715200, 915148800, 1136073600, 1230768000, 1341100800];
var tc_leap_second_years = [2,3,4,5,6,7,8,9,10,11,12,13,15,18,20,21,22,23,24,26,27,29,36,39,42];

var seconds_in = {};
seconds_in.minute = 60;
seconds_in.hour = 60*seconds_in.minute;
seconds_in.day = 24*seconds_in.hour;
seconds_in.month = 28*seconds_in.day;
seconds_in.year = 13*seconds_in.month + seconds_in.day;
seconds_in.years_4 = 4*seconds_in.year + seconds_in.day;
seconds_in.years_128 = 32*seconds_in.years_4 - seconds_in.day;

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function pad(num, size, delimiter) {
 	if (! delimiter || delimiter == 'undefined') delimiter = '0';
	var s = num+"";
	while (s.length < size) s = delimiter + s;
	return s;
}

function TerranDate () {
}
	 
//utc_date must be a object containing year month day hour minute second offset(in seconds)
TerranDate.prototype.setByUTC = function(utc_date) {
	var date = this.getCleanUTCDate(utc_date);

	this.utc = {};
	this.utc.timestamp = Math.floor((Date.UTC(date.year, date.month-1, date.day, date.hour, date.minute, date.second) / 1000) - date.offset.seconds);
	if (isNaN(this.utc.timestamp)) this.utc.timestamp = 0;

	this.utc.is_leap_second = (unix_leap_seconds.indexOf(this.utc.timestamp) != -1 && date.second == 60 ? 1 : 0);

	this.utc.original = this.getUTCFromUNIXTimestamp(this.utc.timestamp, this.utc.is_leap_second, date.offset);
	this.utc.standard = this.getUTCFromUNIXTimestamp(this.utc.timestamp, this.utc.is_leap_second);

	this.tc = {};
	this.tc.timestamp = this.getTCTimestampFromUTCTimestamp(this.utc.timestamp, this.utc.is_leap_second);
	this.tc.original = this.getTCFromTCTimestamp(this.tc.timestamp, '', this.offsetToDatemod(date.offset.seconds));
	this.tc.standard = this.getTCFromTCTimestamp(this.tc.timestamp, '', 0);
	this.tc.reduced = this.reduceTCDate(this.tc.standard.date);
	this.tc.with_datemods = this.withDatemodsTCDate(this.tc.standard);
	this.tc.year_base_0 = this.getTCFromTCTimestamp(this.tc.timestamp, 0, 0);
};

//tc_date must be an object containing year month day hour minute second year_base datemod
TerranDate.prototype.setByTC = function(tc_date) {
	var date = this.getCleanTCDate(tc_date);
	this.tc = {};

	this.tc.timestamp = this.getTCTimestamp(date);

	this.tc.original = this.getTCFromTCTimestamp(this.tc.timestamp, date.year_base, date.datemod);
	this.tc.standard = this.getTCFromTCTimestamp(this.tc.timestamp, '', 0);
	this.tc.reduced = this.reduceTCDate(this.tc.standard.date);
	this.tc.with_datemods = this.withDatemodsTCDate(this.tc.standard);
	this.tc.year_base_0 = this.getTCFromTCTimestamp(this.tc.timestamp, 0, 0);
	


	this.utc = {};
	this.utc.is_leap_second = 0;
	this.utc.timestamp = this.tc.timestamp - 864000;
	for(var i=0; i < unix_leap_seconds.length; i++) {
		if (this.utc.timestamp == unix_leap_seconds[i]) this.utc.is_leap_second = 1;
		if (this.utc.timestamp > unix_leap_seconds[i]) this.utc.timestamp--;
	}

	this.utc.original = this.getUTCFromUNIXTimestamp(this.utc.timestamp, this.utc.is_leap_second, this.datemodToOffset(date.datemod.seconds));
	this.utc.standard = this.getUTCFromUNIXTimestamp(this.utc.timestamp, this.utc.is_leap_second);
};



//returns a cleaned date
TerranDate.prototype.getCleanUTCDate = function(date) {
	var clean_date = {};

	var val;
	for (var key in date) {
		if (key == 'offset') continue;

		val = parseInt(date[key]);
		if (isNaN(val)) val = 0;
		if (key != 'year' && val < 0) val = 0;
		clean_date[key] = val;
	}

	if (clean_date.month > 12) clean_date.month = 12;
	if (clean_date.day > 31) clean_date.day = 31;
	if (clean_date.hour > 23) clean_date.hour = 23;
	if (clean_date.minute > 59) clean_date.minute = 59;
	if (clean_date.second > 60) clean_date.second = 60;
	clean_date.offset = this.getCleanOffset(date.offset);
	return clean_date;
}

//returns an array (cleaned_datemod, datemod_in_seconds)
TerranDate.prototype.getCleanOffset = function(offset) {
	var multiplier = (offset.substr(0,1) == '-' ? -1 : 1);
	return {'original': offset, 'seconds': multiplier * ((parseInt(offset.substr(1,2))*3600) + (parseInt(offset.substr(4,2))*60))};
};


//returns a cleaned date
TerranDate.prototype.getCleanTCDate = function(date) {
	var clean_date = {};

	var val;
	for (var key in date) {
		if (key == 'datemod') continue;
		if (key == 'year_base' && (date[key]=='' || date[key]=='[year base]')) {
			clean_date[key] = '';
			continue;
		}

		val = parseInt(date[key]);
		if (isNaN(val)) val = 0;
		if (key != 'year' && val < 0) val = 0;
		clean_date[key] = val;
	}

	if (clean_date.month > 13) clean_date.month = 13;
	if (clean_date.day > 27) clean_date.day = 27;
	if (clean_date.hour > 23) clean_date.hour = 23;
	if (clean_date.minute > 59) clean_date.minute = 59;
	if (clean_date.second > 59) clean_date.second = 59;
	clean_date.datemod = this.getCleanDatemod(date.datemod);

	return clean_date;
}

//returns an array (cleaned_datemod, datemod_in_seconds)
TerranDate.prototype.datemodToSeconds = function(sign, datemod) {
	var multiplier;
	var split_arr = datemod.match(/\d*(Q|L|W|D|H|M)?/g);
	var seconds = 0;
	for(var i=0; i < split_arr.length; i++) {
		var char = split_arr[i].match(/(Q|L|W|D|H|M)/);
		char = (char ? char[0] : '');

		split_arr[i] = parseInt(split_arr[i]);
		if (isNaN(split_arr[i])) split_arr[i] = 0;

		multiplier=1;
		switch(char) {
			case 'Q': multiplier *= 3.25;
			case 'L': multiplier *= 4;
			case 'W': multiplier *= 7;
			case 'D': multiplier *= 24;
			case 'H': multiplier *= 60;
			case 'M': multiplier *= 60;
		}
		seconds += parseInt(multiplier * split_arr[i]);
	}
	return (sign == '-' ? -1 : 1) * seconds;
}

//returns an array (cleaned_datemod, datemod_in_seconds)
TerranDate.prototype.getCleanDatemod = function(datemod) {
	if (datemod == '[datemod]') datemod = '';
	datemod = datemod.toString().toUpperCase();
	datemod = datemod.replace(/[^QLWDHM\d-]/g, '');
	var sign = '+';
	if (datemod.substring(0,1) === '-') {
		sign = '-';
		datemod = datemod.substr(1);
	}
	datemod = datemod.replace(/[^QLWDHM\d]/g, '');

	if (datemod.length == 0) return {'original': '', 'seconds': 0};

	return {'original': sign+datemod, 'seconds': this.datemodToSeconds(sign, datemod) };
};

//tc_date must be an object containing year month day hour minute second year_base datemod
TerranDate.prototype.offsetToDatemod = function(offset_seconds) {
	var original = '';
	var sign = (offset_seconds > 0 ? '-' : '+');
	var seconds = Math.abs(offset_seconds);

	if (seconds === 0) {}
	else if (seconds%3600 == 0) original = sign+(seconds/3600)+'H';
	else if (seconds%60 == 0) original = sign+(seconds/60)+'M';
	else original = sign+seconds;

	return {'original':original,'seconds':-1 * offset_seconds};
};

//tc_date must be an object containing year month day hour minute second year_base datemod
TerranDate.prototype.datemodToOffset = function(datemod_seconds) {
	var original = '+00:00';
	var sign = (datemod_seconds > 0 ? '-' : '+');
	var seconds = Math.abs(datemod_seconds);

	if (seconds === 0 || seconds > 12 * 3600 || seconds%3600 != 0) { datemod_seconds=0; }
	else {
		original = sign + pad(Math.floor(seconds/3600), 2)+":"+pad(seconds%60, 2);
	}
	return {'original':original,'seconds':-1 * datemod_seconds};
};


//tc_date must be an object containing year month day hour minute second year_base datemod
TerranDate.prototype.reduceTCDate = function(date) {
	var loc = date.indexOf('TC');
	if (loc < 1) return 'TC';

	var tail = date.substr(loc);
	return date.substr(0,loc).replace(/(0|-|\+| |\.|&nbsp;|,|_|:)+$/,'') + tail;
};

//tc_date must be an object containing year month day hour minute second year_base datemod
TerranDate.prototype.withDatemodsTCDate = function(date) {
	var days = date.day + date.month*28;
	var weeks = Math.floor(days/7);
	days -= weeks * 7;

	var datemod =	(weeks ? weeks+"W":"") +
			(days ? days+"D":"") +
			(date.hour ? date.hour+"H":"") +
			(date.minute ? date.minute+"M":"") +
			(date.second ? date.second:"")+'';

	return date.year+'TC'+(date.year_base !== '' ? date.year_base : '')+(datemod != '' ? "+"+datemod : '');
};

//returns a tc timestamp
TerranDate.prototype.getTCTimestamp = function(date) {
	var year = date.year;
	var cycle_128_offsets=0;
	var timestamp=0;
	if (year < 0) { //negative dates
		cycle_128_offsets = Math.ceil(Math.abs(year) / 128);
		year += cycle_128_offsets*128;
	}
	else { //leap seconds
		var max = Math.ceil((tc_leap_second_years.max()) / 128)*128;
		for(var i=0; i < max && year >= 0; i++) {
			timestamp += this.secondsInTCYear(i, date.year_base);
			year--;
		}
		year++;
		timestamp -= this.secondsInTCYear(i-1, date.year_base);
	}

	var cycles_of_128 = Math.floor(year/128);
	year -= 128*cycles_of_128;
	timestamp += cycles_of_128 * seconds_in.years_128;

	if (year > 4) {
		//no additional leap days in first 4 years
		timestamp += 4 * seconds_in.year;
		year -= 4;

		//additional leap days in subsequent sets of 4 years
		var cycles_of_4 = Math.floor(year/4);
		year -= 4*cycles_of_4;
		timestamp += cycles_of_4 * seconds_in.years_4;

		if (year > 0) {
			year -= 1;
			timestamp += seconds_in.year + seconds_in.day;
		}
	}

	timestamp += year*seconds_in.year;
	year = 0;

	timestamp += date.month*seconds_in.month;
	timestamp += date.day*seconds_in.day;
	timestamp += date.hour*seconds_in.hour;
	timestamp += date.minute*seconds_in.minute;
	timestamp += date.second;
	
	timestamp -= cycle_128_offsets * seconds_in.years_128;

	timestamp += date.datemod.seconds;

	return timestamp;
}


//returns seconds in a year given a year
TerranDate.prototype.secondsInTCYear = function(year, year_base) {
	var seconds_this_year = seconds_in.year + (year%4==0 && year%128 !=0 ? seconds_in.day : 0);
	if (year_base === '' || year_base >= year) {
		for(var i=0; i < tc_leap_second_years.length; i++) {
			if (tc_leap_second_years[i] == year) seconds_this_year++;
		}
	}
	return seconds_this_year;
}

TerranDate.prototype.getTCTimestampFromUTCTimestamp = function(utc_timestamp, is_leap_second) {
	var timestamp = utc_timestamp + (10*seconds_in.day);

	for(var i=0; i < unix_leap_seconds.length; i++) {
		if (is_leap_second && utc_timestamp == unix_leap_seconds[i]) continue;
		if (utc_timestamp >= unix_leap_seconds[i]) timestamp++;
	}
	return timestamp;	
}

TerranDate.prototype.getUTCFromUNIXTimestamp = function(timestamp, is_leap_second, offset) {
	if (! offset || offset == 'undefined') offset = {'original':'+00:00', 'seconds':0};
	var date = {};
	date.offset = offset;
	timestamp += offset.seconds-is_leap_second;
   	var d = new Date(timestamp*1000);

	date.year = d.getFullYear();
	date.month = d.getUTCMonth()+1;
	date.day = d.getUTCDate();
	date.hour = d.getUTCHours();
	date.minute = d.getUTCMinutes();
	date.second = d.getUTCSeconds() + is_leap_second;
	date.date = date.year+"-"+pad(date.month,2)+"-"+pad(date.day,2)+" "+pad(date.hour,2)+":"+pad(date.minute,2)+":"+pad(date.second,2)+"&nbsp;UTC"+(date.offset.original == '+00:00' ? '' : date.offset.original);
	return date;
}

TerranDate.prototype.getTCFromTCTimestamp = function(timestamp, year_base, datemod) {
	if (! datemod || datemod == 'undefined') datemod = {'original':'', 'seconds':0};
	var date = {};
	date.year_base = year_base;
	date.datemod = datemod;
	timestamp -= datemod.seconds;
	var year=0;

	var cycle_128_offsets = 0;
	if (timestamp < 0) { //negative dates
		cycle_128_offsets = Math.ceil(Math.abs(timestamp)/seconds_in.years_128);
		timestamp += cycle_128_offsets * seconds_in.years_128;
	}
	else { //leap seconds
		var max = Math.ceil(tc_leap_second_years.max() / 128)*128;
		for(year=0; timestamp >= 0 && year < max; year++) {

			timestamp -= this.secondsInTCYear(year, year_base);
		}
		year--;
		timestamp += this.secondsInTCYear(year, year_base);
	}

	if (timestamp > this.secondsInTCYear(year, year_base)) {
		var cycles_of_128 = Math.floor(timestamp/seconds_in.years_128);
		year += 128 * cycles_of_128;
		timestamp -= cycles_of_128 * seconds_in.years_128;

		if (timestamp > seconds_in.year * 5) {
			//no additional leap days in first 4 years
			timestamp -= 4 * seconds_in.year;
			year += 4;

			//additional leap days in subsequent sets of 4 years
			var cycles_of_4 = Math.floor(timestamp/seconds_in.years_4);
			year += 4*cycles_of_4;
			timestamp -= cycles_of_4 * seconds_in.years_4;

			if (timestamp >= seconds_in.year + seconds_in.day) {
				year += 1;
				timestamp -= seconds_in.year + seconds_in.day;
			}
		}
		var cycles_of_1 = Math.floor(timestamp/seconds_in.year);
		year += cycles_of_1;
		timestamp -= cycles_of_1 * seconds_in.year;
	}

	date.year = year - (cycle_128_offsets * 128);

	date.month = Math.floor(timestamp/seconds_in.month);
	timestamp -= date.month * seconds_in.month;

	date.day = Math.floor(timestamp/seconds_in.day);
	timestamp -= date.day * seconds_in.day;

	date.hour = Math.floor(timestamp/seconds_in.hour);
	timestamp -= date.hour * seconds_in.hour;

	date.minute = Math.floor(timestamp/seconds_in.minute);
	timestamp -= date.minute * seconds_in.minute;

	date.second = timestamp;
	timestamp -= date.second;

	date.date = date.year+"."+date.month+"."+date.day+","+date.hour+"."+date.minute+"."+date.second+"&nbsp;TC"+date.year_base+date.datemod.original;

	return date;
}

TerranDate.prototype.isDelimiter = function(char) {
	return char.match(/[ +,-\.\/:_]+/); 
}

TerranDate.prototype.getUnitFromStrArr = function(str_arr, signed, ret, not_numeric) {
	if (! signed || signed == 'undefined') signed = 0;
	if (! ret || ret == 'undefined') ret = 0;
	if (! not_numeric || not_numeric == 'undefined') not_numeric = 0;
	var sign = 1;
	if(str_arr.length) {
		val = str_arr.shift();
		if(this.isDelimiter(val)) {
			if (signed && val=='-') sign = -1;
			if(str_arr.length) val = str_arr.shift();
			else return ret;
		}
		if (val == '') return ret;
		if (! not_numeric) val = sign*parseInt(val);
		ret = val;	
	}
	return ret;
}

TerranDate.prototype.strToTCDate = function(str) {
	var date = {};
	var sign = 1;
	str = str.replace(/[^ +,-\.\/:_CDHMNTWY0-9]+/g, "");
	var split_str = str.split(/TC/);


	split_str[0] = split_str[0].split(/([ +,-\.\/:_]+)/g);
	split_str[1] = split_str[1].split(/([ +,-\.\/:_]+)/g);

	date.year = this.getUnitFromStrArr(split_str[0], 1);
	date.month = this.getUnitFromStrArr(split_str[0]);
	date.day = this.getUnitFromStrArr(split_str[0]);
	date.hour = this.getUnitFromStrArr(split_str[0]);
	date.minute = this.getUnitFromStrArr(split_str[0]);
	date.second = this.getUnitFromStrArr(split_str[0]);
	date.fraction = this.getUnitFromStrArr(split_str[0]);
	if (! this.isDelimiter(split_str[1][0])) date.year_base = this.getUnitFromStrArr(split_str[1], 0,'');
	date.datemod = this.getUnitFromStrArr(split_str[1],1,'',1);
	return this.getCleanTCDate(date);
}


Array.prototype.max = function() {
	return Math.max.apply(null, this);
};




