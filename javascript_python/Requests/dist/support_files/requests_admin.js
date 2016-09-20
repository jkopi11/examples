var manageHandlerURL = 'http://gis.vodg.us/requests/support_files/Manage_Handler.py';
if (window.location.pathname == "/requests_dev/"){
    manageHandlerURL = window.location.pathname+'support_files/Manage_Handler_Test.py';
}

var inputDate = '<div class="form-group"><label for="dateOccurred" class="col-md-4">Date</label><div class="col-md-8"><input id="dateOccurred" type="text" class="form-control datepicker" value="'+getCurrentDate()+'"></div></div>';

var inputTime = '<div class="form-group"><label for="dateOccurred" class="col-md-4">Time</label><div class="col-md-8"><input id="timeOccurred" type="text" class="form-control timepicker" placeholder="Optional"></div></div>';

var inputAttach = '<div class="form-group"><label for="attachment-1" class="col-md-4">Attachment</label><div class="col-md-8"><input id="attachment-1" type="file" class="form-control attachments"></div></div>';

var inputDesc = '<div class="form-group"><label for="desc" class="col-md-4">Description</label><div class="col-md-8"><textarea id="desc" type="text" class="form-control" maxlength="1020" placeholder="Description" rows="6"></textarea></div></div>';

var contactTypes = {'Contact':'contact','Contractor':'contractor','Stay Informed':'Inform','Multi-Jursidicational':'multi'}

var actionStatus = {10:"Completed",7:"Investigation Needed",3:"Need to Contact",2:"Need Site Visit",4:"Waiting on Resident",8:"Permit Issued",9:"Work Scheduled",99:"Delete"};

var attachmentURLs = [];

var manageLocationMap, tempMarker;

// This should really be a hidden field on the form instead of a global variable
var cObjId;

// Action Forms - Creates the HTML and Provides the list on the right side of the Manage tab
var actionsManage = {
    attachment: {
        title:'Add Attachment',
        markup:'<form id="attachment" class="form"><div class="form-group"><label for="cName" class="col-md-4">File</label><div class="col-md-8"><input class="form-control attachments" id="attachment-1" type="file" name="attachment" /></div></div></form>'
    },
    attachRemove: {
        title:'Remove Attachment'
    },
    contact: {
        title:'Add Contact',
        markup:'<form id="contact" class="form-horizontal"><div class="form-group hidden"><label for="mContactID" class="col-md-4">ID</label><div class="col-md-8"><input id="mContactID" type="text" class="form-control" placeholder="ID"></div></div><div class="form-group"><label for="cName" class="col-md-4">Name</label><div class="col-md-8"><input id="cName" type="text" class="form-control nameLookup" placeholder="Name"></div></div><div class="form-group"><label for="cAddress" class="col-md-4">Address</label><div class="col-md-8"><input id="cAddress" type="text" class="form-control addressLookup" placeholder="Address"></div></div><div class="form-group"><label for="cCity" class="col-md-4">City</label><div class="col-md-8"><input id="cCity" type="text" class="form-control" placeholder="City" value="Downers Grove"></div></div><div class="form-group"><label for="cState" class="col-md-4">State</label><div class="col-md-8"><input id="cState" type="text" class="form-control" placeholder="State" value="IL"></div></div><div class="form-group"><label for="cZip" class="col-md-4">Zip</label><div class="col-md-8"><input id="cZip" type="text" class="form-control" placeholder="Zip"></div></div><div class="form-group"><label for="cEmail" class="col-md-4">Email</label><div class="col-md-8"><input id="cEmail" type="text" class="form-control" placeholder="Email"></div></div><div class="form-group"><label for="cPhone" class="col-md-4">Phone</label><div class="col-md-8"><input id="cPhone" type="tel" class="form-control" placeholder="Phone" maxlength="12" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" autocomplete="off"></div></div><div class="form-group"><label for="cPhone2" class="col-md-4">Alt. Phone</label><div class="col-md-8"><input id="cPhone2" type="tel" class="form-control" placeholder="Alt Phone" maxlength="12" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" autocomplete="off"></div></div><div class="form-group"><label for="cNotes" class="col-md-4">Notes</label><div class="col-md-8"><textarea id="cNotes" placeholder="Notes" class="form-control" rows="2" maxlength="254"></textarea></div></div><div class="form-group"><label for="cType" class="col-md-4">Type</label><div class="col-md-8"><select id="cType" class="form-control"><option value="contact">Contact</option><option value="inform">Stay Informed</option><option value="contractor">Contractor</option><option value="multi">Multi-Jurisdictional</option></select></div></div></form>'
    },
    link: {
        title:'Add Link',markup:'<form id="link" class="form-horizontal"><div class="form-group"><label for="filePath" class="col-md-4">File Path</label><div class="col-md-8"><input id="filePath" type="text" class="form-control" placeholder="Path"></div></div></form>'
    },
    reminder: {
        title:'Add Reminder',
        markup:'<form id="reminder" class="form-horizontal"><div class="form-group"><label for="reminderDate" class="col-md-4">Reminder Date</label><div class="col-md-8"><input id="reminderDate" type="text" class="datepicker form-control"></div></div><div class="form-group"><label for="desc" class="col-md-4">Description</label><div class="col-md-8"><textarea id="desc" type="text" class="form-control" maxlength="255" placeholder="Description" rows="4"></textarea></div></div></form>'
    },
    respond: {
        title:'Add Responder'
    },
    assign: {
        title:'Change Lead Responder'
    },
    location: {
        title:'Change Location'
    },
    requesttype: {
        title:'Change Request Type'
    }, 
    status: {
        title:'Change Status'
    }, 
    citation: {
        title:'Citation/Ticket Issued',
        markup:actionBasic('citation')
    },
    createviolation: {
        title:'Create Violation'
    },
    createworkorder: {
        title:'Create Work Order',
        markup:actionBasic('createworkorder')},
    description: {
        title:'Edit Description',
        markup:actionBasic('description')
    },
    conversation: {
        title:'Record Conversation',
        markup:actionBasic('conversation')
    },
    email: {
        title:'Record Email Received/Sent',
        markup:actionBasic('email')
    },
    inspection: {
        title:'Record Inspection',
        markup:actionBasic('inspection')
    },
    letter: {
        title:'Record Letter Received/Sent',
        markup:actionBasic('letter')
    }
};

function actionAttachment(t){
    var file = document.getElementById(t);
    var oID = detailedRequest.properties.OBJECTID;
    console.log(file);
    file = file.files[0];
    console.log(file);
    //$('#'+t).removeClass('attachments');
    if (typeof file != 'undefined'){
        var data = new FormData();
        data.append('attachment', file);
        data.append('f','json');

        var url = "http://parcels.downers.us/arcgis/rest/services/Public/Requests311/FeatureServer/0/" + oID + "/addAttachment";
        $.ajax({
            type:'POST',
            url: url,
            data: data,
            datatype: 'json',
            processData: false, // Don't process the files
            contentType: false,
            success: function(data, textStatus, jqXHR)
            {
                if(typeof data.error === 'undefined')
                {
                    console.log(data);
                    data = JSON.parse(data);
                    console.log(data.addAttachmentResult);
                    if (data.addAttachmentResult.success){
                        console.log(t);
                        var tObject = {};
                        tObject[t] = 'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/FeatureServer/0/'+oID+'/attachments/'+data.addAttachmentResult.objectId;
                        attachmentURLs.push(tObject);
                        console.log(attachmentURLs);
                        actionSubmit($('#modalBody > form').attr('id'));
                    } else {
                        $('#'+t).addClass('attachments');
                        alert("Error Uploading File");
                    }
                } else{
                    // Handle errors here
                    alert('ERRORS: ' + data.error + " " + jqXHR.responseText);
                }
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                console.log(textStatus);
            }
        });
    } else {
        console.log('No File');
        actionSubmit($('#modalBody > form').attr('id'));
    }
}

function actionAttachmentRemove(a){
    var oID = detailedRequest.properties.OBJECTID;
    console.log(a);
	$.ajax({
		type:'GET',
		url:"http://parcels.downers.us/arcgis/rest/services/Public/Requests311/FeatureServer/0/"+oID+"/deleteAttachments?f=json&attachmentIds="+a,
        datatype: 'json',
		success: function (data) {
            data = JSON.parse(data);
            console.log(data);
            console.log(data.deleteAttachmentResults[0]);
			if (typeof data.deleteAttachmentResults[0].success != 'undefined' && data.deleteAttachmentResults[0].success == true){
                actionSubmit('attachRemove');
            } else {
                loadingHide();
                alert('Attachment was not deleted. Contact BT.');
            }
        },
		error: function(xhr, status, error) {
			alert(status);
			console.log(error);
			console.log(xhr.responseText);}
	});
}

// Action Basic is mainly used to populate the actions that are used to record actual actions.
// ex. Conversation, Inspection, Letter Received/Sent, Email Received/Sent
// Updating a description is also included, but most of the inputs are stripped out because
// it is only updating one field.
function actionBasic(t){
    var actionType = '';
    var a = inputAttach;
    var desc = inputDesc;
    var d = inputDate;
    var time = inputTime;
    if (t == 'conversation'){
        actionType = '<div class="form-group"><label for="type" class="col-md-4">Type</label><div class="col-md-8"><select id="type" class="form-control"><option value="phone">Phone</option><option value="voice">Voice Mail Left</option><option value="person">In-Person (Office)</option><option value="field">In-Person (Field)</option></select></div></div>';
    } else if (t == 'email'){
        actionType = '<div class="form-group"><label for="type" class="col-md-4">Type</label><div class="col-md-8"><select id="type" class="form-control"><option value="sent">Sent</option><option value="received">Received</option><option value="conversation">Email Conversation</option></select></div></div>';
    } else if (t == 'letter'){
        actionType = '<div class="form-group"><label for="type" class="col-md-4">Type</label><div class="col-md-8"><select id="type" class="form-control"><option value="sent">Sent</option><option value="received">Received</option></select></div></div>';
    } else if (t == 'createviolation'){
        a = '';
        desc = '';
    } else if (t == 'description'){
        d = '';
        a = '';
        time = '';
    } else if (t == 'createworkorder'){
        d = '';
        a = '';
        time = '';
        desc = '';
    }
    var finputs = actionType+desc+d+time+a;
    var f = '<form id="'+t+'" class="form-horizontal">'+finputs+'</form>';
    return f;
}

function actionModalFooter(t){
    return '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button><a id="action-submit-button" class="btn btn-primary">Submit</a>';
}

function actionModalShow(t){
    attachmentURLs = [];
    var edit = -1;
    t = t.split('-');
    if (t.length > 1){
        if (t[0] == 'editContact'){
            edit = parseInt(t[1]);
            t = 'contact';
        } else if (t[0] == 'attachRemove'){
            edit = parseInt(t[1]);
            t = t[0];
        }
        // If I ever want to edit something else I'm going to have to search for the string to make sure its editContact or something else
        
    } else {
        t = t[0];
    }
    var mTitle = actionsManage[t].title;
    var mBody = actionsManage[t].markup;
    var mFooter = actionModalFooter(t);
    if (t == 'status' || t == 'assign' || t == 'createviolation' || t == 'requesttype' || t == 'location' || t == 'respond'){
        var rt = detailedRequest.properties.RequestTypeText;
        mBody = actionDropdown(t,rt,false);
        if (t == 'location' && manageLocationMap){
            manageLocationMap.remove();
        }
    }
    if (t == 'attachRemove'){
        var attachment = $('#link-'+edit);
        var title = attachment.attr('title');
        mBody = '<p>Are you sure you want to delete: <b>' + title + '</b>?';
        mFooter = mFooter.replace('Submit','Yes');
        mFooter = mFooter.replace('Cancel','No');
    }
    
    if (t == 'location'){
        $('#basicModal').on('shown.bs.modal',function(){
            console.log(t);
            $('#Address').val(detailedRequest.properties.Address);
            var center = L.latLng(detailedRequest.geometry.coordinates[1],detailedRequest.geometry.coordinates[0]);
            console.log(center);
            manageLocationMap = L.map('request-change-location-map',{center:center,zoom:15});
            L.esri.basemapLayer('Topographic').addTo(manageLocationMap);
            tempMarker = L.marker(center,{color: '#FF7E2B',draggable:true}).addTo(manageLocationMap);
            tempMarker.on('dragend',function(e){
                tempMarker.dragging.disable();
                reverseGeocode(tempMarker,e);
            });
            manageLocationMap.whenReady(mapLoaded);
            setTimeout(function(){manageLocationMap.invalidateSize();},1000);
            $('#basicModal').off('shown.bs.modal');
        });
    }
    
    modalShow(mTitle,mBody,mFooter);
    if ((t == 'assign' || t == 'respond') && active == 'Manage'){
        employeeParse(detailedRequest.properties.RequestTypeText,false);
    }
    
    if (t == 'createviolation'){
        addViolationChangeListener(1);
        $('#desc1').val(requestData.data.violationtypes[$('#violationtype1 option:selected').text()].Description);
    }
    if (t == 'location'){
        lookupLocations();
    }
    if (t == 'contact' && edit > -1){
        var contacts = [];
        $.each(detailedRequest.contacts,function(){
          if (this.attributes.Type !== 'employee'){
            contacts.push(this.attributes);
          }
        });
        var attr = contacts[edit];
        console.log(attr);
        cObjId = attr.OBJECTID;
        $('#mContactID').val(attr.ContactID);
        $('#cName').val(attr.Name);
        $('#cAddress').val(attr.Address);
        $('#cCity').val(attr.City);
        $('#cState').val(attr.State);
        $('#cZip').val(attr.Zip);
        $('#cPhone').val(attr.Phone);
        $('#cPhone2').val(attr.Alt_Phone);
        $('#cEmail').val(attr.Email);
        $('#cNotes').val(attr.Notes);
        if (attr.Type != null){
            $('#cType').val(contactTypes[attr.Type]);
        } else {
            $('#cType').val('contact');
        }
        insertHTML('modalTitle','Edit Contact');
        insertHTML('action-submit-button','Edit Contact');
    }
    if (t == 'attachRemove'){
        t = t + '-' + edit;
    }
    if (t == 'description'){
        $('#desc').val(detailedRequest.properties.Description);
    }
    if (t == 'assign' || t == 'respond'){
        $("#filter-assign").off('change').on('change',function(){employeeShowAll();});
    }
    $('#action-submit-button').off('click');
    $('#action-submit-button').click(function(){actionSubmit(t);});
    $('.datepicker').datepicker();
    $('.timepicker').timepicker({timeFormat:"hh:mm TT",
                                stepMinute:5});
    if (t == 'contact'){
        lookupContact();
        lookupPhone();
    }
}

// Need to change name. This function is called to add dynamic data to the form. Example: Getting the current request type
function actionDropdown(t,rt){
    if (t == "assign" || t == "respond"){
        if (t == "respond"){
            rt = 'General';
        }
        var a = requestData.data.types[rt].DefaultAssigned+'';
        // Here's where I need to update for show all
        var typeEmployees = requestData.data.types[rt].RespondingEmployees;
        var h = '<form id="'+t+'" class="form-horizontal"><div class="form-group">';
        if (t == "respond") {
            h += '<label class="col-md-4">New Employee</label>';
        } else {
            h += '<label class="col-md-4">From</label><div class="col-md-8">'+detailedRequest.properties.EmployeeText+'</div></div><div class="form-group"><label for="to" class="col-md-4">To</label>';
        }
        h += '<div class="col-md-8"><select id="filter-assign" class="form-control">';
        h += '</select></div></div>';
        h += inputDesc;
    } else if (t == "status"){ 
        var h = '<form id="'+t+'" class="form-horizontal"><div class="form-group"><label class="col-md-4">From</label><div class="col-md-8">'+detailedRequest.properties.StatusText+'</div></div><div class="form-group"><label for="to" class="col-md-4">To</label><div class="col-md-8">'+populateDropdownHTMLFromDict(t,actionStatus)+'</div></div>'+inputDesc;
    } else if (t == 'createviolation'){
        var h = '<form id="'+t+'" class="form-horizontal">'+inputDate+'<div id="violations"><legend>Violation(s)</legend><div id="violation1"><div class="form-group"><label for="violationtype1" class="col-md-4">Violation #1</label><div class="col-md-8"><select id="violationtype1" class="form-control violations">'+populateDropdownFromKey(requestData.data.violationtypes)+'</select></div></div>';
        h += '<div class="form-group"><label for="desc1" class="col-md-4">Description</label><div class="col-md-8"><textarea id="desc1" type="text" class="form-control" maxlength="255" placeholder="Description" rows="2"></textarea></div></div></div></div>';
        h += '<div id="addViolationBtn"><a href="javascript:addViolationMarkup(2)">+ Violation</a></div></div>';
        h += '<div id="attachments"><legend>Attachments(s)</legend><div id="attach1"><div class="form-group"><label for="attachment-1" class="col-md-4">Attachment #1</label><div class="col-md-8"><input id="attachment-1" type="file" class="form-control attachments"></div></div><div class="form-group"><label for="caption1" class="col-md-4">Caption/Description</label><div class="col-md-8"><textarea id="caption1" type="text" class="form-control" maxlength="255" placeholder="Caption/Description" rows="2"></textarea></div></div></div></div>';
        h += '<div id="addAttachBtn"><a href="javascript:removeAttachmentMarkup(1)">- Attachment</a>';
        h += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:addAttachmentMarkup(2)">+ Attachment</a></div></div>';
    } else if (t == 'requesttype'){
        var h = '<form id="'+t+'" class="form-horizontal"><div class="form-group"><label class="col-md-4">From</label><div class="col-md-8">'+detailedRequest.properties.RequestTypeText+'</div></div><div class="form-group"><label for="to" class="col-md-4">To</label><div class="col-md-8"><select id="requestTypes" class="form-control">'+populateRequestTypes(false,null)+'</select></div></div>'+inputDesc+'<div class="form-group"><label for="auto-assign" class="col-md-4">Auto-Reassign</label><div class="col-md-8"><div class="checkbox"><input id="auto-assign" type="checkbox"></div></div>';
    } else if (t == 'location'){
        var h = '<p class="text-info">Please either type in a new address or drag the marker on the map to choose a new location.</p><form id="'+t+'" class="form-horizontal"><div class="form-group"><label class="col-md-4">Address</label><div class="col-md-8"><input id="Address" type="text" class="form-control locationLookup"></div></div><div id="request-change-location-map"></div>';
    }
    h += '</form>';
    return h;
}

function actionSubmit(t){
    $('#action-submit-button').prop('disabled',true);
    $('#loadingModal').modal('show');
    console.log(t);
    if (email){
        // Process attachments (if any)
        // I think in jquery a return false in a loop only breaks the loop. So, here if there are still attachments (have a class called attachments) that need to be processed we should return and wait until the attachment has been added and it calls this function again.
        if ($('.attachments').length > 0){
            var attachment = $('.attachments')[0];
            if (typeof attachment.files[0] != 'undefined'){
                $(attachment).removeClass('attachments');
                actionAttachment(attachment.id);
                return;
            } else {
                console.log("Nothing");
                $(attachment).removeClass('attachments');
                if ($('.attachments').length > 0){
                    actionSubmit(t);
                    return;
                }
            }
            
        }
        
        t = t.split('-');
        if (t.length > 1){
            var link = t[1];
            t = t[0];
            console.log(t,link);
            actionAttachmentRemove(link);
            return;
        } else {
            t = t[0];
        }

        // Record Activity
        console.log('Recording Form Data');
        var d = {f:t,r:detailedRequest.properties.OBJECTID};
        
        if (t != 'violationletter' && t != 'attachment' && t != 'attachRemove'){
            f = $('#modalBody > form');
            $.each(f[0].elements,function(){
                var v = this.value;
                if (v.length == 0){
                    v = null;
                } else {
                    if (this.id == 'filter-status'){
                        d['statusText'] = $(this).find("option:selected").text();
                    } else if (this.id == 'filter-assign'){
                        d['EmployeeText'] = $(this).find("option:selected").text();
                    }
                }
                if (v == null){
                    v = 'None';
                }
                if (this.id.search('attachment') < 0){
                    d[this.id] = v;
                }
            });
        }
        
        // Get additional info
        // cObjId will only exist when editing contacts and in that case the action needs to be recorded
        if (cObjId && d['f'] == 'contact'){
            d['ContactID'] = parseInt(d['mContactID']);
            delete d['mContactID'];
            d['cObjID'] = cObjId;
            d['f'] = 'contactEdit';
            d['rID'] = detailedRequest.properties.RequestID;
        }
        // If Changing Status,Assignment (, and soon to be Request Types and Locations) get what it was changed from
        if (t == 'status'){
            d['from'] = detailedRequest.properties.StatusText;
        } else if (t == 'assign'){
            d['from'] = detailedRequest.properties.EmployeeText;
        } else if (t == 'requesttype'){
            d['x'] = detailedRequest.geometry.coordinates[0];
            d['y'] = detailedRequest.geometry.coordinates[1];
            d['from'] = detailedRequest.properties.RequestTypeText;
            if ($('#auto-assign').is(':checked')) {
                d['auto-assign'] = 'on';
                console.log(d['auto-assign']);
                d['filter-assign'] = '9999';
                d['rAddress'] = detailedRequest.properties.Address;
                d['x'] = detailedRequest.geometry.coordinates[0];
                d['y'] = detailedRequest.geometry.coordinates[1];
                d['RequestID'] = detailedRequest.properties.RequestID;
            } else {
                d['auto-assign'] = 'off';
            }
            
        } else if (t == 'location'){
            d['x'] = tempMarker.getLatLng().lng;
            d['y'] = tempMarker.getLatLng().lat;
            d['from-x'] = detailedRequest.geometry.coordinates[0];
            d['from-y'] = detailedRequest.geometry.coordinates[1];
            d['from-address'] = detailedRequest.properties.Address;
        } else if (t == 'respond'){
            d['cType'] = 'employee';
            d['fID'] = d['filter-assign'];
            d['cName'] = d['EmployeeText'];
            delete d['filter-assign'];
            delete d['EmployeeText'];
        }
        
        d['email'] = email;
        
        if (t == 'createviolation'){
            d['count'] = $('.violations').length;
        }
        
        // Check if this a violation letter
        // YES - Add document link
        // NO - Add Attachments
        if (t == 'violationletter'){
            d['desc'] = docLink;
            d['attachments'] = 0;
        } else {
            $.each(attachmentURLs,function(n){
                $.each(this,function(k,v){
                    d['attachment'+(n+1)] = v;
                });
            });
            d['attachments'] = attachmentURLs.length;
        }
        
        if (t == 'attachRemove'){
            var remove = $('#modalBody').text();
            remove = remove.split(':');
            remove = remove[1].substring(1,remove[1].length-1);
            d['desc'] = remove;
        }
        
        if (typeof d['dateOccurred'] != 'undefined'){
            if (typeof d['timeOccurred'] != 'undefined'){
                if (d['timeOccurred'] != 'None'){
                    d['dateOccurred'] += ' ' + d['timeOccurred'];
                } else {
                    d['dateOccurred'] += ' 12:00 AM';
                }
                delete d['timeOccurred'];
            } else {
                d['dateOccurred'] += ' 12:00 AM';
            }
        }
        if (d['desc']){
            d['desc'] = d['desc'].replace(/</g,'(').replace(/>/g,')');
        }
        console.log(d);
        var url = manageHandlerURL;
        console.log(url);
        $.ajax({
            type:'GET',
            url:url,
            data:d,
            dataType:'json',
            success:function(data){
                $('#basicModal').modal('hide');
                if (data.features.length > 0){
                    detailedRequest = data.features[0];
                }
                updateRequestsWithNewInformation([detailedRequest]);
                if (active == 'Manage'){
                    console.log(detailedRequest);
                    if (detailedRequest.properties.StatusCode == 99){
                        $('#list-tab > a').click();
                        return;
                    }
                    console.log(data);
                    if (t == 'requesttype'){
                        populateManageActions();
                    }
                    if (t == 'createviolation') {
                        console.log('Create Letter');
                        createLetter();
                        return;
                    }

                    insertHTML("request-manage",detailParse("manage",0));

                    $('#loadingModal').modal('hide');
                    var location = detailedRequest.geometry.coordinates;
                    mapCenterAndZoom({x:location[0],y:location[1]},false);
                }
                cObjId = null;
                
            },
            done:function(data){
                console.log("done");
                console.log(data);
            },
            error:function(error){
                console.log("error");
                alert("Error: Contact BT");
                loadingHide();
                console.log(error.responseText);
                console.log(error);
            },
            done:function(data){
                console.log("done");
                console.log(data);
            }
        });  
    } else {
        handleSubmit('login');
    }
        
}

function addAttachmentMarkup(count){
    if (count < 11){        
        var h = '<div id="attach'+count+'"><div class="form-group"><label for="attachment-'+count+'" class="col-md-4">Attachment #'+count+'</label><div class="col-md-8"><input id="attachment-'+count+'" type="file" class="form-control attachments"></div></div><div class="form-group"><label for="caption'+count+'" class="col-md-4">Caption/Description</label><div class="col-md-8"><textarea id="caption'+count+'" type="text" class="form-control" maxlength="255" placeholder="Caption/Description" rows="2"></textarea></div></div></div></div>';
        $('#attachments').append(h);
        insertHTML('addAttachBtn','<a href="javascript:removeAttachmentMarkup('+(count)+')">- Attachment</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:addAttachmentMarkup('+(count+1)+')">+ Attachment</a>');
    } else {
        alert('Only up to 10 attachments are allowed.');
    }
}

function addViolationChangeListener(c){
    $('#violationtype'+c).on('change',function(){
        $('#desc'+c).val(requestData.data.violationtypes[$('#'+this.id+' option:selected').text()].Description);
    });
}

function addViolationMarkup(count){
    var h = '<div id="violation'+count+'"><div class="form-group"><label for="violationtype'+count+'" class="col-md-4">Violation #'+count+'</label><div class="col-md-8"><select id="violationtype'+count+'" class="form-control violations">'+populateDropdownViolations(requestData.data.violationtypes)+'</select></div></div>';
    h += '<div class="form-group"><label for="desc'+count+'" class="col-md-4">Description</label><div class="col-md-8"><textarea id="desc'+count+'" type="text" class="form-control" maxlength="255" placeholder="Description" rows="2"></textarea></div></div></div></div>';
    $('#violations').append(h);
    insertHTML('addViolationBtn','<a href="javascript:removeViolationMarkup('+(count)+')">- Violation</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:addViolationMarkup('+(count+1)+')">+ Violation</a>');
    addViolationChangeListener(count);
    $('#desc'+count).val(requestData.data.violationtypes[$('#violationtype'+count+' option:selected').text()].Description);
}


        
function loadManageTab(){
    insertHTML("manage-tab-button","Manage");
    populateManageActions();
}

function populateManageActions(){
    var h = '<legend><small>Actions</small></legend>';
    $.each(actionsManage,function(key,value){
        if (key != 'description' && key != 'attachRemove'){
            if (key == 'createviolation' || key == 'citation' || key == 'createworkorder'){
                var r = requestData.data.types[detailedRequest.properties.RequestTypeText];
                if (((key == 'createviolation' || key == 'citation') && r.MapColor == '#B1D2BE') || (key == 'createworkorder' && r.category == 'Public Signs')){
                    h += '<a href="javascript:actionModalShow(\''+key+'\')">'+value.title+'</a><br>';
                }
            } else {
                if (key == 'respond' && detailedRequest.properties.EmployeeID === 9999){
                    return;
                }
                h += '<a href="javascript:actionModalShow(\''+key+'\')">'+value.title+'</a><br>';
            }
        }
    });
    if (detailedRequest.properties.StatusText === 'Outside Jurisdiction' && !/General/.test(detailedRequest.properties.RequestTypeText)){
            h += '<a href="javascript:requestOverrideJurisdiction(\''+detailedRequest.properties.RequestID+'\',\''+detailedRequest.properties.OBJECTID+'\')">Override Jurisdiction</a>';
    }
    insertHTML("request-manage-actions",h);
}

function removeAttachmentMarkup(count){
    if (count > 0){
        $('#attach'+count).remove();
    } 
    var h = '';
    if ((count-1)>0){
        h = '<a href="javascript:removeAttachmentMarkup('+(count-1)+')">- Attachment</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:addAttachmentMarkup('+(count)+')">+ Violation</a>';
    } else {
        h = '<a href="javascript:addAttachmentMarkup('+(count)+')">+ Violation</a>'
    }
    insertHTML('addAttachBtn',h);
}

function removeViolationMarkup(count){
    if (count > 1){
        $('#violation'+count).remove();
    }
    var h = '';
    if ((count-1)>1){
        h = '<a href="javascript:removeViolationMarkup('+(count-1)+')">- Violation</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:addViolationMarkup('+(count)+')">+ Violation</a>';
    } else {
        h = '<a href="javascript:addViolationMarkup('+(count)+')">+ Violation</a>';
    }
    insertHTML('addViolationBtn',h);
}

function reverseGeocode(m,e){
    var url = 'http://parcels.downers.us/arcgis/rest/services/Locators/LAddress/GeocodeServer/reverseGeocode';
    //var data = {f:'json',location:{"x":x,"y":y,"spatialReference":{"wkid":"4326"}},"distance":1000,"outSR":4326};
    url += '?location=%7B"x"+%3A+'+e.target._latlng.lng+'%2C+"y"+%3A+'+e.target._latlng.lat+'%2C+"spatialReference"+%3A+%7B"wkid"+%3A+4326%7D%7D&outSR=4326&distance=1000&f=pjson';
    $.ajax({
            url: url,
            datatype:'json',
            success: function(data, textStatus, jqXHR)
            {
                data = JSON.parse(data);
                console.log(data);
                $('#Address').val(data.address.Street);
                m.dragging.enable();
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                console.log(textStatus);
            }
    });
}

