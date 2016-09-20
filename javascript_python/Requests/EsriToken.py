# used to obtain a token to make requests with ESRI ArcGIS Server

import urllib
import urllib2
import json
import datetime
import os
import sys


username = "vodg\giscrc"
password = "1234567890"
#fileName = 'C:\\\dev\\python\\token\\crctoken.json'
directory = os.path.dirname(__file__)
fileName = os.path.join(directory,'token/crctoken.json')

def gentoken():
    global fileName
    import os.path
    expires = None
    if os.path.isfile(fileName):
        with open(fileName) as tokenJson:
            token = json.loads(tokenJson.read())
        expires = datetime.datetime.fromtimestamp(token['expires']/ 1000)
    if expires is None or datetime.datetime.now() > expires:
        query_dict = {'username':   username,
                  'password':   password,
                  'expiration': '60',
                  'client':     'requestip'}
    
        query_string = urllib.urlencode(query_dict)
        url = r"http://parcels.downers.us/arcgis/tokens/generateToken"
        
        token = json.loads(urllib.urlopen(url + "?f=json", query_string).read())

            
        if "token" not in token:
            return false
            quit()
        else:
            with open(fileName, 'w') as outfile:
                json.dump(token, outfile)
    return token['token']

gentoken()
