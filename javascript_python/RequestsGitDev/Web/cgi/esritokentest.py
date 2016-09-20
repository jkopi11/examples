import EsriToken
import cgi, cgitb
import os, sys
import json

def main(p):
    print json.dumps(EsriToken.gentoken())

if __name__ == '__main__':
    cgitb.enable()
    params = cgi.FieldStorage()
    # DEBUG
    #print ("""Content-type:text/plain\n\n""")
    # PRODUCTION
    print ("""Content-type:application/json\n""")
    main(params)
