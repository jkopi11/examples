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
    def main(argv):
        """if not isinstance(argv,dict):
            argv = dict(argv)
            # Comment out for loop when testing
            for a in argv:
                if len(argv[a].value) == 0 or argv[a].value is None:
                    argv[a] = 'None'
                else:
                    argv[a] = argv[a].value"""
        #print ("""Content-type:application/json\n""")
        fileName = r"C:\inetpub\wwwroot\requests\support_files\eventItems.json"
        """with open(fileName, 'w') as outfile:
            json.dump(argv.getvalue("eventItems"), outfile)"""
        #print json.dumps(argv)
        print argv.keys()

except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        text = "{0}\n{1}\n{2}\n{3}".format(e,exc_type,fname,exc_tb.tb_lineno)
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
        

if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage(keep_blank_values=True)
    # PRODUCTION
    #print "Content-type:application/json"
    print ("""Content-type:text/plain\n\n""")
    for line in sys.stdin:
        print line,
    #main(params)
