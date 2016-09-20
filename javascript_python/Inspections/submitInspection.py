#!\Python27\32_bit\python.exe

from collections import OrderedDict
import httplib2
from httplib2 import socks
import urllib
import urllib2
import cgi, cgitb
import json
import os, sys



try:
    def main(argv):
        #Production
        http = httplib2.Http()
        #Development
        #http = httplib2.Http(proxy_info = httplib2.ProxyInfo(socks.PROXY_TYPE_HTTP_NO_TUNNEL, proxy_host="10.0.1.30", proxy_port=8080))
        formURL = 'https://docs.google.com/forms/d/1YT0zUhErxM_DngtnmZNdChZt7o4ZOBvIHclPySuzvHg/viewform'
        resp, content = http.request(formURL)
        content = str(content)
        fbzx = 'name="fbzx" value="'
        st = content.index(fbzx)
        end = content.index('"',st+len(fbzx))
        resid = content[st+len(fbzx):end]

        user_agent = {'content-type':'application/x-www-form-urlencoded','Referer':'https://docs.google.com/forms/d/1YT0zUhErxM_DngtnmZNdChZt7o4ZOBvIHclPySuzvHg/viewform?fbzx='+resid,'User-Agent': "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.103 Safari/537.36"}
        url = "https://docs.google.com/forms/d/1YT0zUhErxM_DngtnmZNdChZt7o4ZOBvIHclPySuzvHg/formResponse"
        values = OrderedDict([(u'entry.1526442945',argv.getfirst('i')),(u'entry.1676531498',argv.getfirst('s')),(u'entry.706834164',argv.getfirst('cn')),(u'entry.1836411493',argv.getfirst('ce')),(u'entry.1367243788',argv.getfirst('l')),(u'entry.1161389997',argv.getfirst('st')),(u'entry.1912517190',argv.getfirst('end')),(u'entry.581054477',argv.getfirst('desc')),(u'entry.519880616',argv.getfirst('com')),(u'draftResponse','[,,"'+resid+'"]'),('pageHistory',0),('fbzx',resid)])

        #Production
        http = httplib2.Http()
        #Development
        #http = httplib2.Http(proxy_info = httplib2.ProxyInfo(socks.PROXY_TYPE_HTTP_NO_TUNNEL, proxy_host="10.0.1.30", proxy_port=8080))
        data = urllib.urlencode(values)
        resp, content = http.request(url, method="POST", body=data, headers=user_agent )
        print ("""Content-type:application/json\n\n""")
        print json.dumps({'success':resp, 'content':content},ensure_ascii=False)
    
    
except Exception,e:
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print e
    print(exc_type, fname, exc_tb.tb_lineno)
        


if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    main(params)
