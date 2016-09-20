var clientId = '123456.apps.googleusercontent.com';
var apiKey = 'abc123456';

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
    checkAuth();
}

function checkAuth() {
    window.setTimeout(function(){gapi.auth.authorize({client_id: clientId, scope: scopes, immediate:true}, handleAuthResult);},1);
}


function handleAuthResult(authResult) {
    token = authResult;

    $('#settings').click(showLoginOptions);
    if (authResult && !authResult.error) {
        afterClientLoad();
    } else {
        showLoginOptions();
    }
}

function showLoginOptions(){
    var authBodyHTML = "<p>Please press \"Connect\" below to give the Downers Grove CRC app access to your Google Account.</p>";
    authBodyHTML += "<p><small><i> When connecting your Google account, please be sure to use your Downers Grove Google account. If you are signed into multiple Google accounts, please be sure it is listed first. If it is not, please sign out of all of them and sign back in to your Downers Grove Google account first and then any others after. Thank you.</i></small></p>";
    var authFooterHTML = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button><button type="button" id="revokeButton" class="btn btn-default" data-dismiss="modal">Disconnect</button><button id="authorize-button" class="btn btn-primary">Connect</button>';
    
    insertHTML('modalTitle',strGoogleAuth);
    insertHTML('modalBody',authBodyHTML);
    insertHTML('modalFooter',authFooterHTML);
    
    var authorizeButton = document.getElementById('authorize-button');
    $('#basicModal').modal('show');
    if (token.access_token){
        authorizeButton.disabled = true;
    }
    
    $('#revokeButton').click(disconnectUser);
    authorizeButton.onclick = handleAuthClick;
}

    
function afterClientLoad(){
    gapi.client.load('plus', 'v1').then(makeRequest);
}

function makeRequest(){
    var request = gapi.client.plus.people.get({
        'userId' : 'me'
    });

    request.execute(function(resp) {
        email = resp.emails[0].value;
        domain = email.split('@')[1];
        if (domain == 'downers.us'){
            var userHTML = '<span>'+ email + ' </span><img src="'+resp.image.url+'" width="30" height="30"/>';
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
    });
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
        }
    });
}

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
	var inSr = 4326;
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

                $.each(attachmentURLs,function(n){
                    $.each(this,function(k,v){
                        
                        var photo = document.getElementById(k);
                        photo = photo.files[0];

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
        
    request.execute(function(resp){
            
            docLink = resp.alternateLink;

            actionSubmit('violationletter');
            var win=window.open(docLink, '_blank');
            win.focus();
        });
    }
}