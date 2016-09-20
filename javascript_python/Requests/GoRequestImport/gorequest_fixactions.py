import os
import sys
import datetime
from datetime import timedelta
import shutil
import string
import Requests_Handler_Test
import json

try:
    nowDate = datetime.datetime.now()                                                                                                                                                                                                                                                         
    nowDate = nowDate + timedelta(hours=6)
    employees = {'Sandmann-Bob':'bsandmann@downers.us','Pellicano-Alex':'apellicano@downers.us','Kalmar-Dean':'dkalmar@downers.us','Dabareiner-Tom':'tdabareiner@downers.us','Officer-Code':'gis@downers.us'}
    employeeID = {'Sandmann-Bob':'46','Pellicano-Alex':'1183','Kalmar-Dean':'1078','Dabareiner-Tom':'869','Officer-Code':'999'}
    employeeName = {'Sandmann-Bob':'SANDMANN, ROBERT R','Pellicano-Alex':'PELLICANO, ALEXANDER R','Kalmar-Dean':'KALMAR, DEAN D','Dabareiner-Tom':'DABAREINER, THOMAS J','Officer-Code':'CODE OFFICER'}
    requesttypes = {'Rubbish/Garbage Concern':'Rubbish/Garbage','Construction/Demolition Site':'Code','Sump Pump Discharge Location':'Code','Sign Illegal':'Code','Other':'Code','Work Without Permit':'Work Without Permit - Remodel','Tall Grass/Weeds':'Tall Grass','Boat/RV/Trailer Location':'RVs/Campers,Trailers','Tree/Shrub Obstruction':'Code','Roof/Wall/Fence Deterioration':'Code','Motor Vehicle Inoperable':'Inoperable Vehicles'}
    status = {'Closed':'Closed','Open':'Investigation'}
    statusCode = {'Closed':'10','Open':'7'}

    def geocodeAddress(address):
        # if address has X/Y post:
        # else print out could not post
        print 'Geocode'
        print address
        #url = r"http://parcels.downers.us/arcgis/rest/services/Locators/LAddress/GeocodeServer/findAddressCandidates";
        url = r"http://parcels.downers.us/arcgis/rest/services/Locators/LStreet/GeocodeServer/findAddressCandidates";
        #data = {'Single Line Input': address,'outFields':'*','f':'json','outSR':4326}
        data = {'Street':address,'outFields':'*','outSR':4326,'f':'json'};
        if address.find("/") != -1 or address.find("&") != -1:
            #print address
            url = r"http://parcels.downers.us/arcgis/rest/services/Locators/LStreet/GeocodeServer/findAddressCandidates";
            data = {'Street':address,'outFields':'*','outSR':4326,'f':'json'};
        #print data
        #print url
        results = json.loads(Requests_Handler_Test.getHTTPRequest(url,data))
        #print results
        if 'candidates' in results and len(results['candidates']):
            return [results['candidates'][0]['location']['x'],results['candidates'][0]['location']['y']]
        else:
            return False
    
    def processActions():
        print "Process Updates"
        goRequestFile = r"/Users/josephkopinski/Development/RequestsGitDev/GoRequestImport/GoRequestClosedActions2.csv"
        
        if os.path.isfile(goRequestFile):
            #actionArray = [['ActionRequestID','ActionEnteredDate','ActionEnteredBy','Description']]
            #actionArray = [['ActionRequestID','ActionEnteredDate','Description']]
            #actionArray = [['ID','Location','Topic','Status','Entered date','Entered by','Last name','First name','Assigned to','Description','Date closed']]
            #actionArray = [['RequestID','Description','RequestTypeText','Address','AddressNo','StreetName','X','Y','EmployeeID','EmployeeText','DeptID','DepartmentText','UpdatedBy','StatusText','StatusCode','RequestDate','SubmittedDate','StatusDate']]
            requestID = '1'
            actionDate = nowDate
            actionEnterBy = 'jkopinski@downers.us'
            with open(goRequestFile) as f:
                count = 0
                headers = []
                requestID = 0
                for line in f:
                    line = line.replace('\n','')
                    if count == 0:
                        headers = line.split(',')
                        actionArray = [headers]
                        print headers
                    else:
                        data = line.split(',')
                        print data
                        actionDate = data[headers.index('ActionEnteredDate')]
                        actionDate = datetime.datetime.strptime(actionDate,'%Y%m%d %I:%M:%S %p')
                        actionArray.append([data[headers.index('ActionRequestID')],actionDate.strftime('%m/%d/%Y %I:%M:%S %p'),data[headers.index('Description')],data[headers.index('EnteredBy')],data[headers.index('ActionType\r')]])
                    count = count + 1
                actionFile = './GoRequestActionsProcessed2.csv'
                print "Writing Actions"
                af = open(actionFile,'w')
                for action in actionArray:
                    actionString = ''
                    for a in action:
                        actionString = actionString +str(a)+','
                    actionString = actionString[:-1]+'\n'
                    af.write(actionString)
                af.close()    

except Exception,e:
    exc_type, exc_obj, exc_tb = sys.exc_info()
    print e
    print exc_type
    print exc_tb.tb_lineno

processActions()