#!\Python27\32_bit\python.exe

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

# Custom library located in the PYTHONPATH directory
import dghttpclient2 as dghttpclient

try:
    baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
    #mapURL = baseURL + 'Public/Requests311/MapServer/'
    mapURL = baseURL + 'CRC/CRC_Edits/MapServer/'
    featureURL = baseURL + 'CRC/CRC_Edits/FeatureServer/'
    #featureURL = baseURL + 'Public/Requests311/FeatureServer/'
    requestDataURL = {'Requests':'0','ROW':'1','Response':'2','Actions':'3','Contacts':'4','Departments':'5','Employees':'6','ContactReqRel':'7','Types':'8','Questions':'9','Assets':'10','AdditionalInfo':'11','Layers':'12','EmployeesEden':'13','MonthlyData':'14'}
    departments = {'1':'Building Services','2':'Business Technology','3':'Community Development','4':'Finance','5':'Fire','6':'Legal','7':"Manager's Office",'8':'Police','9':'Public Works','10':'Communications','9999':'Unassigned'}
    statusCodes = {'0':'New Request','1':'New Request','2':'Need Site Visit','3':'Need to Contact','4':'Waiting on Resident','5':'Assign to Street Division','6':'Cost Share','7':'Investigation','8':'Unknown','9':'Unknown','10':'Completed','11':'Outside Jurisdiction','12':'Work Order Created','99':'Deleted'}
    actionCodes = {'attachment':'Attachment','contact':'Contact Added','assign':'Assignment Changed','drive':'Google Drive Letter Created','fStatus':'status','Status':'Status Changed','contactEdit':'Contact Edited','conversation':'In-person Conversation','inspection':'Inspection','phone':'Phone Call','link':'Link Added','email':'Email','reminder':'Reminder Added','respond':'Respondent Added','citation':'Citation/Ticket Issued','createworkorder':'Lucity Work Order Created','jurisdiction':'Village Jurisdiction Confirmed'}
    contactTypes = {'contact':'Contact','contractor':'Contractor','inform':'Stay Informed','multi':'Multi-Jursidicational','None':'Contact'}
    assetURLs = {'Street Light':'http://parcels.downers.us/arcgis/rest/services/PSRT/MapServer/0/'}
    # Outside Jurisdictions would be need to be updated here and also in the ROW_Jusrisdiction feature class on the K:\Requests_311\Requests_311_Edit.mxd  
    outJuris = {'IDOT':{'name':'Illinois Department of Transportation','phone':'(217)782-7820'},'DPC':{'name':'DuPage County Department of Transportation','phone':'(630)407-6900'},'ComEd':{'name':'ComEd','phone':'(800)334-7661'},'DCFPD':{'name':'DuPage County Forest Preserve','phone':'(630)933-7200'},'Lisle Township':{'name':'Lisle Township','phone':'(630)968-2087'},'Milton Township':{'name':'Milton Township','phone':'(630)668-1616'},'York Township':{'name':'York Township','phone':'(630)620-2400'},'Woodridge':{'name':'Village of Woodridge','phone':'(630)719-4705'},'Out':{'name':'Unknown','phone':'Unknown'}}

    admin = "gis@downers.us"
    commDevDirectors = ["spopovich@downers.us","apellicano@downers.us"]
    villageManager = "dfieldman@downers.us"
    vmAdmin = "adeitch@downers.us"
    
    nowDate = datetime.datetime.now()
    stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
    
    # Additional Info is set for requests that have Questions set on the Questions set
    def addAdditionalInfo(d):
        url = featureURL + requestDataURL['AdditionalInfo'] + '/addFeatures'
        featureArray = []
        # requestID is set to a global variable in the main function
        global requestID
        requestID = d['RelInfoRequestID']
        for i in d:
            if i[0:4] == 'more':
                a = {'RelInfoRequestID':requestID,'QuestionID':i[4:]}
                if len(d[i]) > 254:
                    a['QuestionAnswer1'] = d[i][0:255]
                    a['QuestionAnswer2'] = d[i][255:510]
                else:
                    a['QuestionAnswer1'] = d[i]
                featureArray.append({'attributes':a})
        data = {'f':'json','features':featureArray,'gdbVersion':'GISUSER.Requests'}
        result = dghttpclient.postHttpRequestESRI(url,data)
        result = result['addResults']
        result = checkSuccess(result)
        return result

    def addContact(d):
        # 2 Steps -- 1) Create Contact 2) Add relationship to relationship table
        t = 'contact'
        # if the user sets the contact type on the manage screen we override the type
        if 'cType' in d and d['cType'] is not None:
            t = d['cType']
        # Check to see if there is any contact information given. If all fields are blank then we check
        # to see if a contactID was given. In that case, a contact that existed already in the CRC is being
        # added to a request. If there is no contactID given, then we just return True meaning that contact has been
        # processed
        contactInfo = (('fEmail' in d or 'fAddress' in d or 'fPhone' in d or 'fName' in d) and (d['fEmail'] != 'None' or d['fAddress'] != 'None' or d['fPhone'] != 'None' or d['fName'] != 'None'))
        if 'ContactID' not in d and contactInfo is True:
            url = mapURL + requestDataURL['Contacts'] + '/query'
            data = {'where':'OBJECTID IS NOT NULL','orderByFields':'ContactID DESC','outFields':'ContactID','f':'json'}
            uID = dghttpclient.postHttpRequestESRI(url,data)
            uID = uID['features'][0]['attributes']['ContactID']
            uID = uID + 1
            url = featureURL + requestDataURL['Contacts'] + '/addFeatures'
            contact = {'Type':t,'Name':d['fName'],'Address':d['fAddress'],'City':'Downers Grove','State':'IL','Zip':'60515','Email':d['fEmail'],'Phone':d['fPhone'],'Alt_Phone':'None','Notes':'None','ContactID':uID}
            
            data = {'f':'json','features':[{'attributes':contact}],'gdbVersion':'GISUSER.Requests'}
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = result['addResults']
            result = checkSuccess(result)
        elif 'ContactID' in d:
            uID = d['ContactID']
            result = True
        else:
            return True
        
        # After the contact has been added or we verify that we have a contactID, we add the relationship of the contactID and requestID to the
        # ContactReqRel Table
        if (result):            
            url = featureURL + requestDataURL['ContactReqRel']+'/addFeatures'
            contactRel = {'ContactID':str(uID),'RequestID':str(requestID),'ContactType':t}
            data = {'f':'json','features':[{'attributes':contactRel}],'gdbVersion':'GISUSER.Requests'}
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = result['addResults']
            result = checkSuccess(result)
            return result
        else:
            return False
        
    # Features are currently only used for Street Lights, but allow for the ability to add existing assets to a requests
    # Street lights are found using the checkStreetLights function, which is called from the routeRequest feature class which
    # is used when creating new requests
    def addFeature(f):
        url = featureURL+requestDataURL['Assets']+'/addFeatures'
        f['AssetRequestID'] = requestID
        data = {'f':'json','features':[{'attributes':f}],'gdbVersion':'GISUSER.Requests'}
        result = dghttpclient.postHttpRequestESRI(url,data)
        result = result['addResults']
        result = checkSuccess(result)
        if result is False:
            print result

    # Convienence function
    def checkForNone(d):
        for c in d:
            if d[c] is None:
                d[c] = str(d[c])
        return d

    # Check Village Boundary
    # Uses the response zone feature class to query whether a request is in the Village Boundary
    # Uses response zone feature class because I needed to be able to find other jurisdictions.
    # The last item in the data dictionary is the where clause that specifies to look for features in
    # the response zones FC with type = 'Boundary'
    # Response Zones was initially set up for Employee response zones. So, EmployName
    # is returned, but that is actually the Town or Jurisdicition name
    def checkVillageBoundary(x,y):
        url = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/MapServer/2/query'
        geo = str(x)+','+str(y)
        data = {'f':'json','geometry':geo,'geometryType':'esriGeometryPoint','inSR':4326,'spatialRel':'esriSpatialRelIntersects','outFields':'*','returnGeometry':'false'}
        data['where'] = 'Type = \'Boundary\''
        village = dghttpclient.getHttpRequest(url,data)['features']
        if len(village)>0:
            village = village[0]['attributes']['EmployName']
        else:
            village = 'Out'
        return village

    # Called from the routeRequest function which is used to create a new request and send it to the appropriate person
    # or verify the village's response to the request
    def checkStreetLight(d,count):
        delta = .0005*count
        LocationX = d['x']
        LocationY = d['y']
        LocationXMin = float(LocationX) - delta
        LocationYMin = float(LocationY) - delta
        LocationXMax = float(LocationX) + delta
        LocationYMax = float(LocationY) + delta
        streetLightUrl = 'http://parcels.downers.us/arcgis/rest/services/PSRT/MapServer/0/query'
        streetLightData = {'f':'json','geometry':str(LocationXMin)+','+str(LocationYMin)+','+str(LocationXMax)+','+str(LocationYMax),'geometryType':'esriGeometryEnvelope','inSR':4326,'spatialRel':'esriSpatialRelContains','outFields':'*','returnGeometry':'false'}
        result = dghttpclient.getHttpRequest(streetLightUrl,streetLightData)
        features = result['features']
        global sl
        sl = {'AssetType':'Street Light'}
        if len(features)>0:
            for feature in features:
                attrs = feature['attributes']
                owner = attrs['Owner']
                sl['AssetOwner'] = owner
                if owner == 'Village':
                    sl['AssetID'] = str(attrs.get('SystemID'))+"-"+str(attrs.get('PoleID'))
                    break
                else:
                    sl['AssetID'] = str(attrs.get('Address'))
        else:
            if count < 4:
                checkStreetLight(d,count+1)
            else:
                sl['AssetOwner'] = 'Unknown'
                sl['AssetID'] = 'Unknown'
        return sl

    # Convienence function
    def checkSuccess(r):
        r = r[0]
        if r.get('success'):
            return r['success']
        else:
            return False

    # Convienence function
    def copyFile(fileName):
        print "Copy File"
        oldFile = r"\\GIS\wwwroot\requests\support_files\{0}.json".format(fileName)
        newFile = r"\\GIS\wwwroot\requests\support_files\{0}_old.json".format(fileName)
        shutil.copyfile(oldFile,newFile)

    # Convienence function
    def dictionaryKeyUnicodeToString(d):
        tempDict = {}
        for i in d:
            if isinstance(i, unicode):
                i = str(i)
            tempDict[i] = d[i]
        return tempDict

    # GeoQuery is a convenience function that allows for feature classes to be queried
    def geoQuery(geo,geoType,service,queryType,returnGeo):
        data = {'f':'json','geometry':geo,'geometryType':geoType,'inSR':4326,'outSR':4326,'spatialRel':queryType,'outFields':'*','returnGeometry':returnGeo}
        url = baseURL + service + '/query'
        """if geoType == 'esriGeometryPolygon':
            print url
            print geoType,queryType,returnGeo
            print geo"""
        return dghttpclient.getHttpRequest(url,data)['features']
    
    # all the get functions are used primarily to create the request array show on the list and map or to show an updated request
    def getActions(r):
        aUrl = mapURL + requestDataURL['Actions']+'/query?'
        aData = {'returnGeometry':'false','f':'json'}
        aData['where'] = "ActionRequestID = '" + r + "'"
        aData['outFields'] = '*'
        aData['orderByFields'] = 'DateAction DESC'
        acts = dghttpclient.postHttpRequestESRI(aUrl,aData)
        acts = acts['features']
        actionArray = []
        for a in acts:
            attr = a['attributes']
            aType = str(attr['ActionType'])
            if aType in actionCodes:
                aType = actionCodes[aType]
            if aType == 'Attachment':
                attr['Atttachment'] = str(attr['ActionDesc'])
                attr['ActionDesc'] = '<a href="'+str(attr['ActionDesc'])+'" target="_blank">Attachment</a>'
            elif aType == 'Violation Letter Created':
                attr['ActionDesc'] = '<a href="'+str(attr['ActionDesc'])+'" target="_blank">Google Doc</a>'
            elif aType == 'Attachment Deleted':
                attr['ActionDesc'] = 'Attachment "'+str(attr['ActionDesc'])+'" has been deleted.'
            attr['ActionType'] = aType.capitalize()
            attr['DateAction'] = parseTime(attr['DateAction'])
            attr['DateEnter'] = parseTime(attr['DateEnter'])
            attr['DateActionFollowUp'] = parseTime(attr['DateActionFollowUp'])[:10]
            actionArray.append(attr)
        return actionArray

    # this is used by the Manage_Handler.py so that actionCodes only to be set here.
    # ActionCodes are hard coded here and in the UpdateRequestsJSON.py file where the requests_data.json
    # is created that configures the application
    def getActionCodes():
        return actionCodes

    def getAdditionalInfo(a):
        url = mapURL + requestDataURL['AdditionalInfo']+'/query'
        data = {'f':'json','where':'RelInfoRequestID = \''+a+'\'','outFields':'*','returnGeometry':'false'}
        result = dghttpclient.postHttpRequestESRI(url,data)
        result = result['features']
        return result

    def getAssets(a):
        url = mapURL + requestDataURL['Assets']+'/query'
        data = {'f':'json','where':'AssetRequestID = \''+a+'\'','outFields':'*','returnGeometry':'false'}
        result = dghttpclient.postHttpRequestESRI(url,data)
        result = result['features']
        if len(result) > 0:
            result = result[0]
            result = result['attributes']
            url = assetURLs[result['AssetType']]+'query'
            # Streets lights have two unique identfying fields SystemID and PoleID
            # Storing the ID field, I combine them to form one unique ID
            # here I split the StructID to find the SystemID and PoleID, which is unique to the feature class
            if result['AssetType'] == 'Street Light':
                assetID = result['AssetID']
                assetID = assetID.split('-')
                if len(assetID) > 1:
                    data['where'] = 'SystemID = \''+assetID[0] + '\' AND PoleID = \''+assetID[1]+'\''
                else:
                    return []
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = result['features']
        return result

    def getAttachments(o):
        atUrl = mapURL+requestDataURL['Requests']+"/"+str(o)+"/attachments"
        data = {'f':'json'}
        attachmentArray = []
        att = dghttpclient.postHttpRequestESRI(atUrl,data)
        atts = att['attachmentInfos']
        for a in atts:
            a['link'] = "http://parcels.downers.us/arcgis/rest/services/Public/Requests311/MapServer/0/"+str(o)+"/attachments/"+str(a['id'])
            attachmentArray.append(a)
        return attachmentArray


    def getContacts(r):
        cUrl = mapURL+requestDataURL['ContactReqRel']+'/query?''/query?'
        cData = {'returnGeometry':'false','f':'json','outFields':'*'}
        cData['where'] = "RequestID = '" + r + "'"
        cons = dghttpclient.postHttpRequestESRI(cUrl,cData)
        cons = cons['features']
        where = ''
        if len(cons) > 0:
            contactTypeArray = []
            contactArray = []
            for c in cons:
                c = c['attributes']
                contactTypeArray.append({'id':c['ContactID'],'type':c['ContactType']})
                where = where + 'ContactID = '+ c['ContactID'] + ' OR '
                # Parse out employee information to be later parsed on the client
                if c['ContactType'] == 'employee':
                    contactArray.append({'attributes':{'Type':c['ContactType'],'cID':c['ContactID']}})
            where = where[:-4]
            cUrl = mapURL+requestDataURL['Contacts']+'/query?'
            cData = {'returnGeometry':'false','f':'json','outFields':'*'}
            cData['where'] = where
            cons = dghttpclient.postHttpRequestESRI(cUrl,cData)
            cons = cons['features']
            
            for c in cons:
                c = c['attributes']
                for ct in contactTypeArray:
                    if ct['id'] == c['cID']:
                        c['Type'] = contactTypes[str(ct['type'])]
                if c['Type'] is None:
                    c['Type'] = 'Contact'
                contactArray.append({'attributes':c})
            return contactArray
        else:
            cons = []
        return cons

    #d1 - Status Date, d2 - Submitted Date, f - Format of Date String
    # Takes a dates represented by a string and finds the difference in
    # days between them
    def getDeltaDaysFromString(s,d1,d2):
        #if len(d2) > 0:
        if d2 > 0:
            #d2 = datetime.datetime.strptime(d2, f)
            d2 = datetime.datetime.fromtimestamp(d2/1000)
        if s == 10:
            #d1 = datetime.datetime.strptime(d1, f)
            d1 = datetime.datetime.fromtimestamp(d1/1000)
            diff = d1-d2
        #elif s != 99:
        else:
            now = datetime.datetime.now()
            diff = now-d2
        return diff.days
    
    # A simple look up to find the employee name
    def getEmployeeEmailName(d):
        if d['assignEmp'] is None:
            d['assignEmp'] = '9999'
            email = 'gis@downers.us'
            d['assignEmp'] = '9999'
            d['assignEmpText'] = 'Unassigned'
            d['assignEmpDept'] = '9999'
            d['assignEmpDeptText'] = 'Unassigned'
            return email, d
        data = {'where':'EmployID = ' + str(d['assignEmp']) ,'outFields':'*','f':'json'}
        url = mapURL + requestDataURL['Employees'] + '/query'
        email = dghttpclient.postHttpRequestESRI(url,data)
        email = email['features']
        if len(email) > 0:
            email = email[0]['attributes']['Email']
        data['where'] = 'EMP_NO = ' + str(d['assignEmp'])
        url = mapURL + requestDataURL['EmployeesEden'] + '/query'
        name = dghttpclient.postHttpRequestESRI(url,data)
        name = name['features']
        if len(name) > 0:            
            d['assignEmpText'] = name[0]['attributes']['FULL_NAME']
            d['assignEmpDept'] = name[0]['attributes']['DEPT_NO']
            d['assignEmpDeptText'] = name[0]['attributes']['DEPT']
        return email, d

    # Pulls in permits for the related requests section on the new and map sections of the app.
    # When requests are saved locally, permits are reqeusted from the server separately.
    def getPermits():
        url = 'http://parcels.downers.us/arcgis/rest/services/Permits/MapServer/0/query'
        data = parseParameters(parameters)
        data['orderByFields'] = 'main_addr_disp ASC, permit_type_name ASC'
        del data['where']
        data['inSR'] = 4326
        result = dghttpclient.getHttpRequest(url,data)
        resultArray = []
        if 'features' in result:
            result = result['features']
            for p in result:
                pDict = {}
                attr = p['attributes']
                pDict = {'PermitType':attr['permit_type_name'],'PermitNumber':attr['permit_no'],'Status':attr['approval_state'],'Address':attr['main_addr_disp'],'Customer Name':attr['cust_lname'],'Issue Date':parseTime(attr['issue_date']),'Final Date':parseTime(attr['final_date']),'Expiration Date':parseTime(attr['expiration_date']),'Description':attr['permit_desc']}
                resultArray.append(pDict)
        #clean up second loop
        url = 'http://parcels.downers.us/arcgis/rest/services/Permits/MapServer/1/query'
        result = dghttpclient.getHttpRequest(url,data)
        if 'features' in result:
            result = result['features']
            for p in result:
                pDict = {}
                attr = p['attributes']
                pDict = {'PermitType':attr['permit_type_name'],'PermitNumber':attr['permit_no'],'Status':attr['approval_state'],'Address':attr['main_addr_disp'],'Customer Name':attr['cust_lname'],'Issue Date':parseTime(attr['issue_date']),'Final Date':parseTime(attr['final_date']),'Expiration Date':parseTime(attr['expiration_date']),'Description':attr['permit_desc']}
                resultArray.append(pDict)
        return resultArray
    
    # Used when a user has enabled requests to be saved locally to the PC.
    # This takes the static request_list.json file and combines it with any updates
    # that took place since the file was created
    def combineStaticAndNewRequest(old,new):
        features = old['features']
        newFeatures = new['features']
        for r in newFeatures:
            features[newFeatures[r]['properties']['RequestID']] = newFeatures[r]
        requestArray = []
        for r in features:
            requestArray.append(features[r])
        old['features'] = requestArray
        return old

    # This is a general function used to either get all requests for an array or
    # a request with a RequestID
    def getRequestData(params):
        
        url = mapURL+requestDataURL['Requests']+'/query'

        # if queryType == 'requester' -- definition:
        # On the "New" tab, after a user has entered in contact information. If the user already exists in the system,
        # meaning they were able to select them from the dropdown. A request is made to the server to get the other requests
        # submitted by the requester.
        if queryType == 'requester':
            data = getRequesterParameters(params)
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = parseAndGetAdditionalData(result)
            return result
        else:
            data = {'f':'json','orderByFields':'SubmittedDate DESC, StatusCode ASC','outFields':'*','returnGeometry':'true'}
            if queryType != 'all':
                data = parseParameters(params)
            else:
                with open(r"\\GIS\wwwroot\requests\support_files\requests_list.json") as data_file:    
                    staticData = json.load(data_file)
                data['where'] = "StatusCode <> 99 AND (LastUpdate > '{0}' OR StatusDate > '{0}')".format(staticData['lastUpdate'])
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = parseAndGetAdditionalData(result)
            if queryType == 'all':
                result = combineStaticAndNewRequest(staticData,result)                            
            return result
        
        
    # This is related to the if statement in the getRequestData function to see the requests made by a specific person
    # We have to check the relationship table that holds requestID to contactID information and then retrieve requests with those
    # IDs
    def getRequesterParameters(p):
        contactID = p['cID']
        rUrl = mapURL+requestDataURL['ContactReqRel']+'/query?'
        rData = {'returnGeometry':'false','f':'json'}
        rData['where'] = "ContactID = '" + contactID + "'"
        rData['outFields'] = '*'
        rIDs = dghttpclient.postHttpRequestESRI(rUrl,rData)
        rIDs = rIDs['features']
        
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
            # No features print result
            resultJson = {'features':[], 'queryType':queryType}
            print json.dumps(resultJson)
            exit()
        #data = {'f':'json','returnGeometry':False,'outFields':'*'}
        data = {'f':'json','outFields':'*'}
        data['where']= where
        return data

    # This is used to on the List or Map tabs when the user filters for a category of requests
    # instead of an individual request
    def getRequestTypeQueryForCategories(category):
        url = mapURL + requestDataURL['Types'] + '/query'
        data = {'where':'Category = \'' + category + '\'','f':'json','outFields':'RequestName'}
        requestTypes = dghttpclient.postHttpRequestESRI(url,data)
        if 'features' in requestTypes and len(requestTypes['features']) > 0:
            query = ''
            for r in requestTypes['features']:
                query += 'RequestTypeText = \'' + r['attributes']['RequestName'] + '\' OR '
            query = '(' + query[:-4] + ')'
            return query
        else:
            return False

    # checks the ROW Jurisdiciton feature class in K:/Requests_311/Requests_311_Edit.mxd
    def jurisdictionRightOfWay(x,y):
        data = {'f':'json','geometry':str(x)+','+str(y),'geometryType':'esriGeometryPoint','inSR':4326,'spatialRel':'esriSpatialRelIntersects','outFields':'*','returnGeometry':'false'}
        url = mapURL + requestDataURL['ROW'] + '/query'
        juris = dghttpclient.postHttpRequestESRI(url,data)['features']
        if len(juris) > 0:
            juris = juris[0]['attributes']['MAINT']
        else:
            juris = 'VDG'
        return juris

    # Takes the ESRI Json created from ArcGIS Server and returns a json file in the more general GeoJSON format
    def parseESRIJSON(j):
        features = j['features']

        geo = {'type':'FeatureCollection'}
        if queryType == 'all':
            geoFeatures = {}
        else:
            geoFeatures = []

        for fID in features:
            f = fID
            jDict = {'type':'Feature'}
            jGeometry = {'type':'Point'}
            fGeometry = f['geometry']
            jGeometry['coordinates'] = [fGeometry['x'], fGeometry['y']]
            jDict['geometry'] = jGeometry
            fAttributes = f['attributes']
            jDict['properties'] = fAttributes
            if 'actions' in f:
                jDict['actions'] = f['actions']
            if 'attachments' in f:
                jDict['attachments'] = f['attachments']
            if 'contacts' in f:
                jDict['contacts'] = f['contacts']
            if 'additional' in f:
                jDict['additional'] = f['additional']
            if 'assets' in f:
                jDict['assets'] = f['assets']
            if queryType == 'all':
                geoFeatures[fID['attributes']['RequestID']] = jDict
            else:
                geoFeatures.append(jDict)
        geo['features'] = geoFeatures

        return geo

    # dd - Data Dictionary
    # p = parameters
    # Takes the requests received from the client and parses it to fit into the ArcGIS Server REST API
    def parseParameters(p):
        data = {'f':'json','orderByFields':'SubmittedDate DESC, StatusCode ASC','outFields':'*'}
        # q = query
        if 'q' in p:
            a = ' - All'
            # checks to see a user is filtering request types that match a category instead an individual request type
            if p['q'].find(a) > 0:
                r = 'RequestTypeText = '
                startQuery = p['q'].index(r)
                startValue = p['q'].index(r)+len(r)+1
                endValue = p['q'].index("'",startValue)
                query = getRequestTypeQueryForCategories(p['q'][startValue:(endValue-len(a))])
                if query:
                    oldQuery = p['q'][startQuery:(endValue+1)]
                    p['q'] = p['q'].replace(oldQuery,query)
                    order = 'RequestTypeText ASC, StatusCode ASC, RequestedDate DESC'
                    if 'order' in p:
                        p['order'] = p['order'] + ', ' + order
                    else:
                        p['order'] = order
            data['where'] = p['q']
            if p['r'] != 'detail':
                 data['where'] = data['where']+ ' AND StatusCode <> 99'
        else:
            data['where'] = 'StatusCode <> 99'
        if 'fields' in p:
            data['outFields'] = p['fields']
        if 'bounds' in p:
            data['geometryType'] = 'esriGeometryEnvelope'
            data['geometry'] = p['bounds']
        if 'geo' in p:
            data['returnGeometry'] = p['geo']
        if 'order' in p:
            data['orderByFields'] = p['order']
        return data

    # After the initial request data is retrieved from the Requests feature class.
    # The additional data that make up the request are retrieved
    def parseAndGetAdditionalData(r):
        features = r['features']
        #features['EmployeeID'] = parseEmployee(features['EmployeeID'])
        count = 0
        resultJson = {}
        resultArray = []
        more = True
        # if we're just trying to populate one of these items and the user has not saved requests locally
        # then we only return the request data
        if queryType == 'newmap' or queryType == 'Map' or queryType == 'List':
            more = False

        # We loop through the features to add additional data and to strip out the other information that ArcGIS Server includes in the
        # response
        for f in features:
            attributes = f['attributes']
            # For as much stuff is done on the front end, these two items could be added to it
            attributes['DeptID'] = departments[str(attributes['DeptID'])]
            attributes['DaysOpen'] = getDeltaDaysFromString(attributes['StatusCode'],attributes['StatusDate'],attributes['RequestedDate'])                       
            if more:            
                rID = attributes['RequestID']
                actions = getActions(rID)
                attachments = getAttachments(attributes['OBJECTID'])
                contacts = getContacts(rID)
                feature = {'attributes':attributes,'actions':actions,'attachments':attachments,'contacts':contacts}
                feature['additional'] = getAdditionalInfo(rID)
                if len(feature['additional']) == 0:
                    del feature['additional']
                if attributes['RequestTypeText'] == 'Street Light':
                    feature['assets'] = getAssets(rID)
                if f.get('geometry'):
                    feature['geometry'] = f['geometry']
                resultArray.append(feature)
            else:
                feature = {'attributes':attributes}
                if f.get('geometry'):
                    feature['geometry'] = f['geometry']
                resultArray.append(feature)
        resultJson['features']=resultArray
        resultJson['queryType']=queryType
        #if queryType != 'requester':
        resultJson = parseESRIJSON(resultJson)
        # location query type is used when a user selects an address on the "New" tab or when they click on the
        # map on the "Map" tab
        if queryType == 'location':
            resultJson['permits'] = getPermits()
        return resultJson

    # Convienence function
    def parseDate(d):
        if d:
            d = d[:10]
            d = d.split('-')
            return d[1]+'/'+d[2]+'/'+d[0]
        else:
            return ''

    # Convienence function
    def parseTime(t):
        if t:
            t = datetime.datetime.fromtimestamp(int(t)/1000.0)
            t = t + timedelta(hours=5)
            t = t.strftime('%m/%d/%Y %I:%M:%S %p')
            time = t[-11:]
            if time == '12:00:00 AM' or time == '01:00:00 AM':
                t = t[:10]
            return t
        else:
            return ''

    # Convienence function -- Used for debugging
    def printTimeElapsed():
        rightnow = datetime.datetime.now()
        timediff = rightnow-nowDate
        print "Time Elapsed: {0} seconds".format(timediff.seconds)

    # routeRequest
    # Takes data from either the creating new request form or update request type form (manage tab)
    # checks for jurisidction when applicable 
    # and routes the request based on the whether it is should be geographically routed 
    # or routed to specific staff
    # rd - request data from form
    # rid = request ID (calculated after submittal or provided with update request type form data)
    # returns: updated form data, jurisdiction, email address of the staff member to route to
    def routeRequest(rd, rid):
        # Get GeoRouteType to determine type of routing needed
        # Null = Village Boundary Check
        # Juris = Jurisdiction to determine if we're the responding organization geographically
        # Staff = Staff boundary has been established for who responds to the request (i.e. Code)
        url = mapURL + requestDataURL['Types'] + '/query'
        data = {'where':'RequestName = \'' + rd['requestTypes'] + '\'','f':'json','outFields':'*'}
        reqType = dghttpclient.postHttpRequestESRI(url,data)['features'][0]['attributes']
        # did not use admin variable because this email variable will be changed which
        # will then change the original admin value
        email = 'gis@downers.us'
        owner = 'VDG'
        # If a request originally is returned as out of jurisdiction. The User can request to override the jurisdiction
        jurisdictionOverride = ('f' in rd and rd['f'] == 'jurisdiction')
        # Checks to see if the request should be checked for Jurisdiction (mainly street related requests) or if needs to be routed
        # to staff based on a geographic area (Code && PW Techs)
        if (reqType['GeoRouteType'] == 'Juris' or reqType['GeoRouteType'] == 'Juris|Staff') and jurisdictionOverride is False:
            # The first IF statement is to check for jurisdiction
            # Streets Lights check for ownership of a street light pole and add asset related info to the request
            if rd['requestTypes'] == 'Street Light':
                streetLight = checkStreetLight(rd,0)
                rd['asset'] = streetLight
                addFeature(streetLight)
                owner = streetLight['AssetOwner']
                if owner == 'Village':
                    owner = 'VDG'
            else:
                # Determines if the address is an address not an intersection or block
                # if it is an address we get the parcel geography to basically check to see
                # if the request is on a corner where we would then have to check multiple ROW jurisdictions
                if rd['rAddress'].find('Intersection') == -1 and rd['rAddress'].find('Block') == -1:
                    #geoQuery(geo,geoType,service,queryType):
                    g = "{0},{1}".format(rd['x'],rd['y'])
                    parcel = geoQuery(g,'esriGeometryPoint','DGspa/MapServer/2','esriSpatialRelIntersects','true')
                    owner = 'VDG'
                    if len(parcel) > 0:
                        parcel = parcel[0]['geometry']
                        xValues = []
                        yValues = []
                        for i in range(0,len(parcel['rings'][0])):
                           xValues.append(parcel['rings'][0][i][0])
                           yValues.append(parcel['rings'][0][i][1])
                        
                        envelope = {"xmax":max(xValues),"ymax":max(yValues),"xmin":min(xValues),"ymin":min(yValues),"spatialReference":{"wkid" : 4326}}
                        row = geoQuery(envelope,'esriGeometryEnvelope','Public/Requests311/MapServer/'+requestDataURL['ROW'],'esriSpatialRelIntersects','false')
                        owner = []
                        for r in row:
                            owner.append(r['attributes']['MAINT'])
                        if 'VDG' in owner:
                            owner = 'VDG'
                        else:
                            if len(owner) == 0:
                                owner = 'Out'
                            else:
                                owner = owner[0]
                else:
                    owner = jurisdictionRightOfWay(rd['x'],rd['y'])
        # From here we route to the request to the employee
        # First checking if there is a default employee and if there is not we get the first employee in the list
        if 'assignEmp' not in rd or ('assignEmp' in rd and rd['assignEmp'] == '9999' and rd['requestTypes'] != 'General'):
            if reqType['DefaultAssigned'] is None:
                if (reqType['GeoRouteType'] == 'Staff' or reqType['GeoRouteType'] == 'Juris|Staff') and jurisdictionOverride is False:
                    rd['assignEmp'] = '9999'
                else:
                    respond = str(reqType['RespondingEmployees'])
                    if respond.find(',') != -1:
                        respond = respond.split(',')
                        if len(respond) > 0:
                            rd['assignEmp'] = respond[0]
                        else:
                            respond = None
                    else:
                        rd['assignEmp'] = respond
                    if respond is None:
                        rd['assignEmp'] = '9999'
            else:
                rd['assignEmp'] = reqType['DefaultAssigned']
        # Get Email before Routing can change it or set the default email so that it will be sent to someone
        if owner == 'VDG' and ('assignEmp' in rd and (rd['assignEmp'] != '9999' and rd['assignEmp'] is not None and rd['assignEmp'] != 'None')):
            email,rd = getEmployeeEmailName(rd)
        else:
            rd['assignEmp'] = '9999'
            rd['assignEmpText'] = 'Unassigned'
            email = 'gis@downers.us'

        # If this a Village request and there is a Geographic routing set we then route it to the employee.
        # Otherwise we return the assign employee that was set on the last IF statement
        if owner == 'VDG' and (reqType['GeoRouteType'] == 'Staff' or reqType['GeoRouteType'] == 'Juris|Staff') and jurisdictionOverride is False:
            # if email is the default (which is me right now) check to see if it should be routed
            if email == admin:
                cat = reqType['Category']
                if reqType['MapColor'] == '#B1D2BE':
                    cat = 'Code'
                g = str(rd['x'])+','+str(rd['y'])
                email = routeViaGeo(g,'esriGeometryPoint',cat)
                
                if email is None:
                    email = 'gis@downers.us'
                else:
                    rd['assignEmp'] = email
                    email,rd = getEmployeeEmailName(rd)
        return rd, owner, email

    # looks at the response zones feature class and returns the employee name
    def routeViaGeo(geo,geoType,where):
        url = mapURL + requestDataURL['Response']+'/query'
        data = {'f':'json','geometry':geo,'geometryType':geoType,'inSR':4326,'spatialRel':'esriSpatialRelIntersects','outFields':'*','returnGeometry':'false'}
        if where == 'Streets':
            where = 'PW-TECH'
        data['where'] = 'Type = \'' + where + '\''
        emp = dghttpclient.postHttpRequestESRI(url,data)['features']
        if len(emp) > 0:
            emp = emp[0]['attributes']['EmployID']
        else:
            emp = None
        return emp
    
    # Base email function
    # fr = from 
    def sendEmail(fr,to,msg):
        smtp = smtplib.SMTP("beta.vodg.us")
        smtp.ehlo()
        smtp.sendmail(fr, to, msg.as_string())
        smtp.close()
    
    # Email Confirmation for when user has problems signing in
    # an email is sent with a link that signs in for that person
    def sendEmailConfirmation(params):
        fr = "gis@downers.us"        
        to = params['email']
        #to = admin
        html = '<html><head></head><body><img src="http://www.downers.us/public/themes/2009/images/logo.gif"> <br>Village of Downers Grove Community Response Center<br>'
        html += "<p>This is automated message from the Village of Downers Grove Community Response Center.</p>"
        html += "<p>Please use this link to access the CRC.<br><br><a href=\"http://gis.vodg.us/requests/index.html?email={0}\">Click here to access the CRC</a></p>".format(to)
        html += "</body></html>"
        msg = MIMEMultipart('alternative')
        msg['From'] = fr
        msg['To'] = "<"+to+">"
        msg['Subject'] = "CRC Email Confirmation"
        msg.attach(MIMEText(html,'html'))
        sendEmail(fr,to,msg)
        return {'success':True}

    # A more general email function that accepts an array of people as the to
    # this was set up to eventually allow for group responses (i.e. snow managers)
    def sendNotificationSimple(to,subject,requestData):
        fr = "gis@downers.us"
        # DEBUG -- Uncomment below to send all emails to a specific address
        #to = [admin]

        if subject is None:
            subject = "CRC Request #" + requestData['request']['features'][0]['properties']['RequestID']
        subject = subject + ' -- ' + requestData['request']['features'][0]['properties']['Address']
        
        for i in to:
            msg = MIMEMultipart('alternative')
            msg['From'] = fr
            msg['To'] = "<"+i+">"
            msg['Subject'] = subject
            msg.attach(MIMEText(createNotificationBody(requestData,i),'html'))
            sendEmail(fr,to,msg)
            
    # old notification handling
    # ty = Request Type
    # d = Description
    # e = Email
    # sd = Submitted Date
    # r = RequestID
    # a = address
    # sub = subject
    def sendNotification(ty, d, e, sd, r, a, sub):
        fr = admin
        to = "<"+e+">"
        # DEBUG -- Uncomment below to send all emails to a specific address
        #to = admin
        msg = MIMEMultipart('alternative')
        if sub is None:
            sub = "CRC Request #" + str(r)
        msg['Subject'] = sub
        msg['From'] = fr
        msg['To'] = to
        html = '<html><head></head><body><img src="http://www.downers.us/public/themes/2009/images/logo.gif"> <br>Village of Downers Grove Community Response Center<br>'
        #html += "<br>" + e + "<br>"
        html += "<br>This is automated message from the Village of Downers Grove Community Response Center.<br>"
        
        html += "<br>Request ID: " + str(r)
        html += "<br>Address: " + a
        html += "<br>Type: " + ty
        if d is None:
                html += "<br>Description: <i>None</i>" 
        else:
                html += "<br>Description: " + d
        if not sd:
                html += "<br>Date: <i>None</i>"
        else:
                html += "<br>Date: " + sd
        html += "<br><br>A status update should be performed in the next ? business days."
        html += '<br><br><a href="http://gis.vodg.us/requests/index.html?id='+str(r)+'">Open CRM Map to manage request</b></a>'
        html += "</body></html>"

        part1 = MIMEText(html, 'html')

        msg.attach(part1)

        sendEmail(fr,to,msg)

    # This takes a dictionary of data and parses it to create the email message
    def createNotificationBody(requestData,to):
        html = '<html><head></head><body><img src="http://www.downers.us/public/themes/2009/images/logo.gif"> <br>Village of Downers Grove Community Response Center<br>'
        #html += "<br>" + e + "<br>"
        prop = requestData['request']['features'][0]['properties']
        html += "<br>This is automated message from the Village of Downers Grove Community Response Center.<br>"
        
        html += "<br>Request ID: " + str(prop['RequestID'])
        html += "<br>Address: " + prop['Address']
        html += "<br>Type: " + prop['RequestTypeText']
        if prop['Description'] is None:
                html += "<br>Description: <i>None</i>" 
        else:
                html += "<br>Description: " + prop['Description'].encode('ascii', 'ignore')
        if not prop['RequestedDate']:
                html += "<br>Date: <i>None</i>"
        else:
                html += "<br>Date: " + parseTime(prop['RequestedDate'])
        contacts = requestData['request']['features'][0]['contacts']
        if len(contacts) > 0:
            html += '<br><br><u>Contact Information</u><br>'
            contact = contacts[0]['attributes']
            if 'Name' in contact:
                html += '<br>Name: {0}'.format(contact['Name'])
            if 'Address' in contact:
                html += '<br>Address: {0}'.format(contact['Address'])
            if 'Phone' in contact:
                html += '<br>Phone: {0}'.format(contact['Phone'])
            if 'Email' in contact:
                html += '<br>Email: {0}'.format(contact['Email'])
            if 'Notes' in contact:
                html += '<br>Notes: {0}'.format(contact['Notes'])
                        
        html += '<br><br><a href="http://gis.vodg.us/requests/index.html?id='+str(prop['RequestID'])+'">Open CRM Map to manage request</b></a>'
        html += "</body></html>"
        return html
        

    # function for creating new requests
    # d = request data from form
    def staffCreateRequest(d):
        global requestID
        count = 1
        index = 0
        # this loop ensures that duplicate IDs will not be created
        while (count > 0 or index < 10):
            index += 1
            # RequestID is created using this format YYYYMMDD-HHMM%%
            # Y = Year
            # M = Month
            # D = Day
            # H = Hour
            # M = Minute
            # %% = Random number between 10 and 99
            requestID = nowDate.strftime('%Y%m%d-%H%M')+str(randint(10,99))
            url = mapURL+requestDataURL['Requests']+'/query'
            data = {'where':'RequestID = \'' + requestID + '\'','returnCountOnly':'true','f':'json'}
            # Requests are queried to check if the request already exists returning a count only
            count = dghttpclient.postHttpRequestESRI(url,data)
            count = count['count']
            # if count > 0 the loop will continue to stop an infinite loop 
            # I added an index and the loop will stop if it hits 10
        # Creation of the base request to add a new feature to the Requests feature class
        requestUrl = featureURL+requestDataURL['Requests']+'/addFeatures'
        requestDict = {'f':'json','gdbVersion':'GISUSER.Requests'}
        geometryDict = {'x':d['x'],'y':d['y']}
        statusText = 'New Request'
        statusCode = 2
        # check to see if the X/Y is in the village
        owner = checkVillageBoundary(d['x'],d['y'])
        if owner == 'VDG':
            d, owner, email = routeRequest(d,requestID)
            calculatedResult['requestType'] = d['requestTypes']
        else:
            # send all out of jurisdiction requests to Allison
            # Joe added this before he left as someone should
            # manage those requests to ensure validity
            email = vmAdmin
        if owner != 'VDG':
            statusCode = 11
            statusText = statusCodes[str(statusCode)]
            calculatedResult['owner'] = outJuris[owner]['name']
            calculatedResult['phone'] = outJuris[owner]['phone']
        attributesDict = {'RequestID':requestID,'RequestTypeText':d['requestTypes'],'Address':d['rAddress'],'Description':d['rDesc'],'SubmittedDate':stringFullDate,'StatusCode':statusCode,'StatusText':statusText,'StatusDate':stringFullDate,'EmployeeID':int(d['assignEmp']),'EmployeeText':str(d['assignEmpText']),'DeptID':d['assignEmpDept'],'DeptText':str(d['assignEmpDeptText']),'RequestedDate':d['receivedDate']}
        # Updated By is the user that is logged in
        attributesDict['UpdatedBy'] = d['UpdatedBy']
        i = "Intersection of "
        b = "block of "
        # Need to parse out the address # and street name to help with sorting on the list tab
        # if location address is an intersection
        if i in d['rAddress']:
            attributesDict['Address'] = d['rAddress'][len(i):len(i)+100]
            attributesDict['AddressNo'] = 'None'
            attributesDict['StreetName'] = d['rAddress'][len(i):len(i)+100]
        # ... a block address
        elif b in d['rAddress']:
            p = d['rAddress'].index(' ')
            attributesDict['AddressNo'] = d['rAddress'][0:p]
            attributesDict['StreetName'] = d['rAddress'][p+len(b)+1:]
            attributesDict['Address'] = d['rAddress']
        # ... a normal address
        else:
            p = d['rAddress'].index(' ')
            attributesDict['Address'] = d['rAddress']
            attributesDict['AddressNo'] = d['rAddress'][0:p]
            attributesDict['StreetName'] = d['rAddress'][p+1:]
        # Used to use a geocoder that included the LocID
        # No longer do that this as the address list that is used
        # does not contain it
        # So this IF statement is pretty much irrelevant
        if 'fLOCID' in d:
            attributesDict['LOCID'] = d['fLOCID']
        # Verify that attributes do not have a value of None (null)
        # if they did, None gets changed to a string and the table would show
        # None instead of <null>
        attributesDict = checkForNone(attributesDict)
        featureArray = [{'geometry':geometryDict,'attributes':attributesDict}]
        requestDict['features'] = featureArray
        result = dghttpclient.postHttpRequestESRI(requestUrl,requestDict)
        # check for failure
        if 'addResults' not in result:
            print json.dumps({'success':False})
            return
        result = result['addResults']
        # If the request is created then check for contact info and add that
        # to the contact table
        if checkSuccess(result) is True:
            calculatedResult['objectID'] = result[0]['objectId']
            # Add the objectID which is created by the server to the request
            featureArray[0]['attributes']['objectid'] = result[0]['objectId']
            global contact
            contact = addContact(d)
            calculatedResult['request'] = getRequestData({'q':'RequestID = \'{0}\''.format(requestID),'r':'detail'})
            sendNotificationSimple([email],None,calculatedResult)
            sendNotificationSimple([admin],None,calculatedResult)
            # To handle requests that come from Fieldman/Council, Alex and Stan in CD wanted emails for
            # all CD requests
            if attributesDict['UpdatedBy'] == villageManager:
                subject = "VM: CRC Request #" + str(requestID)
                if str(attributesDict['DeptID']) == '3':
                    sendNotificationSimple(commDevDirectors,subject,calculatedResult)
                sendNotificationSimple([admin],subject,calculatedResult)
            return True
        else:
            return False



    def main(argv):
        global queryType
        """argv = {'UpdatedBy': "jkopinski@downers.us",
    'assignEmp': "9999",
    'assignEmpDept': "9999",
    'assignEmpDeptText': "Unassigned",
    'assignEmpText': "Unassigned",
    'fAddress': "",
    'fEmail': "",
    'fName': "",
    'fPhone': "",
    'r': "create",
    'rAddress': "4608 STANLEY AVE",
    'rDesc': "Test ---- tall grass and weeds",
    'receivedDate': "3/17/2015",
    'requestTypes': "Tall Grass",
    'x': -88.00229638780476,
    'y': 41.80348544578651}"""
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
        requiredFields = ['fAddress','fEmail','fName','fPhone','rAddress','rDesc','receivedDate']
        for i in requiredFields:
            if i not in argv:
                argv[i] = 'None'
        # queryType is the reason for the request to the server
        queryType = argv['r']
        # new request
        if queryType == "create":
            # a global variable is created because there could be potentially be
            # several steps when adding a new request (adding the request, adding the contact,
            # verifying it is within the village, verifying it is our jurisdiction)
            global calculatedResult
            calculatedResult = {}
            resp = staffCreateRequest(argv)
            calculatedResult['success'] = False
            if resp is True and contact is True:
                calculatedResult['success'] = True
                calculatedResult['requestID'] = requestID
            else:
                calculatedResult['error'] = {'request':resp,'contact':contact}
                if resp is True:
                    calculatedResult['requestID'] = requestID
            print json.dumps(calculatedResult)
        # additional information for requests that questions in the questions table
        elif queryType == "additional":
            resp = addAdditionalInfo(argv)
            calculatedResult = {}
            calculatedResult['success'] = False
            if resp is True:
                calculatedResult['success'] = True
                calculatedResult['more'] = True
                calculatedResult['requestID'] = requestID
            print json.dumps(calculatedResult)
        # for handling users that have trouble logging and provide their email
        elif queryType == "confirm":
            print json.dumps(sendEmailConfirmation(argv))
        # when users enable requests being saved locally, a call to the server is
        # required to gather nearby permits
        elif queryType == "permits":
            print json.dumps({"permits":getPermits()})
        # handles all other general queries whether they are for the list of requests
        # or for a specific requests when someone receives an email
        else:
            print json.dumps(getRequestData(argv))

except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        text = "{0}\n{1}\n{2}\n{3}".format(e,exc_type,fname,exc_tb.tb_lineno)
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "CRC Error"
        msg['From'] = '<'+admin+'>'
        msg['To'] = '<'+admin+'>'
        part1 = MIMEText(text, 'html')
        msg.attach(part1)
        sendEmail('<'+admin+'>','<'+admin+'>',msg)
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
                
if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    # DEBUG
    #print ("""Content-type:text/plain\n\n""")
    #getRequestData()
    # PRODUCTION
    print ("""Content-type:application/json\n""")
    main(params)



