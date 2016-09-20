import cgi, cgitb
import httplib2
import urllib
import urllib2
import json
import datetime
import time
import sys
import os
import dghttpclient2 as dghttpclient
#import dghttpclient

nowDate = datetime.datetime.now()
stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
mapURL = baseURL + 'CRC/CRC_Edits/MapServer/'
featureURL = baseURL + 'CRC/CRC_Edits/FeatureServer/'
requestDataURL = {'Requests':'0','ROW':'1','Response':'2','Actions':'3','Contacts':'4','Departments':'5','Employees':'6','ContactReqRel':'7','Types':'8','Questions':'9','Assets':'10','AdditionalInfo':'11','Layers':'12','EmployeesEden':'13','MonthlyData':'14','ViolationTypes':'15','Devices':'16','Notifications':'17','Responses':'18'}
failed = {'success':False,'message':'General Error. Please contact the Village at 630-434-5574.'}

try:
    nowDate = datetime.datetime.now()
    stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')

    def createDeviceUser():
        url = mapURL+requestDataURL['Devices']+'/query'
        success = failed.copy()
        # Check for existing contact in CRC contact table
        # Build contact query
        emailQuery = ''
        if 'UserEmail' in parameters and parameters['UserEmail'] != 'null' and len(parameters['UserEmail']) > 0:
            emailQuery = 'Email = \'{0}\''.format(parameters['UserEmail'])
        if len(emailQuery) > 0:
            contactUrl = mapURL+requestDataURL['Contacts']+'/query'
            contactData = {'f':'json','where':emailQuery,'outFields':'ContactID','orderByFields':'ContactID ASC'}
            results = dghttpclient.postHttpRequestESRI(contactUrl,contactData)
            if 'features' in results and len(results['features']) > 0:
                parameters['newUserID'] = results['features'][0]['attributes']['ContactID']

        # Process New or Updated information
        # If a CRC ID exists or if information has been updated on the app, check to see if a mobile app ID
        # has already been created and get the OBJECTID in order to update information.
        
        if ('newUserID' in parameters and parameters['type'] == 'new') or parameters['type'] == 'update':
            if parameters['type'] == 'new':
                parameters['UserID'] = parameters['newUserID']
                del parameters['newUserID']
            """data = {'where':'UserID = \'{0}\''.format(parameters['UserID']),'returnIdsOnly':'true','f':'json'}
            results = dghttpclient.postHttpRequestESRI(url,data)
            if 'objectIds' in results and len(results['objectIds']) > 0:
                #parameters['OBJECTID'] = results['objectIds'][0]
                parameters['type'] = 'update'
            else:
                parameters['type'] = 'new'"""
            
        if 'UserID' not in parameters and parameters['type'] == 'new':
            data = {'where':'OBJECTID IS NOT NULL','returnCountOnly':'true','f':'json'}
            results = dghttpclient.postHttpRequestESRI(url,data)
            if 'count' in results:
                parameters['UserID'] = results['count']+10001
            else:
                return failed
            
        deviceData = parameters.copy()

        # App controls what data is submitted - If UserAddress is provided reverse geocode Address
        if 'UserAddress' in parameters:
            lng, lat = geocodeAddress(parameters['UserAddress'])
            
            if lng != 0 and lat != 0:
                deviceData['Address_Lng'],deviceData['Address_Lat'] = lng,lat
            else:
                success['outside'] = True
        
        if 'Mobile' in deviceData:
            deviceData['Mobile'] = deviceData['Mobile'].replace(" ","").replace("<","").replace(">","")
        if 'EnabledNotificationTypes' in deviceData:
            if deviceData['EnabledNotificationTypes'].find('PI') == -1:
                deviceData['UserAddress'] = "null"
                deviceData['UserPhone'] = "null"
                deviceData['UserName'] = "null"
                if deviceData['EnabledNotificationTypes'].find('EN') == -1:
                    deviceData['UserEmail'] = "null"

        del deviceData['type']
        deviceData['LastUpdated'] = stringFullDate
        
        #print ("""Content-type:application/json\n""")
        requestData = {'f':'json','features':[{"attributes":deviceData}],'gdbVersion':'GISUSER.Requests'}
        action = '/addFeatures'
        actionResults = 'addResults'
        """if parameters['type'] == 'update':
            action = '/updateFeatures'
            actionResults = 'updateResults'"""
        results = dghttpclient.postHttpRequestESRI(featureURL+requestDataURL['Devices']+action,requestData)
        if actionResults in results:
            if 'success' in results[actionResults][0]:
                success['success'] = True
                success['UserID'] = deviceData['UserID']
                success['action'] = actionResults
            else:
                return failed
        else:
            return failed
        
        return success

    def geocodeAddress(address):
        data = {'Single Line Input':address,'f':'json','outSR':4326}
        url = 'http://parcels.downers.us/arcgis/rest/services/Locators/LAddress/GeocodeServer/findAddressCandidates'
        results = dghttpclient.getHttpRequest(url,data)
        if 'candidates' in results and len(results['candidates']) > 0:
            return float(results['candidates'][0]['location']['x']), float(results['candidates'][0]['location']['y'])
        else:
            return 0,0

    def main(argv):
        if type(argv) is not dict:
            argv = dict(argv)
            for a in argv:
                argv[a] = argv[a].value
        global parameters
        parameters = argv
        result = {}
        print ("""Content-type:application/json\n""")
        if parameters['type'] == 'new' or parameters['type'] == 'update':
            result = createDeviceUser()
        else:
            failed['message'] = 'Invalid request'
            result = failed

        if 'success' in result:
            if 'message' in result:
                result['message'] = "Your preferences have been saved."
                if 'outside' in result:
                    result['success'] = False
                    result['message'] = "Your preferences have been saved, but please note we did not find a valid address in the Village's limit. This will only affect the ability to receive location-based nofications. Please try again using your full address (including street type) or contact the Village if you feel this is an error."
            print json.dumps(result)
        else:
            print json.dumps(failed)

except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)

if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    #params = {'EnabledNotificationTypes':'PI|EN|AN','Mobile':'<df877d15 dd5f46f1 38a9ffd4 a8ed3421 d50a4c43 4cd7bdfc f63b9bed bc09a727>','UserEmail':'dfieldman@downers.us','UserName':'Joseph Kopinski','UserPhone':'630-434-6891','type':'update','UserAddress':'4608 Stanley Ave','UserID':'6'} 
    main(params)
