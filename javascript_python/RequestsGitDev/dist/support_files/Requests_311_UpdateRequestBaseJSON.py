import ftplib
import os
import sys
import httplib2
import urllib
import urllib2
import json
from collections import OrderedDict
import datetime
from datetime import timedelta
import shutil
import dghttpclient2 as dghttpclient

baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
#mapURL = baseURL + 'Public/Requests311/MapServer/'
mapURL = baseURL + 'CRC/CRC_Edits/MapServer/'
featureURL = baseURL + 'CRC/CRC_Edits/FeatureServer/'
#featureURL = baseURL + 'Public/Requests311/FeatureServer/'
requestDataURL = {'Requests':'0','ROW':'1','Response':'2','Actions':'3','Contacts':'4','Departments':'5','Employees':'6','ContactReqRel':'7','Types':'8','Questions':'9','Assets':'10','AdditionalInfo':'11','Layers':'12','EmployeesEden':'13','MonthlyData':'14'}
query = '/query?'
dataURLs = {'contacts':'4','employees':'13','types':'8','questions':'9','layers':'12','violationtypes':'15','locationfilter':'2'}
departments = ['Building Services','Business Technology','Community Development','Finance','Fire','Legal',"Manager's Office",'Police','Public Works','Communications']
statusCodes = ['All Open','New Request','Need Site Visit','Need to Contact','Waiting on Resident','Assign to Street Division','Cost Share','Investigation Needed','Unknown','Completed','Outside Jurisdiction','Permit Issued','Work Scheduled']
actionCodes = ['Attachment','Contact Added','Assignment Changed','Google Drive Letter Created','Status Changed','Contact Edited','In-person Conversation','Inspection','Phone Call','Link Added','Email Sent']
timeFrames = {'7':'Week','30':'1 Month','60':'2 Months','90':'3 Months','180':'6 Months','270':'9 Months','365':'1 Year','999':'1 Year +'}
dashboardViews = {'Snapshot':'Snapshot','Performance':'Performance'}
dashboardTypes = {'All':'All','Category':'Category','Dept':'Department','Type':'Type'}
"""
    With the exception of Contact Info, which is needed for typeahead functionality,
    get non-request specific data (i.e. Request Types, Questions, Keywords) in JSON
    format.
"""

try:

    def getDataFromGIS():
        
        requestdata = {}
        requestdata['departments'] = departments
        requestdata['statusCodes'] = statusCodes
        requestdata['actionCodes'] = actionCodes
        requestdata['timeFrames'] = timeFrames
        requestdata['dashboardViews'] = dashboardViews
        requestdata['dashboardTypes'] = dashboardTypes
        #requestdata['dashboardSubtypes'] = getDashboardSubTypes()
        requestcontacts = []
        print dataURLs
        for d in dataURLs:
            print d
            data = {'returnGeometry':'false','f':'json','outFields':'*','where':'OBJECTID IS NOT NULL'}
            if d == 'employees':
                data['orderByFields'] = 'FULL_NAME ASC'
            elif d == 'locationfilter':
                data['returnGeometry'] = 'true'
                data['where'] = 'Type = \'Quadrant\''       
            url = mapURL+dataURLs[d]+query
            print url
            result = dghttpclient.postHttpRequestESRI(url, data)
            result = result['features']
            if d == 'keywords':
                resultDict = {}
                for r in result:
                    attr = r['attributes']
                    keywords = attr['Keywords1']
                    if attr['Keywords2']:
                        keywords = keywords + "," + attr['Keywords2']
                    if keywords:
                        keywords = keywords.split(',')
                    else:
                        keywords = []
                    resultDict[attr['Name']] = keywords
                requestdata[d] = resultDict
            elif d == 'employees':
                empUrl = mapURL+requestDataURL['Employees']+'/query?'
                empData = {'returnGeometry':'false','f':'json','outFields':'*'}
                empJson = {'9999':{'phone':'(630)434-5500','email':'crc@downers.us','name':'Unassigned','title':'Unassigned','dept':9999,'deptText':'Unassigned'}}
                empJson['un'] = {'phone':'(630)434-5500','email':'crc@downers.us','name':'Unassigned','title':'Unassigned','dept':9999,'deptText':'Unassigned'}
                for e in result:
                    e = e['attributes']
                    eID = e['EMP_NO']
                    empData['where'] = 'EmployID = ' + str(eID)
                    empResult = dghttpclient.postHttpRequestESRI(empUrl,empData)
                    empResult = empResult['features']
                    if len(empResult)>0:
                        empResult = empResult[0]['attributes']
                    else:
                        empResult = {'Email':'None','Phone':None,'Active':0}
                    
                    phone = empResult['Phone']
                    if phone is not None:
                        phone = "("+phone[:3]+") "+phone[3:6]+"-"+phone[6:]
                    else:
                        phone = "(###)###-####"
                        
                    empJson[str(eID)] = {'phone':phone,'email':empResult['Email'],'name':e['FULL_NAME'],'title':e['TITLE'],'dept':e['DEPT_NO'],'deptText':e['DEPT'],'active':empResult['Active']}
                #empJson = OrderedDict(sorted(resultDict.items(), key=lambda t: t[2]))
                requestdata[d] = empJson
            elif d == 'types':
                resultDict = {}
                for r in result:
                    attr = r['attributes']
                    requestDict = {'DefaultAssigned':attr['DefaultAssigned'],'RequestID':attr['RequestID'],'MapColor':attr['MapColor']}
                    if attr['RespondingEmployees']:
                        requestDict['RespondingEmployees']= attr['RespondingEmployees'].split(',')
                    else:
                        requestDict['RespondingEmployees'] = 'None'
                    keywords = attr['Keywords1']
                    if attr['Keywords2']:
                        keywords = keywords + "," + attr['Keywords2']
                    if keywords:
                        keywords = keywords.split(',')
                    else:
                        keywords = []
                    requestDict['keywords'] = keywords
                    requestDict['category'] = attr['Category']
                    requestDict['geoLayer'] = attr['GeoLayer']
                    requestDict['geoField'] = attr['GeoField']
                    requestDict['geoRouteType'] = attr['GeoRouteType']
                    requestDict['description'] = attr['Description']
                    requestDict['status'] = attr['RequestStatus']
                    resultDict[attr['RequestName']] = requestDict
                resultDict = OrderedDict(sorted(resultDict.items(), key=lambda t: t[0]))
                requestdata[d] = resultDict
            elif d == 'contacts':
                for r in result:
                    attr = r['attributes']
                    for a in attr:
                        if attr[a] is None:
                            attr[a] = ''
                    attr['ContactName'] = attr['Name']
                    del attr['Name']
                    requestcontacts.append(attr)
            elif d == 'questions':
                resultDict = {}
                # Added second dictionary to look up question text for request that had their request type changed and
                # the new request type does not list the same question
                questionDict = {}
                for r in result:
                    attr = r['attributes']
                    if attr['QuestionType'] == "List":
                        if attr['QuestionAnswerList3'] is not None:
                            questionAnswerList = attr['QuestionAnswerList1'] + "," + attr['QuestionAnswerList2'] + "," + attr['QuestionAnswerList3']
                        elif attr['QuestionAnswerList2'] is not None:
                            questionAnswerList = attr['QuestionAnswerList1'] + "," + attr['QuestionAnswerList2']
                        elif attr['QuestionAnswerList1'] is not None:
                            questionAnswerList = attr['QuestionAnswerList1']
                        else:
                            questionAnswerList = 'None'
                    else:
                        questionAnswerList = 'None'
                    question = {'QuestionType':attr['QuestionType'],'QuestionText':attr['QuestionText'],'QuestionAnswerList':questionAnswerList.split(','),'QuestionOrder':attr['QuestionOrder']}
                    questionDict[attr['QuestionID']] = question
                    question['QuestionID'] = attr['QuestionID']
                    if str(attr['RequestTypeID']) in resultDict:
                        questions = resultDict[str(attr['RequestTypeID'])]
                        questions.append(question)
                        resultDict[str(attr['RequestTypeID'])] = questions
                    else:
                        resultDict[str(attr['RequestTypeID'])] = [question]
                requestdata['question_text'] = questionDict
                requestdata[d] = resultDict
            elif d == 'layers':
                resultDict = {}
                for r in result:
                    attr = r['attributes']
                    resultDict[attr['Name']] = attr
                resultDict = OrderedDict(sorted(resultDict.items(), key=lambda t: t[0]))
                requestdata[d] = resultDict
            elif d == 'violationtypes':
                resultDict = {}
                for r in result:
                    attr = r['attributes']
                    resultDict[attr['Name']] = attr
                resultDict = OrderedDict(sorted(resultDict.items(), key=lambda t: t[0]))
                requestdata[d] = resultDict
            elif d == 'locationfilter':
                resultDict = {}
                for r in result:
                    attr = r['attributes']
                    resultDict[attr['EmployName']] = r
                resultDict = OrderedDict(sorted(resultDict.items(), key=lambda t: t[0]))
                requestdata[d] = resultDict
            else:
                requestdata[d] = result
        postDataToFTP(requestdata,'request_data')
        postDataToFTP(requestcontacts, 'request_contacts')

    def getEmployeeInfo():
        eUrl = mapURL+requestDataURL['Employees']+'/query?'
        edenUrl = mapURL+requestDataURL['EmployeesEden']+'/query?'
        edenData = {'returnGeometry':'false','f':'json','outFields':'*'}
        eData = {'returnGeometry':'false','f':'json'}
        eData['where'] = "OBJECTID IS NOT NULL"
        eData['outFields'] = '*'
        emp = dghttpclient.postHttpRequestESRI(eUrl,eData)
        emp = emp['features']        
        empJson = {}
        for e in emp:
            e = e['attributes']
            eID = e['EmployID']
            edenData['where'] = 'EMP_NO = ' + str(eID)
            edenResult = dghttpclient.postHttpRequestESRI(edenUrl,edenData)
            edenResult = edenResult['features']
            edenResult = edenResult[0]
            phone = e['Phone']
            if phone is not None:
                phone = "("+phone[:3]+") "+phone[3:6]+"-"+phone[6:]
            else:
                phone = "(###)###-####"
            empJson[str(e['EmployID'])] = {'phone':phone,'email':e['Email'],'name':edenResult['FULL_NAME'],'title':edenResult['TITLE']}
        return empJson
        
    """
        Post data to FTP
    """

    sizeWritten = 0
    totalSize = 0

    def handleFTP(block):
        global sizeWritten
        global totalSize
        sizeWritten += 1024 # this line fail because sizeWritten is not initialized.
        percentComplete = sizeWritten / (totalSize*1.0)
        print(str(percentComplete) + " percent complete")

    def postDataToFTP(r,n):
        global sizeWritten
        sizeWritten = 0
        ftp = ftplib.FTP()
        ftp.connect('ftp.downers.us')
        ftp.login('wwwcontent','vDgW3b$1t3')
        ftp.sendcmd('TYPE I')
        ftp.set_pasv(True)
        ftp.cwd('/json')
        fileName = n+'.json'
        copyFile(n)
        with open(fileName, 'w') as outfile:
            json.dump(r, outfile)
        global totalSize
        totalSize = os.stat(fileName).st_size
        ftp.storbinary("STOR " + fileName,open(fileName, 'r'),1024,handleFTP)
        ftp.quit()

    def copyFile(fileName):
        print "Copy File"
        oldFile = r"\\GIS\wwwroot\requests\support_files\{0}.json".format(fileName)
        newFile = r"\\GIS\wwwroot\requests\support_files\{0}_old.json".format(fileName)
        shutil.copyfile(oldFile,newFile)
    """
        Main
    """
    def main():
        logFile = open(r"\\GIS\GISAdmin\Requests_311\log.txt", "a")
        nowDate = datetime.datetime.now()
        nowDate = nowDate + timedelta(hours=6)
        stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
        dayOfWeek = nowDate.weekday()
        
        logFile.write("\n-----     " + stringFullDate + "     -----\n")
        logFile.write("Base Data Updated\n")
        getDataFromGIS()
        logFile.write("------------------------------\n")
        logFile.close()
except Exception,e:
    exc_type, exc_obj, exc_tb = sys.exc_info()
    logFile.write("CRM Daily Notification Error\n")
    logFile.write(str(e)+str(exc_type)+str(exc_tb.tb_lineno)+"\n")
    logFile.write("------------------------------\n")
    logFile.close()
        
if __name__ == '__main__':
    main()
