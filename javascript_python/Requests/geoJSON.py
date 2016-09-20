# parses ESRI responses into GeoJSON format

#!\Python27\32_bit\python.exe

import cgi, cgitb
import httplib2
import urllib
import urllib2
import json
import os
import sys

def getRequests(url,query,geoQuery,geoQueryType,fields):
    try:
        requestUrl = 'http://parcels.downers.us/arcgis/rest/services/'+url
        data = {'f':'json'}
        if query:
            data['where'] =query
        if geoQuery:
            data['geometryType'] = geoQueryType
            data['geometry'] = geoQuery
        if fields:
            data['outFields'] = fields
        data = urllib.urlencode(data)
        url = requestUrl+"?"+data
        http = httplib2.Http()
        resp, content = http.request(url,"GET")
        result = json.loads(content)
        parseESRIJSON(result)
    except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)

def parseESRIJSON(j):
    try:
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
        print ("""Content-type:application/json\n\n""")
        print json.dumps(geo)
    except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
        
        

def main(argv):
    try:
        getRequests(argv.getfirst('u'),argv.getfirst('q'),argv.getfirst('gq'),argv.getfirst('gqt'),argv.getfirst('fields'))
    except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
            
if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    #print ("""Content-type:text/plain\n\n""")
    #print params
    main(params)
