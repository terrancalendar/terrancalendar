	$(function(){
		var unix_leap_seconds = [78796800, 94694400, 126230400, 157766400, 189302400, 220924800, 252460800, 283996800, 315532800, 362793600, 394329600, 425865600, 489024000, 567993600, 631152000, 662688000, 709948800, 741484800, 773020800, 820454400, 867715200, 915148800, 1136073600, 1230768000, 1341100800];

		function timetick (designator, data_class) {
			if (! data_class) data_class = 'now';
			var time = $('[data-designator="'+designator+'"][data-class="'+data_class+'"][data-type="date"]');
			if (! time.length) return;

			if (time.data('timestamp') == '') time.data('timestamp', 0);
			if (time.data('isleapsecond') == '') time.data('isleapsecond', 0);
			var timestamp = parseInt(time.data('timestamp'));
			var isleapsecond = parseInt(time.data('isleapsecond'));

			if ($.inArray(timestamp, unix_leap_seconds) ===-1) isleapsecond = 0;

			var time_timestamp = timestamp-isleapsecond;
			if (designator == 'TAI') {
				var tai_offset = 10
				unix_leap_seconds.forEach(function(unix_leap_second) {
					if (unix_leap_second == timestamp && isleapsecond) tai_offset--;
					if (unix_leap_second <= timestamp) tai_offset++;
				});
				time_timestamp = timestamp+tai_offset;
			}
			
			var d = new Date(time_timestamp*1000);
			var date = d.toISOString();
			date = date.replace('T', ' ').replace('Z', '').replace('.000', '');

			if (isleapsecond && designator == 'UTC') {
				time_timestamp++;
				date = date.replace('59:59', "59:60");
			}

			isleapsecond_temp = isleapsecond;
			if ($.inArray(timestamp+1, unix_leap_seconds) !==-1) isleapsecond = 1;

			if (isleapsecond_temp) isleapsecond = 0;
			else timestamp++;

			time.data('timestamp', timestamp);
			time.data('isleapsecond', isleapsecond);
			time.html(date);

			$('[data-class="'+data_class+'"][data-designator="'+designator+'"][data-type="timestamp"]').html(time_timestamp);
		}


		var tc_leap_second_years = [2,3,4,5,6,7,8,9,10,11,12,13,15,18,20,21,22,23,24,26,27,29,36,39,42];

		function num_leap_seconds_in_year(year) {
			var count=0;
			for (var i=0; i < tc_leap_second_years.length; i++) {
				if (year == tc_leap_second_years[i]) count++;
			}
			return count;
		}
		function num_leap_seconds_since_year(year) {
			var count=0;
			for (var i=0; i < tc_leap_second_years.length; i++) {
				if (year > tc_leap_second_years[i]) count++;
			}
			return count;
		}
		function pad(num, size, delimiter) {
		 	if (! delimiter) delimiter = '0';
			var s = num+"";
			while (s.length < size) s = delimiter + s;
			return s;
		}
		function tctick(just_pad, data_class) {
			if (! data_class) data_class = 'now';
			var td = new Object(); // td = terran date
			td.year = $('[data-unit="year"][data-class="'+data_class+'"]');
			td.month = $('[data-unit="month"][data-class="'+data_class+'"]');
			td.day = $('[data-unit="day"][data-class="'+data_class+'"]');
			td.hour = $('[data-unit="hour"][data-class="'+data_class+'"]');
			td.minute = $('[data-unit="minute"][data-class="'+data_class+'"]');
			td.second = $('[data-unit="second"][data-class="'+data_class+'"]');
			td.designator = $('[data-unit="designator"][data-class="'+data_class+'"]');
			td.year_val = parseInt(td.year.html());
			td.month_val = parseInt(td.month.html());
			td.day_val = parseInt(td.day.html());
			td.hour_val = parseInt(td.hour.html());
			td.minute_val = parseInt(td.minute.html());
			td.second_val = parseInt(td.second.html());
			td.designator_val = td.designator.html();
			if (! just_pad) {
				var leap_seconds = num_leap_seconds_in_year(td.year_val);
				var leap_days = 1+(td.year_val%4 == 0 && td.year_val%128 != 0 ? 1 : 0);
				var already_ticked = false;
				if (td.month_val==13) {
					var current_num_seconds_in_month = td.day_val*86400 + td.hour_val*3600 + td.minute_val*60 + td.second_val;
					var max_num_seconds_in_month = leap_days*86400 + leap_seconds;

					if (current_num_seconds_in_month+1 == max_num_seconds_in_month) {
						td.year_val++;
						td.month_val = td.day_val = td.hour_val = td.minute_val = td.second_val = 0;
						already_ticked = true;
					}
				}
				if (! already_ticked) {
					td.second_val++;
					if (td.second_val == 60) {
						td.second_val=0;
						td.minute_val++;
						if (td.minute_val == 60) {
							td.minute_val=0;
							td.hour_val++;
							if (td.hour_val == 24) {
								td.hour_val=0;
								td.day_val++;
								if (td.day_val == 28) {
									td.day_val=0;
									td.month_val++;
								}
							}
						}
					}
				}
				td.designator.data('tc_timestamp', 1 + parseInt(td.designator.data('tc_timestamp')));
			}
			td.year.filter('[data-pad]').each(function(){
				$(this).html(pad(td.year_val,$(this).data('pad')));
			});
			td.month.filter('[data-pad]').html(pad(td.month_val,2));
			td.day.filter('[data-pad]').html(pad(td.day_val,2));
			td.hour.filter('[data-pad]').html(pad(td.hour_val,2));
			td.minute.filter('[data-pad]').html(pad(td.minute_val,2));
			td.second.filter('[data-pad]').html(pad(td.second_val,2));
			td.designator.filter('[data-pad]').html(pad(td.designator_val,2));

			td.year.filter(':not([data-pad])').html(td.year_val);
			td.month.filter(':not([data-pad])').html(td.month_val);
			td.day.filter(':not([data-pad])').html(td.day_val);
			td.hour.filter(':not([data-pad])').html(td.hour_val);
			td.minute.filter(':not([data-pad])').html(td.minute_val);
			td.second.filter(':not([data-pad])').html(td.second_val);
			td.designator.filter(':not([data-pad])').html(td.designator_val);
			
			$('[data-class="'+data_class+'"][data-designator="TC"][data-type="timestamp"]').html(td.designator.data('tc_timestamp'));
		}

		function tickall(padding) {
			tctick(padding); timetick('UTC'); timetick('TAI'); timestamp_offset('TAI'); timestamp_offset('TC'); timestamp_offset('TCTAI'); tctick(padding, 'local'); tctick(padding, '25');
		}

		function timestamp_offset(designator, data_class) {
			if (! data_class) data_class = 'now';
			var timestamp = parseInt($('[data-class="'+data_class+'"][data-designator="'+designator+'"][data-type="timestamp"]').html());
			var offset = timestamp-parseInt($('[data-class="'+data_class+'"][data-designator="UTC"][data-type="timestamp"]').html())
			$('[data-class="'+data_class+'"][data-designator="'+designator+'"][data-type="timestamp_offset"]').html(offset);
			if (designator == 'TC') {
				var year = parseInt($('[data-class="'+data_class+'"][data-unit="year"]').html());
				offset -= 864000 + num_leap_seconds_since_year(year);
			}
			if (designator == 'TCTAI') {
				offset = num_leap_seconds_since_year(year) + $('[data-class="'+data_class+'"][data-designator="TAI"][data-type="date_offset"]').html() - $('[data-class="'+data_class+'"][data-designator="TC"][data-type="date_offset"]').html();
			}

			$('[data-class="'+data_class+'"][data-designator="'+designator+'"][data-type="date_offset"]').html(offset);
		}

		function tcToLocalTime(data_class) {
			selector = '[data-class="'+data_class+'"][data-designator="TC"]';
			var timestamp = parseInt($(selector+'[data-tc_timestamp]').data('tc_timestamp'));
			var date_obj = new TerranDate();
			var date;
			var date = date_obj.getTCFromTCTimestamp(timestamp,'', date_obj.offsetToDatemod( -60 * parseInt((new Date()).getTimezoneOffset()) ));
			$(selector+'[data-unit="year"]').html(date.year);
			$(selector+'[data-unit="month"]').html(date.month);
			$(selector+'[data-unit="day"]').html(date.day);
			$(selector+'[data-unit="hour"]').html(date.hour);
			$(selector+'[data-unit="minute"]').html(date.minute);
			$(selector+'[data-unit="second"]').html(date.second);
			$(selector+'[data-unit="datemod"]').html(date.datemod.original);
			$('number '+selector+'[data-unit="datemod"]').each(function(){
				$(this).html(date.datemod.original.replace(/(\+|-)/,''));
				$(this).parents('unit').prev().find('number').html((date.datemod.seconds > 0)?'+':'-');
			});
		}

		tcToLocalTime('local'); tickall(1); setInterval(function(){tickall(0);}, 1000);
	});
