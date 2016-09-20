var express = require('express');
var app = express();

var apn = require('apn');


app.post('/:type/:messageTitle/:messageText/:messageLink/', function(req, res) {
      if (req.params.type == 'general'){
          res.send(sendNotification(req.params));
      }
});
app.listen(1337);

function sendNotification(params){
    var token = ["1f2a60c17d057dbc893a00926aec8553b25b35d814852cdb8b992b696703b73a","06ba1d4d3645f4162c7fcd795d8389725c9f311719c0b8964e2b870d64733765"];

    var connOptions = {
        cert:"D:\\GISAdmin\\MobileApps\\node\\apns-prod-cert.pem",
        key:"D:\\GISAdmin\\MobileApps\\node\\apns-prod-key.pem",
        production:true
    };
             

    var connection = new apn.Connection(connOptions);

    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() /1000) + 3600;
    note.badge = 2;
    note.sound = "default";
    note.alert = params.messageTitle;
    note.payload = {'type':"alert",'website':params.messageLink,'text':params.messageText};

    connection.pushNotification(note,token);
    
    return {success:'success'};
}