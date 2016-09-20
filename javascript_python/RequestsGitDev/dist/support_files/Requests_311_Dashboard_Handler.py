#!\Python27\32_bit\python.exe

import cgi, cgitb
import httplib2
import urllib
import urllib2
import json
import datetime
from datetime import timedelta
import sys
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from collections import OrderedDict

try:
    baseURL = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/MapServer/'
    departments = {'1':'Building Services','2':'Business Technology','3':'Community Development','4':'Finance','5':'Fire','6':'Legal','7':"Manager's Office",'8':'Police','9':'Public Works','9999':'Unassigned'}
    nowDate = datetime.datetime.now()
    nowDate = nowDate - timedelta(hours=6)
    stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
    months = {'1':'January','2':'February','3':'March','4':'April','5':'May','6':'June','7':'July','8':'August','9':'September','10':'October','11':'November','12':'December'}
    #monthArray = ['January','February','March','April','May','June','July','August','September','October','November','December']
    dataSeriesColors = {}
    requestTypes = {}
    
    def checkSuccess(r):
        r = r[0]
        if r.get('success'):
            return r['success']
        else:
            return False

    #t-report type, d-Dept rn-RequestName s-report sub type (by dept or request type), tf-timeframe
    def createQuery(t,d,rn,tf):
        w = ''
        openRequest = 'StatusText <> \'Completed\' AND StatusText <> \'Complete\' AND StatusText <> \'Delete\' AND StatusText <> \'Outside Jurisdiciton\''
        if t == 'Open Requests':
            w = openRequest
        elif t == 'No Action Requests':
            w = openRequest + ' AND StatusDate = SubmittedDate'
        if rn is not None:
            w = w +' AND RequestTypeText = \'' + rn + '\''
        if d is not None:
            w = w +' AND DeptID = ' + d
        if tf is not None:
            w = ' AND SubmittedDate > \''+tf+'\''
        #print w
        return w

    # rd-rangedictionary days-daysOpen, n
    def dayRangeGet(rd,days,n):
        dayRange = {'0':0,'31':0,'91':0,'181':0,'271':0,'365':0}
        if n in rd:
            dayRange = rd[n]
        if days < 31:
            dayRange['0'] = dayRange['0'] + 1
        elif days < 91:
            dayRange['31'] = dayRange['31'] + 1
        elif days < 181:
            dayRange['91'] = dayRange['91'] + 1
        elif days < 271:
            dayRange['181'] = dayRange['181'] + 1
        elif days < 366:
            dayRange['271'] = dayRange['271'] + 1
        else:
            dayRange['365'] = dayRange['365'] + 1
        rd[n] = dayRange
        return rd

    

    def dataMonthlyAddName(d):
        finalArray = []
        tempDict = {}
        for a in d:
            tempArray = []
            for e in a['data']:
                tempArray.append({'y':e,'name':a['name']})
            a['data'] = tempArray
            finalArray.append(a)
        return finalArray
        

    # Monthly data is saved in the DB by year. The output needs to be the last 12 months.
    
    def dataMonthlyCombineYears(d):
        t = {}
        ra = []
        for a in d:
            if a['name'] not in t:
                t[a['name']] = a['data']
            else:
                fa = []
                ta1 = t[a['name']]
                for i in range(len(ta1)):
                    if ta1[i] > 0:
                        fa.append(ta1[i])
                    elif a['data'][i] > 0:
                        fa.append(a['data'][i])
                    else:
                        fa.append(0)
                t[a['name']] = fa
        for s in t:
            ra.append({'name':s,'data':t[s]})
        return ra
    
    #rd - range for dept rt - range for type
    def dataProcess(d):
        for c in d:
            b = d[c]
            #resulting dictionary
            f = {}
            for a in b:
                if a != 'All' and a != 'subtitle' and a != 'report_type':
                    dd = {}
                    z = b[a]
                    #labels
                    l = []
                    #data
                    r = []
                    #p = []
                    i = 0
                    for y in z:
                        x = z[y]
                        # if a data item has categories within it, it will need to
                        # be looped through again.
                        if c == 'Days Open Range':
                            q = []
                            x = OrderedDict(sorted(x.items(),key=lambda t:int(t[0])))
                            l = ['0-30','31-90','91-180','181-270','271-365','365+']
                            for w in x:
                                q.append({'y':x[w],'name':w,'color':getColorForData(y)})
                            r.append({'name':y,'data':q,'color':getColorForData(y)})
                        else:
                            r.append({'name':y,'data':[{'y':x,'name':y,'color':getColorForData(y)}],'color':getColorForData(y)})
                            l.append(y)
                        i = i + 1
                    dd['labels'] = l
                    if len(r) > 0:
                        dd['data'] = r
                    """else:
                        dd['data'] = p"""
                    f[a] = dd
                else:
                    f[a] = b[a]
            d[c] = f
        return d
        

    def getAverages(avg, op):
        d = 0
        o = 0
        for i in avg:
            d = d+avg[i]
            o = o+op[i]
            avg[i] = avg[i]/op[i]
        return avg,d,o

    def getCategoryForRequestTypes():
        global requestTypes
        tempTypes = getRequestData('RequestStatus = 1',False,'8')
        for t in tempTypes:
            requestTypes[t['attributes']['RequestName']] = t['attributes']

    def getColorForData(n):
        colors = ['#0083C5','#19F8CB','#003F5F','#F96A57','#C50012','#389F6D','#00C52D','#F8C17C','#C56E00','#265F53']
        global dataSeriesColors
        color = colors[0]
        if n in dataSeriesColors:
            color = dataSeriesColors[n]
        else:
            color = colors[len(dataSeriesColors)%10]
            dataSeriesColors[n] = color
        return color

    #d1 - Status Date, d2 - Submitted Date, f - Format of Date String
    def getDeltaDaysFromString(s,d1,d2,f):
        if d2 is not None and len(d2) > 0:
            d2 = datetime.datetime.strptime(d2, f)
        if s == 10:
            d1 = datetime.datetime.strptime(d1, f)
            diff = d1-d2
        #elif s != 99:
        else:
            now = datetime.datetime.now()
            diff = now-d2
        return diff.days

    #d1 - To Date, d2 - From Date
    def getDeltaDaysFromTime(d1,d2):
        d2 = datetime.datetime.fromtimestamp(int(d2)/1000.0)
        if d1 is not None and d1 > 0:
            d1 = datetime.datetime.fromtimestamp(int(d1)/1000.0)
        else:
            d1 = datetime.datetime.now()
        diff = d1-d2
        return diff.days

    def getHTTPRequest(url, data):
        data = urllib.urlencode(data)
        url = url + '?' + data
        http = httplib2.Http()
        resp,content = http.request(url,"GET")
        return content

    def getMonthlyDataForDashboard():
        thisYear = nowDate.year
        yearAgo = nowDate - timedelta(days=365)
        lastYear = yearAgo.year
        reportMonths = []
        for i in range(yearAgo.month+1,yearAgo.month+13):
            if i > 12:
                i = i % 12
            reportMonths.append(months[str(i)])
        query = 'Year = ' + str(thisYear) + ' OR Year = ' + str(lastYear)
        reqs = getRequestData(query,False,'14')
        #print reqs
        p = {}

        for r in reqs:
            data = []
            labels = []
            a = r['attributes']
            if a['ReportName'] in p:
                p[a['ReportName']]['labels'] = reportMonths
            else:
                p[a['ReportName']] = {'labels':reportMonths}
            rType = a['SubType']
            if rType != 'All':
                rType = rType.split(' - ')
                rSubType = ''                
                for i in range(1,len(rType)):
                    rSubType += rType[i] + " - "
                rSubType = rSubType.rstrip(" - ")
                rType = rType[0]
            else:
                rSubType = 'All'
            # The fields in the monthly data table that are not statistical
            notMonths = ['ReportName','SubType','subtitle','Year']
            for rm in reportMonths:
                labels.append(rm)
                v = a[rm]
                if v is None:
                    v = 0
                data.append(v)
            if a['ReportName'] in p:
                p[a['ReportName']]['labels'] = labels
            else:
                p[a['ReportName']] = {'labels':labels}
            if rType in p[a['ReportName']]:
                td = p[a['ReportName']][rType]
                p[a['ReportName']][rType].append({'name':rSubType,'data':data})
            else:
                p[a['ReportName']][rType] = [{'name':rSubType,'data':data}]
        for q in p:
            for r in p[q]:
                if r != 'labels':
                    p[q][r] = dataMonthlyAddName(dataMonthlyCombineYears(p[q][r]))
        return p

    
    def getRequestsForDashboard():
        thirty = nowDate - timedelta(days=30)
        thirtyString = thirty.strftime('%Y-%m-%d')
        strLast30 = 'Last 30 Days'
        strAllRequests = 'All Open Requests'
        deleted = 'StatusCode <> 99 AND '
        reportTypes = {
            'New Requests':{'subtitle':strLast30,'query':deleted+'RequestedDate > \'' + thirtyString + '\'','layer':None},
            'Closed Requests':{'subtitle':strLast30,'query':deleted+'StatusDate > \'' + thirtyString + '\' AND StatusText = \'Completed\'','layer':None},
            'Acted On Requests':{'subtitle':strLast30,'query':deleted+'StatusDate > \'' + thirtyString + '\' AND StatusDate <> SubmittedDate','layer':None},
            '# of Actions':{'subtitle':strLast30,'query':'DateEnter > \'' + thirtyString + '\'','layer':'3'},
            'Open Requests':{'subtitle':'Total','query':createQuery('Open Requests',None,None,None),'layer':None},
            'Days Open':{'subtitle':strAllRequests +' - Average','query':createQuery('Open Requests',None,None,None),'layer':None},
            'Days Open Range':{'subtitle':strAllRequests,'query':createQuery('Open Requests',None,None,None),'layer':None},
            'Requests w/o Actions':{'subtitle':strAllRequests,'query':createQuery('No Action Requests',None,None,None),'layer':None},
        }
        r = {}
        reqs = 0
        query = ''
        for rt in reportTypes:
            t = {}
            if query != reportTypes[rt]['query']:
                query = reportTypes[rt]['query']
                reqs = getRequestData(query,False,reportTypes[rt]['layer'])
            d = {}
            t = {'Category':{},'Type':{},'Dept':{},'subtitle':reportTypes[rt]['subtitle'],}
            t['All'] = {'name':'All','color':getColorForData('All'),'data':[{'y':len(reqs),'name':'All','color':getColorForData('All')}]}
            if rt == '# of Actions':
                q = ''
                for rq in reqs:
                    q = 'RequestID = \'' + rq['attributes']['ActionRequestID'] + '\''
                    req = getRequestData(q,False,'0')
                    if len(req) > 0 and req[0]['attributes']['StatusCode'] != 99:
                        rType = req[0]['attributes']['RequestTypeText']
                        dept = req[0]['attributes']['DeptText']
                        category = requestTypes[rType]['Category']
                        t['Type'] = openRequestCount(t['Type'],rType,None)
                        t['Dept'] = openRequestCount(t['Dept'],dept,None)
                        t['Category'] = openRequestCount(t['Category'],category,None)
            else:
                for rq in reqs:
                    rType = rq['attributes']['RequestTypeText']
                    dept = rq['attributes']['DeptText']
                    category = requestTypes[rq['attributes']['RequestTypeText']]['Category']
                    if rq['attributes']['Description'].find('via stormwater cost share') > -1:
                        daysOpen = 1
                    else:
                        daysOpen = getDeltaDaysFromTime(None,rq['attributes']['RequestedDate'])
                    v = None
                    if rt == 'Days Open':
                        v = daysOpen
                    if rt == 'Days Open Range':
                        t['Type'] = dayRangeGet(t['Type'],daysOpen,rType)
                        t['Dept'] = dayRangeGet(t['Dept'],daysOpen,dept)
                        t['Category'] = dayRangeGet(t['Category'],daysOpen,category)
                    else:
                        t['Type'] = openRequestCount(t['Type'],rType,v)
                        t['Dept'] = openRequestCount(t['Dept'],dept,v)
                        t['Category'] = openRequestCount(t['Category'],category,v)
            r[rt] = t
        av = 'Days Open'
        td = 0
        tr = 0
        for ty in r[av]:
            if ty != 'All' and ty != 'subtitle' and ty != 'report_type':
                r[av][ty],tDays,tReqs = getAverages(r[av][ty],r['Open Requests'][ty])
                td = td + tDays
                tr = tr + tReqs
        r[av]['All'] = {'name':'All','color':getColorForData('All'),'data':[{'y':td/tr,'name':'All','color':getColorForData('All')}]}
        del r['Days Open Range']['All']
        r = dataProcess(r)
        return r

    def getRequestData(where,countOnly,layer):
        #sprint where + '\n'
        if layer is None:
            layer = '0'
        url = baseURL + layer + '/query'
        data = {'outFields':'StatusCode,DeptText,RequestTypeText,RequestedDate,StatusDate,SubmittedDate,Description','f':'json','where':where,'returnGeometry':False}
        if layer != '0':
            data['outFields'] = '*'
        if countOnly:
            data['returnCountOnly'] = True
        result = json.loads(getHTTPRequest(url,data))
        #print result
        if countOnly:
            return result['count']
        else:
            return result['features']

    # rd - Open Request Dictionary n - name of request of type v - value
    def openRequestCount(rd,n,v):
        if rd is None:
            rd = {}
        if v is None:
            v = 1
        if n not in rd:
            rd[n] = v
        else:
            rd[n] = rd[n] + v
        return rd
            
    # dd - Data Dictionary
    def parseParameters(p):
        data = {'f':'json','outFields':'*','returnGeometry':False,'where':'SubmittedDate > '+timeframe}
        return data
        
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
            t = t + timedelta(hours=6)
            t = t.strftime('%m/%d/%Y %I:%M:%S %p')
            return t
        else:
            return ''

    def postHTTPRequest(url, data):
        headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
        http = httplib2.Http()
        data = urllib.urlencode(data)
        data = data.replace('%27None%27','null')
        data = data.replace('+u%27','+%27')
        resp, content = http.request(url,"POST",data,headers=headers)
        result = json.loads(content)
        return result

    def main(argv):
        getCategoryForRequestTypes()
        global args
        if isinstance(argv,dict) is False:
            args = dict(argv)
            for a in args:
                args[a] = args[a].value
        else:
            args = argv
        global report
        report = {}
        report['Snapshot'] = getRequestsForDashboard()
        report['Performance'] = getMonthlyDataForDashboard()

        """fileName = 'dashboard.json'
        with open(fileName, 'w') as outfile:
            json.dump(report, outfile)"""
        return json.dumps(report)

except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
                
if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    if params is None:
        params = {'Dashboard':sys.argv[1]}
    # DEBUG
    #print ("""Content-type:text/plain\n\n""")
    # PRODUCTION
    print ("""Content-type:application/json\n""")
    main(params)
    #main('a')



