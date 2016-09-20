import cgi, cgitb
import httplib2
import urllib
import urllib2
import json
import dghttpclient

try:            
    def queryLocations(query):
        url = 'http://www.downers.us/public/json/locations.json'
        global locations
        locations = json.loads(dghttpclient.getHttpRequest(url,None))
        resultsArray = []
        for l in locations:
            if str(l['Name']).lower().find(query) > -1:
                resultsArray.append(l)
                if len(resultsArray) == 20:
                    break
        print json.dumps(resultsArray)

    def main(argv):
        argv = dict(argv)
        for a in argv:
            if len(argv[a].value) == 0 or argv[a].value is None:
                argv[a] = 'None'
            else:
                argv[a] = argv[a].value
        queryLocations(argv['q'])

except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)


if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    print ("""Content-type:application/json\n""")
    main(params)
