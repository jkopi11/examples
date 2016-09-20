import dghttpclient2 as dghttpclient
import json
import datetime
from datetime import timedelta
import cgi, cgitb
import os, sys

"""Used to query mobile users submitted request"""


try:
    baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
    #mapURL = baseURL + 'Public/Requests311/MapServer/'
    mapURL = baseURL + 'CRC/CRC_Edits/FeatureServer/'
    nowDate = datetime.datetime.now()
    stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
    requestDataURL = {'Requests':'0','ROW':'1','Response':'2','Actions':'3','Contacts':'4','Departments':'5','Employees':'6','ContactReqRel':'7','Types':'8','Questions':'9','Assets':'10','AdditionalInfo':'11','Layers':'12','EmployeesEden':'13','MonthlyData':'14','Devices':'16'}
    statusCodes = {'0':'New Request','1':'New Request','2':'Need Site Visit','3':'Need to Contact','4':'Waiting on Resident','5':'Assign to Street Division','6':'Cost Share','7':'Investigation','8':'Unknown','9':'Unknown','10':'Completed','11':'Outside Jurisdiction','99':'Deleted'}
    outJuris = {'IDOT':{'name':'Illinois Department of Transportation','phone':'(217)782-7820'},'DPC':{'name':'DuPage County Department of Transportation','phone':'(630)407-6900'},'ComEd':{'name':'ComEd','phone':'(800)334-7661'},'DCFPD':{'name':'DuPage County Forest Preserve','phone':'(630)933-7200'},'Lisle Township':{'name':'Lisle Township','phone':'(630)968-2087'},'Milton Township':{'name':'Milton Township','phone':'(630)668-1616'},'York Township':{'name':'York Township','phone':'(630)620-2400'},'Woodridge':{'name':'Village of Woodridge','phone':'(630)719-4705'},'Out':{'name':'Unknown','phone':'Unknown'}}

    def getContactInfo(user):
        url = mapURL+requestDataURL['Devices']+'/query?'
        data = {'returnGeometry':'false','f':'json','outFields':'UserName,UserAddress,UserPhone,UserEmail,Address_Lat,Address_Lng'}
        data['where'] = 'UserID = {0}'.format(user)
        contact = dghttpclient.getHttpRequestESRI(url,data)
        if 'features' in contact:
            return contact['features'][0]['attributes']
        else:
            return false
                        
        
    def getRequesterParameters(p):
        rUrl = mapURL+requestDataURL['ContactReqRel']+'/query?'
        rData = {'returnGeometry':'false','f':'json'}
        rData['where'] = "ContactID = '" + p + "'"
        rData['outFields'] = '*'
        rIDs = dghttpclient.getHttpRequestESRI(rUrl,rData)['features']
        
        if (len(rIDs)>0):
            requests = []
            for r in rIDs:
                r = r['attributes']
                requests.append(r['RequestID'])

            where = "StatusCode <> 99"
            where = where + " AND ("
            for i in requests:
                where = where + "RequestID = '"+ i + "' OR "
            where = where[:-4] + ")"
        else:
            resultJson = {'results':[],'success':'success'}
            print json.dumps(resultJson)
            exit()
        data = {'f':'json','returnGeometry':False,'outFields':'*'}
        data['where']= where
        return data


    def getRequestData(params):
        #url = params.getfirst('u')
        url = mapURL+requestDataURL['Requests']+'/query'
        data = getRequesterParameters(params)
        result = dghttpclient.getHttpRequestESRI(url,data)['features']
        return parseData(result)

    def parseData(requests):
        requestsArray = []
        if len(requests) > 0:
            for r in requests:
                r = r['attributes']
                requestDict = {'RequestID':r['RequestID'],'RequestType':r['RequestTypeText'],'Description':r['Description'],'StatusDate':r['StatusDate'],'SubmittedDate':r['SubmittedDate'],'StatusText':r['StatusText'],'Location':r['Address']}
                requestsArray.append(requestDict)
        return requestsArray

    def main(argv):
        argv = dict(argv)
        for a in argv:
            if len(argv[a].value) == 0 or argv[a].value is None:
                argv[a] = 'None'
            else:
                argv[a] = argv[a].value
        returnDict = {'success':'success'}
        if 'type' in argv and argv['type'] == 'contact':
            returnDict['results'] = getContactInfo(argv['userID'])
        else:
            returnDict['results'] = getRequestData(argv['userID'])
        """returnDict = {'success':'success'}
        returnDict['results'] = getRequestData('15643')"""
        print json.dumps(returnDict)
        

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

