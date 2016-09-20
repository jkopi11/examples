import httplib2
import urllib
import urllib2
import json
import EsriToken


try:
    def dictionaryKeyUnicodeToString(d):
        tempDict = {}
        for i in d:
            if isinstance(i, unicode):
                i = str(i)
            tempDict[i] = d[i]
        return tempDict
    
    def getHttpRequest(url, data):
        if data:
            data['f'] = 'json'
            data = urllib.urlencode(data)
            url = url + '?' + data
        http = httplib2.Http()
        resp,content = http.request(url,"GET")
        return content

    def getHttpRequestESRI(url, data):
        data['token'] = EsriToken.gentoken()
        return getHttpRequest(url,data)
        

    def postHttpRequest(url, data):
        headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
        http = httplib2.Http()
        data = dictionaryKeyUnicodeToString(data)
        data = urllib.urlencode(data)
        data = data.replace('%27None%27','null')
        data = data.replace('+u%27','+%27')
        resp, content = http.request(url,"POST",data,headers=headers)
        result = json.loads(content)
        return result

    def postHttpRequestESRI(url, data):
        data['token'] = EsriToken.gentoken()
        return postHttpRequest(url,data)


except Exception,e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print e
        print(exc_type, fname, exc_tb.tb_lineno)
