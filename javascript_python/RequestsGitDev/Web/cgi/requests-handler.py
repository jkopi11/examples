import dghttpclient2 as dghttpclient
import json
import datetime
from datetime import timedelta
import cgi, cgitb
import os, sys
from random import randint

try:
    baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
    mapURL = baseURL + 'Public/Requests311/MapServer/'
    featureURL = baseURL + 'CRC/CRC_Edits/FeatureServer/'
    #featureURL = baseURL + 'Public/Requests311/FeatureServer/'    
    nowDate = datetime.datetime.now()
    stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
    requestDataURL = {'Requests':'0','ROW':'1','Response':'2','Actions':'3','Contacts':'4','Departments':'5','Employees':'6','ContactReqRel':'7','Types':'8','Questions':'9','Assets':'10','AdditionalInfo':'11','Layers':'12','EmployeesEden':'13','MonthlyData':'14'}
    departments = {'1':'Building Services','2':'Business Technology','3':'Community Development','4':'Finance','5':'Fire','6':'Legal','7':"Manager's Office",'8':'Police','9':'Public Works','10':'Communications','9999':'Unassigned'}
    statusCodes = {'0':'New Request','1':'New Request','2':'Need Site Visit','3':'Need to Contact','4':'Waiting on Resident','5':'Assign to Street Division','6':'Cost Share','7':'Investigation','8':'Unknown','9':'Unknown','10':'Completed','11':'Outside Jurisdiction','99':'Deleted'}
    outJuris = {'IDOT':{'name':'Illinois Department of Transportation','phone':'(217)782-7820','uri':'1-217-782-7820'},'DPC':{'name':'DuPage County Department of Transportation','phone':'(630)407-6900','uri':'1-630-407-6900'},'ComEd':{'name':'ComEd','phone':'(800)334-7661','uri':'1-800-334-7661'},'DCFPD':{'name':'DuPage County Forest Preserve','phone':'(630)933-7200','uri':'1-630-933-7200'},'Lisle Township':{'name':'Lisle Township','phone':'(630)968-2087','uri':'1-630-968-2087'},'Milton Township':{'name':'Milton Township','phone':'(630)668-1616','uri':'1-630-668-1616'},'York Township':{'name':'York Township','phone':'(630)620-2400','uri':'1-630-620-2400'},'Woodridge':{'name':'Village of Woodridge','phone':'(630)719-4705','uri':'1-630-719-4705'},'Out':{'name':'Unknown','phone':'Unknown'}}
    unassignedNum = '9999'
    unassigned = 'Unassigned'

    def addAdditionalInfo(d):
        url = featureURL + requestDataURL['AdditionalInfo'] + '/addFeatures'
        featureArray = []
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
        #result = dghttpclient.postHttpRequest(url,data)
        result = dghttpclient.postHttpRequestESRI(url,data)
        result = result['addResults']
        result = checkSuccess(result)
        return result

    def addContact(d):
        # 2 Steps -- 1) Create Contact 2) Add relationship to relationship table
        t = 'contact'
        if 'cType' in d and d['cType'] is not None:
            t = d['cType']
        contactInfo = (('Email' in d or 'Address' in d or 'Phone' in d or 'Name' in d) and (d['Email'] != 'None' or d['Address'] != 'None' or d['Phone'] != 'None' or d['Name'] != 'None'))
        if 'UserID' not in d and contactInfo is True:
            url = mapURL + requestDataURL['Contacts'] + '/query'
            data = {'where':'OBJECTID IS NOT NULL','orderByFields':'ContactID DESC','outFields':'ContactID','f':'json'}
            uID = dghttpclient.getHttpRequest(url,data)
            uID = uID['features'][0]['attributes']['ContactID']
            uID = uID + 1
            url = featureURL + requestDataURL['Contacts'] + '/addFeatures'
            contact = {'Type':t,'Name':d['Name'],'Address':d['Address'],'City':'Downers Grove','State':'IL','Zip':'60515','Email':d['Email'],'Phone':d['Phone'],'Alt_Phone':'None','Notes':'None','ContactID':uID}
            data = {'f':'json','features':[{'attributes':contact}],'gdbVersion':'GISUSER.Requests'}
            #result = dghttpclient.postHttpRequest(url,data)
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = result['addResults']
            result = checkSuccess(result)
        elif 'UserID' in d:
            uID = d['UserID']
            result = True
        else:
            return True
        
        
        if (result):            
            url = featureURL + requestDataURL['ContactReqRel']+'/addFeatures'
            contactRel = {'ContactID':str(uID),'RequestID':str(requestID),'ContactType':t}
            data = {'f':'json','features':[{'attributes':contactRel}],'gdbVersion':'GISUSER.Requests'}
            #result = dghttpclient.postHttpRequest(url,data)
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = result['addResults']
            result = checkSuccess(result)
            return result
        else:
            return False

    def addFeature(f):
        url = featureURL+requestDataURL['Assets']+'/addFeatures'
        f['AssetRequestID'] = requestID
        data = {'f':'json','features':[{'attributes':f}],'gdbVersion':'GISUSER.Requests'}
        result = dghttpclient.postHttpRequestESRI(url,data)
        result = result['addResults']
        result = checkSuccess(result)
        return result

    def checkForAdditionalInfo(requestText):
        url = mapURL + requestDataURL['Types']+'/query'
        data = {'where':'RequestName = \''+requestText+'\'','outFields':'RequestID','f':'json'}
        requestType = dghttpclient.getHttpRequest(url,data)
        if 'features' in requestType and len(requestType['features'])>0:
            reqID = requestType['features'][0]['attributes']['RequestID']
        else:
            return False
        url = mapURL + requestDataURL['Questions']+'/query'
        data = {'where':'RequestTypeID = '+str(reqID),'returnCountOnly':True,'f':'json'}
        additionalCount = dghttpclient.getHttpRequest(url,data)
        if 'count' in additionalCount and additionalCount['count']>0:
            return True
        else:
            return False
        
    def checkForNone(d):
        for c in d:
            if d[c] is None:
                d[c] = str(d[c])
        return d

    # Check Village Boundary
    # Uses the response zone feature class to query whether a request is in the Village Boundary
    # Uses response zone FC because I needed to be able to find other jurisdictions.
    # The last item in the data dictionary is the where clause that specifies to look for features in
    # the response zones FC with type = 'Boundary'
    # Response Zones was initially set up for Employee response zones. So, we have to look in the EmployName
    # field to find who's jurisdiction it is.
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


    def checkSuccess(r):
        r = r[0]
        if r.get('success'):
            return r['success']
        else:
            return False

    def getEmployeeEmailName(d):
        if d['assignEmp'] is None:
            d['assignEmp'] = '9999'
        data = {'where':'EmployID = ' + str(d['assignEmp']) ,'outFields':'*'}
        url = mapURL + requestDataURL['Employees'] + '/query'
        email = dghttpclient.getHttpRequest(url,data)['features']
        if len(email) > 0:
            email = email[0]['attributes']['Email']
        else:
            email = 'jkopinski@downers.us'
            d['assignEmp'] = '9999'
            d['assignEmpText'] = 'Unassigned'
            d['assignEmpDept'] = '9999'
            d['assignEmpDeptText'] = 'Unassigned'
            return email, d
        data['where'] = 'EMP_NO = ' + str(d['assignEmp'])
        url = mapURL + requestDataURL['EmployeesEden'] + '/query'
        name = dghttpclient.getHttpRequest(url,data)['features']
        if len(name) > 0:
            d['assignEmpText'] = name[0]['attributes']['FULL_NAME']
            d['assignEmpDept'] = name[0]['attributes']['DEPT_NO']
            d['assignEmpDeptText'] = name[0]['attributes']['DEPT']
        return email, d

    def geoQuery(geo,geoType,service,queryType,returnGeo):
        data = {'f':'json','geometry':geo,'geometryType':geoType,'inSR':4326,'outSR':4326,'spatialRel':queryType,'outFields':'*','returnGeometry':returnGeo}
        url = baseURL + service + '/query'
        """if geoType == 'esriGeometryPolygon':
            print url
            print geoType,queryType,returnGeo
            print geo"""
        return dghttpclient.getHttpRequest(url,data)['features']

    def getRequestData(params):
        #url = params.getfirst('u')
        
        url = mapURL+requestDataURL['Requests']+'/query'

        if queryType == 'requester':
            data = getRequesterParameters(params)
        else:
            data = parseParameters(params)
        
        if 'd' in params:
            days = params.getValue('d')
            # Do additional parsing
        result = dghttpclient.getHttpRequest(url,data)
        parseAndGetAdditionalData(result)

    def jurisdictionRightOfWay(x,y):
        data = {'f':'json','geometry':str(x)+','+str(y),'geometryType':'esriGeometryPoint','inSR':4326,'spatialRel':'esriSpatialRelIntersects','outFields':'*','returnGeometry':'false'}
        url = mapURL + requestDataURL['ROW'] + '/query'
        juris = dghttpclient.getHttpRequest(url,data)['features']
        if len(juris) > 0:
            juris = juris[0]['attributes']['MAINT']
        else:
            juris = 'VDG'
        return juris

    def parseESRIJSON(j):
        features = j['features']
        geo = {'type':'FeatureCollection'}
        geoArray = []
        for f in features:
            jDict = {'type':'Feature'}
            jGeometry = {'type':'Point'}
            fGeometry = f['geometry']
            jGeometry['coordinates'] = [fGeometry['x'], fGeometry['y']]
            jDict['geometry'] = jGeometry
            fAttributes = f['attributes']
            jDict['properties'] = fAttributes
            geoArray.append(jDict)
        geo['features'] = geoArray
        print json.dumps(geo)

    # dd - Data Dictionary
    def parseParameters(p):
        data = {'f':'json','orderByFields':'SubmittedDate DESC, StatusCode ASC','outFields':'*'}
        if 'q' in p:
            a = ' - All'
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
            data['where'] = p['q'] + ' AND StatusCode <> 99'
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

    def parseAndGetAdditionalData(r):
        features = r['features']
        #features['EmployeeID'] = parseEmployee(features['EmployeeID'])
        count = 0
        resultJson = {}
        resultArray = []
        if queryType == 'requester' or queryType == 'location' or queryType == 'detail':
            more = True
        else:
            more = False
        for f in features:
            attributes = f['attributes']
            for a in attributes:
                if a == 'DeptID':
                    attributes['DeptID'] = departments[str(attributes['DeptID'])]
                if a == 'stDate':
                    attributes['stDate'] = parseDate(attributes['stDate'])
                if a == 'SubmittedDate':
                    attributes['SubmittedDate'] = parseTime(attributes['SubmittedDate'])
                if a == 'StatusDate':
                    attributes['StatusDate'] = parseTime(attributes['StatusDate'])
                if a == 'RequestedDate':
                    d = parseTime(attributes['RequestedDate'])
                    attributes['RequestedDate'] = d
                if a == 'sDate':
                    attributes['sDate'] = parseDate(attributes['sDate'])
            if more:            
                rID = attributes['RequestID']
                actions = getActions(rID)
                attachments = getAttachments(attributes['OBJECTID'])
                contacts = getContacts(rID)
                feature = {'attributes':attributes,'actions':actions,'attachments':attachments,'contacts':contacts}
                if checkForAdditionalInfo(attributes['RequestTypeText']):
                    feature['additional'] = getAdditionalInfo(rID)
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
        if queryType == 'map' or queryType == 'bigmap':
            parseESRIJSON(resultJson)
            return
        print json.dumps(resultJson)
        
    def parseDate(d):
        if d:
            d = d[:10]
            d = d.split('-')
            return d[1]+'/'+d[2]+'/'+d[0]
        else:
            return ''
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
        data = {'where':'RequestName = \'' + rd['RequestTypeText'] + '\'','f':'json','outFields':'*'}
        reqType = dghttpclient.getHttpRequest(url,data)['features'][0]['attributes']
        jk = 'jkopinski@downers.us'
        email = jk
        owner = 'VDG'
        if reqType['GeoRouteType'] == 'Juris' or reqType['GeoRouteType'] == 'Juris|Staff':
            if rd['RequestTypeText'] == 'Street Light':
                streetLight = checkStreetLight(rd,0)
                rd['asset'] = streetLight
                addFeature(streetLight)
                owner = streetLight['AssetOwner']
                if owner == 'Village':
                    owner = 'VDG'
            else:
                if rd['Location'].find('Intersection') == -1 and rd['Location'].find('Block') == -1:
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
        # Get default or first responding employee before routing
        if 'assignEmp' not in rd or ('assignEmp' in rd and rd['assignEmp'] == unassignedNum and rd['RequestTypeText'] != 'General'):
            if reqType['DefaultAssigned'] is None:
                if reqType['GeoRouteType'] == 'Staff' or reqType['GeoRouteType'] == 'Juris|Staff':
                    rd['assignEmp'] = unassignedNum
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
                        rd['assignEmp'] = unassignedNum
            else:
                rd['assignEmp'] = reqType['DefaultAssigned']
        # Get Email before Routing can change it
        if owner == 'VDG' and ('assignEmp' in rd and (rd['assignEmp'] != unassignedNum and rd['assignEmp'] is not None and rd['assignEmp'] != 'None')):
            email,rd = getEmployeeEmailName(rd)
        else:
            rd['assignEmp'] = unassignedNum
            rd['assignEmpText'] = unassigned
            email = jk
        if owner == 'VDG' and (reqType['GeoRouteType'] == 'Staff' or reqType['GeoRouteType'] == 'Juris|Staff'):
            # if email is the default (which is me right now) check to see if it should be routed
            if email == jk:
                cat = reqType['Category']
                if reqType['MapColor'] == '#B1D2BE':
                    cat = 'Code'
                g = str(rd['x'])+','+str(rd['y'])
                email = routeViaGeo(g,'esriGeometryPoint',cat)
                if email is None:
                    email = jk
                else:
                    rd['assignEmp'] = email
                    email,rd = getEmployeeEmailName(rd)
        return rd, owner, email

    def routeViaGeo(geo,geoType,where):
        url = mapURL + requestDataURL['Response']+'/query'
        data = {'f':'json','geometry':geo,'geometryType':geoType,'inSR':4326,'spatialRel':'esriSpatialRelIntersects','outFields':'*','returnGeometry':'false'}
        if where == 'Streets':
            where = 'PW-TECH'
        data['where'] = 'Type = \'' + where + '\''
        emp = dghttpclient.getHttpRequest(url,data)['features']
        if len(emp) > 0:
            emp = emp[0]['attributes']['EmployID']
        else:
            emp = None
        return emp

    def createRequest(d):
        global requestID
        count = 1
        index = 0
        while (count > 0 or index < 10):
            index += 1
            requestID = nowDate.strftime('%Y%m%d-%H%M')+str(randint(10,99))
            url = mapURL+requestDataURL['Requests']+'/query'
            data = {'where':'RequestID = \'' + requestID + '\'','returnCountOnly':'true','f':'json'}
            count = dghttpclient.getHttpRequest(url,data)
            count = count['count']
        #print "Create Request"
        requestUrl = featureURL+requestDataURL['Requests']+'/addFeatures'
        requestDict = {'f':'json','gdbVersion':'GISUSER.Requests'}
        geometryDict = {'x':d['x'],'y':d['y']}
        statusText = 'New Request'
        statusCode = 2
        owner = checkVillageBoundary(d['x'],d['y'])
        if owner == 'VDG':
            d, owner, email = routeRequest(d,requestID)
            calculatedResult['requestType'] = d['RequestTypeText']
        if owner != 'VDG':
            statusCode = 11
            statusText = statusCodes[str(statusCode)]
            calculatedResult['owner'] = outJuris[owner]['name']
            calculatedResult['phone'] = outJuris[owner]['phone']
            calculatedResult['uri'] = outJuris[owner]['uri']
        attributesDict = {'RequestID':requestID,'RequestTypeText':d['RequestTypeText'],'Address':d['Location'],'Description':d['Description'],'SubmittedDate':stringFullDate,'StatusCode':statusCode,'StatusText':statusText,'StatusDate':stringFullDate,'EmployeeID':int(d['assignEmp']),'EmployeeText':str(d['assignEmpText']),'DeptID':d['assignEmpDept'],'DeptText':str(d['assignEmpDeptText']),'RequestedDate':stringFullDate}
        attributesDict['UpdatedBy'] = "crc@downers.us"
        i = "Intersection of "
        b = "block of "
        # Need to parse out the address # and street name to help with sorting on the list tab
        # if location address is an intersection
        if i in d['Location']:
            attributesDict['Address'] = d['Location'][len(i):len(i)+100]
            attributesDict['AddressNo'] = 'None'
            attributesDict['StreetName'] = d['Location'][len(i):len(i)+100]
        # ... a block address
        elif b in d['Location']:
            p = d['Location'].index(' ')
            attributesDict['AddressNo'] = d['Location'][0:p]
            attributesDict['StreetName'] = d['Location'][p+len(b)+1:]
            attributesDict['Address'] = d['Location']
        # ... a normal address
        else:
            p = d['Location'].index(' ')
            attributesDict['Address'] = d['Location']
            attributesDict['AddressNo'] = d['Location'][0:p]
            attributesDict['StreetName'] = d['Location'][p+1:]
        attributesDict = checkForNone(attributesDict)
        featureArray = [{'geometry':geometryDict,'attributes':attributesDict}]
        requestDict['features'] = featureArray
        #result = dghttpclient.postHttpRequest(requestUrl,requestDict)
        result = dghttpclient.postHttpRequestESRI(requestUrl,requestDict)
        result = result['addResults']
        return checkSuccess(result)

    def main(argv):
        global queryType
        
        argv = dict(argv)
        # Used for testing
        """argv = {'UpdatedBy': "jkopinski@downers.us",
'assignEmp': "9999",
'assignEmpDept': "9999",
'assignEmpDeptText': "Unassigned",
'assignEmpText': "Unassigned",
'Address': "",
'Email': "",
'Name': "",
'Phone': "",
'r': "create",
'Location': "4608 STANLEY AVE",
'Description': "Test ---- tall grass and weeds",
'RequestTypeText': "Tall Grass",
'x': -88.00229638780476,
'y': 41.80348544578651}"""
        global parameters
        parameters = argv
        # Comment out for loop when testing
        for a in argv:
            if len(argv[a].value) == 0 or argv[a].value is None:
                argv[a] = 'None'
            else:
                argv[a] = argv[a].value
        requiredFields = ['Address','Email','Name','Phone','Location','Description']
        for i in requiredFields:
            if i not in argv:
                argv[i] = 'None'
        queryType = argv['r']
        argv['assignEmp'] = unassignedNum
        argv['assignEmpText'] = unassigned
        argv['assignEmpDept'] = unassignedNum
        argv['assignEmpDeptText'] = unassigned
        if queryType == "create":
            global calculatedResult
            calculatedResult = {}
            resp = createRequest(argv)
            contact = addContact(argv)
            calculatedResult['success'] = False
            if resp is True and contact is True:
                calculatedResult['success'] = True
                calculatedResult['requestID'] = requestID
            else:
                calculatedResult['error'] = {'request':resp,'contact':contact}
                if resp is True:
                    calculatedResult['requestID'] = requestID
            print json.dumps(calculatedResult)
        elif queryType == "additional":
            resp = addAdditionalInfo(argv)
            calculatedResult = {}
            calculatedResult['success'] = False
            if resp is True:
                calculatedResult['success'] = True
                calculatedResult['more'] = True
                calculatedResult['requestID'] = requestID
            print json.dumps(calculatedResult)
        else:
            getRequestData(argv)

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
