# Requests_311_StatusCodes.py
# Created on: 2014-01-30
# Usage: Handle CRC Requests through Mobile App
# Description: 
# The email engine behind CRC Mobile app. Sends out emails as their statuses
# change.
# ---------------------------------------------------------------------------

import arcpy, urllib, urllib2, json
import datetime
import smtplib
import sys
import os
import pyodbc
from arcpy import env
from datetime import timedelta
from datetime import time
from dateutil import tz
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

arcpy.overwriteOutputs = True;

#Local Variables

t = "Type"
desc = "Description"
email = "Email"
employeeID  = "EmployeeID"
sDate = "sDate"
rID = "RequestID"
stDate = "stDate"
sCode = "StatusCode"
fldAddress = "Address"

actionRequestID = "ActionRequestID"
aType = "ActionType"

emailAddresses = ["kbehr@downers.us", "kdlange@downers.us", "nhawk@downers.us", "dkmiecek@downers.us", "jlomax@downers.us", "jtock@downers.us", "ttopor@downers.us", "squasney@downers.us", "jkopinski@downers.us"]
firstNames = ["Kerry", "Karen", "Nate", "Dan", "Julie", "Jim", "Tom", "Susan", "Joe"]

# Local Time
nowDate = datetime.datetime.now()
realDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
realShortDate = nowDate.strftime('%Y-%m-%d')
idDate = nowDate.strftime('%Y%m%d')
logFile = open(r"K:\Requests_311\log.txt", "a")

# Layers
rLayer = "Requests Layer"
actionsTable = "ActionsTable"
actionsLayer = "ActionsLayer"

# Feature Classes
#requests = r"K:\gisuser.sde\sde.DATA.Requests_311"
requests = "sde.DATA.Requests_311"
actions = "sde.DATA.Requests_311_Actions"

version = "GISUSER.Requests"

env.workspace = r"K:\crc.sde"

#---------------------------------------------------------------------------
#Process Actions
#Look for Actions that are either due for a follow-up
# and send a reminder email
def processSummary():
    
    employees = []
    #Status Code 10 = Complete
    #Status Code 11 = Complete (Sent to Code Enforcement)
    # Connect to SDE Database
    con = pyodbc.connect('Trusted_Connection=yes', driver = '{SQL Server}',server = 'GIS', database = 'GBAUser')
    query = "\"SELECT * FROM StatusCode\" <> 10 AND \"StatusCode\" <> 11 AND \"StatusCode\" <> 12 AND \"RequestType\" = 1"
    checkExists(requests, rLayer, version)
    arcpy.SelectLayerByAttribute_management(rLayer, "NEW_SELECTION", query)
    c = int(arcpy.GetCount_management(rLayer).getOutput(0))
    logFile.write("Requests for Weekly Summary: " + str(c))
    #print "Requests with Weekly Summary: " + str(c)
    if c > 0:
        sCursor = arcpy.SearchCursor(rLayer);
        sCursor.reset()
        sRow = sCursor.next()

        while sRow:
            requestEmployee = sRow.getValue(employeeID)
            if len(employees) > 0:
                uniqueEmployee = 1
                for e in range(0, len(employees)):
                    if e == requestEmployee:
                        uniqueEmployee = 0
                        break
                if uniqueEmployee == 1:
                    employees.push(requestEmployee)
        del sCursor
        del sRow 
    
        if len(employees) > 0:
            actionReqIDs = []
            requestTypes = []
            statusCodes = []
            statusDates = []
            addresses = []
            for e in range(0, len(employees)):
                reminderItem = []
                query = "\EmployeeID\" = " + str(e)
                arcpy.SelectLayerByAttribute_management(rLayer, "NEW_SELECTION", query)
                sCursor = arcpy.SearchCursor(rLayer);
                sCursor.reset()
                sRow = sCursor.next()

                while sRow:
                    actReqID = sRow.getValue(rID)
                    actionReqIDs.append(actReqID)
                    actStatusDate = sRow.getValue(stDate)
                    statusDates.append(actStatusDate)
                    requestType = sRow.getValue(t)
                    requestTypes.append(requestType)
                    statusCode = sRow.getValue(sCode)
                    statusCodes.append(statusCode)
                    address = sRow.getValue(fldAddress)
                    addresses.append(address)
                    sRow = sCursor.next()

                del sCursor
                del sRow
                print "# of reminderItems: " + str(len(reminderItems))
                if len(actionReqIDs) > 0:
                    sendSummary(9, actionReqIDs, requestTypes, statusCodes, addresses, statusDates)
                    #sendSummary(e, actionReqIDs, requestTypes, statusCodes, addresses, statusDates)

# ---------------------------------------------------------------------------
# Send Reminder Email
def sendSummary(emp, ids, types, codes, addresses, dates):
    print "Send Summary Email"
    fr = "gis@downers.us"
    #to = "jkopinski@downers.us"
    #cc = "jkopinski@downers.us"
    #to += ", joseph.kopinski@gmail.com"
    
    to = emailAddresses[emp-1]
    print to
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Drainage Request Weekly Summary"
    msg['From'] = fr
    msg['To'] = to
    html = '<html><head></head><body><img src="http://www.downers.us/public/themes/2009/images/logo.gif"> Village of Downers Grove Drainage Requests App<br>'
    html += "<br>" + firstNames[emp-1] + ","
    html += "<br><br>This is automated message from the Village of Downers Grove Drainage Requests App.<br>"
    html += "<br>Listed below are all your drainge request that remain open. "
    html += "<table><tbody><tr><td>Request ID</td><td>Type</td><td>Status</td><td>Address</td><td>Last Updated</td></tr>"
    count = 0
    for i in range(0, len(ids)):
        html += "<tr><td>"+ids[count]+"</td><td>"+types[count]+"</td><td>"+getStatusString(codes[count])+"</td><td>"+addresses[count]+"</td><td>"+dates[count]+"</td></tr>"
    html += "</tbody></table>"
    html += '<br><br><a href="http://gis.vodg.us/requests/drainage.html">Open Drainage Map to manage request</b></a>'
    html += "</body></html>"
    
    part1 = MIMEText(html, 'html')

    msg.attach(part1)

    smtp = smtplib.SMTP("beta.vodg.us")
    smtp.ehlo()
    smtp.sendmail(fr, to, msg.as_string())
    print 'done!'
    smtp.close()
# ---------------------------------------------------------------------------
def getStatusString(code):
    status = ""
    if code == 1 or code == 0:
        return "New Request"
    elif code == 2:
        return "Need Site Visit"
    elif code == 3:
        return "Need to Contact"
    elif code == 4:
        return "Waiting on Resident"
    elif code == 5:
	return "Assign to Street Division"
    elif code == 6:
    	return "Cost Share"
    elif code == 7:
	return "Investigation"
    elif code == 10:
        return "Completed"
    else:
        return "Unknown"
# ---------------------------------------------------------------------------
# Check if layer exists
def checkExists(p, l, v):
    if not arcpy.Exists(l):
        arcpy.MakeFeatureLayer_management(p, l)
        #arcpy.ChangeVersion_management(l, "TRANSACTIONAL", v, "")

# ---------------------------------------------------------------------------
# Check if table exists
def checkTableExists(p, t, v):
    if not arcpy.Exists(t):
        arcpy.MakeTableView_management(p, t)
        #print arcpy.Exists(t)
        #arcpy.ChangeVersion_management(t, "TRANSACTIONAL", v, "")
# ---------------------------------------------------------------------------
# Error email
# Email Variables
email_to = 'jkopinski@downers.us'
email_from = 'gis@downers.us'

def sendEmail(error):
    smtpserver = smtplib.SMTP("beta.vodg.us")
    smtpserver.ehlo()
    header = 'To:' + email_to + '\n' + 'From: ' + email_from + '\n' + 'Subject:Drainage Request Error \n'
    msg = header + error
    smtpserver.sendmail(email_from, email_to, msg)
    smtpserver.close()

# ---------------------------------------------------------------------------
# Main Code
logFile.write("\n---------------------------------------\n")
logFile.write("---------------------------------------\n")
logFile.write("Date: " + str(realDate) +"\n")
try:
    processSummary()
except Exception as e:
    print str(e)
    logFile.write(str(e))
    sendEmail(str(e))
logFile.close()
