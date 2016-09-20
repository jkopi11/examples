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
import Requests_Handler

requestDataURL = {'Requests':'0','ROW':'1','Response':'2','Actions':'3','Contacts':'4','Departments':'5','Employees':'6','ContactReqRel':'7','Types':'8','Questions':'9','Assets':'10','AdditionalInfo':'11','Layers':'12','EmployeesEden':'13','MonthlyData':'14'}
cleanUpTables = ['Actions','Contacts','ContactReqRel','Assets','AdditionalInfo']
baseURL = 'http://parcels.downers.us/arcgis/rest/services/'
mapURL = baseURL + 'Public/Requests311/MapServer/'
featureURL = baseURL + 'Public/Requests311/FeatureServer/'

def cleanTables():
    for i in cleanUpTables:
        if i == 'ContactReqRel':
            objectIds = []
            tableURL = featureURL+requestDataURL[i]
            data = {'where':'OBJECTID IS NOT NULL','f':'json','outFields':'*'}
            results = json.loads(Requests_Handler.getHTTPRequest(tableURL+'/query',data))
            results = results['features']
            total = len(results)
            count = 0
            print "Total {0}".format(total)
            for r in results:
                count += 1
                if count == int(total/4) or count == int((total*2)/4) or count == int((total*3)/4):
                    print "{0}% processed ...".format(count*1.0/total*1.0)
                attr = r['attributes']
                requestURL = mapURL+'0'+'/query'
                requestData = {'where':'RequestID = \''+ attr['RequestID']+'\'','f':'json','returnCountOnly':'True'}
                requestResult = json.loads(Requests_Handler.getHTTPRequest(requestURL,requestData))
                if requestResult['count'] == 0:
                    objectIds.append(str(attr['OBJECTID']))
            objectIds = ", ".join(objectIds)
            postData = {'objectIds':objectIds,'f':'json','gdbVersion':'GISUSER.Requests'}
            postResults = Requests_Handler.postHTTPRequest(tableURL+'/deleteFeatures',postData) 
            print postResults


if __name__ == '__main__':
    cleanTables()                       
