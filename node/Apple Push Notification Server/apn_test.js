var apn = require('apn');

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

var token = ["1f2a60c17d057dbc893a00926aec8553b25b35d814852cdb8b992b696703b73a",";

var connOptions = {
    cert:"apns-prod-cert.pem",
    key:"apns-prod-key.pem",
    production:true
};
             

var connection = new apn.Connection(connOptions);

var device = new apn.Device(token);

var note = new apn.Notification();

note.expiry = Math.floor(Date.now() /1000) + 3600;
note.badge = 2;
note.sound = "default";
note.alert = "Node Test";
note.payload = {'type':"alert",'website':"http://www.downers.us/alert/heatair-quality-advisories-issued",'text':"Heat/Air Quality Advisories Issued"};

connection.pushNotification(note,device);

