var dataURLs = ["data"];
var x,y;
var requestData = {};
var map;
var requestHandlerURL = "../public/cgi/crc/requests-handler.py";
var requestsLayer,nearbyArea,marker;
var popup;

function init(){
    appBaseDataGet();
}

function appBaseDataGet(){
    console.log("Get Request Data");
    $.each(dataURLs, function(i, v){
        var url = "../public/json/request_"+v+".json";
        $.getJSON(url, function(data){
            requestData[v] = data;
            console.log(requestData);
            if (url == "../public/json/request_data.json"){
                formLoad();
            }
        });
    });
}

function detailShow(requestID){
    console.log(requestID);
    $.each(requests,function(){
        if (this.properties.RequestID == requestID){
            var title = requestID + " | " + requestTypeParse(this.properties.RequestTypeText);
            var body = "<dl class=\"dl-horizontal summary\">";
            body += "<dt>Status</dt><dd>"+requestStatusParse(this.properties.StatusText)+"</dd>";
            body +="<dt>Location</dt><dd>"+this.properties.Address+"</dd>";
            body += "<dt>Description</dt><dd>"+this.properties.Description;
            body += "</dd></dl>";
            body += "<p>To receive email updates for this request, please enter your email address below and press the \"Follow\" button below.</p>";
            var form = "<form class=\"form-horizontal\" role=\"form\">"
            form += "<div class=\"form-group\"><label for=\"follow\" class=\"col-md-4\">Email</label><div class=\"col-md-8\"><input id=\"follow\" name=\"follow\" class=\"form-control \" type=\"email\"></div></div>";
                
            var footer = "<a class=\"btn btn-default\" data-dismiss=\"modal\">Close</a><a id=\"follow-button\" class=\"btn btn-primary\">Follow</a>";
            modalShow(title,body+form,footer);
            return false;
        }
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
    $('#RequestTypeText').val("General ");
    /*if (map){
        map.remove();
    }
    map = L.map('crc-map');
    //Disable navigation
    /*map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();*/
    // End Disable Navigation
    var center = L.latLng(41.791,-88.010);
    map.setView(center,13);
    L.esri.basemapLayer('Topographic').addTo(map);
    map.whenReady(mapLoaded);
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
    var g = "General ";
    $("#enterForm")[0].reset();
    $("#RequestTypeText").val(g);
    mapCenterAndZoom(null,true);
}

function insertHTML(e, h){
    var div = document.getElementById(e);
    //console.log(div);
    div.innerHTML = "";
    div.innerHTML = h;
}

function listUpdate(bounds){
    var markup = '<ul class="list-unstyled">';
    if (bounds){
        console.log(bounds);
        $.each(requests,function(){
            var coords = [this.geometry.coordinates[1],this.geometry.coordinates[0]];
            var point = L.latLng(coords);
            if (bounds.contains(point)){
                markup += "<li><a href=\"javascript:detailShow('"+this.properties.RequestID+"')\">"+requestGetSummaryText(this,true)+"</a></li>";
            }
        });
    } else {
        $.each(requests,function(index){
            if (index < 21){
                markup += "<li><a href=\"javascript:detailShow('"+this.properties.RequestID+"')\">"+requestGetSummaryText(this,true)+"</a></li>";
            } else {
                return false;
            }
        });
    }
    markup += '</ul>';
    insertHTML('list-container',markup);
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
        y = parseFloat(datum.y);
        var geoLocation = {'x':x,'y':y};
        mapCenterAndZoom(geoLocation,false);
    });
}

// g-Geometry, r-reset
function mapCenterAndZoom(g,r){
    var m = map;
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
        m.setView(center,16,{animate:true});
        /*if (active == 'New' || active.length == 0){
            if (nearbyArea){m.removeLayer(nearbyArea)};
            nearbyArea = new L.CircleMarker(center, {color: '#928E0F',radius: 50, fillOpacity: 0.10,clickable:false,}).addTo(m);
        }*/
    } else {
        var center = L.latLng(41.791,-88.010);
        m.setView(center,13);
    }
    setTimeout(function(){m.invalidateSize();},500); 
}

// purpose - map to add data to, daysOpen - if filter is used, parse data, heat - if heat map is toggled on
function mapAddData(purpose){
    console.log("Map Add Data");
    var m = map;
    m.invalidateSize();
    
    requestsLayer = L.geoJson(requests, {
        style: function(feature) {
            return {color: requestData.data.types[feature.properties.RequestTypeText].MapColor};
        },
        pointToLayer: function(feature, latlng) {
            if (feature.properties.StatusCode == 10 || feature.properties.StatusCode == 11) {
                return new L.CircleMarker(latlng, {radius: 1, fillOpacity: 0.7,/*clickable:false,*/});
            } else {
                return new L.CircleMarker(latlng, {radius: 5, fillOpacity: 0.85,/*clickable:false,*/});
            }

        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup("<a href=\"javascript:detailShow('"+feature.properties.RequestID+"')\">"+requestGetSummaryText(feature,false)+"</a>");
        }
    }).addTo(m);
    
    m.on('moveend',function(e){
        listUpdate(m.getBounds());
    });
    
    /*requestsLayer.on("mouse-over",function (e){
        console.log(e);
        popup = L.popup()
           .setLatLng(e.feature.geometry.coordinates)
           .setContent('Popup for feature #'+e.layer.feature.properties.RequestTypeText)
            .openOn(m);
    })
    
    requestsLayer.on('mouseout',function(e) {
        m.closePopup(popup);
        popup = null;
    });*/
    listUpdate(null);
}



function mapLoaded(){
    map.invalidateSize();
    requestsGetData(null, 'RequestedDate > \'' +formatFilterDate("1 Month")+'\'',null,true,"map");
}

function modalShow(header, body, footer){
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

function populateRequestTypes(all){
    var d = {}
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
    $.each(d,function(key,value){
        var options = populateDropdownFromArray(value);
        h += '<optgroup label="' + key + '">';
        if (all) {
            h += "<option value=\"" + key + " - All\">" + key + " - All</option>";
        }
        h += options;
        
        h += '</optgroup>';
        
    });
    return h;
}

/**
 * Gets Requests in relation to a specific point and then process them into list form for New Requests page, detailed view, and querying map view on click.
 * @param {LatLng} g - point for address entered or click of map, I also replace g with ID information when I need a list but don't use a location to query data
 * @param {String} t - type of request (location = Related 'Nearby' requests show on 'New',detail = show the detail modal view when requests are selected
* @return After the ajax response is received the element is updated
 */

function requestsGetData(sort,filter,daysFilter,geometry,purpose){
    console.log("Get Requests");
    geometry = true;
    var url = requestHandlerURL;
    var outfields = "*";
    var query = "StatusText <> 'Delete'";
    // s is to capture DaysOpen sort request
    var boundString = null;
    sort = 'StatusDate DESC';
    var d = {order:sort, q:filter,fields:outfields,geo:geometry,r:purpose};
    console.log(d);
    
    $.ajax({
        type:'GET',
        url:url,
        data:d,
        dataType:'json',
        success:function(data){
            console.log(data);
            $('#loadingModal').modal('hide');
            requests = data.features;
            mapAddData(purpose); 
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
        
function requestGetSummaryText(feature,list){
    var requestType = requestTypeParse(feature.properties.RequestTypeText);
    var status = requestStatusParse(feature.properties.StatusText);
    var address = '';
    if (list){
        address = " @ " + feature.properties.Address;
    }
    return requestType + address + " | " + status + " as of " + feature.properties.StatusDate.substring(0,10);
}

function requestTypeParse(requestType){
    if (requestType != 'Street Light'){
        requestType = requestData.data.types[requestType].category;
    }
    if (requestType == 'Existing Disrepair'){
        requestType = 'Code';
    }
    return requestType;
}

function requestStatusParse(status){
    return ((status == 'New Request' || status == 'Completed') ? status : 'Resolution in Progress');
}

function requestSubmit(d){
    if (typeof x == 'undefined' || $('#Location').val().length == 0){
        requestSubmitHandler('location');
        return;
    }

    $('#newSubmit').prop('disabled','disabled');
    var url = requestHandlerURL;
    var d = formParse($('#enterForm'));
    console.log(d);
    if (x.length == 0 || y.length == 0){
        alert("Please reselect the location and be sure to pick from the list that appears as you type.");
        return;
    }

    loadingShow();
    d['r'] = 'create';
    d['x'] = parseFloat(x);
    d['y'] = parseFloat(y);
    if (!d['fName']){
        d['fName'] = 'None';
    }
    if (!d['fAddress']){
        d['fAddress'] = 'None';
    }
    if (!d['fPhone']){
        d['fPhone'] = 'None';
    }
    if (!d['fEmail']){
        d['fEmail'] = 'None';
    }
    if (d['fDesc']){
        d['fDesc'] = d['fDesc'].replace(/</g,'(').replace(/>/g,')');
    }
    console.log(d);
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
    var villageHomepageButton = '<a href="http://www.downers.us" class="btn btn-default">Village Home Page</a>';
    var newRequestButton = '<a href="http://www.downers.us/forms/community-response-center-2-0" class="btn btn-primary">New Request</a>';
    if (r == 'location'){
        // Location was not selected from the typeahead list
        mTitle = "Location Error";
        var mBody = "<p>When entering a location, please be sure to click a location from the list that appears as you type.";
        var mFooter = '<button type="button" class="btn btn-default pull-right" data-dismiss="modal">Try Again</button>';
    } else if (r.success){
        console.log(r.success);
        
        if (r.owner && r.owner != "Village"){
            var mBody = "<p>Thank you for taking the time to help the Village run more efficiently. Unfortunately, this request seems to be out of the jursidiction of the Village. A person on the Village's staff will verify this information. If we confirm that it is correct, we will forward the request on to the appropriate jurisdiction. For the best response, we encourage you to contact <b>" + r.owner + "</b> directly at <b>";
            if (r.phone){
                mBody += r.phone+"</b>.";    
            } else {
                if (r.owner == "ComEd") {   
                    mBody += "1-800-334-7661.";
                }
            }
            mBody += "</b></p>";
            var mFooter = villageHomepageButton + newRequestButton;
        } else if (r.more) {
            var mBody = "<p> Thank you for providing the additional information!</p>";
            var mFooter = villageHomepageButton;
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
                var mFooter = '<a href="http://www.downers.us/forms/community-response-center-2-0" class="btn btn-default">New Request</a>';
                mFooter += '<a class="btn btn-primary" href="javascript:submitAdditional(\''+r.requestID+'\')">Submit Additional Info</a>';
            } else {
                
                var mBody = "<p>Your request has been submitted. The request number for future reference is <b>" + r.requestID + "</b>. Thank you for taking the time to help the Village run more efficiently.</p>";
                var mFooter = villageHomepageButton;
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