import httplib2
import urllib
import urllib2
import json
import datetime
from datetime import timedelta
import time
import sys
import os
import Requests_Handler_Test
import Manage_Handler


try:
    def geocodeAddress(address):
        # if address has X/Y post:
        # else print out could not post
        print 'Geocode'
        
        url = r"http://parcels.downers.us/arcgis/rest/services/Locators/LAddress_LOCID/GeocodeServer/findAddressCandidates";
        address = address.replace(" ","+");
        data = {'Single Line Input': address,'outFields':'*','f':'json','outSR':4326}
        if address.index("/") != -1 or address.index("&") != -1:
            print address
            url = r"http://parcels.downers.us/arcgis/rest/services/Locators/LStreet/GeocodeServer/findAddressCandidates";
            data = {'Street':address,'outFields':'*','outSR':4326,'f':'json'};
        results = json.loads(Requests_Handler_Test.getHTTPRequest(url,data))
        print results
        if 'candidates' in results and len(results['candidates']):
            return [results['candidates'][0]['location']['x'],results['candidates'][0]['location']['y']]
        else:
            return False

    def getObjectID(requestID):
        url = Request_Test_Handler.baseURL + Request_Test_Handler.requestDataURL['Requests'] + '/query'
        data = {'where':'RequestID = \'' + requestID + '\'','f':'json','outFields':'OBJECTID'}
        response = json.loads(Request_Test_Handler.getHTTPRequest(url,data))
        if 'features' in response and len(response['response']) > 0:
            return response['features'][0]['attributes']['OBJECTID']
        else:
            return False

    def processCompleted(requestID,statusText):
        action = {'attachments':0,'desc':statusText,'email':'jkopinski@downers.us','f':'status','filter-status':'10','from':'New Request','statusText':'Completed'}
        objectID = getObjectID(requestID)
        if objectID:
            action['r'] = objectID
            return Manage_Handler.main(action)
        else:
            return False
        
    
    def processCSV(fileName):
        if os.path.isfile(fileName):
            assigned = '171'
            assignedText = 'TUCKER, JOHN'
            assignedDept = '9'
            assignedDeptText = 'Public Works'
            with open(fileName) as f:
                headers = []
                count = 0
                print 'Processing CSV'
                for line in f:
                    line = line.replace('\n','')
                    if count == 0:
                        headers = line.split(',')
                        print headers
                    else:
                        request = {'requestTypes':'Drainage - Streets','r':'create','assignEmp':assigned,'assignEmpDept':assignedDept,'assignempDeptText':assignedDeptText,'assignedEmpText':assignedText}
                        requestData = line.split(',')
                        geoLocation = geocodeAddress(requestData[headers.index('Location')])
                        if geoLocation:
                            request['x'] = geoLocation[0]
                            request['y'] = geoLocation[1]
                            request['rAddress'] = requestData[headers.index('Location')]
                            request['UpdatedBy'] = requestData[headers.index('Timestamp')]
                            request['fAddress'] = (requestData[headers.index('Address Number')] + ' ' + requestData[headers.index('Street Name')]).lstrip()
                            request['fName'] = requestData[headers.index('Name')]
                            request['fEmail'] = requestData[headers.index('Email (if provided)')]
                            request['fPhone'] = requestData[headers.index('Phone Number')]
                            request['rDesc'] = 'Google Form: ' + requestData[headers.index('Type of Flooding (if applicable)')] + ' - ' + requestData[headers.index('Description')]
                            response = json.loads(Requests_Handler_Test.main(request))
                            if 'requestID' in response and len(requestData[headers.index('Status')]) > 0:
                                print 'Inserted'
                                print processCompleted(response['requestID'],requestData[headers.index('Status')])
                            else:
                                print "Need to Update"
                                print requestData
                        else:
                            print 'Did not update'
                            print requestData
                    count += 1
        else:
            print 'Not a file'



except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)

if __name__ == '__main__':
    processCSV('./stormlog.csv')
                            
                            
