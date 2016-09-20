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

#logFile = open(r"D:\GISAdmin\Requests_311\log.txt", "a")
#DEBUG
logFile = open(r"\\GIS\GISAdmin\Requests_311\log.txt", "a")

def sendEmail(to,subject,body):
    fr = 'gis@downers.us'
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = fr
    msg['To'] = to
    part1 = MIMEText(body,'html')
    msg.attach(part1)
    smtpserver = smtplib.SMTP("beta.vodg.us")
    smtpserver.ehlo()
    smtpserver.sendmail(fr, to, msg.as_string())
    smtpserver.close()

try:
    nowDate = datetime.datetime.now()
    nowDate = nowDate + timedelta(hours=6)
    stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
    dayOfWeek = nowDate.weekday()
    
    logFile.write("\n-----     " + stringFullDate + "     -----\n")
    logFile.write("Daily Notifications\n")

    def getEmployees():
        print "Employees..."
        data = {'f':'json','where':'OBJECTID IS NOT NULL','outFields':'*'}
        url = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/MapServer/6/query'
        employees = json.loads(httpGetRequest(url,data))
        employees = employees['features']
        employWhere = ''
        for e in employees:
            attr = e['attributes']
            employWhere = 'EmployeeId = ' + str(attr['EmployID'])
            data = {'f':'json','returnGeometry':'false','where':employWhere + ' AND (StatusCode <> 10 AND StatusCode <> 11 AND StatusCode <> 99)','outFields':'*'}
            url = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/MapServer/0/query'
            requests = json.loads(httpGetRequest(url,data))
            requests = requests['features']
            if len(requests) > 0:
                sendSummary(requests,attr)

    def getReminders():
        print "Reminders..."
        data = {'f':'json','where':'ActionType = \'Reminder\' and DateActionFollowUp = \''+ stringFullDate[:10] + '\'','outFields':'*'}
        url = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/MapServer/3/query'
        reminders = json.loads(httpGetRequest(url,data))
        reminders = reminders['features']
        for r in reminders:
            sendReminder(r['attributes'])
                

    def httpGetRequest(url, data):
        data = urllib.urlencode(data)
        url = url + '?' + data
        http = httplib2.Http()
        resp,content = http.request(url,"GET")
        return content

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

    def sendReminder(reminder):
        print "Send Reminder"
        to = str(reminder['EnteredBy'])
        #DEBUG
        #to = "jkopinski@downers.us"
        subject = "CRM Reminder for Request ID: " + str(reminder['ActionRequestID'])
        html = '<html><head></head><body><p><img src="http://www.downers.us/public/themes/2009/images/logo.gif"></p>'
        html += "<p>Here is the reminder that you set using the Village of Downers Grove CRC.</p>"
        html += "<p><u>Description</u></p>"
        html += "<p>"+str(reminder['ActionDesc'])+"</p>"
        html += '<p><a href="http://gis.vodg.us/requests/index.html?id='+str(reminder['ActionRequestID'])+'">Open CRM to manage request (Internal Link)</b></a></p>'
        html += "</body></html>"
        sendEmail(to,subject,html)
        logFile.write("Reminder Sent to " + to + " for Request ID: " + str(reminder['ActionRequestID']) + "\n")
        

    def sendSummary(requests,employee):
        print "Send Summary"
        to = employee['Email']
        #DEBUG
        to = "jkopinski@downers.us"
        """name = employee['EmployName']
        if str(name) != 'Unassigned':
            name = name.split(',')[1][1:]
        else:
            to = 'jkopinski@downers.us'"""
        subject = "CRM Weekly Summary"
        html = '<html><head></head><body><p><img src="http://www.downers.us/public/themes/2009/images/logo.gif"></p>'
        #html += "<p>" + name + ",</p>"
        html += "<p>This is automated message from the Village of Downers Grove CRC.<br>"
        html += "<br>Listed below are all your requests that remain open.</p>"
        html += "<table><tbody><tr><td>Request ID</td><td>Type</td><td>Status</td><td>Address</td><td>Last Updated</td></tr>"
        for r in requests:
            attr = r['attributes']
            html += "<tr><td>"+str(attr['RequestID'])+"</td><td>"+str(attr['RequestTypeText'])+"</td><td>"+str(attr['StatusText'])+"</td><td>"+str(attr['AddressNo'])+' '+str(attr['StreetName'])+"</td><td>"+parseTime(attr['StatusDate'])+"</td></tr>"
        html += "</tbody></table>"
        html += '<p><a href="http://gis.vodg.us/requests/index.html?eID='+str(employee['EmployID'])+'">Open CRM to manage request (Internal Link)</b></a></p>'
        html += "</body></html>"
        sendEmail(to,subject,html)
        logFile.write("Summary Email Sent to " + to + " with " + str(len(requests)) + " requests\n")


    getReminders()
    if dayOfWeek == 0:
        getEmployees()
    logFile.write("------------------------------\n")
    logFile.close()

except Exception,e:
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print e
    print(exc_type, fname, exc_tb.tb_lineno)
    sendEmail('jkopinski@downers.us','CRM Daily Notification Error',str(e)+str(exc_type)+str(fname)+str(exc_tb.tb_lineno))
    logFile.write("CRM Daily Notification Error\n")
    logFile.write(str(e)+str(exc_type)+str(fname)+str(exc_tb.tb_lineno)+"\n")
    logFile.write("------------------------------\n")
    logFile.close()


