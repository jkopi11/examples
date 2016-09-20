// global variables -- start

var newMap, bigMap, manageMap;
var active = 'New';
var urlParam;
/*var keywords = {General:[],Drainage:['drainage','storm','stormwater','storm water','flood','flooding','floods','sump','pump','water in'],Streetlight:['street light','light','light pole']};*/
var x;
var y;
var locid;
var requestsLayer, marker, heatmapLayer, nearbyArea;
var contact;

var dataURLs = ["contacts", "data"];
var requestData = {};
var requestContacts = {};
// Holds the requests return from a query and is used for 
var requests;
var requestsUpdated;
var lastUpdateDateTime;
var requestsCount;

// Hold the requests on the list and map. So that click the row will always return the correct request.
var filteredRequests;

var mobilefilter = '(StatusDate > \'' + moment().subtract(30,'days').format('YYYY-MM-DD HH:mm:ss') + '\' AND StatusCode <> 99) OR StatusCode <> 10';

var detailedRequest, multipleDetailed;
var addresses;

var baseMaps;
var bigMapLayers = {};
var baseServicesURL = 'http://parcels.downers.us/arcgis/rest/services/';
var requestHandlerURL = 'http://gis.vodg.us/requests/support_files/Requests_Handler.py';
if (window.location.pathname === "/requests_dev/" || window.location.pathname === "/requests_dev/index.html") {
    requestHandlerURL = 'http://gis.vodg.us/requests_dev/support_files/Requests_Handler_Test.py';
    console.log(requestHandlerURL);
}
// localRequests == Chrome Desktop browser. It gets updated if request for more local storage is denied.
var isMobile, isChrome, isSafari, isChromeDesktop, localRequests, isLoadingRequests;
var initialRequestForStorage = true;

var dateRangeElement;

var loadingRequests;

var eventItemIndex = 0, eventItems;


// Filters are the columns shown on the list and map tabs
// queryName is the database attribute name, short name = what is displayed on web page, visible =
// default visibility of the column
// query and queryText get added to these objects
// query is the query that is formed for both local and server queries
// queryText is the text that is displayed above the list and map
var filters = {
    RequestID: {
        queryName: 'RequestID',
        shortName: 'ID', 
        visible: false,
        defaultVisible: false,
    },
    SubmittedDate: {
        queryName: 'SubmittedDate', 
        shortName: 'Date Submitted', 
        visible: true,
        defaultVisible: true,
    }, 
    RequestTypeText: {
        queryName: 'RequestTypeText', 
        shortName: 'Type', 
        visible: true,
        defaultVisible: true,
    }, 
    Address: {
        queryName: 'Address', 
        shortName: 'Address', 
        visible: true,
        defaultVisible: true,
    }, 
    StatusText: {
        queryName: 'StatusText', 
        shortName: 'Status', 
        visible: true,
        defaultVisible: true,
    }, 
    StatusDate: {
        queryName: 'StatusDate', 
        shortName: 'Last Action', 
        visible: false,
        defaultVisible: false,
    }, 
    DaysOpen: {
        queryName: 'DaysOpen', 
        shortName: 'Days Open', 
        visible: false,
        defaultVisible: false,
    }, 
    DeptText: {
        queryName: 'DeptText', 
        shortName: 'Dept', 
        visible: false,
        defaultVisible: false,
    }, 
    EmployeeText: {
        queryName: 'EmployeeText', 
        shortName: 'Staff', 
        visible: true,
        defaultVisible: true,
    }, 
    Description: {
        queryName: 'Description', 
        shortName: 'Description', 
        visible: true,
        defaultVisible: true,
    }, 
    UpdatedBy: {
        queryName: 'UpdatedBy', 
        shortName: 'Entered By', 
        visible: false,
        defaultVisible: false,
    }, 
    Quadrant: {
        queryName: 'Quadrant', 
        shortName: 'Quadrant', 
        visible: false,
        defaultVisible: false,
    }
};

// global variable -- end

var requestFormHTML = ['<legend>Request</legend><div class="form-inline form-group"><label for="rAddress">Address (Optional)</label><input id="gAddress" type="text" class="form-control input-md form-inputs"></div>', '<legend>Request</legend><div class="form-inline form-group"><label for="rSubType">SubType</label><select id="rSubType" class="form-control input-md form-inputs"></select></div><div class="form-inline form-group"><label for="rAssign">Assigned To</label><select id="rAssign" class="form-control input-md form-inputs"></select></div><div class="form-inline form-group"><label for="rAddress">Address</label><input id="gAddress" type="text" class="form-control input-md form-inputs"></div>'];

// Change hash for page-reload
$('.dg-tab a').on('click', function (e) {
    managePanes(e);
});

$('.nav.nav-tabs a').on('click',function(e){
    toggleRelated(e.target.parentNode, e.target.innerHTML);
});


/*$('button.close').on('click',function(){
    if (active == "New" || active.length == 0){
        newFormReset();
    }
});*/

$(document).ready(init);

//$('.datepicker').datepicker();

$('.datepicker').daterangepicker({
    format: 'M/D/YYYY',
    singleDatePicker: true,
    showDropdowns: true
});
    


function init(){
    active = window.location.hash;
    $("#new-pane").addClass("active");
    $("#manage-tab").hide();
    urlParam = document.location.href;
    urlParam = urlParam.substring(urlParam.indexOf("?")+1);
    if (urlParam.length > 0){
        urlParam = urlParam.split("=");
    }
    isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    isChrome = (/Chrome/i).test(navigator.userAgent);
    isSafari = (/Safari/.test(navigator.userAgent) && !isChrome);
  
    localRequests = isChrome && !isMobile && !isSafari;
    isChromeDesktop = localRequests;
    
    if (isChromeDesktop){
      checkLocalStorageEnabled();
    }
    // if localRequest is manually set to false, all requests will be made directly to the server 
    // and not stored locally. This was done for testing, but could always be used to turn off saving requests locally for good.
    //localRequests = false;
    console.log(isMobile,isChrome,isSafari,localRequests);
    
    urlReset();
    // Load New Tab gets called after Request Data is loaded from local JSON files
    // Load New Tab then populates Request Type and loads keyword values
    // Load New Tab checks for url parameters after loading tab
    getRequestBaseData();
    
    // Disable category clicking
    $('body').on('click', 'a.disabled', function(event){
        event.preventDefault();
        return false;
    });
    
    // Handle touch events on tablets
    $('body').bind('touchstart', function() {
        $('.showSubMenu').removeClass('showSubMenu');
        $(this).first().addClass('showSubMenu');
    });
    
    $('#RequestTypeButton').off('click').on('click',function(){
        $('.dropdown-submenu').mouseover(function(){
            $('.showSubMenu').removeClass('showSubMenu');
            $('.dropdown-submenu:hover>.dropdown-menu').addClass('showSubMenu');
        });
        /*$('.dropdown-menu li a').popover({
            title:function(){console.log($(".dropdown-menu li a:hover"));return $(".dropdown-menu li a:hover").text();},
            content:function(){return requestData.data.types[$(".dropdown-menu li a:hover").text()].description;},
            trigger:"hover",
            placement:"right",
        });*/
    });
    
    $('#basicModal').on('hide.bs.modal',function(e){
        if (/Date Range Picker/.test($('#modalTitle').text())){
            if ($('.daterangepicker').is(":visible")){
                $('.daterangepicker-dg').click();
            }
        }
    });
    
}

function attachmentView(a,oid){
  var atID = a.id;
  var atName = a.name;
  var t = atName.substring(atName.length - 4);
  var contentType = a.contentType;
  var u = "http://parcels.downers.us/arcgis/rest/services/Public/Requests311/FeatureServer/0/"+oid+"/attachments/"+atID;
  var img = u;
  if (a.contentType.substring(0,5) != 'image'){
      if (t == ".pdf"){
          img = "./support_files/images/pdf.png";
      } else if (t == ".doc"){
          img = "./support_files/images/doc.png";
      } else if (t == ".xls"){
          img = "./support_files/images/xls.png";
      } else {
          img = "./support_files/images/file.png";
      }
  }
  var photo = "<div class=\"col-md-3\"><a id=\"link-"+atID+"\" href=\"" + u + "\" target=\"_blank\"";
  photo += "title=\"" + atName + "\"><img src=" + img;
  //photoFiles += "<td>" + link;
  photo += " class=\"img-responsive img-rounded\"></a><p class=\"text-center text-muted\">";
  photo += (a.name.length > 20 ? a.name.substring(0,16)+"..."+a.name.substring(a.name.length-6) : a.name) + "</p>";
  console.log(active);
  if (email && active == 'Manage') {
      photo += "<p class=\"text-center\"><a class=\"btn btn-danger\" href=\"javascript:actionModalShow('attachRemove-"+atID+"')\"><span class=\"glyphicon glyphicon-trash\"></span></a></p>";
  }
  photo += "</div>";
  //photo += "<a id=\"" + atID + "\" class=\"pclose\"></a>";
  return photo;
}

function checkLocalStorageEnabled(){
  console.log(localRequests);
  if (localStorage.getItem('requests_local')){
    localRequests = (localStorage.getItem('requests_local') == "true");
  }
  console.log(localRequests);
}


// Handles the submit on the New tab
function createRequest(){
  // Check if logged in first
  if (email){
    // User did not select a Location from the list
    if (typeof x == 'undefined' || $('#rAddress').val().length == 0){
        submitHandler('location');
        return;
    }

    $('#newSubmit').prop('disabled','disabled');
    var url = requestHandlerURL;
    // I did not use the traditional form submit. I was familiar with how to call it using JS at the time and the typeahead was throwing it off too
    // because it adds additional fields to handle the UI.
    var d = formParse($('#enterForm'));
    console.log(d);
    if (x.length == 0 || y.length == 0){
        alert("Please reselect the location and be sure to pick from the list that appears as you type.");
        return;
    }

    loadingShow();
    // r == type of the request made to the server
    d['r'] = 'create';
    // x/y == Coordinate of the location of the request
    d['x'] = parseFloat(x);
    d['y'] = parseFloat(y);
    
    // locid == if the location included a locid. Originally, i had included that in the location json, but I took that later on because of the way the list is created and didn't use the geocoder I created that included it.
    if (locid){
        d['fLOCID'] = locid;
    }
    
    // fName == Form Contact Name
    if (!d['fName']){
        d['fName'] = 'None';
    }
    
    // fAddress == Form Contact Address
    if (!d['fAddress']){
        d['fAddress'] = 'None';
    }
    
    // fPhone == Form Phone Number
    if (!d['fPhone']){
        d['fPhone'] = 'None';
    }
    
    // fEmail == Form Contact Email
    if (!d['fEmail']){
        d['fEmail'] = 'None';
    }
    
    // fPhoneExt1 == Form Contact Phone Ext
    // Here we just add it to the phone and prepend it with an 'x'.
    if (d['fPhoneExt1']){
        if (d['fPhone'] && d['fPhone'] != 'None'){
            d['fPhone'] = d['fPhone'] + ' x' + d['fPhoneExt1'];
        }
        delete d['fPhoneExt1'];
    }
    
    // ContactID is retrieved from previously contacts in the CRC. If a contact is selected from the typeahead list, a ContactID is added and inserted
    // in a hidden form field
    if (d['ContactID'] && (typeof contact != 'undefined' &&(d['fName'] != contact.ContactName || d['fAddress'] != contact.Address || d['fPhone'] != contact.Phone || d['fEmail'] != contact.Email))){
        console.log('ID Deleted');
        delete d.ContactID;
    }
    
    // UpdatedBy for this purpose is really created by but it captures who was logged in when the request was created.
    // This information never changes. So there is always a record of who created the request.
    d['UpdatedBy'] = email;
    
    // assignEmp == is the value selected in the Assigned Employee dropdown
    // If an employee is selected from the Assigned Employee field, that will be handled here.
    // The employeeID is saved as the option value in the Select dropdown
    // All employee information is saved in the request_data.json file that is loaded when the app starts.
    // We can look up their information and add it the request made to the server
    // If the Assigned Employee == 'Unassigned' or 'Automatically Assigned' on the form then we populate those values and the Requests_Handler.py script
    // Will assign it if the request is in the Village boundary and is in our Jurisdiciton (for road specific requests) and the request is not 'General'
    
    if (d['assignEmp'] && d['assignEmp'] != 'un'){
        console.log(d['assignEmp']);
        var i = $('#assignEmp option:selected').val();
        d['assignEmp'] = i;
        d['assignEmpText'] = requestData.data.employees[i].name;
        d['assignEmpDept'] = requestData.data.employees[i].dept;
        d['assignEmpDeptText'] = requestData.data.employees[i].deptText;
    } else {
        d['assignEmpText'] = 'Unassigned';
        d['assignEmp'] = '9999';
        d['assignEmpDept'] = '9999';
        d['assignEmpDeptText'] = 'Unassigned';
    }
    
    // fDesc == the Description field on the request section of the form
    // We replace any use of < or > with ( and )because that was causing issues submitting to ArcGIS Server
    if (d['fDesc']){
        d['fDesc'] = d['fDesc'].replace(/</g,'(').replace(/>/g,')');
    }
    $.ajax({
        type:'POST',
        url:url,
        data:d,
        dataType:'json',
        success:function(data){
            console.log(data);
            // Reset the form
            newFormReset();
            // Update the local requests list with new information
            updateRequestsWithNewInformation(data.request.features);
            // Handle the submit (show confirmation, ask additional ?s, etc)
            submitHandler(data);
        },
        error:function(error){
            console.log(error);
            console.log("error");
            console.log(error.responseText);
            $('#newSubmit').prop('disabled',false);
            submitHandler(false);
        }

    });
  } else {
    submitHandler('login');
  }
}

function detailAccordianPanel(title,body,count,purpose){
    var idName = purpose+title.replace(' ','');
    var a = '<div class="panel panel-default">';
    a += '<div class="panel-heading" role="tab" id="heading'+idName+'">';
    a += '<h4 class="panel-title">';
    a += '<a data-toggle="collapse" href="#'+idName+'" aria-expanded="true" aria-controls="'+idName+'">';
    if (title != "Summary" && title != "Request Link"){
        a += title + " (" + count + ")";
    } else {
        a += title;
    }
    a += '</a>';
    a += '</h4>';
    a += '</div>';
    var show = '';
    if (title == "Summary"){
        show = 'in';
    }
    a += '<div id="'+idName+'" class="panel-collapse collapse '+ show +'" role="tabpanel" aria-labelledby="heading'+idName+'">';
    a += '<div class="panel-body">';
    a += body;
    a += '</div>';
    a += '</div>';
    a += '</div>';
    return a;
}


// Detail Parse shows all the detail information and the pop up when you click on requests and 
// also when you manage requests.
function detailParse(purpose, count){
    if (purpose == "contact"){
        purpose = "manage";
    }
    var str = '<div class="panel-group" id="accordion" role="tablist" aria-multiselectable="true">';
    var summaryPanelBody = "<dl class=\"dl-horizontal summary\">";
    console.log(detailedRequest);
    console.log(detailedRequest.properties);
    summaryPanelBody +="<dt>Status</dt><dd>"+detailedRequest.properties.StatusText+"</dd>";
    summaryPanelBody +="<dt>Location</dt><dd>"+detailedRequest.properties.Address+"</dd>";
    summaryPanelBody += "<dt>Description</dt><dd>"+detailedRequest.properties.Description;
    if (email && purpose == 'manage'){
        summaryPanelBody += " <a href=\"javascript:actionModalShow('description')\"><span class=\"glyphicon glyphicon-pencil\" aria-hidden=\"true\"></span></a>";
    }
    
    summaryPanelBody += "</dd>";
    var rd = detailedRequest.properties.RequestedDate;
    summaryPanelBody +="<dt>Received Date</dt><dd>"+moment.utc(detailedRequest.properties.RequestedDate).format("MM/DD/YYYY")+"</dd>";
    summaryPanelBody += "<dt>Entered By</dt><dd>"+detailedRequest.properties.UpdatedBy+"</dd>";
    
    
    
    
    var actionPanelBody = '';    
    if (purpose == "manage"){
        // Set title for detail page
        insertHTML('rManage',detailedRequest.properties.RequestTypeText + '  -- ID: ' + detailedRequest.properties.RequestID);
        summaryPanelBody += "</dl>";
        var actionPanelBody = "<dl>";
        $(detailedRequest.actions).each(function(){
            actionPanelBody += "<dt><u>"+this.ActionType + " on " + this.DateAction +  "</u>&nbsp<span style=\"color:darkgray\">  <small><i>" + this.EnteredBy + "</i></small><span></dt><dd>"+this.ActionDesc+"</dd>";
            if (this.DateActionFollowUp && this.DateActionFollowUp != "null"){
                actionPanelBody += "<dd>Follow-up Date: " + this.DateActionFollowUp + "</dd>";
            }

        });
        actionPanelBody += "</dl>";
    } else {
        if (detailedRequest.actions.length > 0){
            summaryPanelBody += "<dt>Last Action</dt>";
            summaryPanelBody += "<dd>"+detailedRequest.actions[0].ActionType + " on " + detailedRequest.actions[0].DateAction +  "<br>"+detailedRequest.actions[0].ActionDesc+"</dd></dl>";
        } else {
            summaryPanelBody += "<dt>Last Action</dt><dd><i>n/a</i></dd></dl>";
        }
    }
    // Add additional info if exists
    if (purpose == "manage" && typeof detailedRequest.additional != 'undefined'){
        var additionalHTML = '<dl>';
        
        
        $.each(detailedRequest.additional,function(){
            console.log(this);
            var info = this.attributes;
            console.log(info.QuestionID);
            var question = requestData.data.question_text[info.QuestionID+""];
            console.log(requestData.data.question_text);
            console.log(question);
            additionalHTML += '<dt>'+question.QuestionText+'</dt>';
            additionalHTML += '<dd>'+info.QuestionAnswer1+'</dd>';
        });
        console.log("After additional");
        additionalHTML += "</dl>";
        summaryPanelBody += additionalHTML;
    }
    
    str += detailAccordianPanel("Summary",summaryPanelBody,count,purpose);
    if (purpose == "manage"){
        str += detailAccordianPanel("Actions",actionPanelBody,detailedRequest.actions.length,purpose);
    }
    // Add assets if exists and a village email is logged in
    if (purpose == "manage" && typeof detailedRequest.assets != 'undefined' && email){
        var assetsPanelBody = "<dl class=\"dl-horizontal summary\">";
        $.each(detailedRequest.assets,function(){
            $.each(this.attributes,function(key,value){
                assetsPanelBody += '<dt>'+key+'</dt>';
                assetsPanelBody += '<dd>'+value+'</dd>';
            });
        });
        assetsPanelBody += "</dl>";
        str += detailAccordianPanel("Assets",assetsPanelBody,detailedRequest.assets.length,purpose);
    }
    //str += "<div class=\"subDetail\"><p class=\"detailSection\">Respondent</p><div id=\"respond"+count+"\">"
    var respondCount = 1;
    var respondPanelBody = '<h5 style="color:darkgray;"><i>Lead Responder</i></h5>';
    respondPanelBody += detailParseGetRespondeeMarkup(detailedRequest.properties.EmployeeID);
        /*"<dl class=\"dl-horizontal\"><dt>Department</dt><dd>"+detailedRequest.attributes.DeptID+"</dd>";
    respondPanelBody += "<dt>Employee</dt><dd>"+ requestData.data.employees[detailedRequest.attributes.EmployeeID].name +'</dd>';
    respondPanelBody += '<dt>Title</dt><dd>'+requestData.data.employees[detailedRequest.attributes.EmployeeID].title+'</dd>';
    respondPanelBody += '<dt>Phone</dt><dd>'+requestData.data.employees[detailedRequest.attributes.EmployeeID].phone+"</dd></dl>";*/
    
    //str += "<p class=\"detailSection\">Contact(s)</p>";
    var contactPanelBody = '';
    var contactCount = 0;
    $(detailedRequest.contacts).each(function(){
        if (this.attributes.Type == 'employee') {
            respondPanelBody += detailParseGetRespondeeMarkup(this.attributes.cID);
            respondCount++;
        } else {
            var noneProvided = '<i>None</i>';
            contactPanelBody += "<dl class=\"dl-horizontal\"><dt>Name</dt><dd>"+(this.attributes.Name == null || this.attributes.Name == '' ? noneProvided : this.attributes.Name) +"</dd><dt>Address</dt><dd>"+(this.attributes.Address == null || this.attributes.Address == '' ? noneProvided : this.attributes.Address)+"</dd><dt>Phone</dt><dd>"+(this.attributes.Phone == null || this.attributes.Phone == '' ? noneProvided : this.attributes.Phone)+"</dd><dt>Email</dt><dd>"+(this.attributes.Email == null || this.attributes.Email == '' ? noneProvided : this.attributes.Email)+"</dd><dt>Type</dt><dd>"+(this.attributes.Type == null || this.attributes.Type == '' ? noneProvided : this.attributes.Type)+"</dd>";
            if (typeof actionsManage != 'undefined' && purpose == 'manage' && email){
                contactPanelBody += '<dt>Notes</dt><dd>'+(this.attributes.Notes == null || this.attributes.Notes == '' ? noneProvided : this.attributes.Notes)+'</dd>';
                contactPanelBody += '<dd><a href="javascript:actionModalShow(\'editContact-'+contactCount+'\')">Edit</a></dd>';
            }
            contactPanelBody += '</dl>';
            contactCount++;
        }
        
    });
    
    str += detailAccordianPanel("Responders",respondPanelBody+"</dl>",respondCount,purpose);
    str += detailAccordianPanel("Contacts",contactPanelBody,contactCount,purpose);
    //str += '</div></div>';
    var attachmentBody = '';
    $.each(detailedRequest.attachments,function(){
        attachmentBody += attachmentView(this,detailedRequest.properties.OBJECTID);
    });
    str += detailAccordianPanel("Attachments",attachmentBody,detailedRequest.attachments.length,purpose);
    if (purpose == "manage"){
        var requestLink = 'http://gis.vodg.us/requests/index.html?id='+detailedRequest.properties.RequestID;
        var requestLinkStr = '<p>This is the link to get directly to the request:</p>';
        requestLinkStr += '<p><a href="'+requestLink+'">'+requestLink+'</a></p>';
        requestLinkStr += '<p>You can use it in emails to inform other Village staff of the request.</p>';
        requestLinkStr += '<p><i>Please remember you must be on a Village computer or connected to the Village\'s VPN to use this link.</i></p>'; 
        str += detailAccordianPanel("Request Link",requestLinkStr,0,purpose);
    }
    str += '</div>';
    return str;
}

function detailParseGetRespondeeMarkup(employeeID){
    var respMarkup = "<dl class=\"dl-horizontal\"><dt>Department</dt><dd>"+requestData.data.employees[employeeID || '9999'].deptText+"</dd>";
    respMarkup += "<dt>Employee</dt><dd>"+ requestData.data.employees[employeeID || '9999'].name+'</dd>';
    respMarkup += '<dt>Title</dt><dd>'+requestData.data.employees[employeeID || '9999'].title +'</dd>';
    respMarkup += '<dt>Phone</dt><dd>'+requestData.data.employees[employeeID || '9999'].phone +"</dd></dl>";
    return respMarkup;
    
}

function detailRequestShow(){
    var radio = $('#modalBody input[type="radio"]:checked').attr('id');
    // Check to see if a map click resulted in multiple requests being found
    if (typeof radio != 'undefined'){
        radio = radio.substring(13);
        detailedRequest = multipleDetailed[parseInt(radio)];
    }
    $('#basicModal').modal('hide');
    $("#manage-tab").show();
    $("#manage-tab > a").trigger('click');
     
    
    insertHTML("request-manage",detailParse("manage",0));
    if (manageMap){
        mapLoaded();
    }
}

// For assigned employee on new tab
// append -- is for the show all feature which takes the existing the options and then appends all the Village employees
function employeeParse(r,append){
    //console.log("Employee Parse");
    //var e = '#assignEmp option:selected';
    var unassigned = '<option value="9999">Unassigned</option>';
    
    // If we're on list view, get existing value for the Employee filter
    if (typeof requestData.data.types[r] == 'undefined'){
        return;
    }
    var selectedEmployee;
    if (active == 'List'){
        selectedEmployee = $('#List-EmployeeText').val();
    } else {
        selectedEmployee = $('#Map-EmployeeText').val();
    }
    var a = requestData.data.types[r].DefaultAssigned+'';
    
    var typeEmployees = requestData.data.types[r].RespondingEmployees;
    var h = '';
    if (append){
        if (active == 'Manage'){ 
            // insert selector for manage module
            h = $('#filter-assign').html();
        } else {
            
            h = $('#assignEmp').html();
        }
    }
    if (active == 'List' || active == 'Map'){
        h += '<option value="all">All</option>';
        h += unassigned;
    }
    if (typeEmployees == 'None'){
        // Populate All Employees
        var employees = requestData.data.employees;
        if(!append && (active == 'New' || active.length == 0)){
            h += unassigned;
        }
        var tempEmployees = {};
        $.each(employees,function(key,value){
            if (value.active == 1){
                tempEmployees[key] = this;
            }
        });
        employees = tempEmployees;
        
        h += populateDropdownEmployee(employees);
        /*$.each(requestData.data.employees,function(key,value){
            h += "<option value=\"" + key + "\">" + value.name + "</option>";
        });*/
    } else {
        // Populate employees for the request type
        if ((a.length == 0 || a == 'null') && (active == 'New' || active.length == 0)){
            h += '<option value="9999">Auto-assigned</option>';
        }
        var td = {};
        $.each(typeEmployees,function(){
            var tempEmployee = requestData.data.employees[this];
            if (tempEmployee.active == 1 || active == 'List' || active == 'Map'){
                td[this] = tempEmployee;
            }
            /*
            var n = requestData.data.employees[this].name;
            var i = requestData.data.employees[this];
            h += "<option value=\"" + this + "\">" + n + "</option>";
            */
        });
        h += populateDropdownEmployee(td);
    }
    if (active == 'New' || active.length == 0){
        if (r != 'General'){
            h += '<option value="Show All">Show All</option>';
        }
        insertHTML('assignEmp',h);
        if (a != 'null'){
            $('#assignEmp').val(a);
        }
    } else if (active == 'Map' || active == 'List'){
        insertHTML(active+'-EmployeeText',h);
        if (active == 'List' || active == 'Map'){
            $('#'+active+'-EmployeeText').val(selectedEmployee);
        }
    } else if (active == 'Manage') {
        h += '<option value="Show All">Show All</option>';
        insertHTML('filter-assign',h);
    }
    if (append){
        if (active == 'Manage'){
            $('#filter-assign option[value="Show All"]').text('----------------------------------');
            $('#filter-assign option[value="Show All"]').prop('disabled','disabled');
        } else {
            $('#assignEmp option[value="Show All"]').text('----------------------------------');
            $('#assignEmp option[value="Show All"]').prop('disabled','disabled');
        }
    }
}

function employeeShowAll(){
    console.log("Employee Show All");
    // Employee Show All calls two separate functions because under the Manage view 
    // actionDropdown creates the entire form whereas employeeParse fills in an element already
    // create in the HTML file
    if ((active == 'Active' || active == '' || active == 'Manage') && ($("#assignEmp").val() == 'Show All' || $('#filter-assign').val() == 'Show All')){
        employeeParse('General',true);
    }
}

function exportCSV(){
    //console.log("Export CSV");
    
    var str = '';
    var line = '';
    
    if (active == "List"){

        for (var key in filteredRequests[0].properties){
            if (filters[key] && filters[key].visible){
                var value = key + "";
                line += '"' + value.replace(/"/g, '""') + '",';
            }
        }
        line = line.slice(0, -1);
        str += line + '\r\n';


        for (var i = 0; i < filteredRequests.length; i++) {
            var line = '';
            var attr = filteredRequests[i].properties;
            for (var key in attr){
                if (filters[key] && filters[key].visible){
                    var value = attr[key] + "";
                    line += '"' + value.replace(/"/g, '""') + '",';
                }
            }
            line = line.slice(0, -1);
            str += line + '\r\n';
        }
    } else {
        var features = requests.features;
        // Export geoJSON
        for (var key in features[0].geometry){
            var value = key + "";
            line += '"' + value.replace(/"/g, '""') + '",';
        }
        for (var key in features[0].properties){
            if (filters[key] && filters[key].visible){
                var value = key + "";
                line += '"' + value.replace(/"/g, '""') + '",';
            }
        }
        line = line.slice(0, -1);
        str += line + '\r\n';


        for (var i = 0; i < features.length; i++) {
            var line = '';
            var geo = features[i].geometry;
            for (var key in geo){
                var value = geo[key] + "";
                line += '"' + value.replace(/"/g, '""') + '",';
            }
            var attr = features[i].properties;
            for (var key in attr){
                if (filters[key] && filters[key].visible){
                    var value = attr[key] + "";
                    line += '"' + value.replace(/"/g, '""') + '",';
                }
            }
            line = line.slice(0, -1);
            str += line + '\r\n';
        }
    }
    
    //return str;
    
    var d = new Date();
    var fileName = "DGR"+d.getFullYear() + (d.getMonth()+1) + d.getDate() + ".csv";
    //var csv = exportCSV();
    //window.open("data:text/csv;charset=utf-8," + escape(str));
    var pom = document.createElement('a');
    //pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(escape(str)));
    pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + escape(str));
    pom.setAttribute('download', fileName);
    pom.click();
}

function exportPDF(){
    console.log("PDF");
    var doc = new jsPDF();

    // We'll make our own renderer to skip this editor
    var specialElementHandlers = {
        '#editor': function(element, renderer){
            return true;
        }
    };
    
    doc.setFontSize(15);
    // All units are in the set measurement for the document
    // This can be changed to "pt" (points), "mm" (Default), "cm", "in"
    var pdfHTML = '<div><h3>Village of Downers Grove CRC Request:   '+$('#rManage').html()+'</h3></div>';
    pdfHTML += '<div><h4>Summary</h4></div>';
    pdfHTML += '<div>'+$('#manageSummary').html()+'</div><br><br>';
    pdfHTML += '<div><h4>Actions</h4></div>';
    pdfHTML += '<div>'+$('#manageActions').html()+'</div><br><br>';
    pdfHTML += '<div><h4>Respondents</h4></div>';
    pdfHTML += '<div>'+$('#manageRespondents').html()+'</div><br><br>';
    pdfHTML += '<div><h4>Contacts</h4></div>';
    pdfHTML += '<div>'+$('#manageContacts').html()+'</div><br><br>';
    
    doc.fromHTML(pdfHTML, 15, 15, {
        'width': 170, 
        'elementHandlers': specialElementHandlers
    });
    //console.log(detailedRequest.attachments);
    /*($.each($('#manageAttachments img'),function(){
        doc.addImage(getBase64Image(this),'PNG',15,300,150,150);
    });*/
    doc.output('dataurlnewwindow', {});
}

function getBase64Image(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpg" will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function filterToggle(){
    var i = 'request-list';
    var r = requests;
    if (active == 'List'){
        r = filteredRequests;
    }
    if (active == 'Map'){
        i = 'request-map-filter';
        r = null;
    }
    var h = '<form id="filterToggle">';
    $.each(filters,function(key,value){
        var checked = 'checked';
        if (!value.visible){
            checked = '';
        }
        h += '<div class="checkbox"><label><input type="checkbox" name="'+value.queryName+'" ' + checked + '>'+value.shortName+'</label></div>';
    });
    var footer = '<a class="btn btn-default" data-dismiss="modal">Cancel</a><a id="filter-toggle-update" class="btn btn-primary">Update</a>';
    modalShow("Filter Toggle",h,footer);
    $('#filter-toggle-update').click(function(){
        console.log("Filter Update");
        $('#filterToggle *').each(function(){
            if (this.name){
                if (filters[this.name]){
                    filters[this.name].visible = this.checked;
                }
            }
            
        });
        if (active == 'List'){
            listFilterSortLocal(null,null,true);
        } else {
            populateTable(r,i,true);
        }
        
        $('#basicModal').modal('hide');
    });
    
}
    
function formParse(f){
    var d = {};
    $.each(f[0].elements,function(){
            var v = this.value;
            var i = this.id;
            if (v && i){
             d[i] = v;
            }
    });
    return d;
}

function formatFilterDate(v){
    var d = new Date();
    var m = 0;
    if (v == "Week"){
        m = 7;
    } else if (v == "1 Month"){
        m = 30;
    } else if (v == "2 Months"){
        m = 60;
    } else if (v == "3 Months"){
        m = 90;
    } else if (v == "6 Months"){
        m = 180;
    } else if (v == "9 Months"){
        m = 270;
    } else if (v == "1 Year" || v == "1 Year +"){
        m = 365;
    } 
    
    d = d.setDate(d.getDate()-m);
    d = new Date(d);
    d = d.toLocaleDateString();
    return d;
}

function formatFilterDaysOpen(v){
    var d = -1;
    if (v != "All"){
        d = parseInt(v);
    }
}

/*function getAddresses(){
    var url = "http://www.downers.us/public/json/addresses.json";
    $.getJSON(url, function(data){
        addresses = data;
        lookupAddress();
    });
}*/

function getAssignedEmployees(){
    var content = "";
    for (n in employID){
		content += "<option value=\""+employID[n]+"\">"+employ[n]+"</option>";
	}
    insertHTML("rAssign", content);
}

function getCurrentDate(){
    var dt = new Date();
	dt = ( dt.getMonth()+1)+"/"+dt.getDate()+"/"+dt.getFullYear();
    return dt;
}

function getDateReceived(){
    var requestDate = $("#receivedDate").val();
    var dateArray = requestDate.split("/");
    //console.log(dateArray);
    return dateArray[2] + "-" + dateArray[0] + "-" + dateArray[1] + " 00:00:00";
}

/**
 * Gets Requests in relation to a specific point and then process them into list form for New Requests page, detailed view, and querying map view on click.
 * @param {LatLng} g - point for address entered or click of map, I also replace g with ID information when I need a list but don't use a location to query data
 * @param {String} t - type of request (location = Related 'Nearby' requests show on 'New',detail = show the detail modal view when requests are selected
* @return After the ajax response is received the element is updated
 */
function getExistingRequests(g, t){
    
    if (g != null){
        var url = requestHandlerURL;
        
        if (t == "location"){
            var requestBounds = "{xmin: " + (g.x - .002) +", ymin: " + (g.y - .001) + ", xmax: " + (g.x + .001) + ", ymax: " + (g.y + .002) + "}";
            var data = {bounds:requestBounds,r:'location',q:'RequestedDate > \'' +formatFilterDate("3 Months")+'\''};
            
        } else if (t == "detail" || t == 'layer'){
            
            $('#loadingModal').modal('show');
            
            
            var data = {q:g,r:t};
            if (typeof g == 'object'){
                var diff = .0015;
                if (t == 'layer'){
                    diff = .00005;
                }
                var requestBounds = "{xmin: " + (g.lng - diff) +", ymin: " + (g.lat - diff) + ", xmax: " + (g.lng + diff) + ", ymax: " + (g.lat + diff) + "}";
                //delete data.q;
                if (t == 'layer'){
                    var n = mapLayerNameSplit($('input[name=radioLayerIdentify]:checked', '#formLayerIdentify').val());
                    data = {geometeryType:'esriGeometryEnvelope','geometry':requestBounds,f:'json',inSR:4326,returnGeometry:false,outFields:'*'};
                    url = baseServicesURL+requestData.data.layers[n[0]].Path+n[1]+"/query?";
                } else {
                    //data['q'] = listGetFilteredColumns("bigmap")[0];
                    data['q'] = listCreateQueryForServer();
                    data['bounds'] = requestBounds;
                }
            } else if (g.search("=") == -1){
                var g = "RequestID = '" + g + "'";
                data.q = g;
            }
        } else {
            var data = {cID:g,r:'requester'};
        }
        //console.log(data);
        $.ajax({
            type:'GET',
            url:url,
            dataType: 'json',
            data: data,
            success: function (result){
                //console.log(result);
                var existReqText = "";
                $('#loadingModal').modal('hide');
                if (result.features.length > 0){
                    var count = 0;
                    console.log(t);
                    if (t == 'requester' || t == 'location'){
                        populateRelated(result.features,{queryType: t});
                        return;
                    }
                    if ((t != 'detail' && t != 'layer') || (t == 'detail' && result.features.length > 1)){
                        existReqText += "<h4>Requests</h4>";
                        $(result.features).each(function(){
                            
                            existReqText += "<div class=\"related\">";
                            if (t == 'detail'){
                                existReqText += '<div class="radio"><label><input type="radio" name="optionsRadios" id="optionsRadios'+count +'"';
                                if (count == 0){
                                    existReqText += ' checked';
                                }
                                existReqText += '>';
                            }
                            existReqText += "<a href=\"javascript:toggleDetail(rDetail" + count + ")\">" + this.attributes.RequestTypeText + " @ " + this.attributes.Address;
                            existReqText += " (" + this.attributes.StatusText + " - " + this.attributes.StatusDate.substring(0,10) + ")</a></div>";
                            existReqText += "<div id=\"rDetail"+count+"\" class=\"rDetail\"><dl class=\"dl-horizontal summary\"><dt>Description</dt><dd>"+this.attributes.Description+"</dd>";
                            if (this.actions.length > 0){
                                existReqText += "<dt>Last Action</dt><dd>"+this.actions[0].ActionType + "<br>"+this.actions[0].ActionDesc+"</dd></dl>";}
                            existReqText += "<div class=\"subDetail\"><p class=\"detailSection\">Respondent</p><div id=\"respond"+count+"\"><dl class=\"dl-horizontal\"><dt>Department</dt><dd>"+this.attributes.DeptID+"</dd><dt>Employee</dt><dd>"+ requestData.data.employees[this.attributes.EmployeeID].name +"</dd><dt>Title</dt><dd>"+requestData.data.employees[this.attributes.EmployeeID].title+"<dt>Phone</dt><dd>"+requestData.data.employees[this.attributes.EmployeeID].phone+"</dd></dl>";
                            existReqText += "<p class=\"detailSection\">Contact(s) (<a href=\"javascript:getExistingRequests('"+this.attributes.RequestID+"','detail')\">Add</a>)</p>";
                            $(this.contacts).each(function(){
                                existReqText += "<dl class=\"dl-horizontal\"><dt>Name</dt><dd>"+this.attributes.Name+"</dd><dt>Address</dt><dd>"+this.attributes.Address+"</dd><dt>Phone</dt><dd>"+this.attributes.Phone+"</dd><dt>Email</dt><dd>"+this.attributes.Email+"</dd></dl>";
                            });
                            existReqText += '</div></div></div>';
                            if (t == 'detail'){
                                existReqText += '</label></div>';
                            }
                            count++;
                        });
                        if (t != 'detail' && typeof result.permits != "undefined" && result.permits.length > 0){
                            existReqText += "<h4>Active Permits</h4>";
                            $(result.permits).each(function(){
                                existReqText += "<div class=\"related\"><a href=\"javascript:toggleDetail(rDetail" + count + ")\">";
                                existReqText += this.PermitType + " @ " + this.Address + "</a></div>";
                                existReqText += "<div id=\"rDetail"+count+"\" class=\"rDetail\"><dl class=\"dl-horizontal summary\">";
                                $.each(this,function(key,value){
                                    existReqText += "<dt>"+key+"</dt>";
                                    existReqText += "<dd>"+value+"</dd>";
                                });
                                existReqText += "</dl></div>";
                                count++;
                            });
                        }
                        
                        if (t == 'detail'){
                            detailedRequest = result.features[0];
                            multipleDetailed = result;
                        }
                        
                    } else if (t == 'layer'){
                        var count = 0;
                        $(result.features).each(function(){
                            existReqText += "<div class=\"related\"><a href=\"javascript:toggleDetail(attributes" + count + ")\">";
                            existReqText += this.attributes[result.displayFieldName]+ "</a></div>";
                            existReqText += "<div id=\"attributes"+count+"\" class=\"rDetail\"><dl class=\"dl-horizontal summary\">";
                            $.each(this.attributes,function(key,value){
                                existReqText += "<dt>"+key+"</dt>";
                                existReqText += "<dd>"+value+"</dd>";   
                            });
                            existReqText += "</dl></div>";
                            count++;
                        });
                    } else {
                        detailedRequest = result.features[0];
                        existReqText += detailParse(t, 0);
                    }
                } else {
                    existReqText += "<div class=\"related\"><p><i>None found.</i></p></div>";
                }

                if (t != 'detail' && t != 'layer'){
                    insertHTML("newResultsList",existReqText);
                    manageRelated(result.queryType);
                    $("#results").removeClass("hide");
                    enableRelated();
                } else if (t == 'layer'){
                    var mFooter = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
                    var mHeader = $('input[name=radioLayerIdentify]:checked', '#formLayerIdentify').val().split('-')[0];
                    if (result.features.length == 0){
                        existReqText = 'No Records Found';
                    }
                    if (nearbyArea){bigMap.removeLayer(nearbyArea)};
                    nearbyArea = new L.CircleMarker(g, {color: '#928E0F',radius: 25, fillOpacity: 0.10,clickable:false,}).addTo(bigMap);
                    modalShow(mHeader,existReqText,mFooter);
                }else {
                    var mFooter = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
                    if (result.features.length > 0){
                        var detail = 'More';
                        if (typeof loadManageTab != 'undefined' && email){
                            detail = 'Manage';
                        }
                        if (result.features.length > 1){
                            var mHeader = 'Multiple results';
                        } else {
                            var mHeader = result.features[0].attributes.RequestTypeText + ' ID: ' + result.features[0].attributes.RequestID;
                        }
                        
                        if (result.features.length > 0){
                            mFooter += '<a id="manage-button" class="btn btn-primary" href="javascript:detailRequestShow()">'+detail+'</a>';
                        }
                    } else {
                        var mHeader = 'No Records Found';   
                    }
                    modalShow(mHeader,existReqText,mFooter);
                }
            },
            error: function (xhr, status, error){
                //alert(status);
                console.log(error);
                console.log(xhr.responseText);
            }});
    } else {
        console.log("here");
        var h = "<div class=\"related\"><p><i>No results found for the contact information that was  entered.</i></p></div>";
        insertHTML("newResultsList",h);
        manageRelated(t);
        $("#results").removeClass("hide");
        enableRelated();
    }
}

function getNumberText(n){
    var numberText = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
    return numberText[n];
}


/*
*   Gets Request Support Data (i.e. types of questions, keywords, etc.) from JSON files on webserver
*/
function getRequestBaseData(){
    console.log("Get Request Data");
    $.each(dataURLs, function(i, v){
        var url = "http://gis.vodg.us/requests/support_files/request_"+v+".json";
        /*
        * For Emergency Mode Testing
        if (v == 'data'){
          url = "http://gis.vodg.us/requests/support_files/request_"+v+"_emer.json";
        }
        */
        $.getJSON(url, function(data){
            requestData[v] = data;
            // Second condition added for emergency mode testing
            if (url == "http://gis.vodg.us/requests/support_files/request_data.json" || url == "http://gis.vodg.us/requests/support_files/request_"+v+"_emer.json"){
                loadNewTab();
            }
            if (url == "http://gis.vodg.us/requests/support_files/request_contacts.json"){
                lookupContact();
            }
        });
    });
    //getAddresses();
}

function checkAndAskForMoreStorage(){
    // Request Quota (only for File System API)  
    // you could also use it from webkitPersistentStorage
    /*var successCallback = function(a,b){
        console.log(a,b);
    };
    var errorCallback = function(err){
        console.log(err);
    };
    navigator.webkitTemporaryStorage.queryUsageAndQuota(
          successCallback,
          errorCallback);*/
    
    var requestedBytes = 1024*1024*100; // 100MB
    

    var onInitFs = function(fs){
        console.log(fs);
    };
    
    var errorHandler = function(err){
        console.log(err);
    };
    
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    navigator.webkitPersistentStorage.requestQuota (
        requestedBytes, function(grantedBytes) {  
            console.log('we were granted ', grantedBytes, 'bytes');
            if (initialRequestForStorage){
                console.log("initialRequestForStorage");
                initialRequestForStorage = false;
                var tempmobilefilter;
                if (grantedBytes == 0){
                    tempmobilefilter = mobilefilter;
                    localRequests = false;
                } 
                var callback = function (){
                    mapAddData({purpose:"newmap"});
                }
                getRequestsFeatureData(null,tempmobilefilter,null,null,"newmap",callback);
            }
        }, errorHandler);
}

function getRequestsFromLocalStorage(callback){
    console.log("Get Requests from Local");
    
    if (!requests){
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        var errorHandler = function(err){
            console.log(err);
        };
        function onInitFs(fs) {

          fs.root.getFile('requests_list.json', {}, function(fileEntry) {

            // Get a File object representing the file,
            // then use FileReader to read its contents.
            fileEntry.file(function(file) {
               var reader = new FileReader();

               reader.onloadend = function(e) {
                   requests = JSON.parse(reader.result);
                   callback();
               };

               reader.readAsText(file);
            }, errorHandler);

          }, errorHandler);

        };
        var grantedBytes = 1024*1024*100; // 100MB
        window.requestFileSystem(window.PERSISTENT, grantedBytes, onInitFs, errorHandler);
    } else {
        if (callback){
            callback();
        }
    }
}

function showLoadingRequests(){
    if (!isLoadingRequests){
        isLoadingRequests = true;
        lastUpdateDateTime = moment.utc();
        insertHTML("request-dl-state","Getting Requests From Server");
        console.log(active);
        if (active != 'New' && active.length != 0){
            loadingShow();
        }
        $('#request-dl-status').addClass("state4")
        loadingRequests = setInterval(function(){
            if ($('#request-dl-status').hasClass("state1")){
                insertHTML("request-dl-state","Getting Requests From Server.");
                $('#request-dl-status').removeClass('state1').addClass('state2');
                return;
            } 
            if ($('#request-dl-status').hasClass("state2")) {
                insertHTML("request-dl-state","Getting Requests From Server..");
                $('#request-dl-status').removeClass('state2').addClass('state3');
                return;
            } 
            if ($('#request-dl-status').hasClass("state3")){
                insertHTML("request-dl-state","Getting Requests From Server...");
                $('#request-dl-status').removeClass('state3').addClass('state4');
                return;
            }
            if ($('#request-dl-status').hasClass("state4")){
                insertHTML("request-dl-state","Getting Requests From Server");
                $('#request-dl-status').removeClass('state4').addClass('state1');
                return;
            }
        },2000);
    }
}

function stopLoadingRequests(){
    isLoadingRequests = false;
    console.log(active);
    if (active != 'New' && active.length != 0){
        $('.dg-tab.active > a').click();
    }
    clearInterval(loadingRequests);
    loadingHide();
    var loadingRequestText = "Requests are up to date";
    if (!localRequests){
        loadingRequestText = "Request data received";
    }
    insertHTML("request-dl-state",loadingRequestText);
    $('#request-dl-status').removeClass('state1').removeClass('state3').removeClass('state2').addClass('state4');
    if (localRequests){
        showLastUpdateTimeRequests(moment().format("MM/DD/YYYY hh:mm A"));
    }
}

function showLastUpdateTimeRequests(lastUpdateTime){
    setTimeout(function(){
        insertHTML("request-dl-state","Last Complete Update: " + lastUpdateTime);
    },10000);
}

function deleteRequestsFromLocalStorage(){
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    var errorHandler = function(err){
        console.log(err);
    };
    
    var onInitFS = function(fs){
        fs.root.getFile('requests_list.json', {create: false}, function(fileEntry) {
            fileEntry.remove(function(){
                console.log("File Removed");
            },errorHandler);
        },errorHandler);
    };
    
    var grantedBytes = 1024*1024*100; // 100MB
    window.requestFileSystem(window.PERSISTENT, grantedBytes, onInitFS, errorHandler);
    
}

function saveRequestsToLocalStorage(requests) {
    console.log("Save Requests to Local");
    requestsUpdated = true;
    $('#refreshButton').prop('disabled',false);
    stopLoadingRequests();
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    var errorHandler = function(err){
        console.log(err);
    };
    
    var createRequestsJSON = function(fs){
        fs.root.getFile("requests_list.json",{create:true}, function(fileEntry){
                fileEntry.createWriter(function(fileWriter){
                    console.log("Creating File");
                    var blob = new Blob([JSON.stringify(requests)], {type: "application/json"});
                    console.log(blob.size);
                    console.log(blob.type);
                    fileWriter.addEventListener("writeend", function(){
                        console.log("Requests Saved");
                        localStorage.setItem("requests_local",true);
                    },false);
                    fileWriter.write(blob);
                },errorHandler);
        });
    }
    
    var onInitFS = function(fs){
        if (localStorage.getItem("requests_local") !== null && localStorage.getItem("requests_local")){
            fs.root.getFile('requests_list.json', {create: false}, function(fileEntry) {
                fileEntry.remove(function(){
                    createRequestsJSON(fs);
                },errorHandler);
                console.log("File Removed");
            });
        } else {
            createRequestsJSON(fs);
        }
        
    };
    
    var grantedBytes = 1024*1024*100; // 100MB
    window.requestFileSystem(window.PERSISTENT, grantedBytes, onInitFS, errorHandler);
}

/*
*   Gets request data for the list view currently.
*/
function getRequestsFeatureData(sort,filter,daysFilter,geoBounds,purpose,callback){
    console.log("getRequestFeaturesData");
    var geometry = true;
    var url = requestHandlerURL;
    console.log(url);
    var days = null;
    var outfields = "*";
    
    // The most general query we can do that will get all legitimate requests created in the system.
    var query = "StatusText <> 'Delete'";
    if (!localRequests){
        query = filter;
    }
    
    if (purpose != 'email'){
    // s is to capture DaysOpen sort request
        var s = null;
        if (purpose != 'list' && localRequests){
            if (filter){
                query = filter;
            }
            if (sort && sort.search("DaysOpen") > -1){
                s = sort;
                sort = null;
            }
        }

        var boundString = null;

        var d = {order:sort, q:query,d:days,fields:outfields,geo:geometry,r:purpose,bounds:null};
        if (purpose == 'nearby'){
            d.bounds = geoBounds;
        }
      
        // If local requests are enabled, this is where it will be handled
        try {
            if (localRequests && localStorage.getItem("requests_local") !== null && localStorage.getItem("requests_local")){
                initialRequestForStorage = false;
                console.log("Local Requests");
                if (!requests){
                    getRequestsFromLocalStorage(callback);
                    //deleteRequestsFromLocalStorage();
                    if (localStorage.getItem("requests_lastupdate") !== null && localStorage.getItem("requests_lastupdate") !== undefined && moment().subtract(7,'days') < moment.utc(parseInt(localStorage.getItem("requests_lastupdate")))){
                        console.log("Get Last Update");
                        purpose = 'refresh';
                        lastUpdateDateTime = parseInt(localStorage.getItem("requests_lastupdate"));
                    }
                } else if (purpose != 'refresh'){
                    console.log("load from local");
                    // This should catch any queries made that can use local data
                    callback();
                    return;
                } 
            }
        } catch(e){
            console.log(e);
            localRequests = false;
            d.q = mobilefilter;
        }
        if (purpose == 'newmap' && localRequests){
            purpose = 'all';
            d.r = purpose;
        }

        if (purpose == 'refresh'){
            requestsUpdated = false;
            var dateQuery = moment.utc(lastUpdateDateTime).utcOffset(-300).format("YYYY/MM/DD HH:mm:ss");
            d.q = "(LastUpdate > '"+dateQuery+"' OR StatusDate > '"+dateQuery+"')"; 
            d.r = 'refresh';
            console.log(d);
        }
    } else {
        var d = {order:null, q:filter,d:null,fields:outfields,geo:geometry,r:purpose,bounds:null};
        console.log(d);
    }
    console.log(d);
    console.log(localRequests, requestsUpdated);
    if (!localRequests || !requestsUpdated){
        if (localRequests){
            checkAndAskForMoreStorage();
            if ((purpose == 'all' || purpose == 'newmap' || purpose == 'refresh') && initialRequestForStorage){
                console.log("return");
                return;
            }
        }
        if (purpose != 'email'){
            showLoadingRequests();
        }
        console.log("Requesting Data");
        $.ajax({
            type:'GET',
            url:url,
            data:d,
            dataType:'json',
            success:function(data){
                console.log("Received Data - " + purpose);
                if (purpose != 'email'){
                    stopLoadingRequests();
                    if (!localRequests){
                        if (purpose != 'nearby' && purpose != 'detail' && purpose != 'requester'){
                            requests = data.features;
                        } else if (purpose != 'detail') {
                            filteredRequests = data.features;
                        }
                    } else if (purpose == 'all'){
                        requests = data.features;
                    }

                    $('#loadingModal').modal('hide');

                    if (localRequests && lastUpdateDateTime !== undefined){
                        console.log(lastUpdateDateTime.utc().valueOf());
                        localStorage.setItem("requests_lastupdate",lastUpdateDateTime.utc().valueOf());
                    }
                    if (localRequests){
                        if (purpose != 'refresh' && purpose != 'detail'){
                            saveRequestsToLocalStorage(requests);
                        } else {
                            updateRequestsWithNewInformation(data.features);    
                        }
                    }
                }
                if (callback){
                    if (purpose == 'email'){
                      callback(data);
                      return;
                    } else if (purpose == 'detail' && !localRequests && active == 'List'){
                      callback(data.features[0]);
                      return;
                    }
                    callback(data.features);
                    return;
                }
                /*if (purpose == "list"){
                    listFilterSortLocal(sort,daysFilter,true);
                } else if (purpose == "bigmap" || purpose == "map"){
                    requests = data.features;
                    mapAddData({purpose:purpose,daysFilter:daysFilter,heat:heat}); 
                }*/
            },
            error:function(error){
                console.log("error");
                console.log(error.responseText);
            },
            done:function(data){
                console.log("done");
                console.log(data);
            }
        });
    }
}

// When using Chrome, requests are saved locally. This functions updates the local copy of the requests
function updateRequestsWithNewInformation(r){
  var deleted = 0,updated = 0,added = 0;
  // Requests have not been received yet
  if (requests === undefined){
    setTimeout(function(){
        updateRequestsWithNewInformation(r);
    },10000);
    return;
  }
  var start = requests.length;
  console.log("Request Count: " + r.length);
  $.each(r,function(nIndex){
    var found = false;
    $.each(requests,function(index){
      if (requests[index].properties.RequestID == r[nIndex].properties.RequestID){
        found = !found;
        //Remove deleted requests
        if (r[nIndex].properties.StatusCode == 99){
          requests.splice(index,1);
          deleted++;
          return false;
        }
        requests[index] = cloneObjectInternal(r[nIndex]);
        updated++;
        return false;
      }
    });
    if (!found){
      var newRequest = cloneObjectInternal(r[nIndex]);
      added++;
      if (!localRequests){
          console.log(requests.length);
          requests.splice(0,0,newRequest);
          console.log(requests.length);
      } else {
          console.log(requests.length);
          requests.push(newRequest);
          console.log(requests.length);
      }
      
    }
  });
  var end = requests.length;
  if (r.length > 0 && localRequests){
    saveRequestsToLocalStorage(requests);
  } else {
    stopLoadingRequests();
  }
  if (active == "New"){
    if (!$('#results').hasClass('hide')){
      console.log("Update New");
      // Update related information
      // If nearby requests tab is showing
      if (!$('#relatedRequester').hasClass('active')){
        getNearbyRequests({purpose:'nearby',location:L.point(x,y),distance:150});
        var mFooter = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
        mFooter += '<a class="btn btn-primary" href="javascript:populateDetailed()">View Request</a>';
        modalShow("Success!","Request #" + r.properties.RequestID +" has been updated.",mFooter);
      } else {
        // if requester tab is showing
        getRelatedRequests($("#ContactID").val());
      }
   }
  }
  if (($("#request-list > .table-container > table").length != 0)) {
    console.log("New Data - Update List");
    listFilterSortLocal(listGetSortedColumn('list'),listGetFilteredColumns('list'),false);
  }
  if ($(".map-filter > table").length != 0){
    console.log("New Data - Update Map");
    mapAddData({purpose:'bigmap',heat:(heatmapLayer !== null)});
  }
  console.log("Start: "+ start + " - Added: " + added + " - Updated: " + updated + " - Deleted: " + deleted + " - End: " + end);
}

function heatMapGetData(){
  //console.log(requests);
  var heatMapData = {max:2000};
  var heatArray = [];
  var mapRequests = {type:'FeatureCollection','features':requests};

  if (filteredRequests){
    mapRequests = {type:'FeatureCollection','features':filteredRequests};
  }
  $.each(mapRequests.features, function(index){
    if ('query' in filters['Quadrant'] && !/All/.test(filters['Quadrant'].query)) {
      if (pointInPolygon(this.geometry.coordinates,requestData.data.locationfilter[$('#filter-Quadrant').val()].geometry.rings[0])){
        heatArray.push({'lat':this.geometry.coordinates[1],'lng':this.geometry.coordinates[0],'value':1});
      }
    } else {
      heatArray.push({'lat':this.geometry.coordinates[1],'lng':this.geometry.coordinates[0],'value':1});
      if (index == 10){
        console.log(heatArray);
      }
    }
  });
  heatMapData['data'] = heatArray;
  return heatMapData;
}

function heatMapTurnOff(){
    insertHTML('bigMapHeat',"Turn On Heat Map");
    bigMap.removeLayer(heatmapLayer);
    heatmapLayer = null;
}

function heatMapTurnOn(){
    insertHTML('bigMapHeat',"Turn Off Heat Map");
    var heatdata = heatMapGetData();
    var cfg = {
      // radius should be small ONLY if scaleRadius is true (or small radius is intended)
      // if scaleRadius is false it will be the constant radius used in pixels
      "radius": 40,
      "maxOpacity": .3, 
      // scales the radius based on map zoom
      "scaleRadius": false, 
      // if set to false the heatmap uses the global maximum for colorization
      // if activated: uses the data maximum within the current map boundaries 
      //   (there will always be a red spot with useLocalExtremas true)
      "useLocalExtrema": true,
      // which field name in your data represents the latitude - default "lat"
      latField: 'lat',
      // which field name in your data represents the longitude - default "lng"
      lngField: 'lng',
      // which field name in your data represents the data value - default "value"
      valueField: 'value'
    };
    heatmapLayer = new HeatmapOverlay(cfg);
    console.log("Heat Map Before Add Data");
    bigMap.addLayer(heatmapLayer);
    console.log("Heat Map After Add Layer");
    heatmapLayer.setData(heatdata);
    console.log("Heat Map After Add Data");
    bigMap.invalidateSize();
}

function heatMapToggle(){
    if (heatmapLayer){
        heatMapTurnOff();
    } else {
        heatMapTurnOn();
    }
}

function keywordsFind(){
    var text = $('#rDesc').val();
    text = text.toLowerCase();
    text = text.replace(/[^a-z ]/g, "");
    var types = requestData.data.types;
    var suggestedTypes = [];
    for (var t in text){
        for (var ty in types){
            var words = types[ty].keywords;
            for (var w in words){
                if (text.search(words[w]) > -1){
                    if (suggestedTypes.indexOf(ty) == -1){
                        suggestedTypes.push(ty);
                        break;
                    }
                }
            }
        } 
    }
    // Get Selected Request - So that it doesn't change
    var selectedRequest = $("#requestTypes").val();
    // Update request list
    
    if (isChromeDesktop && !requestData.data.emerMode){
        insertHTML('RequestTypeList',populateRequestTypes(false,suggestedTypes));
    } else {
        insertHTML('requestTypes',populateRequestTypes(false,suggestedTypes));
    }
    // Re-select selected request
    $("#requestTypes").val(selectedRequest);
}

/*function keywordsMenuShow(e){
    if (e.target.innerHTML != "..."){
        var text = e.target.innerHTML;
        text = text.split(" ");
        if (text[1]){
            tags.splice(tags.indexOf(text[0]),1);
        } else {
            tags.push(text[0]);
        }
    }
    var h = '';
    for (var key in keywords){
        if (tags.indexOf(key) > -1){
            h += '<span class="label label-info label-add">'+key+' <span class="glyphicon glyphicon-ok"></span></span>';
        } else {
            h += '<span class="label label-info label-add label-unchecked">'+key+'</span>'
        }
        h += '<span>   </span>';
    }
    var more = "Done";
    h += '<span class="label label-more">'+more+'</span>';
    insertHTML("tags", h);
    $('.label-add').on('click',function(e){keywordsMenuShow(e);});
    $('.label-more').on('click',function(){keywordsFind($('#rDesc'));
    });
}*/

function listFilterReset(){
    $.each(filters,function(){
        this.visible = this.defaultVisible;
        delete this.query;
        delete this.queryText;
    });
}

// Gathers query parameters from filters on List and Map tabs
// e == the element that triggered the filter/sort request
function listFilterSort(e){
  // This query text is set only when requests are not being saved locally.
  // After the original request to the server (when this queryText is inserted), filters are set by the user. 
  // SubmittedDate will never contain this queryText shown below because it references the Status filter, which is it's own individual filter.
  // We delete it because after the initial request to the server the filters are essential "reset" and we need to remove the queryText so
  // that it doesn't show up on subsequent filter requests
  if (filters['SubmittedDate'].queryText == "Status is not \"Completed\" or has changed in the last 30 days"){
    delete filters['SubmittedDate'].queryText;
  }
  console.log(e);
  console.log("List Filter Sort");
  var purpose = "list";
  var geo = true;
  if (active == "List"){
    $(".glyphicon-sort-by-alphabet, .glyphicon-sort-by-alphabet-alt, .glyphicon-sort").off('click');
  } else if (active == "Map"){
    purpose = "bigmap";
    geo = true;
  }

  console.log(purpose);
  // s == sort, f == filter
  var s = null;
  var f = null;

  if (purpose == "bigmap"){
    f = listGetFilteredColumns(purpose);
  } else if (e && e.target.nodeName == "SPAN"){
    console.log("Sort");
    s = listHandleSortEvent(e);
    f = listGetFilteredColumns(purpose);
  } else {
    console.log("Sort - Purpose");
    f = listGetFilteredColumns(purpose);
    s = listGetSortedColumn(purpose);
  }


  if ((e.target.id == 'refreshButton' && e.target.nodeName == 'BUTTON') && localRequests){
    purpose = 'refresh';
    getRequestsFeatureData(s,f[0],f[1],f[2],purpose,null);

  } else if (e && e.target.nodeName == 'BUTTON' && !localRequests){
    purpose = active;
    var listfiltercallback = function (){
        populateTable(requests,'request-list',false);
        queryInsertDescription(requests.length);
    };
    if (active == 'Map'){
        listfiltercallback = function (){
            mapAddData({purpose:'bigmap'});
            queryInsertDescription(requests.length);
        }
    }
    getRequestsFeatureData(s,f[0],f[1],f[2],purpose,listfiltercallback);
  }else{
    listFilterSortLocal(s,f[1],false);
  }
}

// Performs queries and sorting locally (client-side) for the filters
function listFilterSortLocal(sort,daysFilter,newTable,listCallback){
    console.log("List Filter Sort Local");
    loadingShow();
    console.log(urlParam);
    if (typeof urlParam[0] != 'undefined'){
        if (urlParam[0] == "eID"){
            var allOpen = "StatusText <> 'Completed' AND StatusText <> 'Complete' AND StatusText <> 'Delete' AND StatusText <> 'Outside Jurisdiction'";
            filter = 'EmployeeID = ' + urlParam[1];
            filters['EmployeeText'].query = filter;
            filters['EmployeeText'].queryText = 'Employee is ' + requestData.data.employees[urlParam[1]].name;
            filters['StatusText'].query = allOpen;
            filters['StatusText'].queryText = 'Status is not completed or outside jurisdiction';
        }
        urlReset();
    }
    var tempArray = requests.slice();
    var processedArray = [];
    var filter = false;
    $.each(filters,function(key,value){
        if (this.query){
            filter = true;
            if (key == 'Address'){
                $('.locationLookup').typeahead('close');
            }
        }
    });
    if (filter){
        $.each(tempArray,function(rIndex){
            var keep = 0;
            var queries = 0;
            if (filters['Quadrant'].visible){
                var geo = tempArray[rIndex].geometry.coordinates;
                this.properties.Quadrant = locationFilterName('Quadrant',null,geo);
            }
            $.each(filters,function(key,val){
                if (val.visible && val.query){
                    var query = parseFilter(val.query);
                    if (key == 'EmployeeText'){
                        key = 'EmployeeID';
                        
                    }
                    $.each(query[key],function(qIndex){
                        queries++;
                        if (this.operator == '='){
                            $.each(this.value,function(){
                                if (this == tempArray[rIndex].properties[key]) {
                                    keep++;
                                }
                            });
                        } else if (this.operator == '<>') {
                            var notEqualCount = 0;
                            $.each(this.value,function(){
                                if (this != tempArray[rIndex].properties[key]){
                                    notEqualCount++;
                                }
                            });
                            if (notEqualCount == this.value.length){
                                keep++;
                            }
                        } else if (this.operator == '>'){
                            $.each(this.value,function(){
                                if (key.toLowerCase().search('date') > -1){
                                    var vDate = moment(Number(tempArray[rIndex].properties[key]));
                                    var qDate = moment(Number(this)*1000);
                                    if (vDate > qDate){
                                        keep++;
                                    }
                                } else {
                                    if (tempArray[rIndex].properties[key] > this){
                                        keep++;
                                    }
                                }
                            });
                        } else if (this.operator == '<'){
                            $.each(this.value,function(){
                                if (key.toLowerCase().search('date') > -1){
                                    var vDate = moment(Number(tempArray[rIndex].properties[key]));
                                    var qDate = moment(Number(this)*1000);
                                    
                                    if (vDate < qDate){
                                        keep++;
                                    }
                                } else {
                                    if (tempArray[rIndex].properties[key] < this){
                                        keep++;
                                    }
                                }
                            });
                        } else if (this.operator == 'LIKE'){
                            $.each(this.value,function(){
                                if (tempArray[rIndex].properties[key] && tempArray[rIndex].properties[key].toLowerCase().search(this.toLowerCase()) > -1){
                                    keep++;
                                }
                            });
                        } else if (this.operator == '=='){
                            $.each(this.value,function(){
                                if (tempArray[rIndex].properties[key] === tempArray[rIndex].properties[this]){
                                    keep++;
                                }
                            });
                        }
                    });
                }
            });
            if (keep >= queries) {
                processedArray.push(tempArray[rIndex]);
            }
        });
        tempArray = processedArray;
    }
    if (!sort){
        sort = 'SubmittedDate DESC, RequestedDate DESC';
    } else {
        sort = sort + ', SubmittedDate DESC';
    }
    
    var sortArray = tempArray;
    var sortParams = sort.split(", ");
    var previousSortFields = [];
    // for sorting for mulitple fields
    var secondaryTempSortArray = [];
    $.each(sortParams,function(sIndex){
        var tempSortArray = [];
        var tempDict = {};
        var tempSortParams = this.split(" ");
        previousSortFields.push(tempSortParams[0]);
        if (sIndex == 0){
            $.each(sortArray,function(aIndex){
                if (typeof this === Object){
                    console.log(this);
                }
                var sortValue = this.properties[tempSortParams[0]];
                if (tempSortParams[0] == 'Quadrant' && !this.properties.Quadrant){
                    var geo = sortArray[aIndex].geometry.coordinates;
                    sortValue = locationFilterName('Quadrant',null,geo);
                    this.properties.Quadrant = sortValue;
                } /*else if (tempSortParams[0].toLowerCase().search('date') > -1){
                    sortValue = Date.parse(sortValue);
                }*/
                tempSortArray.push([sortValue,this]);
            });
            tempSortArray.sort(function(a,b){
                if (a[0] === b[0]) {
                    return 0;
                }
                else {
                    return (a[0] < b[0]) ? -1 : 1;
                }
            });
            if (tempSortParams[1] == "DESC"){
                tempSortArray.reverse();
            }
            sortArray = [];
            $.each(tempSortArray,function(tIndex){
                sortArray.push(this[1]);
            });
        } else {
            $.each(sortArray,function(aIndex){
                var sortValue = this.properties[tempSortParams[0]];
                if (tempSortParams[0] == 'AddressNo'){
                    sortValue = parseInt(sortValue);
                } /*else if (tempSortParams[0].toLowerCase().search('date') > -1){
                    sortValue = Date.parse(sortValue);
                }*/
                var item = [sortValue,this];
                var previousSort = previousSortFields[sIndex-1];
                var previousSortValue = this.properties[previousSort];
                if (previousSort == 'AddressNo'){
                    previousSortValue = this.properties.StreetName + this.properties.AddressNo;
                }
                if (tempDict[previousSortValue]){
                    var ta = tempDict[previousSortValue];
                    ta.push(item);
                } else {
                    tempDict[previousSortValue] = [item];
                }
            });
            sortArray = [];
            $.each(tempDict,function(key){
                this.sort(function(a,b){
                    if (a[0] === b[0]) {
                        return 0;
                    }
                    else {
                        return (a[0] < b[0]) ? -1 : 1;
                    }
                });
                if (tempSortParams[1] == "DESC"){
                    this.reverse();
                }
                $.each(tempDict[key],function(){
                    sortArray.push(this[1]);
                });
            });
        }
    });
                    
    filteredRequests = sortArray;
    if (listCallback){
        listCallback();
        return;
    }
    console.log("populate - "+active);
    if (!localRequests){
        requests = filteredRequests;
    }
    if (active == 'List'){
        populateTable(filteredRequests,'request-list',newTable);
        queryInsertDescription(filteredRequests.length);
    } else if (active == 'Map'){
        mapAddData({purpose:'bigmap'});
        queryInsertDescription(filteredRequests.length);
    } else {
        console.log("Check to see if non-active views need updates");
        if ($("#request-list .table-container").length != 0){
            console.log("Non-active List Update");
            populateTable(filteredRequests,'request-list',newTable,{purpose:'List'});
            queryInsertDescription(filteredRequests.length,{purpose:'List'});
        }
        if ($(".map-filter > table").length != 0){
            console.log("Non-active Map Update");
            mapAddData({purpose:'bigmap'});
            queryInsertDescription(filteredRequests.length,{purpose:'Map'});
        }
    }
    
}

function queryInsertDescription(count,options){
  if (options === undefined){
      options = {purpose:active};
  }
  var descriptionID = 'list-query-text';
  if (active == 'Map' || options.purpose == 'Map'){
      descriptionID = 'map-query-text';
  }
  if ($('#'+descriptionID).length){
      insertHTML(descriptionID,'<b>Showing ' + count + ' requests where: </b>'+listCreateQueryDescription()+'</p>');
  } else if (active == 'List' || active == 'Map'){
      var e = '#request-list';
      if (active == 'Map'){
          e = '#request-map-filter';
      }
      $(e).before('<p id="' + descriptionID + '" class="text-muted"><b>Showing ' + count + ' requests where: </b>'+listCreateQueryDescription()+'</p>');
  }
}

function trimValue(s){
    s = s.replace(/^( +)/,"").replace(/^(')/,"").replace(/^(%)/,"").replace(/( +)$/,"").replace(/(')$/,"").replace(/(%)$/,"");
    return s;
}
    
function parseFilter(filter){
    var query = {};
    var and = " AND ";
    filter = filter.split(and);
    $.each(filter,function(index){
        var tempParams = getQueryParameters(filter[index]);    
        if (tempParams.length > 1){
            var tempArray = [];
            var v = trimValue(tempParams[1]); 
            v = (v != 'un' ? v : '9999');
            if (query[tempParams[0]]){
                var tempDictArray = query[tempParams[0]];
                /*$.each(tempDictArray,function(){
                    if (this.operator == tempParams[2].trim()){
                        this.value.push(v);
                    } else {
                        tempDictArray.push({value:[v],operator:this.operator});
                    }
                }*/
                query[tempParams[0]] = parseFilterQuery(tempDictArray,tempParams);
            } else {       
                if (tempParams[0] == 'RequestTypeText' && v.indexOf(' - All')>0){
                    var category = v.substring(0,v.indexOf(' - All'));
                    var keyArray = [];
                    $.each(requestData.data.types,function(key,val){
                        if (val.category == category){
                            keyArray.push(key);
                        }
                    });
                    tempArray.push({value:keyArray,operator:'='});
                    query[tempParams[0]] = tempArray;
                } else {              
                    tempArray.push({value:[v],operator:tempParams[2].trim()});
                    query[tempParams[0]] = tempArray;
                }
            }
        }
    });
    return query;
}

function parseFilterQuery(dictArray,paramArray){
    var tempDictArray = dictArray.slice();
    var appended = 0;
    $.each(tempDictArray,function(){
        if (this.operator == paramArray[2].trim()){
            this.value.push(trimValue(paramArray[1]));
            appended = 1;
        }
    });
    if (appended == 0){
        tempDictArray.push({'operator':paramArray[2].trim(),'value':[trimValue(paramArray[1])]});
    }
    
    return tempDictArray;
}

function getQueryParameters(q){
    var operators = [' = ',' < ',' <> ',' > ',' LIKE ',' == '];
    
    $.each(operators,function(index){
        var tempQuery = q;
        tempQuery = tempQuery.split(operators[index]);
        if (tempQuery.length != 1){
            tempQuery.push(operators[index]);
            q = tempQuery;
            return false;
        }
    });
    
    return q;
}


function listGetSortedColumn(){
    var s = $(".glyphicon-sort-by-alphabet");
    console.log(s);
    var c = null;
    if (s.length > 0){
        s = $(s).attr('id')
        console.log(s);

        var c = s.split("-");
        c = c[1];
        if (c == "Address"){
            c = "StreetName ASC, AddressNo ASC";
        } else {
            c = c + " ASC";
        }
    } else {
        s = $(".glyphicon-sort-by-alphabet-alt");
        if (s.length > 0){
            s = $(s).attr('id')
            c = s.split("-");
            c = c[1];
            if (c == "Address"){
                c = "StreetName DESC, AddressNo DESC";
            } else {
                c = c + " DESC";
            }
        } 
    }
    return c;
}

function listCreateQueryForServer(){
    var query = "StatusText <> 'Delete'";
    console.log(filters);
    $.each(filters,function(key,value){
        if (key != 'Quadrant' && value.visible && 'query' in this){
            query += ' AND ' + value.query;
        }
    });
    return query;
}

function listCreateQueryDescription(){
    var queryText = "";
    $.each(filters,function(key,value){
        if (value.visible && 'queryText' in this){
            queryText += value.queryText + ', ';
        }
    });
    if (queryText.length == 0){
        queryText = 'All';
    } else {
        queryText = queryText.substring(0,queryText.length-2);
    }
    return queryText;
}

// p - filter purpose (source of request)
function listGetFilteredColumns(p){
    // Select all the possible filters
    if (p == "bigmap"){
        //console.log($(".map-filter .table-header th select"));
        var s = $(".map-filter .table-header th select");
        var i = $(".map-filter .table-header th input");
    } else {
        //console.log($(".table-container .table-header th select"));
        var s = $(".table-container .table-header th select");
        var i = $(".table-container .table-header th input");
    }
    
    var f = '';
    var days = null;
    var bounds = null;
    $.each(s,function(){
        var v = $(this).val();
        var c = this.id;
        c = c.split("-");
        if (v != "all" && v != ''){
            /*if (c[1] == 'StatusDate' || c[1] == 'SubmittedDate'){
                var d = formatFilterDate(v);
                if (v != '1 Year +'){
                    f += c[1] + " > '" + d + "' AND ";
                } else {
                    f += c[1] + " < '" + d + "' AND ";
                }
            } else */
            if (c[1] == 'DaysOpen'){
                days = v;
                filters[c[1]].query = c[1] + " < " + v;
                filters[c[1]].queryText = c[1] + " less than " + v + " days open";
                //f += c[1] + " < " + v + " AND ";
            } else if (c[1] == 'StatusText' && v == "All Open"){
                //f += c[1] + " <> 'Completed' AND " + c[1] + " <> 'Complete' AND " + c[1] + " <> 'Delete' AND " + c[1] + " <> 'Outside Jurisdiction' AND ";
                filters[c[1]].query = c[1] + " <> 'Completed' AND " + c[1] + " <> 'Complete' AND " + c[1] + " <> 'Delete' AND " + c[1] + " <> 'Outside Jurisdiction'";
                filters[c[1]].queryText = 'Status is not completed or outside jurisidiction';
            } else if (c[1] == 'EmployeeText') {
                //f += 'EmployeeID = ' + v + " AND ";
                filters[c[1]].query = 'EmployeeID = ' + v;
                filters[c[1]].queryText = 'Employee is ' + requestData.data.employees[v].name;
            } else if (typeof c[1] != undefined){
                //f += c[1] + " = '" + v + "' AND ";
                filters[c[1]].query = c[1] + " = '" + v + "'";
                filters[c[1]].queryText = filters[c[1]].shortName + ' is ' + v;
                if (c[1] == 'RequestTypeText' && /- All/.test(v)){
                    filters[c[1]].queryText = 'Category is ' + v.split(' - ')[0];   
                }
            }
        } else if (v == 'all' && 'query' in filters[c[1]]) {
            delete filters[c[1]].query;
            delete filters[c[1]].queryText;
        }
    });
    
    // Loop inputs
    $.each(i,function(){
        var v = $(this).val();
        var c = this.id;
        console.log(c);
        c = c.split("-");
        console.log(c);
        
        if (v.length > 0){
            if (c[1] == 'Address'){
                if (active != 'Map'){
                    var i = "Intersection of ";
                    if (v.search(i) > -1){
                        v = v.substring(i.length,i.length+100);
                    } 
                    filters[c[1]].query = c[1] + " LIKE \'%" + v + "%\'";
                    filters[c[1]].queryText = c[1] + " includes " + v;
                    //f += 'Address LIKE \'%' + v + '%\' AND ';
                }
            } else if (c[1] == 'Description'){
                filters[c[1]].query = c[1] + " LIKE \'%" + v + "%\'";
                filters[c[1]].queryText = c[1] + " includes " + v;
                //f += 'Description LIKE \'%' + v + '%\' AND ';
            } else if (typeof c[1] != 'undefined'){
                filters[c[1]].query = c[1] + " = '" + v + "'";
                filters[c[1]].queryText = filters[c[1]].shortName + " is " + v;
                //f += c[1] + " = '" + v + "' AND ";
            }
            
        } else if (c.length > 1 && c[1].length > 0){
            if ('query' in filters[c[1]]){
                delete filters[c[1]].query;
            }
            if ('queryText' in filters[c[1]]){
                delete filters[c[1]].queryText;
            }
        }
    });
    /*if (f.length > 0) {
        f = f.substring(0,(f.length-4));
    } else {
        f = null;
    }*/
    return [listCreateQueryForServer(),days];
}

function listHandleSortEvent(e){
    var classList = [];
    for (var i = 0; i < e.target.classList.length; i++){
        classList.push(e.target.classList[i]);
    }
    e = "#"+e.target.id;
    $(".glyphicon-sort-by-alphabet").addClass("glyphicon-sort");
    $(".glyphicon-sort-by-alphabet-alt").addClass("glyphicon-sort");
    $(".glyphicon-sort-by-alphabet").removeClass("glyphicon-sort-by-alphabet");
    $(".glyphicon-sort-by-alphabet-alt").removeClass("glyphicon-sort-by-alphabet-alt");

    if (classList.indexOf("glyphicon-sort-by-alphabet") > -1){
        $(e).addClass("glyphicon-sort-by-alphabet-alt");
    } else if (classList.indexOf("glyphicon-sort-by-alphabet-alt") > -1){
        // Empty just to prevent going to else -- might be a better way to do this
    } else {
        $(e).removeClass("glyphicon-sort");
        $(e).addClass("glyphicon-sort-by-alphabet");
    }
    return listGetSortedColumn();
}

function listHasNotBeenCreated(){
  return ($("#request-list > .table-container > table").length == 0);
}

function loadDetailTab(){
    console.log("Load Detail");
    if (!manageMap){
        var center = L.latLng(41.791,-88.010);
        manageMap = L.map('request-manage-map',{center:center,zoom:15});
        L.esri.basemapLayer('Topographic').addTo(manageMap);
        manageMap.whenReady(mapLoaded);
    } else {
        mapLoaded();
    }
}

function loadingShow(){
    $('#loadingModal').modal('show');
}

function loadingHide(){
    $('#loadingModal').modal('hide');
}

function loadNewTab(){
  lookupLocations();
  // For Chrome Desktop, the request list is a custom ul that watches if the cursor hovers over a category to show the request types.
  // In emergency mode, this feature is disabled to enabled better tabbing between fields and keyboard functionality associated with the Select element
  if (isChromeDesktop && !requestData.data.emerMode){
    insertHTML('RequestTypeList',populateRequestTypes(false,null));
  } else {
    insertHTML('RequestTypeContainer','<select id=\'requestTypes\' class=\'form-control\'>'+populateRequestTypes(false,null)+'</select>');
  }



  insertHTML('assignContainer','<select id=\'assignEmp\' class=\'form-control\'></select>');
  if (newMap){
      newMap.remove();
  }
  newMap = L.map('map');
  //Disable navigation
  newMap.dragging.disable();
  newMap.touchZoom.disable();
  newMap.doubleClickZoom.disable();
  newMap.scrollWheelZoom.disable();
  // End Disable Navigation
  var center = L.latLng(41.791,-88.010);
  newMap.setView(center,13);
  L.esri.basemapLayer('Topographic').addTo(newMap);
  /*$('.label-more').on('click',function(e){keywordsMenuShow(e);
  });*/
  newMap.whenReady(mapLoaded);
  newFormReset();
  $("#results").addClass("hide");
  if (!localRequests || requestData.data.emerMode){
    $('#requestTypes').val('General ');
  }
  $("#requestTypes").off('change');
  $("#requestTypes").change(function(){
    if (requestData.data.emerMode && $("#requestTypes").val() == 'Show All'){
      insertHTML('RequestTypeContainer','<select id=\'requestTypes\' class=\'form-control\'>'+populateRequestTypes(false,[],true)+'</select>');
      $('#requestTypes').val("General ");
      return;
    }
    employeeParse($("#requestTypes").val(),false);
  });
  $('.popover-underline').popover({
      title:function(){return $("#requestTypes").val();},
      content:function(){return requestData.data.types[$("#requestTypes").val()].description;},
      trigger:"hover",
      placement:"top",
  });
  /*$("#newSubmit").off('click');
  $("#newSubmit").click(createRequest);*/
  $("#newReset").off('click');
  $("#newReset").click(newFormReset);
  $('#rDesc').keypress(keywordsFind);

  $("#assignEmp").off('change').on('change',function(){employeeShowAll();});
  // Emergency Mode
  if (requestData.data.emerMode){
    getEventItems();
  }
}

function loadListTab(){
    // replace these lines with resetFilterZoom because it ensures that the list and filters are in sync
    /*$('#loadingModal').modal('show');
    getRequestsFeatureData(null, filter,null,false,"list");*/
    if ($("#request-list .table-container").length == 0){
        loadingShow();
        if (isLoadingRequests) return;
        if (!filteredRequests && localRequests){
            resetFilterSort();
        } else {
            console.log("populate filtered list requests");
            // If big map already exists, get current filters
            if ($(".map-filter > table").length != 0){
                listFilterSortLocal(null,listGetFilteredColumns('bigmap'),true);
                return;
            }
            if (!localRequests){
                if (requests === undefined) return;
                filteredRequests = requests;
                if (listHasNotBeenCreated() && mapHasNotBeenCreated()){
                  filters['SubmittedDate'].queryText = "Status is not \"Completed\" or has changed in the last 30 days";
                }
                queryInsertDescription(filteredRequests.length);
            }
            populateTable(filteredRequests,'request-list',false);
        }
    } 
}

function loadMapTab(){
    //console.log("Load Map Tab");
    if (!bigMap){
        loadingShow();
        if (isLoadingRequests) return;
        populateTable(null,"request-map-filter",false);
        bigMap = L.map('request-map');
        //Disable navigation
        // End Disable Navigation
        var center = L.latLng(41.791,-88.010);
        bigMap.setView(center,13);
        var topo = L.esri.basemapLayer('Topographic');
        topo.addTo(bigMap);
        var aerial = L.esri.basemapLayer('Imagery');
        baseMaps = {'Topographic':topo,'Aerial':aerial};
        L.control.layers(baseMaps).addTo(bigMap);
        bigMap.whenReady(mapLoaded);
        //bigMap.on('viewreset',mapLoaded);
        bigMap.invalidateSize();
            /*$('.label-more').on('click',function(e){keywordsMenuShow(e);
            });*/
    }
    
}

// Lookup by Contact Name on New Tab
function lookupContact(){
    var contactname = new Bloodhound({
        
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('ContactName'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        //prefetch: 'http://gis.vodg.us/requests/support_files/request_contacts.json'
        local:requestData.contacts
    });

    // kicks off the loading/processing of `local` and `prefetch`
    contactname.initialize();

    // passing in `null` for the `options` arguments will result in the default
    // options being used
    $('.contactLookup').typeahead('destroy');
    
    $('.contactLookup').removeClass('contactLookup');
    
    $('.nameLookup').typeahead({highlight:true}, {
        name: 'nameResults',
        displayKey: 'ContactName',
      // `ttAdapter` wraps the suggestion engine in an adapter that
      // is compatible with the typeahead jQuery plugin
        source: contactname.ttAdapter()
    }).bind("typeahead:selected",function (obj, datum, name) {
        lookupContactShow(datum);
    });
    
    $('.nameLookup').addClass('contactLookup');
}

function lookupContactToggle(t){
    if (t == 'off'){
        $('.contact-search').removeClass('btn-warning');
        $('.contact-search').addClass('btn-default');
        $('.contactLookup').typeahead('destroy');
        $('.contactLookup').removeClass('contactLookup');
        insertHTML('contactSearchType','Off');
    } else if (t == 'name') {
        $('.contact-search').addClass('btn-warning');
        $('.contact-search').removeClass('btn-default');
        lookupContact();
        insertHTML('contactSearchType','Name');
    } else if (t == 'phone'){
        $('.contact-search').addClass('btn-warning');
        $('.contact-search').removeClass('btn-default');
        lookupPhone();
        insertHTML('contactSearchType','Phone');
    } else if (t == 'address'){
        $('.contact-search').addClass('btn-warning');
        $('.contact-search').removeClass('btn-default');
        lookupContactAddress();
        insertHTML('contactSearchType','Address');
    }
}
            
function lookupContactShow(datum){
    if (active == 'New' || active == ''){
        $('#ContactID').val(datum.ContactID);
        $('#fName').val(datum.ContactName);
        $('#fAddress').val(datum.Address);
        if (datum.Phone.search(' x') > 0){
            var p = datum.Phone.split(' x');
            $('#fPhone').val(p[0]);
            $('#fPhoneExt1').val(p[1]);
        } else {
            $('#fPhone').val(datum.Phone);
        }
        $('#fEmail').val(datum.Email);
        lookupContactToggle('off');
    } else if (active == 'Manage'){
        $('#mContactID').val(datum.cID);
        $('#cName').val(datum.ContactName);
        $('#cAddress').val(datum.Address);
        $('#cPhone').val(datum.Phone);
        $('#cPhone2').val(datum.Alt_Phone);
        $('#cEmail').val(datum.Email);
        $('#cState').val(datum.State);
        $('#cCity').val(datum.City);
        $('#cZip').val(datum.Zip);
        $('#notes').val(datum.Notes);
    }
    contact = datum;
}

function lookupDestroy(className){
    var lookups = $(className);
    $.each(lookups,function(){
        
        if (typeof $(this).attr('id') != 'undefined'){
            console.log($(this).attr('id'));
            $('#'+$(this).attr('id')).typeahead('destroy');
        }
    });
}

function lookupLocations(){
    var locationLookup = new Bloodhound({
        
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('Name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        sorter: function(a,b){
            var tempA = a.Name.split(' ');
            var tempB = b.Name.split(' ');
            if (tempA[0] == 'Intersection'){
                a = tempA[2];
            } else {
                a = tempA[0];
                if (/^[0-9]+$/.test(a)){
                    a = parseInt(a);
                }
            }
            if (tempB[0] == 'Intersection'){
                b = tempB[2];
            } else {
                b = tempB[0];
                if (/^[0-9]+$/.test(b)){
                    b = parseInt(b);
                }
            }
            return (a<b?-1:(a>b?1:0));
        },
        prefetch: 'http://www.downers.us/public/json/locations.json',
        limit: 5,
    });
    
    locationLookup.initialize(true);
    
    $('.locationLookup').typeahead('destroy');

    // passing in `null` for the `options` arguments will result in the default
    // options being used
    $('.locationLookup').typeahead({
            highlight: true,
        }, {
            //name: 'locationResults',
            displayKey: 'Name',
            matcher: function (item) {
                if (item.toLowerCase().indexOf(this.query.trim().toLowerCase()) == 0) {
                    return true;
                }
            },
            
            // `ttAdapter` wraps the suggestion engine in an adapter that is compatible with the typeahead jQuery plugin
            source: locationLookup.ttAdapter(),
        }
    ).bind("typeahead:selected",function (obj, datum, name) {
        if (active != 'List'){
            x = parseFloat(datum.x);
            y = parseFloat(datum.y);
            var geoLocation = L.point(x,y);
            mapCenterAndZoom(geoLocation,false);
        }
        if (active == 'New' || active == ''){
            disableRelated();
            if (!$('#relatedRequester').hasClass('active')){
                
                if (!localRequests){
                    var requestBounds = "{xmin: " + (geoLocation.x - .002) +", ymin: " + (geoLocation.y - .001) + ", xmax: " + (geoLocation.x + .001) + ", ymax: " + (geoLocation.y + .002) + "}";
                    var callback = function() {getNearbyRequests({purpose:'nearby',location:geoLocation,distance:800});}
                    getRequestsFeatureData(null,mobilefilter,null,requestBounds,"nearby",callback);
                } else {
                    getNearbyRequests({purpose:'nearby',location:geoLocation,distance:800});    
                }
            } else {
                getRelatedRequests($("#ContactID").val());
            }
        }
    });
}

function getNearbyRequests(options){
    console.log("getNearbyRequets");
    if (options.purpose == 'nearby' || options.purpose == 'detail'){
        var nearbyRequests = [];
        if (options.purpose == 'detail'){
            var optLatLng = options.location;
        } else {
            var optLatLng = L.latLng([options.location.y,options.location.x]);
        }
        var tempNearbyRequests = filteredRequests;
        if (localRequests && (active == 'New' || active.length == 0 || active == 'Map')){
            tempNearbyRequests = requests;
        }
        $.each(tempNearbyRequests,function(index){   
            var distance = optLatLng.distanceTo(L.latLng(this.geometry.coordinates[1],this.geometry.coordinates[0]));
            if (distance < options.distance * 0.3048 && (options.purpose == 'nearby' && moment(this.properties.RequestedDate) > moment().subtract(3,'months') || options.purpose == 'detail')){
                this['distance'] = distance;
                nearbyRequests.push(this);
            }
        });
        nearbyRequests.sort(function(a,b){
            if (a.distance === b.distance) {
                return 0;
            }
            else {
                return (a.distance < b.distance) ? -1 : 1;
            }
        });
        options.queryType = 'location';
        populateRelated(nearbyRequests,options);
        requestNearbyPermits(optLatLng);
    }
}

function populateDetailed(){
    populateRelated([detailedRequest],{purpose:'detail'});
}

// Populate related shows the results for clicks on the Map and List
function populateRelated(relatedRequests,options){
    var t = options.purpose;
    var existReqText = "";
    $('#loadingModal').modal('hide');
    if (relatedRequests.length > 0){
        var count = 0;
        if ((t != 'detail' && t != 'layer') || (t == 'detail' && relatedRequests.length > 1)){
            console.log("Multiple Requests w/ purpose: "+t);
            existReqText += "<h4>Requests (" + relatedRequests.length + ")</h4>";
            $(relatedRequests).each(function(){
                existReqText += "<div class=\"related\">";
                if (t == 'detail'){
                    existReqText += '<div class="radio"><label><input type="radio" name="optionsRadios" id="optionsRadios'+count +'"';
                    if (count == 0){
                        existReqText += ' checked';
                    }
                    existReqText += '>';
                }
                existReqText += "<a href=\"javascript:toggleDetail(rDetail" + count + ")\">" + this.properties.RequestTypeText + " @ " + this.properties.Address;
                existReqText += " (" + this.properties.StatusText + " - " + moment(this.properties.StatusDate).format("MM/DD/YYYY") + ")</a></div>";
                existReqText += "<div id=\"rDetail"+count+"\" class=\"rDetail\">";
                // Add action buttons to (show more -- future), update the request, add contacts
                if (email){
                    existReqText += "<p><a class=\"btn-sm btn-info\" href=\"javascript:performRelatedRequestActions('"+this.properties.RequestID+"','detail')\">Show Detail</a>&nbsp<a class=\"btn-sm btn-default\" href=\"javascript:performRelatedRequestActions('"+this.properties.RequestID+"','manage')\">Manage Request</a>&nbsp<a class=\"btn-sm btn-default\" href=\"javascript:performRelatedRequestActions('"+this.properties.RequestID+"','contact')\">Add Contact</a></p>";
                } else {
                    existReqText += "<p><a class=\"btn-sm btn-info\" href=\"javascript:getExistingRequests('"+this.properties.RequestID+"','detail')\">Show Detail</a></p>";   
                }
                if (this.distance){
                    existReqText += "<p><i>Distance: " + Math.round(this.distance*3.28084,2) + " feet</i></p>";
                }
                existReqText += "<dl class=\"dl-horizontal summary\"><dt>Description</dt><dd>"+this.properties.Description+"</dd>";
                if (this.actions.length > 0){
                    existReqText += "<dt>Last Action</dt><dd>"+this.actions[0].ActionType + "<br>"+this.actions[0].ActionDesc+"</dd></dl>";}
                existReqText += "<div class=\"subDetail\"><p class=\"detailSection\">Respondent</p><div id=\"respond"+count+"\"><dl class=\"dl-horizontal\"><dt>Department</dt><dd>"+this.properties.DeptID+"</dd><dt>Employee</dt><dd>"+ requestData.data.employees[this.properties.EmployeeID].name +"</dd><dt>Title</dt><dd>"+requestData.data.employees[this.properties.EmployeeID].title+"<dt>Phone</dt><dd>"+requestData.data.employees[this.properties.EmployeeID].phone+"</dd></dl>";
                existReqText += "<p class=\"detailSection\">Contact(s)</p>";
                $(this.contacts).each(function(){
                    existReqText += "<dl class=\"dl-horizontal\"><dt>Name</dt><dd>"+this.attributes.Name+"</dd><dt>Address</dt><dd>"+this.attributes.Address+"</dd><dt>Phone</dt><dd>"+this.attributes.Phone+"</dd><dt>Email</dt><dd>"+this.attributes.Email+"</dd></dl>";
                });
                existReqText += '</div></div></div>';
                if (t == 'detail'){
                    existReqText += '</label></div>';
                }
                count++;
            });
            if (t == 'detail'){
                
                detailedRequest = relatedRequests[0];
                multipleDetailed = relatedRequests.slice();
                console.log(multipleDetailed);
            }

        } else {
            detailedRequest = relatedRequests[0];
            existReqText += detailParse(t, 0);
        }
    } else {
        existReqText += "<div class=\"related\"><p><i>None found.</i></p></div>";
    }
    existReqText += "<div id=\"nearby-permits\" class=\"related\"></div>";

    if (t != 'detail'){
        insertHTML("newResultsList",existReqText);
        manageRelated(options.queryType);
        $("#results").removeClass("hide");
        enableRelated();
    } else {
        var mFooter = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
        if (relatedRequests.length > 0){
            var detail = 'More';
            if (typeof loadManageTab != 'undefined' && email){
                detail = 'Manage';
            }
            if (relatedRequests.length > 1){
                var mHeader = 'Multiple results';
            } else {
                var mHeader = relatedRequests[0].properties.RequestTypeText + ' ID: ' + relatedRequests[0].properties.RequestID;
            }

            if (relatedRequests.length > 0){
                mFooter += '<a id="manage-button" class="btn btn-primary" href="javascript:detailRequestShow()">'+detail+'</a>';
            }
        } else {
            var mHeader = 'No Records Found';   
        }
        modalShow(mHeader,existReqText,mFooter);
    }
}

function requestNearbyPermits(location){
    var requestBounds = "{xmin: " + (location.lng - .002) +", ymin: " + (location.lat - .001) + ", xmax: " + (location.lng + .001) + ", ymax: " + (location.lat + .002) + "}";
    var data = {bounds:requestBounds,r:'permits',fields:'*',geo:true};
    $.ajax({
        type:'POST',
        url:requestHandlerURL,
        data:data,
        dataType:'json',
        success:function(data){
            populateNearbyPermits(data.permits);
        },
        error:function(error){
            console.log("error");
            console.log(error.responseText);
            submitHandler(false);
        }

    });
}

function populateNearbyPermits(permits){
   
    var existPermitText = "<h4>Active Permits</h4>";
    $(permits).each(function(){
        existPermitText += "<div class=\"related\"><a href=\"javascript:toggleDetail(rPermit" + count + ")\">";
        existPermitText += this.PermitType + " @ " + this.Address + "</a></div>";
        existPermitText += "<div id=\"rPermit"+count+"\" class=\"rDetail\"><dl class=\"dl-horizontal summary\">";
        $.each(this,function(key,value){
            existPermitText += "<dt>"+key+"</dt>";
            existPermitText += "<dd>"+value+"</dd>";
        });
        existPermitText += "</dl></div>";
        count++;
    });
    if (permits.length == 0){
        existPermitText += "<p><i>None found.</i></p>";
    }
    insertHTML("nearby-permits",existPermitText);
}

// Show Detail Button on Related Request 
function performRelatedRequestActions(requestID,action){
    if (requests){
        $.each(requests,function(key,value){
            if (value.properties.RequestID == requestID){
                detailedRequest = this;
                return false;
            }
        });
        
        if (action){
            if (action == 'detail'){
                populateRelated([detailedRequest],{purpose:action});
            } else if (action == 'manage'){
                detailRequestShow();
            } else if (action == 'contact'){
                actionModalShow(action);
            }
        }
    }
}



function performAction(){
    return {    
        detail : function(){
            populateRelated([detailedRequest],{purpose:action});
        },
        manage : function(){
            detailRequestShow();
        },
        contact : function(){
            actionModalShow(action);
        }
    }
}

function getMapLayers(layers){
    var count = 0;
    $(relatedRequests).each(function(){
        existReqText += "<div class=\"related\"><a href=\"javascript:toggleDetail(attributes" + count + ")\">";
        existReqText += this.properties[result.displayFieldName]+ "</a></div>";
        existReqText += "<div id=\"attributes"+count+"\" class=\"rDetail\"><dl class=\"dl-horizontal summary\">";
        $.each(this.attributes,function(key,value){
            existReqText += "<dt>"+key+"</dt>";
            existReqText += "<dd>"+value+"</dd>";   
        });
        existReqText += "</dl></div>";
        count++;
    });
    
    var mFooter = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
    var mHeader = $('input[name=radioLayerIdentify]:checked', '#formLayerIdentify').val().split('-')[0];
    if (result.features.length == 0){
        existReqText = 'No Records Found';
    }
    if (nearbyArea){bigMap.removeLayer(nearbyArea)};
    nearbyArea = new L.CircleMarker(g, {color: '#928E0F',radius: 25, fillOpacity: 0.10,clickable:false,}).addTo(bigMap);
    modalShow(mHeader,existReqText,mFooter);
}

function lookupPhone(){
    var contactphone = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('Phone'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        //prefetch: 'http://gis.vodg.us/requests/support_files/request_contacts.json'
        local:requestData.contacts
    });

    // kicks off the loading/processing of `local` and `prefetch`
    contactphone.initialize();

    // passing in `null` for the `options` arguments will result in the default
    // options being used
    $('.contactLookup').typeahead('destroy');
    
    $('.contactLookup').removeClass('contactLookup');
    
    $('.phoneLookup').typeahead({highlight:true}, {
        name: 'phoneResults',
        displayKey: 'Phone',
      // `ttAdapter` wraps the suggestion engine in an adapter that
      // is compatible with the typeahead jQuery plugin
        source: contactphone.ttAdapter()
    }).bind("typeahead:selected",function (obj, datum, name) {
        lookupContactShow(datum);
    }); 
    
    $('.phoneLookup').addClass('contactLookup');
}

function lookupContactAddress(){
    var contactaddress = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('Address'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        //prefetch: 'http://gis.vodg.us/requests/support_files/request_contacts.json'
        local:requestData.contacts
    });

    // kicks off the loading/processing of `local` and `prefetch`
    contactaddress.initialize();

    // passing in `null` for the `options` arguments will result in the default
    // options being used
    $('.contactLookup').typeahead('destroy');
    
    $('.contactLookup').removeClass('contactLookup');
    
    $('.addressLookup').typeahead({highlight:true}, {
        name: 'addressResults',
        displayKey: 'Address',
      // `ttAdapter` wraps the suggestion engine in an adapter that
      // is compatible with the typeahead jQuery plugin
        source: contactaddress.ttAdapter()
    }).bind("typeahead:selected",function (obj, datum, name) {
        lookupContactShow(datum);
    }); 
    
    $('.addressLookup').addClass('contactLookup');
}

function managePanes(e){
    var currentTab = $(".nav.navbar-nav > .active").attr('id');
    $("#"+currentTab).removeClass("active");
    $(".tab-content > .active").removeClass("active");
    $(e.target.parentNode).addClass("active");
    active = e.target.innerHTML;
    
    if (active == "New"){
        newFormReset();    
    } else if (active == "List"){
        loadListTab();
    } else if (active == "Map"){
        loadMapTab();
    } else if (active == "Detail"){
        active = "Manage";
        loadDetailTab();
    } else if (active == "Dashboard"){
        loadDashboardTab();
    }
    $("#"+active.toLowerCase()+"-pane").addClass("active");
}



// purpose - map to add data to, daysOpen - if filter is used, parse data, heat - if heat map is toggled on
function mapAddData(parameters){
    if (requests === null){
        return;
    }
    var purpose = parameters.purpose;
    var m = bigMap;
    if (purpose == "newmap"){
        m = newMap;
    }
    // Trying to update a when it hasn't been created
    if (m === undefined){
        console.log("Map Not Created");
        return;
    }
    m.invalidateSize();
    var options = {
        style: function(feature) {
            return {color: requestData.data.types[feature.properties.RequestTypeText].MapColor};
        },
        pointToLayer: function(feature, latlng) {
            if (feature.properties.StatusCode == 10 || feature.properties.StatusCode == 11) {
                return new L.CircleMarker(latlng, {radius: 1, fillOpacity: 0.7,clickable:false,});
            } else {
                return new L.CircleMarker(latlng, {radius: 5, fillOpacity: 0.85,clickable:false});
            }

        }
        /*,
        onEachFeature: function (feature, layer) {
            layer.bindPopup('<a href=\"javascript:getExistingRequests(\'' +feature.properties.RequestID+'\',\'detail\')\">'+feature.properties.RequestTypeText+' - '+feature.properties.RequestID+'</a>');
        }*/
    };
    // Filter out old requests
    if (purpose == 'newmap'){
        options['filter'] = function(featureData,layer){
            return moment(featureData.properties.RequestedDate) > moment().subtract(1,'months');
        };
    } else if (purpose == 'nearby'){
        options['filter'] = function(featureData,layer){
                console.log(parameters.location.distanceTo(L.point(featureData.geometry.coordinates[1],featureData.geometry.coordinates[0])));
            return parameters.location.distanceTo(L.point(featureData.geometry.coordinates[1],featureData.geometry.coordinates[0])) < 150;
        };
    }
    if ('query' in filters['Quadrant'] && !/All/.test(filters['Quadrant'].query)){
        requestsCount = 0;
        options['filter'] = function(feature,layer){
            if (pointInPolygon(feature.geometry.coordinates,requestData.data.locationfilter[$((active == 'Map' ? '.map-filter #filter-Quadrant' : '.table-container #filter-Quadrant')).val()].geometry.rings[0])){
                requestsCount++;
                return true;
            }
            return false;  
        };
    }
    if (m.hasLayer(requestsLayer)){
        m.removeLayer(requestsLayer);
    }
    
    var mapRequests = {type:'FeatureCollection','features':requests};
    
    if (purpose == 'bigmap' && filteredRequests){
      if (!localRequests){
        filteredRequests = requests;
        if (listHasNotBeenCreated() && mapHasNotBeenCreated()){
          filters['SubmittedDate'].queryText = "Status is not \"Completed\" or has changed in the last 30 days";
        }
        queryInsertDescription(filteredRequests.length);
      }
      mapRequests = {type:'FeatureCollection','features':filteredRequests};
    }
    
    if (mapRequests.features === undefined){
      console.log("No Features");
      return;
    }
    requestsCount = mapRequests.features.length;
    console.log("Map request count: " + requestsCount);
    
    requestsLayer = L.geoJson(mapRequests, options).addTo(m);
    
    setTimeout(function(){m.invalidateSize();},500); 
    
    console.log(purpose);
    if (purpose == "bigmap" && heatmapLayer){
        console.log(purpose);
        heatMapTurnOff();
        heatMapTurnOn();
    }
                              
    if (active == 'Map'){
        m.on('click', function(e) {
            var queryType = 'detail';
            // Get information from other feature class
            if ($('input[name=radioLayerIdentify]:checked', '#formLayerIdentify').val() != 'Requests'){
                queryType = 'layer';
                getExistingRequests(e.latlng,queryType);
            } else {
                console.log("Pre Get Nearby");
                console.log(e.latlng);
                console.log(typeof e.latlng);
                if (!localRequests){
                    var mapcallback = function(){
                        getNearbyRequests({purpose:queryType,location:e.latlng,distance:300});
                    };
                    var requestBounds = "{xmin: " + (e.latlng.lng - .002) +", ymin: " + (e.latlng.lat - .001) + ", xmax: " + (e.latlng.lng + .001) + ", ymax: " + (e.latlng.lat + .002) + "}";
                    getRequestsFeatureData(null,listCreateQueryForServer(),null,requestBounds,'nearby',mapcallback);
                    return;
                }
                getNearbyRequests({purpose:queryType,location:e.latlng,distance:300});
            }
        });
    }
    
    // Parse employee filter to only those that are associated with request type
    if (active == 'Map'){
        var e = '#Map-RequestTypeText option:selected';
        var rt = $(e).val();
        if (typeof rt == 'undefined' || rt == 'all'){
            rt = 'General';
        }
        employeeParse(rt,false);
        queryInsertDescription(requestsCount);
    }
    console.log("Map Add Done");
    loadingHide();
}

// g-Geometry, r-reset
function mapCenterAndZoom(g,r){
    var m = bigMap;
    if (active == 'New' || active.length == 0){
        m = newMap;
        
    } else if ((active == 'Manage' || active == 'Detail') && !$('#basicModal').hasClass('in')){
        m = manageMap;
    } else if (active == 'Manage' && $('#basicModal').hasClass('in') && !$('loadingModal').hasClass('in')){
        console.log('manage location');
        m = manageLocationMap;
    }
    if (typeof m != 'undefined' && marker){m.removeLayer(marker);}
    if (nearbyArea){m.removeLayer(nearbyArea);}
    if (!r){
        var center = [g.y, g.x];
        if ($('#basicModal').hasClass('in') && !$('#loadingModal').hasClass('in')){
            console.log('Modal');
            m.removeLayer(tempMarker);
            tempMarker = L.marker(center,{color: '#ABA609'}).addTo(m);
            tempMarker.dragging.enable();
            tempMarker.on('dragend',function(e){
                reverseGeocode(tempMarker,e);
            });
        } else {
            marker = L.marker(center,{color: '#ABA609'}).addTo(m);
        }
        m.setView(center,15,{animate:true});
        if (active == 'New' || active.length == 0){
            if (nearbyArea){m.removeLayer(nearbyArea)};
            nearbyArea = new L.CircleMarker(center, {color: '#928E0F',radius: 50, fillOpacity: 0.10,clickable:false,}).addTo(m);
        }
    } else {
        var center = L.latLng(41.791,-88.010);
        m.setView(center,13);
    }
    setTimeout(function(){m.invalidateSize();},500); 
}

// Map Clear Marker - Clears the wayfinder marker that is placed when an address is searched for.
function mapClearMarker(map){
    if (typeof map != 'undefined' && marker){map.removeLayer(marker);}
}

// Map Filter Days Open - after querying for other parameters, this function loops through the data to find requests that match how many
// days open are being queried.
//
// d-days open
function mapFilterDaysOpen(d){
    var preSortArray = [];
    var postSortArray = [];
    console.log(requests);
    $(requests.features).each(function(){
        if (this.properties.DaysOpen > d){
            preSortArray.push([this.properties.DaysOpen,this]);
        }
    });
    
    $(preSortArray).each(function(){
        postSortArray.push(this[1]);
    });
    return postSortArray;
}

function mapHasNotBeenCreated(){
  return ($(".map-filter > table").length == 0);
}

// Big Map Only
function mapLayerAccordian(type){
    var h = '<a data-toggle="collapse" href="#layer'+type+'" aria-expanded="true" aria-controls="layer'+type+'">'+(type == 'Toggle' ? 'Turn On/Off Layers' : 'Set Map Identify Layer')+'</a><br>';
    h += '<div id="layer'+type+'" class="panel-collapse collapse" role="tabpanel" style="height: auto;">';
    h += '<div class="panel-body">';
    h += mapLayerToggle(type);
    h += '</div></div>';
    return h;
}

// Handle split the layer name with a hyphen ('-') in the toggle and identify inputs
function mapLayerNameSplit(n){
    n = n.split('-');
    // Handle names with additional hyphens
    if (n.length > 2){
        var temp =n[0];
        for (var i = 1; i<(n.length-1); i++){
            temp += '-'+n[i];
        }
        var index = n[n.length-1];
        n = [];
        n.push(temp);
        n.push(index);
    }
    return n;
}

// For Big Map Only
function mapLayerToggle(type){
    var updateButton = '<button type="submit" class="btn btn-info">Update Layers</button>';
    var h = '<form id="formLayer'+type+'" '+(type == 'Toggle' ? 'action="javascript:mapLayerUpdate()"' : '')+ '>';
    if (type == 'Toggle'){
        h += updateButton;
    }
    if (type == 'Identify'){
        h += '<div class="radio"><label><input type="radio" name="radioLayerIdentify" value="Requests" checked>Requests</label></div>';
    }
    $.each(requestData.data.layers,function(key,value){
        var checked = 'checked';
        if (!value.visible){
            checked = '';
            requestData.data.layers[value.Name].visible = false;
        } else {
            requestData.data.layers[value.Name].visible = true;
        }
        if (type == 'Toggle'){
            h += '<div class="checkbox"><label><input type="checkbox" name="'+value.Name+'-'+value.LayerNo+'" ' + checked + '>'+value.Name+'</label></div>';
        } else {
            if (requestData.data.layers[value.Name].visible){
                h += '<div class="radio"><label><input type="radio" name="radioLayerIdentify" value="'+value.Name+'-'+value.LayerNo+'">'+value.Name+'</label></div>';
            }
        }
        
    });
    if (type == 'Toggle'){
        h += updateButton;
    }
    h += '</form>';
    return h;
}

function mapLayerReset(){
    $('#formLayerToggle *').each(function(){
        if (typeof this.name != 'undefined' && this.name.length > 0){
            $('input[type=checkbox][name="'+this.name+'"]').prop('checked',false);
        }
    });
    mapLayerUpdate();
}

function mapLayerUpdate(){
    //modalShow("Layer Toggle",h,footer);
    console.log("Layer Update");
    if (nearbyArea){bigMap.removeLayer(nearbyArea)};
    $('#formLayerToggle *').each(function(){
        if (this.name){
            var n = mapLayerNameSplit(this.name);
            if (requestData.data.layers[n[0]] && requestData.data.layers[n[0]].visible != this.checked){
                var p = requestData.data.layers[n[0]].Path;
                if (this.checked){
                    if (typeof bigMapLayers[p] != 'undefined'){
                        console.log("Layer Exists");
                        if (bigMapLayers[p].layerNos.indexOf(n[1]) == -1){
                            bigMapLayers[p].layerNos.push(n[1]);
                            var l = bigMapLayers[p].leaflet;
                            l.setLayers(bigMapLayers[p].layerNos);
                        }
                    } else {
                        console.log("New Layer");
                        var leafLayer = L.esri.dynamicMapLayer('http://parcels.downers.us/arcgis/rest/services/'+requestData.data.layers[n[0]].Path);
                        leafLayer.setLayers([n[1]]);
                        leafLayer.addTo(bigMap);
                        bigMapLayers[p] = {leaflet:leafLayer,layerNos:[n[1]]};

                    }
                    requestData.data.layers[n[0]].visible = true;

                } else {
                    console.log("Remove Layer");
                    // If layers has path
                    if (typeof bigMapLayers[p] != 'undefined'){
                        var xl = bigMapLayers[p].layerNos.indexOf(n[1]);
                        if (xl != -1){
                            bigMapLayers[p].layerNos.splice(xl,1);
                            var l = bigMapLayers[p].leaflet;
                            if (bigMapLayers[p].layerNos.length > 0){
                                l.setLayers(bigMapLayers[p].layerNos);
                            } else {
                                bigMap.removeLayer(l);
                                delete bigMapLayers[p];
                            }
                        }
                        console.log(requestData.data.layers[n[0]]);
                        requestData.data.layers[n[0]].visible = false;
                    }
                }
            }
        }
    });
    var identifyLayer = $('input[name=radioLayerIdentify]:checked', '#formLayerIdentify').val();
    if ($("input[type='checkbox'][name='"+identifyLayer+"']",'#formLayerToggle').prop('checked') == false){
        identifyLayer = 'Requests';
    }
    insertHTML('formLayerIdentify',mapLayerToggle('Identify'));
    $('input[name=radioLayerIdentify][value="'+identifyLayer+'"]').prop('checked',true);
}

function mapLoaded(){
    console.log("mapLoaded");
    console.log(active);
    // If New Tab is opened get data from server
    if (active == "New" || active.length == 0){
        console.log("Map Loaded - New Tab");
        if (typeof urlParam[0] != 'undefined'){
          // Check to see if a url param is provided
          // Two parameters exist: RequestID (id=###########-######) will get request information about a specific request
          // EmployeeID (eID=####) will load list view with requests for that employee
          if (urlParam[0] == "id"){
            // If request id is included in the url
            $('#loadingModal').modal('show');
            getRequestsFeatureData(null,'RequestID = \''+urlParam[1]+'\'',null,null,'email',function(result){
                console.log(result);
                populateRelated(result.features,{purpose:'detail'});
            });
            //getExistingRequests(urlParam[1],'detail');
          } else if (urlParam[0] == "eID"){
            // If employee id is included in the url
            $('#list-tab > a').click();
            return;
          } else if (urlParam[0] == "email"){
            //
            console.log("email");
            email = urlParam[1];
            console.log(email);
            validateEmail(urlParam[1]);
          }
        }
        newMap.invalidateSize();
        var callback = function (){
          mapAddData({purpose:"newmap"});
        };
        var tempmobilefilter;
        if (!localRequests){
            tempmobilefilter = mobilefilter;
        }
        console.log(tempmobilefilter);
        getRequestsFeatureData(null,tempmobilefilter,null,null,"newmap",callback);
    } else if (active == "Map"){
        if (!localRequests && requests){
            // Load previous loaded requests
            mapAddData({purpose:"bigmap"});
            return;
        }
        var callback = function (){
            mapAddData({purpose:"bigmap"});
        };
        getRequestsFeatureData(null, null,null,null,"bigmap",callback);
    } else if (active == "Manage" && !$('#basicModal').hasClass('in')){
        //setTimeout(function(){manageMap.invalidateSize();},1000);
        populateActions('request-manage-tools');
        mapCenterAndZoom(L.point(detailedRequest.geometry.coordinates),false);
        if (typeof loadManageTab != 'undefined' && email){
            loadManageTab();
        }
    }
        
    //setTimeout(getRequests(),2000);  
}

function modalShow(header, body, footer){
    insertHTML('modalTitle',header);
    insertHTML('modalBody',body);
    insertHTML('modalFooter',footer);
    $('#basicModal').modal('show');
    $('.modal-dialog').addClass('modal-lg');
}

function newFormReset(){
    $('#newSubmit').prop('disabled',false);
    var g = "General";
    $("#enterForm")[0].reset();
    $("#receivedDate").val(getCurrentDate());
    $("#requestTypes").val(g);
    requestTypeSet("General");
    mapCenterAndZoom(null,true);
    $("#results").addClass("hide");
    urlReset();
}

function populateActions(s){
    $('.filter-button').off('click');
    var filter = '<button id="filterButton" class="col-md-9 btn btn-primary filter-button">Filter</button><button id="refreshButton" class="col-md-3 btn btn-default filter-button"><span class="glyphicon glyphicon-refresh"></span></button>';
    filter += '<legend><small>Tools</small></legend>';
    
    var tools = '<legend><small>Tools</small></legend>';
    
    var h = tools;
    if (s == 'request-list-actions'){
        h = filter;
        h += '<a href="javascript:filterToggle()">Turn On/Off Filters</a><br>';
        h += '<a href="javascript:exportCSV()">Open List in Excel</a><br>';
        h += '<a href="javascript:resetFilterSort(true)">Reset List</a><br>';
    } else if (s == 'request-manage-tools'){
        h += '<a href="javascript:exportPDF()">Create PDF</a><br>';
    } else if (s == 'Dashboard-Tools'){
        h += '<a href="javascript:dashboardFilter()">Filter Dashboard</a><br>';
    }else {
        // Big Map Actions
        h = filter;
        /*h += '<a data-toggle="collapse" href="#mapLayers" aria-expanded="true" aria-controls="mapLayers">Turn On/Off Layers</a><br>';
        h += '<div id="mapLayers" class="panel-collapse collapse" role="tabpanel" style="height: auto;">';
        h += '<div class="panel-body">';
        h += mapLayerToggle('toggle');
        h += '</div></div>';*/
        h += mapLayerAccordian('Toggle');
        h += mapLayerAccordian('Identify');
        h += '<a href="javascript:filterToggle()">Turn On/Off Filters</a><br>';
        h += '<a id="bigMapHeat" href="javascript:heatMapToggle()">Turn On Heat Map</a><br>';
        h += '<a href="javascript:exportCSV()">Open List In Excel</a><br>';
        h += '<a href="javascript:resetFilterSort(false)">Reset Map</a><br>';
    }
    insertHTML(s,h);
    if (active == 'map'){
        mapLayerUpdate();
    }
    
    if (!requestsUpdated){
        $('#request-map-actions > #refreshButton').prop('disabled','disabled');
        $('#request-list-actions > #refreshButton').prop('disabled','disabled');
    } else {
        $('#request-map-actions > #refreshButton').prop('disabled',false);
        $('#request-list-actions > #refreshButton').prop('disabled',false);
    }
    
    $('.filter-button').click(function(e){listFilterSort(e);});
}

function populateRequestTypes(all,suggestions,emergencyShowAll){
    if (!suggestions){
        suggestions = [];
    }
    var h = '';
    var d = {}
    if (suggestions.length > 0){
        d['Suggestions'] = suggestions;
    }
    if (requestData.data.emerMode){
      d['General'] = [];
    }
    $.each(requestData.data.types,function(key,value){
        if ((!requestData.data.emerMode || emergencyShowAll || (active != 'New' && active.length != 0)) && value.category != null && (value.status == 1 || value.status == 2)){
            if (typeof d[value.category] == 'undefined'){
                d[value.category] = [key];
            } else {
                var a = d[value.category];
                a.push(key);
                d[value.category] = a;
            }
        } else if (requestData.data.emerMode && requestData.data.emerRequests.indexOf(value.RequestID+'') != -1){
          var a = d['General'];
          a.push(key);
          d['General'] = a;
        }
    });
    if (requestData.data.emerMode && !emergencyShowAll){
      var a = d['General'];
      a.push('Show All');
      d['General'] = a;
    }
    d = sortDictionary(d);
    var menuCount = 0;
    $.each(d,function(key,value){
        if (active == 'New' || active.length == '' && isChromeDesktop && !requestData.data.emerMode){
            var drop = 'dropdown-menu';
            if (menuCount > 9 || (value.length > 9 && value.length < 15)) {
                drop = 'dropdown-menu dropup-menu';
            } else if (value.length > 15) {
                drop = 'dropdown-menu dropmiddle-menu';
            }
            h += '<li class="dropdown-submenu" id="RTL-'+key+'Title">'
            h += '<a class="disabled" tabindex="-1">'+key+' ('+ value.length + ')</a>';
            h += '<ul class="' + drop + '" id="RTL-'+key+'">';
            h += populateRequestListFromArray(value);
            h += '</ul></li>';
            menuCount++;
        } else {
            var options = populateDropdownFromArray(value);
            h += '<optgroup label="' + key + '">';
            if (all) {
                h += "<option value=\"" + key + " - All\">" + key + " - All</option>";
            }
            h += options;

            h += '</optgroup>';
        }
    });
    return h;
}

function pointInPolygon(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    
    //var x = point[0], y = point[1];
    var x = point[1], y = point[0];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        //var xi = vs[i][0], yi = vs[i][1];
        //var xj = vs[j][0], yj = vs[j][1];
        var xi = vs[i][1], yi = vs[i][0];
        var xj = vs[j][1], yj = vs[j][0];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};

function locationFilterName(filterType,name,point){
    var locationName = false;
    var bounds = requestData.data.locationfilter;
    if (name){
        var poly = bounds[name].geometry.rings[0];
        if (pointInPolygon(point,poly)){
            locationName = name;
        }
    } else {
        var count = 0;
        $.each(bounds,function(key,value){
            
            
            
            var poly = this.geometry.rings[0];
            if (pointInPolygon(point,poly)){
                locationName = key;
                return false;
            }
        });
    }
    return locationName;
}

// Used to create both the filters for the list and map
// d - data coming in (null if map. map data is saved globally, e - HTML Element (element that result will added to, newTable(boolean) does the table exist or map exist
function populateTable(d,e,newTable,options){
    console.log("pop Table");
    if (options === undefined){
        options = {purpose:active};
    }
    var tableHTML = '';
    if (!newTable){
        if (active == 'List'){
            newTable = listHasNotBeenCreated();
        } else if (active == 'Map'){
            newTable = mapHasNotBeenCreated();
        }
    }  
    if (newTable || !d){
        //tableHTML += '<div class="action-bar"><button type="button" id="list-csv" class="btn btn-default">Export</button><br></div>';
        if (d){
            tableHTML += '<div class="table-container"><table class="table table-hover table-header"><thead><tr>';
        } else {
            tableHTML += '<div class="map-filter"><table class="table table-header"><thead><tr>';
        }
        $.each(filters,function(key,value){
            if (value.visible){
                var c = "small-column";
                if ((key == 'Description' && (active == 'List' || options.purpose == 'List')) || (key == 'Address' && (active == 'Map' || options.purpose == 'Map'))){
                    c = "large-column";
                } else if (key == 'Address' || key == 'RequestID' || key == 'DeptText' || key == 'EmployeeID'){
                    if (d){
                        c = "medium-column"; 
                    }
                }
                if (d){
                    tableHTML += '<th class="' + c + '">'+value.shortName+' <span id="sort-' + key + '" class="glyphicon glyphicon-sort pull-right"></span></th>';
                } else {
                    tableHTML += '<th class="' + c + '">'+value.shortName+'</th>';
                }
            }
        });
        //tableHTML += '<th class="col-md-2"></th></tr><tr>';
        tableHTML += '</tr><tr>';
        //console.log(requestData);
        $.each(filters,function(key,value){
            if (value.visible){
                if (key == 'RequestTypeText'){
                    tableHTML += '<th><select id="'+active+'-' + key + '" class="form-control" type="text"><option value="all">All</option>'+ populateRequestTypes(true,null)+ '</select></th>';
                } else if (key == 'StatusText'){
                    tableHTML += populateDropdownHTML(key,requestData.data.statusCodes);
                } else if (key == 'StatusDate' || key == 'DaysOpen' || key == 'SubmittedDate'){
                    tableHTML += '<th><a id="List-' + key + '" href="javascript:dateRangePickerShow(\''+key+'\')" class="btn btn-default daterangepickerbutton-dg"><span> Select </span><i class="glyphicon glyphicon-calendar fa fa-calendar"></i></a></th>';
                } else if (key == 'DeptText'){
                    tableHTML += populateDropdownHTML(key,requestData.data.departments);
                } else if (key == 'EmployeeText'){
                    tableHTML += populateDropdownHTMLFromDict(key,[]);
                } else if (key == 'Address'){
                    tableHTML += '<th><input id="'+active+'-' + key + '" class="form-control locationLookup" type="text" placeholder="Filter ' + value.shortName + '"></th>';
                } else if (key == 'RequestID'){
                    tableHTML += '<th><input id="filter-' + key + '" class="form-control requestIDLookup" type="text" placeholder="Filter ' + value.shortName + '"></th>';
                } else if (key == 'Quadrant'){
                    tableHTML += populateDropdownHTMLForLocationFilter(key,requestData.data.locationfilter);
                } else {
                    tableHTML += '<th><input id="filter-' + key + '" class="form-control" type="text" placeholder="Filter ' + value.shortName + '"></th>';
                }
            }
        });
        //tableHTML += '<th class="col-md-2"><input id="filterSubmit" class="form-control" type="submit"></th>';
        //tableHTML += '</tr></thead></table></div><div id="tableBody">';
        // d -- Data is only passed if we are on the list tab. Otherwise, the data is add to a map
        // and the table header is used to sort and filter the map
        if (d){
            tableHTML += '</tr></thead><tbody id="tableBody">';
        } else {
            tableHTML += '</tr></thead></table><div style="height:25px;width:100%;"></div>';
        }
    }
    //tableHTML += '<table id="tableBody" class="table table-scroll"><tbody>';
    //tableHTML += '</tr></thead><tbody id="tableBody">';
    console.log(filters);
    if (d){
        $.each(d,function(index){
            var attr = this.properties;
            var trClass = "tr-normal";
            if (attr.StatusText == "Completed"){
                trClass = 'tr-closed';   
            } else if (attr.DaysOpen > 30){
                trClass = 'warning';
            }
            tableHTML += '<tr class="'+trClass+'" id="row-'+index+'">';
            $.each(filters,function(key,value){
                if (value.visible){
                    //tableHTML += '<td ' + c + '>'+attr[f[field]]+'</td>';
                    var cellText = attr[key];
                    if (key == "Address"){
                        cellText = attr['AddressNo'] ? attr['AddressNo'] + ' ' + attr['StreetName'] : attr['StreetName'];
                    } else if (key == "Quadrant" && !attr['Quadrant']){
                        var geo = d[index].geometry.coordinates;
                        cellText = locationFilterName(key,null,geo);
                    } else if (key !== 'UpdatedBy' && key.toLowerCase().search('date') > -1){
                        cellText = moment.utc(cellText).format("MM/DD/YYYY hh:mm A");
                    }
                    tableHTML += '<td class="col-md-6"><span data-toggle="tooltip" data-placement="bottom" title="'+ cellText +'" + >'+cellText+'</span></td>';
                }
                
            });
            //tableHTML += '<td class="col-md-2"></td>';
            tableHTML += '</tr>';
        });
    } 
    if (newTable){
        tableHTML += '</tbody></table></div>';
    } else {
        e = "tableBody";
    }
    
    
    
    insertHTML(e,tableHTML);
    loadingHide();
    // Update Employee List in case Request Type has change
    
    //if (!newTable && active == 'List'){
    if (active == 'List' || active == 'Map' || options.purpose == 'List' || options.purpose == 'Map'){
        var e = '#List-RequestTypeText option:selected';
        var rt = $(e).val();
        if (typeof rt == 'undefined' || rt == 'all'){
            rt = 'General';
        }
        employeeParse(rt,false);
    }
    
    /*if (d){
        insertHTML("rList","Request List (" +d.length+")");
    }*/
    
    if (d){
        /*$(".table-container .table-header th select").on("change", listFilterSort);
        $(".table-container .table-header th input").on("blur",listFilterSort);
        //$('#List-RequestID').on("blur",listFilterSort);*/
        $('.locationLookup').off('blur');
        //$('#List-Address').on("change",listFilterSort);
        //$('#List-Address').focusout(listFilterSort);
        $(".glyphicon-sort-by-alphabet, .glyphicon-sort-by-alphabet-alt, .glyphicon-sort").off().on('click',listFilterSort);
        
        // Table row click handler
        setTableRowClick();
    } else {
        /*$(".map-filter .table-header th select").on("change", listFilterSort);
        $(".map-filter .table-header th input").on("blur",listFilterSort);*/
        $('#Map-Address').off('blur');
        
    }
    
    if (newTable || !d){
        lookupLocations();
    }
    
    
    
    if (d){
        var source = "request-list-actions";
    } else {
        var source = "request-map-actions";
    }
    populateActions(source);
    
}

function dateRangePickerShow(i){
    console.log(i);
    dateRangeElement = i;
    var modalPicker = '<div style="height: 400px;"><button class="btn btn-default daterangepicker-dg">Date Range Picker</button></div>';
    var modalFooter = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
    console.log(dateRangeElement);
    modalShow(filters[dateRangeElement].shortName+' Date Range Picker',modalPicker,modalFooter);
    $('.daterangepicker-dg').daterangepicker({
            format: 'M/D/YYYY',
            startDate: moment().subtract(1, 'month'),
            endDate: moment(),
            minDate: '01/01/2012',
            maxDate: moment(),
            dateLimit: { days: 60 },
            showDropdowns: true,
            showWeekNumbers: true,
            timePicker: false,
            ranges: {
               'Today': [moment(), moment()],
               'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
               'Last 7 Days': [moment().subtract(6, 'days'), moment()],
               'Last 30 Days': [moment().subtract(29, 'days'), moment()],
               'This Month': [moment().startOf('month'), moment().endOf('month')],
               'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            opens: 'right',
            drops: 'down',
            buttonClasses: ['btn', 'btn-sm'],
            applyClass: 'btn-primary',
            cancelClass: 'btn-default',
            separator: ' - ',
            locale: {
                applyLabel: 'Submit',
                cancelLabel: 'Cancel',
                fromLabel: 'From',
                toLabel: 'To',
                customRangeLabel: 'Custom',
                daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr','Sa'],
                monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                firstDay: 1
            }
        }, function(start, end, label) {
            console.log(start.toISOString(), end.toISOString(), label);
            var query;
            if (label == 'Today'){
                query = dateRangeElement + " > " + start.unix();
            } else if (label == 'Yesterday'){
                query = dateRangeElement + " > " + start.unix();
                query += " AND " + dateRangeElement + " < '" + moment().unix() + "'";
            } else {
                query = dateRangeElement + " > " + start.subtract(1,'days').unix() + " AND " + dateRangeElement + " < " + end.add(1,'days').unix();
            }
            if (label != 'Custom'){
                filters[dateRangeElement].queryText = filters[dateRangeElement].shortName + ' is ' + label;
            } else {
                filters[dateRangeElement].queryText = filters[dateRangeElement].shortName + ' is between ' + start.format('M/D/YYYY') + ' and ' + end.format('M/D/YYYY');
            }
            filters[dateRangeElement].query = query;
            $('#basicModal').modal('hide');
            if (active == 'List' && localRequests){
                listFilterSortLocal(null,null,false);
            } else {
                getRequestsFeatureData(null, null,null,null,"bigmap",null);
            }
            
            
        });
    $('.daterangepicker-dg').click();
}

// Chrome Desktop - Request Type List <ul> Dropdown

function requestTypeShowSubMenu(sublist){
    $('.showSubMenu').removeClass('showSubMenu');
    $('#'+sublist).addClass('showSubMenu');
}

function requestTypeSet(requestType){
    $('#requestTypes').val(requestType);
    $('#RequestTypeButton').text(requestType);
    employeeParse(requestType,false);
}

// Chrome Desktop - Request Type List <ul> Dropdown -- end

function resetForm(f){
    var cForm = document.getElementById(f);
    cForm.reset();
}

function resetFilterSort(local){
    $('#loadingModal').modal('show');
    $.each(filters,function(){
        if ('query' in this){
            delete this.query;
        }
        if ('queryText' in this){
            delete this.queryText;
        }
    });
    if (active == "List"){
        $(".table-container .table-header th select").val("all");
        $(".table-container .table-header th input").val("");
        $(".glyphicon-sort-by-alphabet-alt").addClass('glyphicon-sort');
        $(".glyphicon-sort-by-alphabet").addClass('glyphicon-sort');
        $(".glyphicon-sort-by-alphabet-alt").removeClass('glyphicon-sort-by-alphabet-alt');
        $(".glyphicon-sort-by-alphabet").removeClass('glyphicon-sort-by-alphabet');
        var p = "list";
        var g = false;
        if (!requests){
            var tempmobilefilter,listcallback;
            if (!localRequests){
                tempmobilefilter = mobilefilter;
                listcallback = function(){
                    populateTable(requests,'request-list',true);
                };
            }
            getRequestsFeatureData('SubmittedDate DESC, RequestedDate DESC',tempmobilefilter,null,null,p,listcallback);
        } else{
            listFilterSortLocal(null,null,false);
        }
    } else {
        mapLoaded();
        $(".map-filter .table-header th select").val("all");
        $(".map-filter .table-header th input").val("");
        var p = "bigmap";
        var g = true;
        var center = L.latLng(41.791,-88.010);
        bigMap.setView(center,13);
        if (nearbyArea){bigMap.removeLayer(nearbyArea)};
        mapLayerReset();
        filteredRequests = null;
        mapAddData({purpose:'bigmap'});
    }
}

function submitAdditional(r){
    if (email){
        var url = requestHandlerURL;
        var d = formParse($('#moreForm'));
        d['r'] = 'additional';
        d['RelInfoRequestID'] = r;
        
        console.log(d);
        $.ajax({
            type:'POST',
            url:url,
            data:d,
            dataType:'json',
            success:function(data){
                console.log(data);
                submitHandler(data);
            },
            error:function(error){
                console.log("error");
                console.log(error.responseText);
                submitHandler(false);
            }

        });
    } else {
        submitHandler('login');
    }
}

// When requests return outside jurisdiction, the confirmation screen allows the user to override that 
// the request status will be updated and assigned to the default assigned or first in the list for that request
// type
function requestOverrideJurisdiction(requestID,objectId){
    if (email){
        var d = {};
        var url = manageHandlerURL;
        d['f'] = 'jurisdiction';
        d['r'] = objectId;
        d['email'] = email;
        
        console.log(d);
        $.ajax({
            type:'POST',
            url:url,
            data:d,
            dataType:'json',
            success:function(data){
                console.log(data);
                updateRequestsWithNewInformation(data.features);
                data.success = true;
                data.type = 'jurisdiction';
                submitHandler(data);
            },
            error:function(error){
                console.log("error");
                console.log(error.responseText);
                submitHandler(false);
            }

        });
    } else {
        submitHandler('login');
    }
}

// Submit Handler handles the results from the server when a request is created
// It also handles any validation errors that can occur.
// Most validation is done in the createRequest
// Although some is right on the form like phone number for instance

function submitHandler(r){
    loadingHide();
    console.log(r);
    var mTitle = "Thank You!";
    var villageHomepageButton = '<a href="http://www.downers.us" class="btn btn-default">Village Home Page</a>';
    var newRequestButton = '<a href="http://gis.vodg.us/requests" class="btn btn-primary">New Request</a>';
    var overrideButton = function(requestID,objectId){return '<a href="javascript:requestOverrideJurisdiction(\''+requestID +'\',\''+objectId+'\')" class="btn btn-default">Change to Village</a>'};
    if (r == 'login'){
        mTitle = "Error";
        var mBody = "<p>Please login in order to submit a request.</p><p> If you are using Internet Explorer, please try submitting the request in Google Chrome.";
        var mFooter = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button><a id="login-button" class="btn btn-primary" href="javascript:handleAuthClick()">Login</a>';
    } else if (r == 'location'){
        // Location was not selected from the typeahead list
        mTitle = "Location Error";
        var mBody = "<p>When entering a location, please be sure to click a location from the list that appears as you type.";
        var mFooter = '<button type="button" class="btn btn-default pull-right" data-dismiss="modal">Try Again</button>';
    } else if (r.success){
        if (r.owner && r.owner != "Village"){
            var mBody = "<p>Thank you for taking the time to help the Village run more efficiently. Unfortunately, this request is out of the jursidiction of the Village. We will do our best to forward the request on to the appropriate jurisdiction, but for the best response, we encourage you to contact <b>" + r.owner + "</b> directly at <b>";
            if (r.phone){
                mBody += r.phone+"</b>.";    
            } else {
                if (r.owner == "ComEd") {   
                    mBody += "1-800-334-7661.";
                }
            }
            mBody += "</b></p>";
            console.log(/General/.test(r.request.features[0].properties.RequestTypeText));
            var viewRequestButton = '<a class="btn btn-default" href="javascript:getExistingRequests(\'' +r.requestID+'\',\'detail\')">View Request</a>';
            var mFooter = (!/General/.test(r.request.features[0].properties.RequestTypeText) ? overrideButton(r.requestID,r.objectID) : '') + viewRequestButton + newRequestButton;
            
        } else if (r.more) {
            var mBody = "<p> Thank you for providing the additional information!</p>";
            
            var mFooter = '<a class="btn btn-default" href="javascript:performRelatedRequestActions(\'' +r.requestID+'\',\'detail\')">View Request</a>'; 
            mFooter += newRequestButton;        
            
        } else if (r.type && r.type === 'jurisdiction'){
            var mBody = "<p>Thank you for confirming the jurisdiction. The request has been updated and reassigned.</p>";
                var mFooter = '<a class="btn btn-default" href="javascript:performRelatedRequestActions(\'' +r.requestID+'\',\'detail\')">View Request</a>'; 
                mFooter += newRequestButton;   
            
        } else {
            var q = false;
            if (typeof r.requestType != 'undefined'){
                q = requestData.data.questions[requestData.data.types[r.requestType].RequestID+''];
            }
            if (q){
                var mBody = "<p>Your request has been submitted. The request number for future reference is <b>" + r.requestID + "</b>. Thank you for taking the time to help the Village run more efficiently.</p>";
                mBody += "<p>If you have another moment and would like to, please answer these additional question(s) to help the Village respond to your request better.</p>";
                
                mBody += '<form id="moreForm" class="form" role="form">';
                mBody += '<fieldset>';
                mBody += '<legend>Additional Question(s)</legend>';
                var inputs = '';
                $.each(q,function(){
                    inputs += '<div class="form-group">';
                    inputs += '<label for="more'+this.QuestionID+'">'+this.QuestionText+'</label>';
                    if (this.QuestionType == "List"){
                        inputs += '<select id="more'+this.QuestionID+'" class="form-control">';
                        inputs += populateDropdownFromArray(this.QuestionAnswerList);
                        inputs += '</select>';
                    } else {
                        inputs += '<input id="more'+this.QuestionID+'" type="text" class="form-control"></input>'
                    }
                    inputs += '</div>';
                });
                mBody += inputs;
                mBody += "</fieldset></form>";
                var mFooter = '<a href="http://gis.vodg.us/requests" class="btn btn-default">New Request</a>';
                mFooter += '<a class="btn btn-primary" href="javascript:submitAdditional(\''+r.requestID+'\')">Submit Additional Info</a>';
            } else {
                
                var mBody = "<p>Your request has been submitted. The request number for future reference is <b>" + r.requestID + "</b>. Thank you for taking the time to help the Village run more efficiently.</p>";
                var mFooter = '<a class="btn btn-default" href="javascript:performRelatedRequestActions(\'' +r.requestID+'\',\'detail\')">View Request</a>'; 
                mFooter += newRequestButton;      
            }
        }
    } else if (!r.success && (typeof r.error != 'undefined' && r.error.request && !r.error.contact && r.requestID)){
        mTitle = "Error Adding Contact";
        var mBody = "<p>There was an error submitting your request. The request was submitted, the Request ID is <b>"+r.requestID+"</b>, but there was an error adding the contact. Please try to submit the contact again by \"Managing\" the request. <i>(Click View Request and then Manage.)</i></p>";
        var mFooter = '<a class="btn btn-default" href="javascript:getExistingRequests(\'' +r.requestID+'\',\'detail\')">View Request</a>'; 
        mFooter += newRequestButton;
        
    } else {
        mTitle = "Error";
        var mBody = "<p>There was an error submitting your request. Please try to submit your request again or contact the Village at either via phone at 630-434-5574 or email at gis@downers.us</p>";
        var mFooter = '<a href="http://www.downers.us" class="col-md-5 btn btn-default">Return to Village Home Page</a>';
        mFooter += '<button type="button" class="col-md-4 btn btn-primary" data-dismiss="modal">Try Again</button>';
    }
    modalShow(mTitle,mBody,mFooter);
}

function toggleDetail(d){
    $(d).toggleClass('rDetail');
}


function disableRelated(){
    if (!$('#results').hasClass('hide')){
        $('.nav.nav-tabs a').prop('disabled',true);
        // PRODUCTION IF moved to the VDG web server
        //var loadingImg = '<img src="http://www.downers.us/public/themes/gis/loading.gif" height="30" width="30">';
        // TEST
        var loadingImg = '<img src="./support_files/images/loading.gif" height="30" width="30">';
        insertHTML("newResultsList",loadingImg);
    }
}

function enableRelated() {
    $('.nav.nav-tabs a').prop('disabled', false);
}

/*
*   Manages Related Tab on New Request tab
*/
function manageRelated(t) {
    $('#results li').removeClass('active');
    if (t == 'location'){
        $('#relatedLocation').addClass('active');
    } else {
        $('#relatedRequester').addClass('active');
    }
}

function toggleRelated(r,t){
    $('#results li').removeClass('active');
    disableRelated();
    
    $(r).addClass('active');
    if (t == "Requester"){
        var contactID = $('#ContactID').val()
        if (contactID.length == 0){
            contactID = null;
        }
        console.log(contactID);
        getExistingRequests(contactID,"requester");
    } else if (t == "Nearby"){
        var location, m;
        if (marker){
            m = marker.getLatLng();
        } else {
            m = newMap.getCenter();
        }
        location = {'x':m.lng,'y':m.lat};
        getExistingRequests(location,"location");
    }
}

function setTableRowClick(){
    $(".table-container .table-header tbody tr").click(
        function(){
            var listNumber = this.id.split('-')[1];
            console.log(filteredRequests[listNumber].properties.RequestID);
            //var query = "RequestID = '" + filteredRequests[listNumber].properties.RequestID + "'";
            //getExistingRequests(query, "detail");
            if (!localRequests){
                console.log("!Local Request Click");
                // we need to query the server and run the callback when the result is received.
                var listcallback = function(detailedRequest){
                    populateRelated([detailedRequest],{purpose:'detail'});
                    //performRelatedRequestActions(requests[0].properties.RequestID,'detail');
                };
                getRequestsFeatureData(null,'RequestID = \''+requests[listNumber].properties.RequestID+'\'',null,null,'detail',listcallback);
                return;
            }
            performRelatedRequestActions(filteredRequests[listNumber].properties.RequestID,'detail');
        }
    );
}