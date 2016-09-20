// Enter a client ID for a web application from the Google Developer Console.
// The provided clientId will only work if the sample is run directly from
// https://google-api-javascript-client.googlecode.com/hg/samples/authSample.html
// In your Developer Console project, add a JavaScript origin that corresponds to the domain
// where you will be running the script.
//var clientId = '189927336779.apps.googleusercontent.com';
// JK - Personal
//var clientId = '520694065517-lnf60q6mccmi0mqrb89qoruiadn6mlh5.apps.googleusercontent.com';
// downersapps@gmail.com
var clientId = '323864319066-455k5oabrnrdosht1ra3rr722u2u7flr.apps.googleusercontent.com';

// Enter the API key from the Google Developer Console - to handle any unauthenticated
// requests in the code.
// The provided key works for this sample only when run from
// https://google-api-javascript-client.googlecode.com/hg/samples/authSample.html
// To use in your own application, replace this API key with your own.
// JK - Personal
//var apiKey = 'AIzaSyDLzGUhjx8_Ub9sXuUGsHW8NCLMt2J_zvM';
var apiKey = 'AIzaSyD49LPpKhZgDMJbOLznMqwg_KwvprDp-w8';

var docLink;

var email;

var token;
// To enter one or more authentication scopes, refer to the documentation for the API.
var scopes = 'https://www.googleapis.com/auth/plus.me email https://www.googleapis.com/auth/drive';

var count = 0;

var strGoogleAuth = 'Connect Your Google Account';
	  
// Use a button to handle authentication the first time.
function handleClientLoad() {
  gapi.client.setApiKey(apiKey);
  //window.setTimeout(checkAuth,1);
  console.log("handleClientLoad");
  checkAuth();
}

function checkAuth() {
  console.log("Check Auth");

  window.setTimeout(function(){gapi.auth.authorize({client_id: clientId, scope: scopes, immediate:true}, handleAuthResult);},1);
  setTimeout(function(){
      if (!email){
          showEmailConfirmationOption();
      }
  },30000);
}

function showEmailConfirmationOption(){
  modalShow("Trouble logging in?","<form class=\"form-hozizontal\"><p>Enter your email below to be sent a confirmation email with access to the CRC.</p><div class=\"form-group\"><label>Enter Email</label><input id=\"confirmEmail\" class=\"form-control\" type=\"email\" placeholder=\"Enter Email Here\"/></div></form>",'<a class="btn btn-primary" href="javascript:sendConfirmationEmail()">Submit</a>');
}

function sendConfirmationEmail(){
    url = requestHandlerURL;
    var d = {r:'confirm',email:$('#confirmEmail').val()};
    $.ajax({
        type:'POST',
        url:url,
        data:d,
        dataType:'json',
        success:function(data){
            console.log(data);
        },
        error:function(error){
            console.log("error");
            console.log(error.responseText);
            submitHandler(false);
        }

    });   
}

function handleAuthResult(authResult) {
    token = authResult;
    //var insertButton = document.getElementById('insert-button');
    if (authResult && !authResult.error) {
        console.log("Auth Result True");

        //makeApiCall();
        //insertButton.style.visibility = '';
        //insertButton.onclick = handleInsertClick;
        //showLoginOptions();
        afterClientLoad();
    } else {
        console.log("Auth Result False");
        showLoginOptions();
    }
}

function showLoginOptions(){
    console.log("Auth Result False");
    var authBodyHTML = "<p>Please press \"Connect\" below to give the Downers Grove CRC app access to your Google Account.</p>";
    authBodyHTML += "<p><small><i> When connecting your Google account, please be sure to use your Downers Grove Google account. If you are signed into multiple Google accounts, please be sure it is listed first. If it is not, please sign out of all of them and sign back in to your Downers Grove Google account first and then any others after. Thank you.</i></small></p>";
    //var authFooterHTML = '<span id="signinButton"><span class="g-signin" data-callback="signinCallback" data-clientid="520694065517-lnf60q6mccmi0mqrb89qoruiadn6mlh5.apps.googleusercontent.com" data-cookiepolicy="single_host_origin" data-requestvisibleactions="http://schema.org/AddAction" data-scope="https://www.googleapis.com/auth/plus.login email"></span></span><button type="button" id="revokeButton" class="btn btn-default" data-dismiss="modal">Disconnect</button>';
    var authFooterHTML = '<a class="btn btn-default" href="javascript:showEmailConfirmationOption()">Trouble Logging in?</a>&nbsp<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>&nbsp<button type="button" id="revokeButton" class="btn btn-default" data-dismiss="modal">Disconnect</button>&nbsp<button id="authorize-button" class="btn btn-primary">Connect</button>';
    insertHTML('modalTitle',strGoogleAuth);
    insertHTML('modalBody',authBodyHTML);
    insertHTML('modalFooter',authFooterHTML);
    var authorizeButton = document.getElementById('authorize-button');
    $('#basicModal').modal('show');
    if (token.access_token){
    authorizeButton.disabled = true;}
    $('#revokeButton').click(disconnectUser);
    //insertButton.style.visibility = 'hidden';
    authorizeButton.onclick = handleAuthClick;
}

    
function afterClientLoad(){
    gapi.client.load('plus', 'v1').then(makeRequest);
}

/*function signinCallback(authResult) {
console.log("Sign in Callback");
if (authResult['status']['signed_in']) {
// Update the app to reflect a signed in user
// Hide the sign-in button now that the user is authorized, for example:
document.getElementById('signinButton').setAttribute('style', 'display: none');
} else {
// Update the app to reflect a signed out user
// Possible error values:
//   "user_signed_out" - User is signed-out
//   "access_denied" - User denied access to your app
//   "immediate_failed" - Could not automatically log in the user
console.log('Sign-in state: ' + authResult['error']);
}
}*/

function makeRequest(){
  var request = gapi.client.plus.people.get({
      'userId' : 'me'
  });

  request.execute(function(resp) {
      //console.log(resp);
      email = resp.emails[0].value;
      validateEmail(email,resp.image.url);
  });
}

function validateEmail(emailAddress,image){
  email = emailAddress;
  domain = email.split('@')[1];
  console.log(domain);
  if (domain == 'downers.us'){

      var userHTML = '<span>'+ email + ' </span>';
      if (image) {userHTML += '<img src="'+image+'" width="30" height="30"/>'};
      insertHTML('userphoto',userHTML);
      $('#settings').removeClass('active');
      if ($('#modalTitle').html() == strGoogleAuth){
          console.log("Hide");
          $('#basicModal').modal('hide');
      }
  } else {
      email = '';
      modalShow('Error','This is not a VODG email address. Please sign out of all Google accounts and then back in with your VODG email first. (You can then sign in with other accounts.)','<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
      disconnectUser();
  }
}

function handleAuthClick(event) {
  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
  return false;
}

function disconnectUser() {
  console.log(token);
  var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' +
    token.access_token;
  // Perform an asynchronous GET request.
  $.ajax({
  type: 'GET',
  url: revokeUrl,
  async: false,
  contentType: "application/json",
  dataType: 'jsonp',
  success: function(nullResponse) {
    // Do something now that user is disconnected
    // The response is always undefined.
      console.log(nullResponse);
      if (typeof nullResponse == 'undefined'){
          var userHTML = '<span>Login</span>';
          insertHTML('userphoto',userHTML);
          token = {error:"immediate_failed"};
          $('#settings').removeClass('active');
          $("#new-tab > a").click();
          email = null;
      }

  },
  error: function(e) {
    // Handle the error
    console.log(e);
    // You could point users to manually disconnect if unsuccessful
    // https://plus.google.com/apps
  }
  });
}

/*function disconnectUser(){
console.log("Sign Out");
gapi.auth.signOut();
}*/

function handleInsertClick(event) {
  makeInsertApiCall();
}

function createDoc(msg){
  var html = "<html><style>body{font-family:\"Times New Roman\";}</style><body><div>";
  html += msg;
  html += "</div></body></html>";
  return html;
}

function createLetter(){
	inSr = 4326;
	
	var query = "where=&objectIds=&time=&geometry="+detailedRequest.geometry.x+","+detailedRequest.geometry.y+"&geometryType=esriGeometryPoint&inSR="+ inSr +"&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=%2a&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&gdbVersion=GISUSER.Requests&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&f=pjson";
	
	$.ajax({
		type:'GET',
		url:'http://parcels.downers.us/arcgis/rest/services/DGspa/MapServer/2/query?',
		dataType: 'json',
		data: query,
		success: function (result){
            if (result.features.length > 0){
                var owner = result.features[0].attributes;
                var ownerName = owner.BILLNAME;
                var ownerAdd1 = owner.BILLADDRL1;
                var ownerAdd2 = owner.BILLADDRL2;
                var pin = owner.PIN;
				var today = new Date();
                var compDate = new Date();
                var todayString = getFormattedDate(months[today.getMonth().toString()],today.getDate(),today.getFullYear()); 
				var text = "<div style=\"position:absolute; margin-left:100px;\"><br><br><br><p style='text-align:center'>NOTICE OF VIOLATION</p><br><br><p>";
				text += todayString+"</p><br><br>";
				text += ownerName + "<br>" + ownerAdd1 + "<br>" + ownerAdd2 + "<br><br>";
                text += "<p>re: " + detailedRequest.attributes.RequestTypeText + " at " + detailedRequest.attributes.Address + ", Downers Grove, IL 60515</p><br>";
				text += "<p>Property Index Number: "+ pin.substring(0,2) + '-'+pin.substring(2,4)+'-'+pin.substring(4,7)+'-'+pin.substring(7) + "</p><br>";
				text += "<p>An inspection of the property at <b>" + detailedRequest.attributes.Address + "</b>"; 
				text += ", Downers Grove, Illinois, on " + todayString + " revealed the following violation(s) of the code of ordinances of the Village of Downers Grove:</p><br>";
                var compDays = 0;
                console.log(requestData.data);
                if ($('.violations').length > 1) {
                    text += "<ol>";
                }
                $.each($('.violations'),function(n){
                    if ($('.violations').length > 1) {
                        text += "<li>";
                    }
                    var violationType = $('#'+this.id+' option:selected').text();
                    var violation = requestData.data.violationtypes[violationType];
                    var source = "2006 International Property Maintenance Code";
                    if (violation.Source = "DGMC"){
                        source = "Downers Grove Municipal Code";
                    }
                    if (parseInt(violation.ComplianceTime) > compDays){
                        compDays = parseInt(violation.ComplianceTime);
                    }
                    text += '<p>';
                    text += violation.Name + ' in violation of ' + violation.SectionNumber + ' of ' + source + ': <b>' + $('#desc'+(n+1)).val() + '</b></p>';
                    if ($('.violations').length > 1) {
                        text += "</li>";
                    }
                });
                if ($('.violations').length > 1) {
                    text += "</ol><br>";
                }
				compDate.setDate(today.getDate()+compDays);
                var compDateString = getFormattedDate(months[compDate.getMonth().toString()],compDate.getDate(),compDate.getFullYear());
				text += "<p><b>A correction of these problems must be made by the close of business on " + compDateString + ", or a complaint will be filed against you in a court of local jurisdiction.</b></p><br>";
				text += "<p>If you fail to correct these violations, any action taken by the Village of Downers Grove, the authority having jurisdiction, may be charged against the real estate upon which the complaint(s) is located and shall be a lien upon such real estate.</p><br>";
				text += "<p>Please feel free to contact me to discuss this matter.</p><br>";
				text += "<p>Very truly yours,</p>";
				text += "<br><br>";
				text += "<p>";
                var emp = requestData.data.employees[detailedRequest.attributes.EmployeeID].name;
                emp = emp.split(",");
                emp = emp[1] + " " + emp[0];
                text += capFirstLetter(emp);
                text += "<br>"+requestData.data.employees[detailedRequest.attributes.EmployeeID].title;
                text += "<br>"+requestData.data.employees[detailedRequest.attributes.EmployeeID].phone;
                text += "<br>"+requestData.data.employees[detailedRequest.attributes.EmployeeID].email+"</p></div><br><br><br>";
                text += "<div><u>Attachments</u><table border=\"0\"><tr style=\"border-style:none;\">";
                console.log(text);
                $.each(attachmentURLs,function(n){
                    $.each(this,function(k,v){
                        console.log(k);
                        var photo = document.getElementById(k);
                        photo = photo.files[0];
                        console.log(photo);
                        if (photo.type.search('image') > -1){
                            var float = 'left';
                            if (n % 2 == 1){
                                float = 'right';
                            }
                            if (n > 0 && n % 2 == 0){
                                text += "</tr><tr style=\"border-style:none;\">";
                            }
                            text += "<td style=\"width:50%; padding-right:10px; border-style:none;\"><div style=\"border-style:none;\">";
                            text += "<p>Taken: <i>"+getFormmatedFullDateTimeFromMilliseconds(photo.lastModified)+"</i></p>";
                            text += "<p>Caption: <i>"+$('#caption'+(n+1)).val()+"</i></p>";
                            text += "<img style=\"border-style:none;\" width=\"250px\" length=\"250px\" src=\""+v+"\">";
                            text += "</div><br></td>";
                        }
                    });
                });
                text += "</tr></table></div>";
                console.log(text);
				makeDriveApiCall(text, detailedRequest.attributes.Address, detailedRequest.attributes.RequestTypeText);
			} else {
                modalShow("Error","Property owner not found.",'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
            }
		},
		error: function (xhr, status, error){
			console.log(error);
			console.log(xhr.responseText);
	}});
	
	
}

function makeDriveApiCall(text, address, type) {
    gapi.client.load('drive', 'v2', function() {
        /*var request = gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'media', 'convert':true},
            'headers': {
              'Content-Type': 'text/html'
            },
            'body': createDoc("Hello Google!")});
        request.execute(function(resp){
            console.log(resp);
        });*/
        var blob = new Blob([createDoc(text)], {type:'text/html'});
        insertFile(blob, address, type);
      });
}

function insertFile(fileData, address, type) {
  var boundary = '-------314159265358979323846';
  var delimiter = "\r\n--" + boundary + "\r\n";
  var close_delim = "\r\n--" + boundary + "--";

  var reader = new FileReader();
  reader.readAsBinaryString(fileData);
  reader.onload = function(e) {
  var contentType = fileData.type || 'application/octet-stream';
  var metadata = {
    'title': type + " - " + address,
    'mimeType': contentType,
    'parents':[{
          "id": "0B3tiFIjkSF-2fnFMZXl0QVg1RDRodE83Yjg2dldJUmlBSldvRjUzUlBscF94a2xPU1VibjA",
    }],
  };

  console.log(metadata);

  var base64Data = btoa(reader.result);
  var multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      base64Data +
      close_delim;

  var request = gapi.client.request({
      'path': '/upload/drive/v2/files',
      'method': 'POST',
      'params': {'uploadType': 'multipart', 'convert':true,},
      'headers': {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
      },
      'body': multipartRequestBody});
  /*if (!callback) {
    callback = function(file) {
      console.log(file)
    };
  }*/
  request.execute(function(resp){
          console.log(resp);
          docLink = resp.alternateLink;
          console.log(docLink);
          actionSubmit('violationletter');
          var win=window.open(docLink, '_blank');
          win.focus();
      });
  }
}