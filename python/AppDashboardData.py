#!\Python27\32_bit\python.exe

import httplib2
import json
import pprint
import cgi, cgitb
import datetime
from datetime import timedelta
from datetime import time
import os, sys
import dg_generics
import operator

import xml.etree.ElementTree as ET


from oauth2client.client import SignedJwtAssertionCredentials
from apiclient.discovery import build
from httplib2 import socks

try:
    os.chdir(r"D:\GISAdmin\MobileApps")
    logFile = open(r"log.txt","a")
    
    keyFile = r"D:\GISAdmin\MobileApps\APIProject-e3ac44d0fb18.p12"

    def dateIsLessThan7Days(d):
        d = datetime.datetime.strptime(d,'%Y-%m-%dT%H:%M:%S')
        t = timedelta(days=7)
        today = datetime.datetime.now() - timedelta(days=1)
        week = today+t
        if (d > today and d < week):
            return True
        else:
            return False
        

    def checkForWebsite(d):
        s = d.find('http')
        if s == -1:
            s = d.find('www')
        if s > -1:
            e = d.find(' ',s)
            if e == -1:
                e = len(d)
            d = d[s:e+1]
            if d[-2] == ".":
                 d = d[:-2]
            
            return 'http://'+d
        else:
            return None

    def htmlWrapper(t):
        htmlStart = '<html><link rel="stylesheet" href="bootstrap.min.css" type="text/css"/><body>'
        divStart = '<div class="container"><div class="row"><div class="col-xs-12"><p></p>'
        divEnd = '</div></div></div>'
        htmlEnd = '</body></html>'
        return htmlStart + divStart + t + divEnd + htmlEnd

    def getEventCalendarItems():
        eventCalendar = 'downers.us_rpfukfjqi8klo5o98u2j9ecpn8@group.calendar.google.com'
        meetingCalendar = 'downers.us_eu2eucf0sjbku4plfetfu5r4ho@group.calendar.google.com'
        calendars = [eventCalendar,meetingCalendar]
        f = file(keyFile, 'rb')
        key = f.read()
        f.close()

        # Create an httplib2.Http object to handle our HTTP requests and authorize it
        # with the Credentials. Note that the first parameter, service_account_name,
        # is the Email address created for the Service account. It must be the email
        # address associated with the key that was created.
        # Downers - Service Email
        # serviceEmail = '141491975384@developer.gserviceaccount.com'
        # Personal - Service Email
        serviceEmail = '825162943373-70gkeia4779r1rqmsddssq9u91c6t3r1@developer.gserviceaccount.com'
        #calendar = 'mqsf5t1lkfej1afcvk58u9bam8@group.calendar.google.com'
        #calendar = 'downers.us_52tm978pbmm5lotj39v7lb2o2g@group.calendar.google.com'

        credentials = SignedJwtAssertionCredentials(
            serviceEmail,
            key,
            scope='https://www.googleapis.com/auth/calendar')
        #Development
        http = httplib2.Http(proxy_info = httplib2.ProxyInfo(socks.PROXY_TYPE_HTTP_NO_TUNNEL, proxy_host="10.0.1.30", proxy_port=8080))
        #Production
        #http = httplib2.Http()
        http = credentials.authorize(http)

        service = build(serviceName='calendar', version='v3', http=http)
        nextDay = datetime.date.today()
        
        dayOf = nextDay.strftime('%Y-%m-%dT%H:%M:%S-05:00')
        print dayOf
        dayAfter = datetime.timedelta(days=32)
        nextDay = nextDay+dayAfter
        nextDay = nextDay.strftime('%Y-%m-%dT%H:%M:%S-05:00')

 
        
        page_token = None
        events = []
        global event7DayCount
        event7DayCount = 0
        for c in calendars:
            while True:
                response = service.events().list(calendarId=c, pageToken=page_token, timeMin=dayOf, timeMax=nextDay, singleEvents=True).execute()
                utilityDue = None
                garbageArray = []
                for r in response['items']:
                    start = dg_generics.getDate(r['start'])
                    end = dg_generics.getDate(r['end'])
                    e = {'start':start,'startTime':dg_generics.getTimeString(start),'startDateTime':dg_generics.getDateTime(start),'end':end,'title':r['summary']}
                    if e['title'][:12] == 'Utility Bill':
                        e['startTime'] = e['startTime'].split(' - ')[0] + '- 5 PM'
                        if utilityDue is None:
                            if e['title'].find('North') > -1:
                                side = 'North'
                            else:
                                side = 'South'
                            desc = '<p>Utility bills are due every other month. Alternating the north and south sides of the BNSF railroad.</p> <p>Information regarding the water portion of the utility bill can be found <a href="http://www.downers.us/res/water">here</a>.</p>'
                            desc = desc + '<p>Information regarding the stormwater portion of your utility bill can be found <a href="http://www.downers.us/res/stormwater-management/stormwater-utility">here</a>.</p>'
                            desc = desc + '<p><a href="https://mydg.downers.us/Default.asp?Build=UB.UtilitiesHome&ClearErrors=Y">Please use this link to pay bills on-line.</a></p>'
                            dashboard['utility'] = {'date':start,'side':side, 'Description': htmlWrapper(desc)}
                    elif e['title'].find('Garbage - ') > -1:
                        print "Garbage"
                        garbage = e['title'].split(' - ')
                        startDate = dg_generics.getDateTime(start)
                        endDate = dg_generics.getDateTime(end)
                        days = endDate-startDate
                        for i in range(days.days):
                            garbageDict = {'Date':(startDate+timedelta(days=i)).strftime('%Y-%m-%dT%H:%M:%S'),'Type':garbage[1],'Length':garbage[2]}
                            
                            if 'description' in r:
                                garbageDict['Description'] = htmlWrapper('<p>'+r['description'].encode('ascii','ignore')+'</p>')
                            else:
                                garbageDict['Description'] = htmlWrapper('<p>'+garbage[2]+'</p>')
                            print garbageDict
                            garbageArray.append(garbageDict)
                    if c == eventCalendar:
                        if dateIsLessThan7Days(start):
                            event7DayCount += 1
                        e['type'] = 'Event'
                    else:
                        e['type'] = 'Meeting'
                    htmlText = '<h2 class="h3">'+e['title']+'</h2>'
                    htmlText = htmlText + '<p>' + e['startTime'] + '</p>'
                    
                    if 'location' in r:
                        e['location'] = r['location']
                        htmlText = htmlText + '<p>' + e['location'] + '</p>'
                    if 'description' in r:
                        e['description'] = r['description'].encode('ascii','ignore')
                        web = checkForWebsite(str(e['description']))
                        if web is not None:
                            e['website'] = web
                        htmlText = htmlText + '<p>' + e['description'] + '</p>'
                        del e['description']
                    e['Description'] = htmlWrapper(htmlText)
                    events.append(e)
                if len(garbageArray) > 0:
                    dashboard['garbage'] = garbageArray
                waterNumberMessage = '<p>Water usage is allowed for houses ending in {0} numbers from 7-11am and 7-11pm today.</p>'
                waterLink = '<p><a href="http://www.downers.us/res/water/water-conservation">Please click here for more information</a></p>'
                waterMessages = {'allowed':htmlWrapper('<p>Outdoor water usage is allowed for your address between 7-11am and 7-11pm today.</p>'+waterLink),'restricted':htmlWrapper('<p>Outdoor water usage is not allowed today for your address.</p>'+waterLink)}
                waterMessages['even'] = htmlWrapper(waterNumberMessage.format('EVEN')+waterLink)
                waterMessages['odd'] = htmlWrapper(waterNumberMessage.format('ODD')+waterLink)
                dashboard['water'] = waterMessages
                
                dashboard['garbageMessage'] = htmlWrapper('<p>Garbage collection is on a normal schedule.</p><p><a href="http://www.downers.us/res/garbage-and-recycling">Click here for more information</a></p>')
                page_token = response.get('nextPageToken')
                if not page_token:
                    break
        events.sort(key=operator.itemgetter('startDateTime'))
        for e in events:
            del e['startDateTime']
        return events

    def getHTTPRequest(url, data):
        if data is not None:
            data['f'] = 'json'
            data = urllib.urlencode(data)
            url = url + '?' + data
        http = httplib2.Http()
        resp,content = http.request(url,"GET")
        return content

    def getConstructionUpdates():
        constUpdates = getHTTPRequest('http://www.downers.us/public/feeds/construction-updates.xml',None)
        #print constUpdates
        constArray = []
        root = ET.fromstring(constUpdates)
        for child in root.iter('item'):
            title = child.find('title').text
            pubDate = child.find('pubDate').text[:-4]
            print pubDate
            pubDate = datetime.datetime.strptime(pubDate,'%a, %d %b %Y %H:%M:%S')
            pubDate = pubDate.strftime('%Y-%m-%d %H:%M:%S')
            link = child.find('link').text.split("?")[0]
            
            constArray.append({'title':title,'pubDate':pubDate,'link':link})
        return constArray

    def getPhoneNumbers():
        phone = {}
        phone['VDG-Main'] = {'name':'Village of Downers Grove','Phone':'5500'}
        phone['VDG-BT'] = {'name':'Business Technology','Phone':'5574'}
        phone['VDG-CD'] = {'name':'Community Development','Phone':'5515'}
        phone['VDG-PW'] = {'name':'Public Works','Phone':'5460'}
        phone['VDG-PD'] = {'name':'Police Department','Phone':'5600'}
        phone['VDG-FD'] = {'name':'Fire Department','Phone':'5980'}
        phone['ComEd'] = {'name':'ComEd','Phone':'1-800-334-7661'}
        phone['Nicor'] = {'name':'Nicor','Phone':'1-888-642-6748'}
        phone['Comcast'] = {'name':'Comcast','Phone':'1-866-594-1234'}
        phone['ATT'] = {'name':'AT&T','Phone':'1-800-244-4444'}
        phone['DGTS'] = {'name':'Downers Grove Township','Phone':'1-630-719-6600'}
        phone['YorkTS'] = {'name':'York Township','Phone':'1-630-620-2400'}
        phone['LisleTS'] = {'name':'Lisle Township','Phone':'1-630-968-2087'}
        phone['MiltonTS'] = {'name':'Milton Township','Phone':'1-630-668-1616'}
        phone['IDOT'] = {'name':'Illinois Department of Transportation','Phone':'1-217-782-7820'}
        phone['DPCDOT'] = {'name':'Dupage County - Department of Transportation','Phone':'1-630-407-6900'}
        phone['ITA'] = {'name':'Illinois Tollway Authority','Phone':'1-630-241-6800'}
        phone['DPFPD'] = {'name':'DuPage County Forest Preserve District','Phone':'1-630-933-7200'}
        phone['Woodridge'] = {'name':'Village of Woodridge','Phone':'1-630-719-4705'}
        return phone
        
    
    def main(argv):
        global dashboard
        dashboard = {}
        today = datetime.datetime.now()
        logFile = open(r"log.txt","a")
        logFile.write("-----     " + today.strftime('%Y-%m-%d %H:%M:%S') + "     -----\n")
        dashboard['updateTime'] = today.strftime('%Y-%m-%d %H:%M:%S')
        dashboard['events'] = getEventCalendarItems()
        website = 'http://www.downers.us'
        #dashboard['alerts'] = [{'level':'low','title':'Test','description':htmlWrapper('<p>Test Description</p><p><a href="'+website+'">Click here for more information</a></p>'),'website':website}] 
        global event7DayCount
        dashboard['event7DayCount'] = event7DayCount
        dashboard['construction'] = getConstructionUpdates()
        dashboard['phone'] = getPhoneNumbers()
        dg_generics.postDataToFTP(dashboard,'app_dashboard')
        logFile.write("Update Completed\n")
        logFile.close()

except Exception,e:
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    logFile.write('------ERROR------')
    logFile.write('{0}\n'.format(e))
    logFile.write('{0}\n'.format(exc_type))
    logFile.write('{0}\n'.format(fname))
    logFile.write('{0}\n'.format(exc_tb.tb_lineno))
    logFile.close()
    print e
    print(exc_type, fname, exc_tb.tb_lineno)

if __name__ == '__main__':
    cgitb.enable()
    #print "Hello"
    #print ("""Content-type:application/json\n\n""")
    data = cgi.FieldStorage()
    data = dict(data)
    for d in data:
        data[d] = data[d].value
    #print data
    main(data)
