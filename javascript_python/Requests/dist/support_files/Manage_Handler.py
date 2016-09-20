#!\Python27\32_bit\python.exe

import cgi, cgitb
import httplib2
import urllib
import urllib2
import json
import datetime
import time
import sys
import os
import Requests_311_LucityWorkOrder as LucityWorkOrder
import dghttpclient2 as dghttpclient
#DEVELOPMENT            
#import Requests_Handler_Test as Requests_Handler
#PRODUCTION
import Requests_Handler

actionCodes = Requests_Handler.getActionCodes()
contactTypes = {'contact':'Contact','contractor':'Contractor','inform':'Stay Informed','multi':'Multi-Jursidicational','None':'Contact'}
nowDate = datetime.datetime.now()
stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
#mapURL = baseURL + 'Public/Requests311/MapServer/'
mapURL = baseURL + 'CRC/CRC_Edits/MapServer/'
#mapURL = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/MapServer/'
featureURL = baseURL + 'CRC/CRC_Edits/FeatureServer/'
requestDataURL = {'Requests':'0','ROW':'1','Response':'2','Actions':'3','Contacts':'4','Departments':'5','Employees':'6','ContactReqRel':'7','Types':'8','Questions':'9','Assets':'10','AdditionalInfo':'11','Layers':'12','EmployeesEden':'13','MonthlyData':'14'}

admin = 'gis@downers.us'


try:
    def addAction(d):
        """requestID = '20130902-198298'
        form = d['f']"""
        url = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/FeatureServer/3/addFeatures'
        action = {'ActionRequestID': str(requestID),'ActionType':form,'DateAction':stringFullDate,'DateEnter':stringFullDate,'EnteredBy':d['email']}
        if 'desc' in d and d['desc'] is not None:
            desc = d['desc']
        else:
            desc = ''
        if (form == 'status' or form == 'assign') and len(desc) > 0:
            desc = '\n\n<i>Comment: </i>' + desc

        if 'dateOccurred' in d and d['dateOccurred'] is not None:
            oDate = time.strptime(d['dateOccurred'],'%m/%d/%Y %I:%M %p')
            action['DateAction'] = datetime.datetime(*oDate[:6]).strftime('%Y-%m-%d %H:%M:%S')
        
        """if form == 'attachment' or form == 'drive':
            action['ActionDesc'] = d['attachment']
            action['Attachment'] = d['attachment']"""
        if form == 'status':
            action['ActionDesc'] = 'Changed status from ' + d['from'] + ' to ' + d['statusText'] + '.' + desc 
        elif form == 'assign':
            action['ActionDesc'] = 'Changed assignment from ' + d['from'] + ' to ' + d['EmployeeText'] + '.' + desc
        elif form == 'contact':
            t = d['cType']
            if t is None:
                t = 'contact'
            action['ActionDesc'] = d['cName'] + ' was added as a ' + contactTypes[str(t)]
        elif form == 'contactEdit':
            t = d['cType']
            if t is None or t == 'None':
                t = 'contact'
            action['ActionDesc'] = d['cName'] + '\'s contact info was edited'
        elif form == 'link':
            action['ActionDesc'] = d['filePath']
        elif form == 'respond':
            rad = d['cName'] + ' was added as a respondent'
            if len(desc) > 0: 
                rad += '.\n Comments: ' + desc
            action['ActionDesc'] = rad
        elif form == 'reminder':
            action['ActionDesc'] = desc
            action['DateActionFollowUp'] = d['reminderDate'] + ' 00:00:00'
        elif form == 'description':
            action['ActionDesc'] = 'Updated Description'
        elif form == 'requesttype':
            # rad = Request Type Action Description
            rad = 'Changed request type from ' + d['from'] + ' to ' + d['requestTypes'] + '.'
            if len(desc) > 0:
                rad = rad + '\n Comments: ' + desc
            action['ActionDesc'] = rad
        elif form == 'location':
            # rad = Request Type Action Description
            rad = ''
            if d['from-address'] != d['Address']:
                rad = 'Address was change from ' + d['from-address'] + ' to ' + d['Address'] + '.\n'
            rad = rad + 'Location was changed from [' + d['from-x'] + ',' + d['from-y'] + '] to [' + d['x'] + ',' + d['y'] + '].'
            
            action['ActionDesc'] = rad
        elif form == 'createworkorder':
            action['ActionDesc'] = 'Work Order #' + d['workOrder'] + ' created in Lucity.'
        elif form != 'attachment':
            action['ActionDesc'] = desc
        actionArray = [{'attributes':action}]
        if form == 'createviolation':
            action['ActionType'] = 'Violation'
            action['ActionDesc'] = desc
            actionArray = [{'attributes':action}]
            for i in range(int(d['count'])):
                tAction = dict(action)
                tAction['ActionType'] = ('CV-'+d['violationtype'+str(i+1)])[:20]
                tAction['ActionDesc'] = d['desc'+str(i+1)]
                actionArray.append({'attributes':tAction})
        if 'attachments' in d:
            if form == 'attachment':
                actionArray = []
            for i in range(0,int(d['attachments'])):
                tAction = dict(action)
                tAction['ActionType'] = 'attachment'
                tAction['ActionDesc'] = d['attachment'+str(i+1)]
                actionArray.append({'attributes':tAction})
        data = {'f':'json','features':actionArray,'gdbVersion':'GISUSER.Requests'}
        result = dghttpclient.postHttpRequestESRI(url,data)
        if 'addResults' in result:
            result = checkSuccess(result['addResults'])
        else:
            result = False
        return result

    # addContact
    # Description -- Add contact is for add contacts and also additional employees who have a hand in responding to the request.
    def addContact(d):
        # 2 Steps -- 1) Create Contact 2) Add relationship to relationship table
        t = 'contact'
        if 'cType' in d and d['cType'] is not None:
            t = d['cType']
            if t == 'employee':
                d['fID'] = int(d['fID'])
                global email
                email, e = Requests_Handler.getEmployeeEmailName({'assignEmp':str(d['fID'])})
                
        #if ('fID' not in d and d['assignEmp'] != '9999'):
        if ('fID' not in d):
            url = mapURL + requestDataURL['Contacts'] + '/query'
            data = {'where':'OBJECTID IS NOT NULL','orderByFields':'ContactID DESC','outFields':'ContactID','f':'json'}
            uID = dghttpclient.postHttpRequestESRI(url,data)
            uID = uID['features'][0]['attributes']['ContactID']
            uID = uID + 1
            url = featureURL + requestDataURL['Contacts'] + '/addFeatures'
            contact = {'Type':t,'Name':d['cName'],'Address':d['cAddress'],'City':d['cCity'],'State':d['cState'],'Zip':d['cZip'],'Email':d['cEmail'],'Phone':d['cPhone'],'Alt_Phone':d['cPhone2'],'Notes':d['cNotes'],'ContactID':uID}
            data = {'f':'json','features':[{'attributes':contact}],'gdbVersion':'GISUSER.Requests'}
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = result['addResults']
            result = checkSuccess(result)
        elif 'fID' in d:
            uID = d['fID']
            result = True
        else:
            return True
        
        
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

    def checkNone(v):
        if v is None:
            return 'None'
        else:
            return v
        
    def checkSuccess(r):
        result = True
        for re in r:
            if re.get('success') is False:
                result = False
        return result

    def editContact(d):
        t = 'contact'
        if 'cType' in d and d['cType'] is not None:
            t = d['cType']
        contact = {'OBJECTID':int(d['cObjID']),'ContactID':checkNone(d['ContactID']),'Name':checkNone(d['cName']),'Address':checkNone(d['cAddress']),'City':checkNone(d['cCity']),'State':checkNone(d['cState']),'Zip':checkNone(d['cZip']),'Email':checkNone(d['cEmail']),'Phone':checkNone(d['cPhone']),'Alt_Phone':checkNone(d['cPhone2']),'Notes':checkNone(d['cNotes']),'cRqID':'None','Type':t,'cID':'None'}
        url = featureURL + requestDataURL['Contacts'] + '/updateFeatures'
        data = {'f':'json','gdbVersion':'GISUSER.Requests','rollbackOnFailure':'true','features':[{'attributes':contact}]}
        result = dghttpclient.postHttpRequestESRI(url,data)
        result = result['updateResults']
        result = checkSuccess(result)
        if (result):
            url = mapURL + requestDataURL['ContactReqRel']+'/query'
            data = {'f':'json','outFields':'*','where':'ContactID = \''+d['ContactID']+'\' AND RequestID = \''+d['rID']+'\''}
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = result['features']
            result = result[0]
            attr = result['attributes']
            url = featureURL + requestDataURL['ContactReqRel']+'/updateFeatures'
            for a in attr:
                if a == 'ContactType':
                    attr[a] = t
                elif a == 'OBJECTID':
                    attr[a] = attr[a]
                else:
                    attr[a] = str(attr[a])
            attr = Requests_Handler.dictionaryKeyUnicodeToString(attr)
            data = {'f':'json','gdbVersion':'GISUSER.Requests','rollbackOnFailure':'true','features':[{'attributes':attr}]}
            result = dghttpclient.postHttpRequestESRI(url,data)
            result = result['updateResults']
            result = checkSuccess(result)
            return result
        else:
            return False
        
    def getRequest(d):
        url = mapURL + '0/query'
        data = {'objectIds':d['r'],'f':'json','outFields':'*'}
        return dghttpclient.postHttpRequestESRI(url,data)

    # Uses the requests handler to get new information. This just runs through the main function.
    # and then the getRequestData function which prints the updated request in json format
    def getUpdatedRequestAndData():
        data = {'r':'detail','q':'RequestID = \''+requestID+'\'','outFields':'*','geo':True}
        Requests_Handler.main(data)

    def parseAddress(request,argv):
        i = "Intersection of "
        b = "block of "
        # Need to parse out the address # and street name to help with sorting on the list tab
        # if location address is an intersection

        if i in argv['Address']:
            request['features'][0]['attributes']['Address'] = argv['Address'][len(i):len(i)+100]
            request['features'][0]['attributes']['AddressNo'] = 'None'
            request['features'][0]['attributes']['StreetName'] = argv['Address'][len(i):len(i)+100]
        # ... a block address
        elif b in argv['Address']:
            p = argv['Address'].index(' ')
            request['features'][0]['attributes']['AddressNo'] = argv['Address'][0:p]
            request['features'][0]['attributes']['StreetName'] = argv['Address'][p+len(b)+1:]
            request['features'][0]['attributes']['Address'] = argv['Address']
        # ... a normal address
        else:
            p = argv['Address'].index(' ')
            request['features'][0]['attributes']['Address'] = argv['Address']
            request['features'][0]['attributes']['AddressNo'] = argv['Address'][0:p]
            request['features'][0]['attributes']['StreetName'] = argv['Address'][p+1:]
        return request

    def updateRequest(d,r):
        request = r['features']
        fields = r['fields']
        integers = []
        dates = []
        for f in fields:
            if f['type'] == 'esriFieldTypeInteger' or f['type'] == 'esriFieldTypeOID':
                integers.append(f['name'])
            elif f['type'] == 'esriFieldTypeDate': 
                dates.append(f['name'])
        req = request[0]
        attr = req['attributes']
        global objectID
        global requestID
        objectID = attr['OBJECTID']
        requestID = attr['RequestID']
        attributes = {}
        for a in attr:
            if attr[a] == None:
                attributes[str(a)] = 'None'
            elif a in integers:
                attributes[str(a)] = int(attr[a])
            elif a in dates:
                attributes[str(a)] = float(attr[a])
            else:
                attributes[str(a)] = attr[a].encode('ascii', 'ignore')
        if form == 'status' or form == 'createworkorder':
            statusCode = '12'
            statusText = 'Work Order Created'
            if form == 'status':
                statusCode = d['filter-status']
                statusText = d['statusText']
            attributes['StatusCode'] = statusCode
            attributes['StatusText'] = statusText
            attributes['StatusDate'] = stringFullDate
        if form == 'jurisdiction':
            attributes['StatusCode'] = '2'
            attributes['StatusText'] = 'New Request'
            attributes['EmployeeID'] = str(d['filter-assign'])
            attributes['EmployeeText'] = str(d['assignEmpText'])
            attributes['DeptID'] = int(d['assignEmpDept'])
            attributes['DeptText'] = str(d['assignEmpDeptText'])
            
        if form == 'assign' or (form == 'requesttype' and d['auto-assign'] == 'on'):
            global email
            if form == 'assign':
                email, e = Requests_Handler.getEmployeeEmailName({'assignEmp':str(d['filter-assign'])})
            else:
                e, owner, email = Requests_Handler.routeRequest(d,d['RequestID'])
            attributes['EmployeeID'] = str(d['filter-assign'])
            attributes['EmployeeText'] = str(e['assignEmpText'])
            attributes['DeptID'] = int(e['assignEmpDept'])
            attributes['DeptText'] = str(e['assignEmpDeptText'])
        if form == 'description':
            attributes['Description'] = d['desc']
        # Update Last Update
        attributes['LastUpdate'] = stringFullDate
        if form == 'requesttype':
            attributes['RequestTypeText'] = d['requestTypes']
        geo = req['geometry']
        geometry = {}
        for g in geo:
            geometry[str(g)] = float(geo[g])
        url = featureURL+'0/updateFeatures'
        requests = [{'attributes':attributes,'geometry':geometry}]
        requestData = {'f':'json','gdbVersion':'GISUSER.Requests','rollbackOnFailure':'true','features':requests}
        result = dghttpclient.postHttpRequestESRI(url,requestData)
        if 'updateResults' in result:            
            result = result['updateResults']
            result = checkSuccess(result)
        else:
            result = False
        return result
        
        
    def main(argv):
        argv = dict(argv)
        for a in argv:
            argv[a] = argv[a].value
        global form
        form = argv['f']
        request = getRequest(argv)
        # Update location
        if form == 'location':
            request['features'][0]['geometry']['x'] = argv['x']
            request['features'][0]['geometry']['y'] = argv['y']
            request = parseAddress(request,argv)
                
        global email
        # If the request type has changed get necessary information to send notification
        if form == 'requesttype' or form == 'jurisdiction':
            if 'requestTypes' not in argv:
                argv['requestTypes'] = request['features'][0]['attributes']['RequestTypeText']
            nType = argv['requestTypes']
            argv['assignEmp'] = '9999'
            argv['rAddress'] = request['features'][0]['attributes']['Address']
            argv, owner, email = Requests_Handler.routeRequest(argv,request['features'][0]['attributes']['RequestID'])
            argv['filter-assign'] = argv['assignEmp']
        update = updateRequest(argv,request)
        # Update request to make request only the attributes. Wait til after because updateRequest processing the request differently
        # and uses some of the metadata data that comes back with the call to the feature service
        request = request['features'][0]['attributes']

        # Set the defaults for action and contact. These will be changed as needed and the returned data will depend on the states
        # of both the these variables.
        action = False
        contact = None
        
        if form == 'requesttype' or form == 'assign' or form == 'jurisdiction':
            nSubmitDate = Requests_Handler.parseTime(request['SubmittedDate'])
            subjectHeader = 'ASSIGNMENT CHANGED: '
            if form == 'requesttype':
                subjectHeader = 'REQUEST TYPE CHANGED: '
            if email:
                Requests_Handler.sendNotification(request['RequestTypeText'],request['Description'],email,nSubmitDate,request['RequestID'],request['Address'],subjectHeader + 'CRC Request #' +request['RequestID'])
            Requests_Handler.sendNotification(request['RequestTypeText'],request['Description'],admin,nSubmitDate,request['RequestID'],request['Address'],subjectHeader + 'CRC Request #' +request['RequestID'])
        if form == 'contact' or form == 'respond':
            contact = addContact(argv)
            action = addAction(argv)
            if form == 'respond':
                Requests_Handler.sendNotification(request['RequestTypeText'],argv['desc'],email,Requests_Handler.parseTime(request['SubmittedDate']),request['RequestID'],request['Address'],'You have been ADDED to CRC Request #' +request['RequestID'])
                Requests_Handler.sendNotification(request['RequestTypeText'],argv['desc'],admin,Requests_Handler.parseTime(request['SubmittedDate']),request['RequestID'],request['Address'],'You have been ADDED to CRC Request #' +request['RequestID'])
        elif form == 'contactEdit':
            contact = editContact(argv)
            action = addAction(argv)
        elif form == 'createworkorder':
            url = mapURL + requestDataURL['Requests'] + '/query'
            data = {'where':'RequestID = \''+requestID+'\'','outFields':'*','outSR':102671,'f':'json'}
            request = dghttpclient.postHttpRequestESRI(url,data)['features'][0]
            lucity = LucityWorkOrder.createWorkOrder(request,argv['email'])
            if 'wo_id' in lucity:
                argv['workOrder'] = lucity['wo_id']
                action = addAction(argv)
        else:
            action = addAction(argv)
        

        if update and action and (contact is None or contact):
            print ("""Content-type:application/json\n""")
            getUpdatedRequestAndData()
            #print json.dumps({'success':True})
        else:
            print "Status: 501 Not Implemented\n\n" + "update: " + str(update) + " action : " + str(action) + "contact: " + str(contact) + "\n"
        
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
        Request_Handler.sendEmail('<'+admin+'>','<'+admin+'>',msg)
        print ("""Content-type:text/plain\n\n""")
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
                
if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    # DEBUG
    #print ("""Content-type:text/plain\n\n""")
    # PRODUCTION
    #print ("""Content-type:application/json\n""")
    main(params)



