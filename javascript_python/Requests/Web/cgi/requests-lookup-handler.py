import dghttpclient2 as dghttpclient
import json
import datetime
from datetime import timedelta
import cgi, cgitb
import os, sys
from random import randint

try:
    baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
    mapURL = baseURL + 'CRC/CRC_Edits/MapServer/'
    requestDataURL = {'Requests':'0'}
    departments = {'1':'Building Services','2':'Business Technology','3':'Community Development','4':'Finance','5':'Fire','6':'Legal','7':"Manager's Office",'8':'Police','9':'Public Works','10':'Communications','9999':'Unassigned'}
    statusCodes = {'0':'New Request','1':'New Request','2':'Need Site Visit','3':'Need to Contact','4':'Waiting on Resident','5':'Assign to Street Division','6':'Cost Share','7':'Investigation','8':'Unknown','9':'Unknown','10':'Completed','11':'Outside Jurisdiction','99':'Deleted'}
    outJuris = {'IDOT':{'name':'Illinois Department of Transportation','phone':'(217)782-7820','uri':'1-217-782-7820'},'DPC':{'name':'DuPage County Department of Transportation','phone':'(630)407-6900','uri':'1-630-407-6900'},'ComEd':{'name':'ComEd','phone':'(800)334-7661','uri':'1-800-334-7661'},'DCFPD':{'name':'DuPage County Forest Preserve','phone':'(630)933-7200','uri':'1-630-933-7200'},'Lisle Township':{'name':'Lisle Township','phone':'(630)968-2087','uri':'1-630-968-2087'},'Milton Township':{'name':'Milton Township','phone':'(630)668-1616','uri':'1-630-668-1616'},'York Township':{'name':'York Township','phone':'(630)620-2400','uri':'1-630-620-2400'},'Woodridge':{'name':'Village of Woodridge','phone':'(630)719-4705','uri':'1-630-719-4705'},'Out':{'name':'Unknown','phone':'Unknown'}}
    unassignedNum = '9999'
    unassigned = 'Unassigned'

    def getRequestData(params):
        #url = params.getfirst('u')
        
        url = mapURL+requestDataURL['Requests']+'/query'
        params['where'] = 'RequestID = \'{0}\''.format(params['RequestID'])
        params['outFields'] = 'RequestID,RequestTypeText,SubmittedDate,StatusDate,StatusText'
        params['f'] = 'json'
        del params['RequestID']
        result = dghttpclient.postHttpRequestESRI(url,params)
        if 'features' in result and len(result['features']) > 0:
            result = {'result':[result['features'][0]['attributes']],'success':True}
        else:
            result = {'result':[],'success':True}
        return result

    def main(argv):
        argv = dict(argv)
        global parameters
        parameters = argv
        # Comment out for loop when testing
        for a in argv:
            if len(argv[a].value) == 0 or argv[a].value is None:
                argv[a] = 'None'
            else:
                argv[a] = argv[a].value
        print json.dumps(getRequestData(argv))

except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
                
if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    # DEBUG
    #print ("""Content-type:text/plain\n\n""")
    # PRODUCTION
    print ("""Content-type:application/json\n""")
    main(params)
