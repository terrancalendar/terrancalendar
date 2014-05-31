var moving = false;
var nav_multiplier = 0;
var nav_scroll_height = 0;
var count = 0;
var temp;

//for parsing query strings
var initial = true;

//used for header related issues
var header_height = 0;

//for droplabels
var drop_more = " more&nbsp;&rsaquo;&rsaquo; ";
var drop_less = " &lsaquo;&lsaquo;&nbsp;less ";

$(function(){
	function applyDefaults() {
		//style different links
		$('a[href^="http"]').attr('target', 'blank');
		$('a[href^="http"]').not('a[href^="http://terran"], a[href^="http://www.terran"]').filter(':not(.external)').addClass('external').append('<span class="e_arrow">&#10548;</span>');
		$('a[href^="?date"]').filter(':not(.internal_drop)').addClass('internal_drop').append('<span class="id_arrow">&#10548;</span>');
		$('a[href^="#"],a[data-name]').filter(':not(.internal)').addClass('internal').append('<span class="i_arrow">&#10549;</span>');
		$('area[href^="#"]').addClass(':not(.internal)');
	

		//add droplabels for dropdowns
		$('dropdown').each(function () {
			if ($(this).next('droplabel').prop('tagName') !== 'DROPLABEL')
				$('<droplabel/>').insertAfter(this).html(drop_more).attr('data-state', 'up');
		});

		//make invalid links red
		//$('a').not('[href^="#"],[href^="http"],[href^="?"],[href^="mailto"]').css('color', 'red');

		//allow for a tootip to be used multiple times without rewriting the same tooltip
		$('a[data-name]').each(function(){
			var original = $('a[data-tip][data-name="'+$(this).data('name')+'"]');
			$(this).attr('data-tip', original.data('tip')).attr('href', original.attr('href'));
		});

		//preload hover images
		$('img[data-alt]').each(function(){
			if ($(this).not('[data-loading="set"]').length) {
				$('<img/>')[0].src = $(this).data('alt');
				$(this).attr('data-loading','set');
			}
		});
	}

	applyDefaults();
	applyDefaults();

	//swaps image with alt
	function imageSwap(elems) {
		temp = elems.attr('src');if (initial) initial = false;
		elems.attr('src',elems.data('alt'));
		elems.data('alt', temp);
	}

	//swaps text with alt
	function swapHTML(elems) {
		temp = elems.html();
		elems.html(elems.data('alt'));
		elems.data('alt', temp);
	}

	//scrolls to and opens up dropdowns
	function scrollTo(selector, just_highlight) {
		if(! just_highlight || just_highlight == 'undefined') {
			if(history.pushState) {
				history.pushState(null, null, selector);
			}

			
			var dl = $(selector).parents('dropdown').next('droplabel');
			if (dl.length) {
				if (dl.html().indexOf("more") !== -1) {
					dl.trigger('click');
				}
			}
			$('html, body').animate({ scrollTop: parseInt($(selector).offset().top)-header_height }, 750);
			$(selector).children('droplabel').each(function(){
				$(this).attr('data-state', 'up').trigger('click');
			});
		}

		$('*').remove('.highlight_arrow').removeClass('highlight');

		var header = $(selector).filter('h2, h2, h4');
		if (! header.length) header = $(selector).find('h2, h3, h4').first();
		header.prepend('<span class="highlight_arrow">&#8618;</span>');
		header.addClass('highlight');
	};

	//closes header dropdown
	function closeDrop() {
		$('.drop_close, #drop > div > div').hide();
	}

	//resize cdate inputs when information is entered
	function resizeInput() {
		var mult = 12;
		var len = $(this).val().length*mult;
		if (len < mult) len = mult;
		$(this).css('width', len + 'px');
	}

	//sets cdates with values
	function setConvertDate(year, month, day, hour, minute, second, designator, year_base, offset_or_datemod, change) {
		if (! change || change == 'undefined') change = 0;
		$('cdate[data-ctype="'+designator+'"] [data-cunit="year"]').val(year);
		$('cdate[data-ctype="'+designator+'"] [data-cunit="month"]').val(month);
		$('cdate[data-ctype="'+designator+'"] [data-cunit="day"]').val(day);
		$('cdate[data-ctype="'+designator+'"] [data-cunit="hour"]').val(hour);
		$('cdate[data-ctype="'+designator+'"] [data-cunit="minute"]').val(minute);
		$('cdate[data-ctype="'+designator+'"] [data-cunit="second"]').val(second);
		if (designator=="TC") {
			$('cdate[data-ctype="TC"] [data-cunit="datemod"]').val(offset_or_datemod);
			$('cdate[data-ctype="TC"] [data-cunit="year_base"]').val(year_base);
		}
		else $('cdate[data-ctype="UTC"] [data-cunit="offset"]').val(offset_or_datemod);

		if (change) $('cdate[data-ctype="'+designator+'"] [data-cunit="second"]').trigger('change');
	}

	//returns an object representing stuff in the query string
	function setDateFromHREF(href) {
		if (href == '') href = window.location.href;
		var date_str = '';
		var parts = href.split("#")[0].replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			if (key == 'date') date_str = decodeURIComponent(value);
		});

		if (date_str == '') {
			if (href == window.location.href) {
				$('cdatebutton a[data-type="local"]').trigger('click');
			}
		}
		else {
			var date = new TerranDate();
			date = date.strToTCDate(date_str);
			date.datemod = (date.datemod.original == '+0' ? '' : date.datemod.original);
			setConvertDate(date.year,date.month,date.day,date.hour,date.minute,date.second,'TC',date.year_base,date.datemod,1);

			$('#convert_link').trigger('click');
		}
	}

	//drawas initial comments
	function drawComments() {
		$.get("comments.php?draw", function(data){
			$('#Comments > .drop_container').html(data);
			$('#loading_comments').hide();
			$('#drop').animate({ scrollTop: 0 }, 750);
			applyDefaults();
			
		});
	}

	//reorders and/or appends additional comments
	function loadComments() {
		$('#comments_show_more, #order').hide();
		
		$('#loading_comments').show();

		var order = $('#order').data('order');
		var offset = $('#comments_parent > .comment1').length;

		if (order != $('#comments_parent').data('order')) {
			$('#comments_parent').data('order', order);
			offset=0;
			$('#comments_parent').html('');
		}

		$.get("comments.php?offset="+offset+"&order="+order, function(data){
			var old_num_comments = $('#comments_parent > .comment1').length;
			$('#comments_parent').append(data);
			var new_num_comments = $('#comments_parent > .comment1').length;
			if (old_num_comments == new_num_comments) $('#comments_show_more').hide();
			else $('#comments_show_more').show();
			$('#order').show();
			$('#loading_comments').hide();
			applyDefaults();
		});
	}


	//prevent internal links from moving, but add the href to the window hash
	$(".internal, .internal_drop").click(function(event) {
        	event.preventDefault();
	});


	//clean and conver the dates
	$('cdate [data-cunit]').change(function(){
		var converted_dates = new TerranDate();
		var parent = $(this).parent();
		var date = {
			year: parent.children('[data-cunit="year"]').val(),
			month: parent.children('[data-cunit="month"]').val(),
			day: parent.children('[data-cunit="day"]').val(),
			hour: parent.children('[data-cunit="hour"]').val(),
			minute: parent.children('[data-cunit="minute"]').val(),
			second: parent.children('[data-cunit="second"]').val()
		};
		if (parent.data('ctype') == 'TC') {
			date.year_base = parent.children('[data-cunit="year_base"]').val();
			date.datemod = parent.children('[data-cunit="datemod"]').val();
			converted_dates.setByTC(date);
		}
		else if (parent.data('ctype') == 'UTC') {
			date.offset = parent.children('[data-cunit="offset"]').val();
			converted_dates.setByUTC(date);
		}
		setConvertDate(converted_dates.tc.original.year, converted_dates.tc.original.month, converted_dates.tc.original.day, converted_dates.tc.original.hour, converted_dates.tc.original.minute, converted_dates.tc.original.second, "TC", converted_dates.tc.original.year_base, converted_dates.tc.original.datemod.original);

		setConvertDate(converted_dates.utc.original.year, pad(converted_dates.utc.original.month, 2), pad(converted_dates.utc.original.day, 2), pad(converted_dates.utc.original.hour, 2), pad(converted_dates.utc.original.minute, 2), pad(converted_dates.utc.original.second, 2), 'UTC', '', converted_dates.utc.original.offset.original);

		//$('cdate input').each(function(){ resizeInput.call(this); });
		$('cdate input').each(resizeInput);
		$('cdate input[data-default]').trigger('blur');

		var sign = (converted_dates.tc.timestamp < 0 ? '' : '+');
		$('cdate[data-ctype="TC_timestamp"] span').html('<a class="internal_drop" href="?date=TC'+sign+converted_dates.tc.timestamp+'">TC'+sign+converted_dates.tc.timestamp+'</a>');
		$('cdate[data-ctype="UNIX_timestamp"] span').html(converted_dates.utc.timestamp);

		$('cdate[data-ctype="TC_dates"] span').html('<ib style="white-space: nowrap;"><ib style="text-align: right;"><span class="color_h4">original:</span><br /><span class="color_h4">standard:</span><br /><span class="color_h4">reduced:</span><br /><span class="color_h4">reduced with datemods:</span><br /><span class="color_h4">year base 0:</span></ib> <ib style="text-align: left;"><a class="internal_drop" href="?date='+converted_dates.tc.original.date.replace('&nbsp;',' ')+'">'+converted_dates.tc.original.date+'</a><br /><a class="internal_drop" href="?date='+converted_dates.tc.standard.date.replace('&nbsp;',' ')+'">'+converted_dates.tc.standard.date+'</a><br /><a class="internal_drop" href="?date='+converted_dates.tc.reduced.replace('&nbsp;',' ')+'" id="reduced">'+converted_dates.tc.reduced+'</a><br /><a class="internal_drop" href="?date='+converted_dates.tc.with_datemods.replace('&nbsp;',' ')+'">'+converted_dates.tc.with_datemods+'</a><br /><a class="internal_drop" href="?date='+converted_dates.tc.year_base_0.date.replace('&nbsp;',' ')+'">'+converted_dates.tc.year_base_0.date+'</a></ib></ib>');
		$('cdate[data-ctype="UTC_dates"] span').html('<ib style="white-space: nowrap;"><ib style="text-align: right;"><span class="color_h4">original:</span><br /><span class="color_h4">standard:</span></ib> <ib style="text-align: left;">'+converted_dates.utc.original.date+'<br />'+converted_dates.utc.standard.date+'</ib></ib>');

		$(".internal_drop").click(function(event) {
        		event.preventDefault();
		});	

		$('cdatebutton a').removeClass('selected');
	});

	//resize inputs
	$('cdate input').keyup(resizeInput).blur(resizeInput);

	//replace default values when empty string
	$('cdate input[data-default]').focus(function(){
		if ($(this).val() == $(this).data('default')) $(this).val('');
	}).blur(function(){
		if ($(this).val() == '') $(this).val($(this).data('default'));
		resizeInput.call(this);
	});

	//change widths and positioning when resized and onload
	$(window).on('resize load', function(){
		var window_width = parseInt($(window).outerWidth(true));
		var window_height = parseInt($(window).outerHeight(true));
		$('#Introduction > div').css('width', (window_width-40)+'px');
		var date_width = parseInt($('date').outerWidth())+40;
		header_height = parseInt($('header > div').outerHeight())+23;
		var intro_height = parseInt($('#Introduction').outerHeight())+40;

		$('#drop').css('max-height', (window_height-header_height)+'px');

		if (date_width >= window_width) {
			$('#Introduction > div').css('width', 'auto');
		}
		else $('#Introduction > div').css('width', date_width+'px');

		$('#Introduction').css('margin-top',(header_height-16)+'px');
		$('#Introduction > a').css('top', parseInt(intro_height/2-72)+'px');
		$('#small_left').css('left', parseInt((window_width-date_width)/4-92)+'px');	
		$('#small_right').css('right', parseInt((window_width-date_width)/4-92)+'px');

		$('#Introduction > div > ib').css('width', 'auto');

		
		if (parseInt($('header > div').outerHeight()) < 55) $('#header_right').css('float', 'right');
		else $('#header_right').css('float', 'none');
	});

	//swap hover images
	$(document).on('mouseenter mouseleave', 'img[data-alt]', function(){
		imageSwap($(this));
	//open and close dropdowns
	}).on('click', 'droplabel', function(){
		if ($(this).attr('data-state') == 'up') {
			$(this).html(drop_less);
			$(this).attr('data-state', 'down');
			$(this).prev('dropdown').slideDown(500);
		}
		else {
			$(this).html(drop_more);
			$(this).attr('data-state', 'up');
			if ($(this).parent("[id]").length)
				$('html, body').animate({ scrollTop: parseInt($(this).parent("[id]").offset().top)-header_height }, 750);
			$(this).prev('dropdown').slideUp(500);
		}
	//scroll to id
	}).on('click', ".internal", function(){
		if ($(this).parents('#Comments').length) return;
		scrollTo($(this).attr('href'));
	//scroll to id
	}).on('click', '[data-move]', function(){
		closeDrop();
		scrollTo($(this).data('move'));
	//open up header drops
	}).on('click', '.header_link[data-for]', function(){
		$('#drop > div > div').hide();
		$('.drop_close').css('display','inline-block');
		$('.drop_close, #'+$(this).data('for')).show();
	//close drop
	}).on('click', '.drop_close', function(){
		closeDrop();
	//open up sub menu
	}).on('click', 'navarrow', function(){
		if($(this).hasClass('open')) {
			$(this).removeClass('open').css('transform','rotate(0deg)').css('-webkit-transform','rotate(0deg)').css('-moz-transform','rotate(0deg)').css('-o-transform','rotate(0deg)').css('-ms-transform','rotate(0deg)');
			$(this).siblings('navitems').hide(300);
		}
		else {
			$(this).addClass('open').css('transform','rotate(90deg)').css('-webkit-transform','rotate(90deg)').css('-moz-transform','rotate(90deg)').css('-o-transform','rotate(90deg)').css('-ms-transform','rotate(90deg)');
			$(this).siblings('navitems').show(300).css('display','block');
		}
	//close drop
	}).on('click','.internal',function(){
		if($(this).parents('#Nav, #Compare, #Convert').length) closeDrop();
	//open up the convert date section with the current local time
	}).on('click', "#clock", function(){
		$('cdatebutton [data-type="local"]').trigger('click');
	//open up the convert date section with the date in the href
	}).on('click', ".internal_drop", function(){
		if ($(this).filter('[data-type]').length) {
			var d = new Date();
			var j_timestamp = d.getTime();
			var offset = ($(this).data('type') == 'local' ? d.getTimezoneOffset() * 60 : 0);
		   	var d = new Date(j_timestamp - offset*1000);

			offset = (offset <= 0 ? "+" : "-") + pad(Math.floor(offset/3600),2)+":"+pad(Math.floor(offset%60),2);

			setConvertDate(d.getFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds(),'UTC','',offset,1);
			$(this).attr('href', "?date="+$('#reduced').html());
		}
		else {	
			setDateFromHREF($(this).attr('href'));
			$('#convert_link').trigger('click');
		}
		if(history.pushState && ! initial) history.pushState(null, null, $(this).attr('href'));
		if (initial) initial = false;
		if ($(this).is('cdatebutton a')) $(this).addClass('selected');
	//open up the commen section
	}).on('click', '#comment_icon', function(){
		drawComments();
	//load additional comments
	}).on('click', '#comments_show_more', function(){
		loadComments();
	//reply to a comment
	}).on('click', '.comment_reply', function(){
		$('#post_a_comment').show();
		$("#comment_form_header").html("Reply to post #"+$(this).data('id'));
		$('#parentid').val($(this).data('id'));
	//????
	}).on('click', '#post_a_comment', function(){
		$('#post_a_comment').hide();
		$("#comment_form_header").html($(this).html());
	//show all of the comment
	}).on('click', '.comment_body droplabel', function(){
		if ($(this).attr('data-state') == 'up') $(this).siblings('.hellip').hide();
		else $(this).siblings('.hellip').show();
	//post  comment
	}).on('click', '#comment_form input[type="submit"]', function(){
		$.ajax({
			type: "POST",
			url: "comments.php?draw",
			data: $('#comment_form').serialize(),
			success: function(data) {
				$('#Comments > .drop_container').html(data);
				$('#drop').animate({ scrollTop: 0 }, 750);
				$('#loading_comments').hide();
				applyDefaults();
			}
		});
	//reorder dates
	}).on('click', '#order', function(){
		var order = $(this).data('order');
		var new_order = ($(this).data('order') == 'ASC' ? 'DESC' : 'ASC');

		$('#loading_comments').show();
		$('#comments_show_more, #order').hide();

		$.get("comments.php?order="+new_order, function(data){
			$('#comments_parent').html(data);
			
			swapHTML($('#order'));
			$('#loading_comments').hide();
			$('#comments_show_more, #order').show();

			applyDefaults();

			$('#order, #comments_parent').data('order', new_order);
		});
	});

	//fill the Convert section with the date in the query string or local time
	setDateFromHREF('');

	//resize inputs
	$('cdate input').each(resizeInput);

	//scroll to hash
	$(window).on('load', function(){
		var hash = window.location.hash.substring(1).replace(/\./g, '\\.');
		if (hash != "" && $('#'+hash).length) scrollTo('#'+hash);
	});



	var image_is_loaded = false;
	$("#date_notation_image").load(function() {
		$($(this).attr('usemap')+" area").each(function(){
			$(this).data('coords', $(this).attr('coords'));
		});

		image_is_loaded = true;
		$(window).trigger('resize');
	});


	function ratioCoords (coords, ratio) {
		coord_arr = coords.split(",");

		for(i=0; i < coord_arr.length; i++) {
			coord_arr[i] = Math.round(ratio * coord_arr[i]);
		}

		return coord_arr.join(',');
	}
	$(window).on('resize', function(){
		if (image_is_loaded) {
			var img = $("#date_notation_image");
			var ratio = img.width()/img.data('width');

			$(img.attr('usemap')+" area").each(function(){
				$(this).attr('coords', ratioCoords($(this).data('coords'), ratio));
			});
		}
	});

	window.onpopstate = function(e){
		scrollTo(e.target.location.hash, 1);
	};

});

