#!/usr/bin/env python2
#
# Unity indicator for the terran computational calendar
#
# This was created and tested on Ubuntu 14.04 running Python 2.7.6.
#
# Last updated at 44.5.16,21.34.33 TC (2014-05-26 21:34:33 UTC)
#
# This work (terran computational calendar, by http://terrancalendar.com) is free of known copyright restrictions.
# For information about it's Public Domain Mark go to http://creativecommons.org/publicdomain/mark/1.0/
#
#===INSTALL===
#	Requires python-appindicator package:
#	sudo apt-get install python-appindicator
#
#	~~Command Line~~
#	Make sure it's executable (chmod +x terran_computational_calendar.py)
#	and run it:  ./terran_computational_calendar.py
#
#	or
#
#	~~Add it to Startup Applications~~
#	Run Startup Applications (search for it in the Dash (tap super key & then search))
#	Click the add button and browse to the location of terran_computational_calendar.py.  The name and description fields are at your discretion.
#	It will show up in the unity panel next time you restart your computer.
#
#==Removal==
#	There is a 'Quit' menu option on this app indictor that will close the appindicator and stop program from running. However, If you wish remove it from your startup applications, you have to do that from the Startup Applications program itself.
#
#==Usage==
#	Clicking the date in the unity panel will open the app indicator's menu
#	Clicking "Copy to Clipboard" will copy the terran computational date
#	Clicking the next line will switch between your local timezone/datemod
#	Clicking the gregorian date will copy it
#	Clicking Quit will remove this indicator from the unity panel and stop the application from running.

import gtk
import appindicator
import os
import time
import math
from time import gmtime, strftime
import time
from array import *


timezone = 'UTC'
local_timezone = strftime("%Z",time.localtime())
local_datemod_seconds = -1 * time.timezone
local_time = time.localtime()
if local_time.tm_isdst :
	local_datemod_seconds += 3600

local_datemod = ''

#item_debug = gtk.MenuItem('')
#item_debug = gtk.MenuItem('Debug')

unix_leap_seconds = array('L', [78796800, 94694400, 126230400, 157766400, 189302400, 220924800, 252460800, 283996800, 315532800, 362793600, 394329600, 425865600, 489024000, 567993600, 631152000, 662688000, 709948800, 741484800, 773020800, 820454400, 867715200, 915148800, 1136073600, 1230768000, 1341100800])
tc_leap_second_years = array('L', [2,3,4,5,6,7,8,9,10,11,12,13,15,18,20,21,22,23,24,26,27,29,36,39,42])

#global_debug = ''

class terrandate:
	def secondsInYear(self,year):
		leap_day = 0;
		if year%4 == 0 and year%128 != 0:
			leap_day = 1;
		seconds_in_year = 86400 * (365 + leap_day)

		for i in range(len(tc_leap_second_years)):
			if year == tc_leap_second_years[i]:
				seconds_in_year += 1;

		return seconds_in_year;
		

	def secondsToDatemod(self,seconds):
		if seconds == 0:
			return '';
		if seconds%3600 == 0:
			return str(str(seconds/3600)+'H')
		if seconds%60 == 0:
			return str(str(seconds/60)+'M')
		return seconds


	def tick(self):
		global local_datemod, global_debug
		local_datemod = self.secondsToDatemod(local_datemod_seconds)

		self.unix_timestamp = int(time.time())

		self.tc_timestamp = self.unix_timestamp;

		for i in range(len(unix_leap_seconds)):
			if self.unix_timestamp == unix_leap_seconds[i] and int(time.strftime("%S")) == 0:
				self.tc_timestamp += 1;
			if self.unix_timestamp > unix_leap_seconds[i]:
				self.tc_timestamp += 1;
		
		self.tc_timestamp += 864000

		seconds_left = self.tc_timestamp
		self.datemod_seconds = 0;
		if timezone != 'UTC':
			self.datemod_seconds = local_datemod_seconds

		seconds_left += self.datemod_seconds;

		self.datemod = self.secondsToDatemod(self.datemod_seconds);

		self.year = 0;
		self.month = 0;
		self.day = 0;
		self.hour = 0;
		self.minute = 0;
		self.second = 0;

		seconds_in_minute = 60
		seconds_in_hour = seconds_in_minute * 60
		seconds_in_day = seconds_in_hour * 24
		seconds_in_month = seconds_in_day * 28

		while seconds_left >= self.secondsInYear(self.year):
			seconds_left -= self.secondsInYear(self.year)
			self.year += 1;

		while seconds_left >= seconds_in_month:
			seconds_left -= seconds_in_month
			self.month += 1;

		while seconds_left >= seconds_in_day:
			seconds_left -= seconds_in_day
			self.day += 1;

		while seconds_left >= seconds_in_hour:
			seconds_left -= seconds_in_hour
			self.hour += 1;

		while seconds_left >= seconds_in_minute:
			seconds_left -= seconds_in_minute
			self.minute += 1;

		self.second = seconds_left;

		self.date = str(str(self.year)+'.'+str(self.month)+'.'+str(self.day)+','+str(self.hour)+'.'+str(self.minute)+'.'+str(self.second)+' TC'+str(self.datemod))


terran_date_obj = terrandate()	
gregorian_date = ' '

if __name__ == "__main__":

	filename = os.getcwd() + '/.terran_date_timezone'


	def tick(args=None):
		global gregorian_date
		terran_date_obj.tick()
		ind.set_label(terran_date_obj.date)

		if timezone == 'UTC':
			current_time = gmtime()
		else:
			current_time = time.localtime()

		gregorian_date = str(strftime("%Y-%m-%d %H:%M:%S",current_time) + " " + timezone)
			
		item_gregorian_category.set_label('Gregorian Date  ( ' + strftime("%A",current_time)+' )')
		item_gregorian.set_label(gregorian_date)
		return True

	def writeTimezone(widget, new_timezone):
		global timezone, local_timezone
		with open(filename, "w") as f:
			f.write(new_timezone)
		timezone = new_timezone
		if timezone == 'UTC':
			item_timezone.set_label('Use your local datemod/timezone ('+ local_datemod +'/' + local_timezone + ')') 
			item_timezone.connect("activate", writeTimezone, local_timezone)
		else:
			item_timezone.set_label('Use standard TC/UTC date')
			item_timezone.connect("activate", writeTimezone, 'UTC')
		return True

	def copyDate(widget, date_type):
		clipboard = gtk.Clipboard(gtk.gdk.display_get_default(), "CLIPBOARD")
		if date_type == 'terran':
			clipboard.set_text(terran_date_obj.date, -1)
		else:
			clipboard.set_text(gregorian_date, -1)

		return True
              

	icon_image = os.path.dirname(__file__) + "/my_inv.png"
	if not os.path.isfile(icon_image):
		icon_image = "/usr/share/unity/icons/panel-shadow.png"
	ind = appindicator.Indicator ("terran-computational-calendar", icon_image, appindicator.CATEGORY_APPLICATION_STATUS)
	ind.set_status (appindicator.STATUS_ACTIVE)
	menu = gtk.Menu()


        #Menu item: Quit
	image = gtk.Image()
	image.set_from_icon_name("gtk-quit", 24)
	item_quit = gtk.ImageMenuItem()
	item_quit.set_label("Quit")
	item_quit.set_image(image)
	item_quit.set_always_show_image(True)
	item_quit.connect("activate", gtk.main_quit)

	
	item_gregorian = gtk.MenuItem('')
	item_gregorian_category = gtk.MenuItem('Gregorian Date')
	item_gregorian_category.set_sensitive(False);
	item_gregorian.connect("activate", copyDate, 'gregorian')

	item_copy_terran = gtk.MenuItem('Copy to Clipboard')
	item_copy_terran.connect("activate", copyDate, 'terran')

	menu.append(item_copy_terran)
	menu.append(gtk.SeparatorMenuItem())
	if local_timezone != 'UTC':
	  	try:
			with open(filename) as f:
				timezone = f.read() 
			
		except IOError:
			timezone = 'UTC'
		item_timezone = gtk.MenuItem('')
		menu.append(item_timezone)
		menu.append(gtk.SeparatorMenuItem())
		writeTimezone(None, timezone)
	menu.append(item_gregorian_category)
	menu.append(item_gregorian)
	menu.append(gtk.SeparatorMenuItem())
	#menu.append(item_debug)
	menu.append(gtk.SeparatorMenuItem())
	menu.append(item_quit)



	#display menu
	menu.show_all()
	ind.set_menu(menu)

	tick()
	gtk.timeout_add(1000, tick)    
	gtk.main()

