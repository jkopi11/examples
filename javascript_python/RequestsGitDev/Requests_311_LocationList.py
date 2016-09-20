import sys, os
import httplib2, urllib, json, errno
import ftplib
import datetime

try:
    logFile = open(r"\\GIS\GISAdmin\Requests_311\log.txt", "a")
    nowDate = datetime.datetime.now()
    nowDate = nowDate + timedelta(hours=6)
    stringFullDate = nowDate.strftime('%Y-%m-%d %H:%M:%S')
    logFile.write("-----     " + stringFullDate + "     -----\n")

    def httpGetRequest(url, data):
        data['OutSR'] = 4326
        data['f'] = 'json'
        data = urllib.urlencode(data)
        url = url + '?' + data
        http = httplib2.Http()
        resp,content = http.request(url,"GET")
        return content

    def getIntersections():
        print "Intersections..."
        f = open(r'\\GIS\GISAdmin\Requests_311\Intersections.txt')

        content = [x.strip('\n') for x in f.readlines()]

        f.close()
        del content[0]
        for c in content:
            c = c.split(",")
            d = {}
            d['Name'] = 'Intersection of ' + c[0]
            d['x'] = c[1]
            d['y'] = c[2]
            resultArray.append(d)

    def getAddresses():
        print "Addresses..."
        url = "http://gis:6080/arcgis/rest/services/DGspa/MapServer/1/query?"
        data = {}
        data['where'] = 'STRNUM IS NOT NULL AND SNAME IS NOT NULL AND STYPE IS NOT NULL AND STATUS = 0'
        data['outFields'] = 'STRNUM, SNAME, STYPE, UNIT, LOCID'
        data['orderByFields'] = 'SNAME ASC, STRNUM ASC'
        addresses = json.loads(httpGetRequest(url,data))
        addresses = addresses['features']
        for a in addresses:
            attr = a['attributes']
            geo = a['geometry']
            d = {}
            n = str(attr['STRNUM']) + ' ' + attr['SNAME'] + ' ' + attr['STYPE']
            if attr['UNIT'] is not None and len(attr['UNIT'] > 0:
                n = n + ' UNIT ' + attr['UNIT']
            n = n.strip()
            d['Name'] = str(n)
            d['x'] = geo['x']
            d['y'] = geo['y']
            d['LOCID'] = attr['LOCID']
            resultArray.append(d)
            
    def getBlocks():
        print "Blocks..."
        url = "http://gis:6080/arcgis/rest/services/DGspa/MapServer/3/query?"
        data = {}
        data['where'] = 'OBJECTID IS NOT NULL'
        data['outFields'] = 'FULLNAME, R_F_ADD'
        data['orderByFields'] = 'SNAME ASC'
        blocks = json.loads(httpGetRequest(url,data))
        blocks = blocks['features']
        for b in blocks:
            attr = b['attributes']
            if attr['R_F_ADD'] is not None:
                n = attr['R_F_ADD'] + ' block of ' + attr['FULLNAME']
                d = {'Name': str(n)}
                geo = b['geometry']
                geo = geo['paths']
                s = geo[0]
                s = s[0]
                sX = s[0]
                sY = s[1]
                e = geo[len(geo)-1]
                e = e[0]
                eX = e[0]
                eY = e[1]
                d['x'] = (s[0]+e[0])/2
                d['y'] = (s[1]+e[1])/2
                a = attr['R_F_ADD']
                if len(a)>1 and not any(c.isalpha() for c in a) and int(a)%100 == 0:
                    resultArray.append(d)

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
        ftp.storlines("STOR " + fileName,open(fileName, 'r'))
        ftp.quit()
            
        
    
            

except Exception,e:
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print e
    print(exc_type, fname, exc_tb.tb_lineno)
    logFile.write("CRM Daily Notification Error\n")
    logFile.write(str(e)+str(exc_type)+str(fname)+str(exc_tb.tb_lineno)+"\n")
    logFile.write("------------------------------\n")
    logFile.close()


resultArray = []
getIntersections()
getAddresses()
getBlocks()
postDataToFTP(resultArray,'locations')
logFile.write("Locations Updated")
logFile.write("------------------------------\n")
