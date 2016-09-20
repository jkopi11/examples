#!\Python27\32_bit\python.exe

import cgi, cgitb
import json
import datetime
from datetime import timedelta
import time
import sys
import os
import dghttpclient

baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
mapURL = baseURL + 'CRC/CRC_Edits/MapServer/'
featureURL = baseURL + 'CRC/CRC_Edits/FeatureServer/'
requestDataURL = {'Requests':'0','ROW':'1','Response':'2','Actions':'3','Contacts':'4','Departments':'5','Employees':'6','ContactReqRel':'7','Types':'8','Questions':'9','Assets':'10','AdditionalInfo':'11','Layers':'12','EmployeesEden':'13','MonthlyData':'14','ViolationTypes':'15','Devices':'16','Notifications':'17','Responses':'18'}

try:
        
    def main(argv):
        argv = dict(argv)

        for a in argv:
            if len(argv[a].value) == 0 or argv[a].value is None:
                argv[a] = 'None'
            else:
                argv[a] = argv[a].value
        
        print ("""Content-type:application/json\n""")
        if 'query' in argv and argv['query'] == 'All':
            req = {'f':'json','where':'Mobile IS NOT NULL','outFields':'Mobile,UserName'}
            res = dghttpclient.postHttpRequestESRI(featureURL+requestDataURL['Devices']+'/query',req)
            if 'features' in res:
                tokens = []
                res = res['features']
                for r in res:
                    if r['attributes']['UserName'].find('Kopinski') > 0:
                        tokens.append(r['attributes']['Mobile'])
                print json.dumps({'tokens':tokens})
            else:
                print json.dumps({'tokens':[]})
            
            
    

except Exception,e:
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print e
    print(exc_type, fname, exc_tb.tb_lineno)



if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    #print ("""Content-type:text/plain\n\n""")
    #print params
    
    # PRODUCTION
    #params = {'message-title': "New Message from the Village", 'message-text': "Test", 'nType': "general"}
    main(params)
    
