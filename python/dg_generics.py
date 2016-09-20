import ftplib
import json
import os
import datetime
from datetime import timedelta
import httplib2
import urllib
import urllib2

sizeWritten = 0
totalSize = 0

domain = 'http://parcels.downers.us/'


def handleFTP(block):
    global sizeWritten
    global totalSize
    sizeWritten += 1024 # this line fail because sizeWritten is not initialized.
    percentComplete = sizeWritten / (totalSize*1.0)
    print(str(percentComplete) + " percent complete")

def postDataToFTP(r,n):
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
    print (ftp.storbinary("STOR " + fileName,open(fileName, 'r'),1024,handleFTP))
    ftp.quit()

def getDate(d):
    if 'date' in d:
        return d['date']+'T00:00:00'
    elif 'dateTime' in d:
        return d['dateTime'][:-6]
    else:
        return None

def getDateTime(d):
    return datetime.datetime.strptime(d,'%Y-%m-%dT%H:%M:%S')

def getTimeString(s):
    s = datetime.datetime.strptime(s,'%Y-%m-%dT%H:%M:%S')
    today = datetime.datetime.now()
    t = timedelta(days=7)
    week = today+t
    if s > week:
        d = s.strftime('%a') + '(' + s.strftime('%b %d') + ')'
    else:
        d = s.strftime('%a')
    s = s.strftime('%I %p')
    if int(s[0:2]) < 10:
        s = s[1:]
    if s == '12 AM':
        s = 'All Day'

    return d + ' - ' + s

def httpGetRequest(url, data):
        data['f'] = 'json'
        data = urllib.urlencode(data)
        url = url + '?' + data
        http = httplib2.Http()
        resp,content = http.request(url,"GET")
        return content

def httpPostRequest(url, data):
        headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
        http = httplib2.Http()
        data = urllib.urlencode(data)
        data = data.replace('%27None%27','null')
        data = data.replace('+u%27','+%27')
        resp, content = http.request(url,"POST",data,headers=headers)
        result = json.loads(content)
        return result


adminUser = "vodg\giscrc"
adminPass = "crc_3d1t$"

def gentoken(domain, username, password, expiration=60):
    #Re-usable function to get a token required for Admin changes
    
    query_dict = {'username':   username,
                  'password':   password,
                  'expiration': str(expiration),
                  'client':     'requestip'}
    
    query_string = urllib.urlencode(query_dict)
    url = "http://{}/arcgis/admin/generateToken".format(domain)
    
    token = json.loads(urllib.urlopen(url + "?f=json", query_string).read())
        
    if "token" not in token:
        arcpy.AddError(token['messages'])
        quit()
    else:
        return token['token']
    #END of Re-usable function to get a token required for Admin changes
