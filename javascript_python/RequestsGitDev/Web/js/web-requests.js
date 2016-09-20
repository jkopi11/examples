var dataURLs = ["data"];
var x,y;
var requestData = {};
var requestHandlerURL = "../public/cgi/crc/requests-handler.py";
var urlParam, userID;

var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function init(){
    getParameters();
    appBaseDataGet();
    if (isMobile){
        getLocation();
    }
    $("#RequestTypeText").on("change",updateDescription);
}

function getLocation() {
    if (navigator.geolocation) {
        var position = navigator.geolocation.getCurrentPosition(reverseGeocode);
    }
}

function reverseGeocode(position){
    console.log(position);
    var geocoderURL = "http://parcels.downers.us/arcgis/rest/services/Locators/LWeb/GeocodeServer/reverseGeocode?f=json&outSR=4325&distance=250&location=";
    var location = position.coords.longitude.toFixed(3)+","+position.coords.latitude.toFixed(3);
    geocoderURL += encodeURIComponent(location) 
    console.log(geocoderURL);
    $.getJSON(geocoderURL,function(data){
        console.log(data);
        console.log(typeof data.error === undefined);
        if (!data.error){
            x = data.location.x;
            y = data.location.y;
            $('#Location').val(data.address.Street);
        }
    });
}

function getParameters(){   
    urlParam = document.location.href;
    urlParam = urlParam.substring(urlParam.indexOf("?")+1);
    if (urlParam.length > 0){
        urlParam = urlParam.split("&");
    }
    var tempParams = {};
    $.each(urlParam,function(){
        var v = this.split("=");
        if (v.length > 1){
            tempParams[v[0]] = v[1];
        }
    });
}



function appBaseDataGet(){
    console.log("Get Request Data");
    $.each(dataURLs, function(i, v){
        var url = "../public/json/request_"+v+".json";
        $.getJSON(url, function(data){
            requestData[v] = data;
            if (url == "../public/json/request_data.json"){
                formLoad();
            }
        });
    });
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
    console.log(d);
    return d;
}

function formLoad(){
    locationsLookup();
    insertHTML('RequestTypeText',populateRequestTypes(false));
    $("#RequestTypeText option[value='General ']").prop('selected', 'selected');
    $('#Description').on('keyup',function(){
        keywordsFind(this);
    });
    updateDescription();
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

function formReset(){
    $('#newSubmit').prop('disabled',false);
    $('#location-container').removeClass('has-error');
    var g = "General ";
    $("#enterForm")[0].reset();
    $("#RequestTypeText").val(g);
    x = null;
    y = null;
    updateDescription();
}

function insertHTML(e, h){
    var div = document.getElementById(e);
    //console.log(div);
    div.innerHTML = "";
    div.innerHTML = h;
}

function keywordsFind(e){
    var text = $(e).val();
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
    var selectedRequest = $("#RequestTypeText").val();    
    insertHTML('RequestTypeText',populateRequestTypes(suggestedTypes));
    $("#RequestTypeText").val(selectedRequest);
}

function loadingShow(){
    $('#loadingModal').modal('show');
}

function loadingHide(){
    $('#loadingModal').modal('hide');
}

function locationsLookup(){
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
        prefetch: '../public/json/locations.json',
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
        x = parseFloat(datum.x);
        console.log(x);
        y = parseFloat(datum.y);
    });
}

function modalShow(title, body, footer){
    var header = '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">X</button>';
    header += '<h2 class="modal-title">'+title+'</h2>';
    insertHTML('modalTitle',header);
    insertHTML('modalBody',body);
    insertHTML('modalFooter',footer);
    $('#modal1').modal('show');
    $('.modal-dialog').addClass('modal-lg');
}

/***
*   List Populaters
***/

function populateDropdownFromArray(a){
    var h = '';
    $.each(a,function(){
        h += "<option value=\"" + this + "\">" + this + "</option>";
    });
    return h;
}

function populateRequestTypes(suggestions){
    var d = {};
    $.each(requestData.data.types,function(key,value){
        if (value.status == 2 || value.status == 3){
            var category = value.category;
            if (category != 'Animal'){
                category = 'General';
            }
            if (typeof d[category] == 'undefined'){
                d[category] = [key];
            } else {
                var a = d[category];
                a.push(key);
                d[category] = a;
            }
        }
    });
    var h = '';
    d = sortDictionary(d);
    if (suggestions && suggestions.length > 0){
        var options = populateDropdownFromArray(suggestions);
        h += '<optgroup label="Suggestions">';
        h += options;
        h += '</optgroup>';
    }
    $.each(d,function(key,value){
        var options = populateDropdownFromArray(value);
        h += '<optgroup label="' + key + '">';
        h += options;
        h += '</optgroup>';
    });
    return h;
}

function requestSubmit(d){
    

    $('#newSubmit').prop('disabled','disabled');
    var url = requestHandlerURL;
    var d = formParse($('#enterForm'));
    /*if (x.length == 0 || x === null || y.length == 0 || y === null){
        x = -88.004;
        y = 41.795;
        d['Location'] = 'None Given';
    }*/
    if (typeof x == 'undefined' || x === null || $('#Location').val().length == 0){
        requestSubmitHandler('location');
        return;
    }

    loadingShow();
    d['r'] = 'create';
    d['x'] = parseFloat(x);
    d['y'] = parseFloat(y);
    
    if (!d['Name']){
        d['Name'] = 'None';
    }
    if (!d['Location']){
        d['Location'] = 'None';
    }
    if (!d['Phone']){
        d['Phone'] = 'None';
    }
    if (!d['Email']){
        d['Email'] = 'None';
    }
    if (d['Description']){
        d['Description'] = d['Description'].replace(/</g,'(').replace(/>/g,')');
    }
    $.ajax({
        type:'POST',
        url:url,
        data:d,
        dataType:'json',
        success:function(data){
            //console.log(data);
            formReset();
            requestSubmitHandler(data);
        },
        error:function(error){
            console.log(error);
            console.log("error");
            console.log(error.responseText);
            $('#newSubmit').prop('disabled',false);
            requestSubmitHandler(false);
        }

    });
}

function requestSubmitHandler(r){
    loadingHide();
    console.log(r);
    var mTitle = "Thank You!";
    var closeButton = '<button type="button" class="btn btn-default" data-dismiss="modal" aria-hidden="true">Close</button>';
    var villageHomepageButton = '<a href="http://www.downers.us" class="btn btn-default">Village Home Page</a>';
    var newRequestButton = '<a class="btn btn-primary" data-dismiss="modal">New Request</a>';
    var newRequestButtonDefault = '<a class="btn btn-default" data-dismiss="modal">New Request</a>';
    if (r == 'location'){
        $('#location-container').addClass('has-error');
        $('#newSubmit').prop('disabled',false);
        // Location was not selected from the typeahead list
        mTitle = "Location";
        var mBody = "<p>Did you want to submit this request without a location?</p>";
        mBody += "<p class=\"text-muted\">If you are trying to include a location, please be sure to pick from the list that appears as you type in the Location field.</p>";
        mBody += "<p class=\"text-muted\">If you entered information into the location field and did not find your address in the list, please know that the location is most likely not within the Village's jurisdiction. If you still would like to submit this request to the Village, please press \"Yes, Submit Request\" below.</p>";
        var mFooter = '<button type="button" class="btn btn-default" data-dismiss="modal">No, Update Location</button><a href="javascript:submitRequestWithoutLocation()" class="btn btn-primary">Yes, Submit Request</a>';
    } else if (r.success){
        if (r.owner && r.owner != "Village"){
            var mBody = "<p>Thank you for taking the time to help the Village run more efficiently. Unfortunately, this request seems to be out of the jursidiction of the Village. A person on the Village's staff will verify this information. If we confirm that it is correct, we will forward the request on to the appropriate jurisdiction. For the best response, we encourage you to contact <b>" + r.owner + "</b> directly at <b>";
            if (r.phone){
                var phoneButton = "<a class=\"btn btn-default\" href=\"tel:"+ r.uri + "\">Call</a></b>.";
                
                if (isMobile){
                    mBody += "<a href=\"tel:"+ r.uri + "\">"+ r.phone+"</a>"; 
                } else {
                    mBody += r.phone;
                }
                mBody += "</b>."
            } else {
                if (r.owner == "ComEd") {   
                    mBody += "1-800-334-7661.";
                }
            }
            mBody += "</b></p>";
            var mFooter = closeButton;
            if (phoneButton && isMobile){
                mFooter += phoneButton;
            }
            mFooter += newRequestButton;
        } else if (r.more) {
            var mBody = "<p> Thank you for providing the additional information!</p>";
            var mFooter = closeButton;
            
            mFooter += newRequestButton;        
            
        } else {
            var q = false;
            if (typeof r.requestType != 'undefined'){
                q = requestData.data.questions[requestData.data.types[r.requestType].RequestID+''];
            }
            console.log(q);
            var mBody = "<p>Thank you for taking the time to help the Village run more efficiently! Your request has been submitted. The request number for future reference is <b>" + r.requestID + "</b>.</p>";
            if (q){
                var inputs = '';
                var moreInput = false;
                $.each(q,function(){
                    if (this.QuestionType != "Response"){
                        moreInput = true;
                        inputs += '<div class="form-group">';
                        inputs += '<label for="more'+this.QuestionID+'">'+this.QuestionText+'</label>';
                        if (this.QuestionType == "List"){
                            inputs += '<select id="more'+this.QuestionID+'" class="form-control">';
                            inputs += populateDropdownFromArray(this.QuestionAnswerList);
                            inputs += '</select>';
                        } else if (this.QuestionType == "Input"){
                            inputs += '<input id="more'+this.QuestionID+'" type="text" class="form-control"></input>'
                        } else if (this.QuestionType == "Paragraph"){
                            inputs += '<textarea id="more'+this.QuestionID+'" class="form-control"></textarea>';
                        } 
                        if (this.QuestionType != "Response"){
                            inputs += '</div>';
                        }
                    } else {
                        mBody += '<p>' + this.QuestionText + '</p>';
                    }
                });
                
                
                if (moreInput){
                    mBody += "<p>If you have another moment and would like to, please answer these additional question(s) to help the Village respond to your request better.</p>";

                    mBody += '<form id="moreForm" class="form" role="form">';
                    mBody += '<fieldset>';
                    mBody += '<legend>Additional Question(s)</legend>';

                    mBody += inputs;
                    mBody += "</fieldset></form>";
                }
                var mFooter = newRequestButtonDefault;
                mFooter += '<a class="btn btn-primary" href="javascript:submitAdditional(\''+r.requestID+'\')">Submit Additional Info</a>';
            } else {
                
                var mBody = "<p>Your request has been submitted. The request number for future reference is <b>" + r.requestID + "</b>. Thank you for taking the time to help the Village run more efficiently.</p>";
                var mFooter = closeButton;
                mFooter += newRequestButton;        
            }
        }
    } else {
        mTitle = "Error";
        var mBody = "<p>We apologize, but there was an error submitting your request. Please try to submit your request via email at crc@downers.us or contact the Village by phone at 630-434-5500.</p>";
        var mFooter = '<a href="http://www.downers.us" class="col-md-5 btn btn-default">Return to Village Home Page</a>';
    }
    modalShow(mTitle,mBody,mFooter);
}

function sortDictionary(d){
    var a = [];
    $.each(d,function(key,value){
        a.push(key);
    });
    a.sort();
    var temp = {};
    $.each(a,function(key,value){
        temp[this] = d[this];
    });
    
    return temp;
}

function updateDescription(){
    insertHTML('Description-Help',"Description: " + requestData.data.types[$("#RequestTypeText").val()].description);
}

function submitAdditional(r){
    var url = requestHandlerURL;
    var d = formParse($('#moreForm'));
    d['r'] = 'additional';
    d['RelInfoRequestID'] = r;
    $.ajax({
        type:'POST',
        url:url,
        data:d,
        dataType:'json',
        success:function(data){
            console.log(data);
            requestSubmitHandler(data);
        },
        error:function(error){
            console.log("error");
            console.log(error.responseText);
            requestSubmitHandler(false);
        }

    });
}

function submitRequestWithoutLocation(){
    x = -88.004;
    y = 41.795;
    if ($('#Location').val().length == 0) { 
        $('#Location').val('None Given');
    }
    requestSubmit();
}