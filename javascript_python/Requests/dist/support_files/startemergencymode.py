import cgi, cgitb
import httplib2
import urllib
import urllib2
import json
import datetime
from datetime import timedelta
import time
import sys
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from random import randint

try:

    def getAndFindRequestTypesFor(requests,scenario):
        with open(r"\\GIS\wwwroot\requests\support_files\request_data_emer.json") as data_file:    
            requestData = json.load(data_file)
        if requests[0] == 'None':
            requestData['emerMode'] = False
            if 'emerRequests' in requestData:
                del requestData['emerRequests']
            if 'emerModeStartTime' in requestData:
                del requestData['emerModeStartTime']
        else:
            emerMode = True
            if len(requests) == 0:
                emerMode = False
            if 'emerMode' not in requestData:
                requestData['emerModeStartTime'] = int(time.mktime(datetime.datetime.now().timetuple()) * 1000)
            requestData['emerMode'] = emerMode
            requestData['emerRequests'] = requests
            requestData['emerType'] = scenario 
            
        
        fileName = r"C:\inetpub\wwwroot\requests\support_files\request_data_emer.json"
        with open(fileName, 'w') as outfile:
            json.dump(requestData, outfile)
        return {'success':True}
        

    def main(argv):
        if not isinstance(argv,dict):
            argv = dict(argv)
            # Used for testing
            
            # Comment out for loop when testing
            for a in argv:
                if len(argv[a].value) == 0 or argv[a].value is None:
                    argv[a] = 'None'
                else:
                    argv[a] = argv[a].value

        global parameters
        parameters = argv
        print ("""Content-type:application/json\n""")
        if 'requests' in argv:
            requests = argv['requests'].split(',')
            scenario = None
            if 'scenario' in argv:
                scenario = argv['scenario']
            print json.dumps(getAndFindRequestTypesFor(requests,scenario))
        else:
            print json.dumps({'Success':False})

except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        text = "{0}\n{1}\n{2}\n{3}".format(e,exc_type,fname,exc_tb.tb_lineno)
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "CRC Error"
        msg['From'] = '<gis@downers.us>'
        msg['To'] = '<jkopinski@downers.us>'
        part1 = MIMEText(text, 'html')
        msg.attach(part1)
        sendEmail('<gis@downers.us>','<jkopinski@downers.us>',msg)
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
        

if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    # DEBUG
    #print ("""Content-type:text/plain\n\n""")
    #getRequestData()
    # PRODUCTION
    main(params)
