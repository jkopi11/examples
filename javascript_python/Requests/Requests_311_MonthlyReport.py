import cgi, cgitb
import ftplib
import json
import datetime
from datetime import timedelta
import sys
import os
import smtplib
import Requests_311_Dashboard_Handler
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from collections import OrderedDict

try:
    nowDate = Requests_311_Dashboard_Handler.nowDate
    day = nowDate.day
    if day == 1:
        startDate = nowDate - timedelta(days=30)
        month = startDate.strftime('%B')
        year = startDate.strftime('%Y')      
        startDate = str(datetime.date(startDate.year,startDate.month,1))
        endDate = str(datetime.date(nowDate.year,nowDate.month,1))
    else:
        startDate = str(datetime.date(nowDate.year,nowDate.month,1))
        month = nowDate.strftime('%B')
        year = nowDate.strftime('%Y')      
        endDate = nowDate.strftime('%Y-%m-%d')

    print startDate
    print endDate
     
    print month
    print year
    
    def getRequestTypes(rd):
        reqTypeDict = {}
        for r in rd:
            reqTypeDict[r['attributes']['RequestName']] = r['attributes']
        return reqTypeDict
    
    def monthlyDataGet():
        strMonth = 'Monthly Total'
        strAllRequests = 'All Open Requests'
        deleted = 'StatusCode <> 99 AND '
        reportTypes = {
            'New Requests':{'subtitle':strMonth,'query':deleted+'RequestedDate >= \'' + startDate + '\' AND RequestedDate < \'' + endDate + '\'','layer':None},
            'Closed Requests':{'subtitle':strMonth,'query':deleted+'StatusDate >= \'' + startDate + '\' AND StatusDate < \'' + endDate + '\' AND StatusText = \'Completed\'','layer':None},
            'Acted On':{'subtitle':strMonth,'query':deleted+'StatusDate >= \'' + startDate + '\' AND StatusDate < \'' + endDate + '\' AND StatusDate <> SubmittedDate','layer':None},
            '# of Actions':{'subtitle':strMonth,'query':'DateEnter >= \'' + startDate + '\' AND DateEnter < \'' + endDate + '\'','layer':'3'},
            'Open Requests':{'subtitle':strAllRequests,'query':Requests_311_Dashboard_Handler.createQuery('Open Requests',None,None,None),'layer':None},
            'Days Open':{'subtitle':strAllRequests,'query':Requests_311_Dashboard_Handler.createQuery('Open Requests',None,None,None),'layer':None},
            'Requests w/o Actions':{'subtitle':strAllRequests,'query':Requests_311_Dashboard_Handler.createQuery('No Action Requests',None,None,None),'layer':None},
        }

        requestTypes = getRequestTypes(Requests_311_Dashboard_Handler.getRequestData('RequestStatus = 1',False,'8'))
        
        r = {}
        reqs = 0
        query = ''
        for rt in reportTypes:
            print rt
            t = {}
            if query != reportTypes[rt]['query']:
                query = reportTypes[rt]['query']
                reqs = Requests_311_Dashboard_Handler.getRequestData(query,False,reportTypes[rt]['layer'])
            d = {}
            t = {'Type':{},'Dept':{},'Category':{},}
            t['subtitle'] = reportTypes[rt]['subtitle']
            t['All'] = len(reqs)
            if rt == '# of Actions':
                q = ''
                for rq in reqs:
                    q = 'RequestID = \'' + rq['attributes']['ActionRequestID'] + '\''
                    req = Requests_311_Dashboard_Handler.getRequestData(q,False,'0')
                    if len(req) > 0:
                        rType = req[0]['attributes']['RequestTypeText']
                        dept = req[0]['attributes']['DeptText']
                        category = requestTypes[req[0]['attributes']['RequestTypeText']]['Category']
                        t['Type'] = Requests_311_Dashboard_Handler.openRequestCount(t['Type'],rType,None)
                        t['Dept'] = Requests_311_Dashboard_Handler.openRequestCount(t['Dept'],dept,None)
                        t['Category'] = Requests_311_Dashboard_Handler.openRequestCount(t['Category'],category,None)
                    
            else:
                for rq in reqs:
                    rType = rq['attributes']['RequestTypeText']
                    dept = rq['attributes']['DeptText']
                    category = requestTypes[rq['attributes']['RequestTypeText']]['Category']
                    if rq['attributes']['Description'].find('via stormwater cost share') > -1:
                        daysOpen = 1
                    else:
                        #temp = (datetime.date(2015,1,1).toordinal() - datetime.date(1970, 1, 1).toordinal()) * 24*60*60
                        #daysOpen = Requests_311_Dashboard_Handler.getDeltaDaysFromTime(temp*1000,rq['attributes']['RequestedDate'])
                        daysOpen = Requests_311_Dashboard_Handler.getDeltaDaysFromTime(None,rq['attributes']['RequestedDate'])
                    v = None
                    if rt == 'Days Open':
                        v = daysOpen
                    if rt == 'Days Open Range':
                        t['Type'] = Requests_311_Dashboard_Handler.dayRangeGet(t['Type'],daysOpen,rType)
                        t['Dept'] = Requests_311_Dashboard_Handler.dayRangeGet(t['Dept'],daysOpen,dept)
                        t['Category'] = Requests_311_Dashboard_Handler.dayRangeGet(t['Category'],daysOpen,category)
                    else:
                        t['Type'] = Requests_311_Dashboard_Handler.openRequestCount(t['Type'],rType,v)
                        t['Dept'] = Requests_311_Dashboard_Handler.openRequestCount(t['Dept'],dept,v)
                        t['Category'] = Requests_311_Dashboard_Handler.openRequestCount(t['Category'],category,v)
            r[rt] = t
        av = 'Days Open'
        td = 0
        tr = 0
        for ty in r[av]:
            if ty != 'All' and ty != 'subtitle':
                r[av][ty],tDays,tReqs = Requests_311_Dashboard_Handler.getAverages(r[av][ty],r['Open Requests'][ty])
                td = td + tDays
                tr = tr + tReqs
        r[av]['All'] = td/tr
        #del r['Days Open Range']['All']
        #r = Requests_311_Dashboard_Handler.dataProcess(r)
        return r

    def monthlyDataProcess():
        addArray = []
        updateArray = []
        for r in reports:
            for s in reports[r]:
                query = 'ReportName = \'' + r + '\' AND Year = ' + year
                if s == 'All':
                    u = ' AND SubType = \'' + s + '\''
                    q = query + u
                    reqs = Requests_311_Dashboard_Handler.getRequestData(q,False,'14')
                    if len(reqs) > 0:
                        a = {}
                        for v in reqs[0]['attributes']:
                            val = reqs[0]['attributes'][v]
                            if val is None or isinstance(val,unicode):
                                val = str(val)
                            if month == str(v):
                                a[str(v)] = reports[r][s]
                            else:
                                a[str(v)] = val
                        updateArray.append({'attributes':a})
                    else:
                        report = {'subtitle':reports[r]['subtitle'],'SubType':s,month:reports[r][s],'ReportName':r,'Year':year}
                        addArray.append({'attributes':report})
                elif s != 'subtitle':
                    # SubType is Dept or Type
                    for t in reports[r][s]:
                        a = {}
                        u = ' AND SubType = \'' + s + ' - ' + t + '\''
                        q = query + u
                        reqs = Requests_311_Dashboard_Handler.getRequestData(q,False,'14')
                        if len(reqs) > 0:
                            for v in reqs[0]['attributes']:
                                val = reqs[0]['attributes'][v]
                                if val is None or isinstance(val,unicode):                                   
                                    val = str(val)
                                if month == str(v):
                                    a[str(v)] = reports[r][s][t]
                                else:
                                    a[str(v)] = val
                            updateArray.append({'attributes':a})
                        else:
                            report = {'subtitle':reports[r]['subtitle'],month:reports[r][s][t],'ReportName':r,'Year':year}
                            report['SubType'] = s + ' - ' + t
                            addArray.append({'attributes':report})
        return addArray,updateArray

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
        with open(fileName, 'w') as outfile:
            json.dump(r, outfile)
        global totalSize
        totalSize = os.stat(fileName).st_size
        ftp.storbinary("STOR " + fileName,open(fileName, 'r'),1024,handleFTP)
        ftp.quit()

    def main():
        global reports
        reports = monthlyDataGet()
        adds,updates = monthlyDataProcess()
        baseURL = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/FeatureServer/'
        if len(adds) > 0:
            print "Adds..."
            #print adds
            data = {'f':'json','features':adds,'gdbVersion':'GISUSER.Requests','rollbackOnFailure':True}            
            result = Requests_311_Dashboard_Handler.postHTTPRequest(baseURL+'14/addFeatures?',data)
            print json.dumps(result)        
        if len(updates) > 0:
            print "Updates..."
            #print updates
            data = {'f':'json','features':updates,'gdbVersion':'GISUSER.Requests','rollbackOnFailure':True}            
            result = Requests_311_Dashboard_Handler.postHTTPRequest(baseURL+'14/updateFeatures?',data)
            print json.dumps(result)
        print "Creating Dashboard JSON and posting to FTP"
        postDataToFTP(Requests_311_Dashboard_Handler.main({"timeFrame":""}),'request_dashboard')
            

except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
                
if __name__ == '__main__':
    #cgitb.enable()
    #params = cgi.FieldStorage()
    # DEBUG
    #print ("""Content-type:text/plain\n\n""")
    # PRODUCTION
    #print ("""Content-type:application/json\n""")
    main()
    #main('a')
