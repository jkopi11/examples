var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http');

var apn = require('apn');

app.all('/*',function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

app.post('/notification/', function(req,res){
    var responseCallback = function(data){
        res.send(data);
    }
    getTokens(req.body,responseCallback);
});

app.get('/notification/', function(req,res){
    res.send("You are here. V1.");
});
app.listen(1337);

function sendNotification(query,callback){
    console.log(query);
    var tokens = ["1f2a60c17d057dbc893a00926aec8553b25b35d814852cdb8b992b696703b73a","06ba1d4d3645f4162c7fcd795d8389725c9f311719c0b8964e2b870d64733765"];
    
    if (query.nType == 'general'){
        tokens = query.tokens;
        console.log(tokens);
        return;
    }
    
    

    var connOptions = {
        cert:"D:\\GISAdmin\\MobileApps\\node\\apns-prod-cert.pem",
        key:"D:\\GISAdmin\\MobileApps\\node\\apns-prod-key.pem",
        production:true
    };
             

    var connection = new apn.Connection(connOptions);

    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() /1000) + 3600;
    note.badge = 1;
    note.sound = "default";
    note.alert = query['message-title'];
    note.payload = {
        'type':"alert",
        'website':query['message-link'] ? query['message-link'] : 'http://www.downers.us',
        'text':query['message-text']
    };

    connection.pushNotification(note,tokens);
    
    connection.shutdown();
    
    callback({'success':'success','notifications':tokens.length});
}

function httpGetRequest(h,p,q,cb){
    console.log(new Date(),h,p);

    //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
    var options = {
      host: h,
      path: p
    };

    callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        console.log(str);
        q['tokens'] = JSON.parse(str).tokens;
        sendNotification(q,cb);
      });
    }
    http.request(options, callback).end();
}

function getTokens(p,cb){
    var query = 'All';
    if (p.nType != 'general'){
        
    }
    console.log(p);
    
    return httpGetRequest('gis.vodg.us','/downersnow/support_files/downers-now-portal.py?query='+query,p,cb);
}