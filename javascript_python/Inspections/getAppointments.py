#!\Python27\32_bit\python.exe

import httplib2
import json
import pprint
import cgi, cgitb
import datetime
import os, sys


from oauth2client.client import SignedJwtAssertionCredentials
from apiclient.discovery import build
from httplib2 import socks

try:

    planners = ['kchrisse@downers.us','painsworth@downers.us','rpietrzak@downers.us']
    calendars = {'Engineering':['jlomax@downers.us','kbehr@downers.us'],'Fence - Final':planners,'Sign - Final':planners, 'Parking Lot - Final':planners}
    # development
    #keyFile = r"\\gis\wwwroot\requests\support_files\API Project-e3ac44d0fb18.p12"
    #production
    keyFile = r"D:\www-root\www.downers.us\www\public\cgi\APIProject-e3ac44d0fb18.p12"
    


    def main(argv):
        #print argv
        # Load the key in PKCS 12 format that you downloaded from the Google API
        # Console when you created your Service account.
        #print os.path.realpath(__file__)
        #print os.path.dirname(os.path.realpath(r"D:\www-root\www.downers.us\www\public\cgi\APIProject-e3ac44d0fb18.p12"))
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
        #http = httplib2.Http(proxy_info = httplib2.ProxyInfo(socks.PROXY_TYPE_HTTP_NO_TUNNEL, proxy_host="10.0.1.30", proxy_port=8080))
        #Production
        http = httplib2.Http()
        http = credentials.authorize(http)

        service = build(serviceName='calendar', version='v3', http=http)
        nextDay = datetime.datetime.strptime(argv['d'],'%Y-%m-%d')
        dayOf = nextDay.strftime('%Y-%m-%dT%H:%M:%S-05:00')
        #print dayOf
        dayAfter = datetime.timedelta(days=1)
        nextDay = nextDay+dayAfter
        nextDay = nextDay.strftime('%Y-%m-%dT%H:%M:%S-05:00')
        #print nextDay
        
        page_token = None
        while True:
            
            #print "found multiple"
            cals = calendars[argv['i']]
            response = []
            for c in cals:
                response.append(service.events().list(calendarId=c, pageToken=page_token, timeMin=dayOf, timeMax=nextDay).execute())
                    
            
            events = {'events':response}
            print(json.dumps(events))
            page_token = events.get('nextPageToken')
            if not page_token:
                break

except Exception,e:
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print e
    print(exc_type, fname, exc_tb.tb_lineno)

if __name__ == '__main__':
    cgitb.enable()
    #print "Hello"
    print ("""Content-type:application/json\n\n""")
    data = cgi.FieldStorage()
    data = dict(data)
    for d in data:
        data[d] = data[d].value
    #print data
    main(data)
