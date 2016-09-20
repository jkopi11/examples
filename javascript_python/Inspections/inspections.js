var calendars = ["Engineering","Fence - Final","Sign - Final", "Parking Lot - Final"];
var calendarId = calendars[0];
var selectedCalendarID = 0;
var disclaimers = ["<li>A final grading plan must be submitted.</li><li>Final site stablization (mulch, sodded, or grass growing) must be completed.</li>", "<li>The entire scope of the permit must be completed.</li>","<li>The entire scope of the permit must be completed, including the installation of landscaping for monument signs.</li><li>Monument signs with new foundations or electrical must have passed the pre-pour and/or rough electrical inspection in order to final the sign.  Call the inspection hotline at (630) 434-5529 to schedule a pre-pour and/or rough electrical inspections.</li>","<li>The entire scope of the permit must be completed, including the proper striping and signage for accessible spaces.</li>"];
var eventArray = [], amAppts = [], pmAppts = [], filledTimes = [], perferredTimes = [], amPerferredOrder = [], pmPerferredOrder = [], amDistances = [], pmDistances = [];
var interval = 30 / 60.0;
var anyTimeAppts;
var selectStreetNames = "";
var selectApptHTML = "";
var amClosest = -1, pmClosest = -1;
var appt = 0;
var hour = 12;
// Accept Appts after
var sHour = 8.0;
// Accept Appts after Lunch
var sPMHour = 13.0;
// End of appointment day
var eHour = 15.0;
var calendarDate;
var geoLocation = "";

//var calendarId = 'downers.us_52tm978pbmm5lotj39v7lb2o2g@group.calendar.google.com';

var email, username;
var today;

var calendarResult, gisResult;
var allday = false;
// All Day count is the amount of all day calendar appointments (i.e. vacation days)
var allDayCount = 0;
// All Day Max -- Is the calendar count we are referencing and how many all day appointment do we need to skip parsing appointments... meaning the inspector(s) is booked for the day
var allDayMax = 1;
// ID # of the engineering calendar
var engineering = 0;
var count = 0;

var apptRecd = false;

var xhr;

//init function
function afterClientLoad(i) {
    //$('.datepicker').datepicker();
    $('.alert.alert-danger').hide();
    $(".loadSpinner").hide();
    document.getElementById("scheduleDate").disabled=true;
    $("#submitSpinner").hide();
    today = new Date();
    //console.log(today);
    
    calendarDate = new Date();
    calendarDate.setDate(calendarDate.getDate() + 1);

    //calendarDate = calendarDate.toLocaleDateString();
    calendarDate = addZero(calendarDate.getMonth()+1) + "/" + addZero(calendarDate.getDate()) + "/" + calendarDate.getFullYear();
    //console.log(calendarDate);
    $("#scheduleDate").val(calendarDate);
 
    //insertHTML("disclaimer",disclaimers[0]);
    getAppointments();
    populateCalendars();
    document.getElementById("submit-button").disabled=true;
    lookupLocations();
    /*$('#submit-button').off('click');
    $('#submit-button').click(addToCalendar);*/
}

$(document).ready(function () {
    afterClientLoad();
    }
);



    function addThirtyMinutes(i) {
        var cHour, cMin, ap = "a";
        if (i.length == 5){
            cHour = parseInt(i.substring(0,1));
            cMin = parseInt(i.substring(2,4));
        } else if (i.length == 6){
            cHour = parseInt(i.substring(0,2));
            cMin = parseInt(i.substring(3,5));
        }
        if (cMin == 45) {
            cMin = 15;
            cHour = cHour + 1;
        } else if (cMin == 30){
            cMin = 0;
            cHour = cHour + 1;
        } else {
            cMin += 30;
        }
        if (cHour > 11) {
            ap = "p";
            if (cHour > 12){
                cHour = cHour % 12;
            }
        }

        var thirty = cHour.toString()+":"+addZero(cMin)+ap;
        return thirty;
    }

    function addToCalendar() {
        if(formValidate()){
            document.getElementById("submit-button").disabled=true;
            document.getElementById("scheduleDate").disabled=true;
            $('#submitSpinner').show();
            var url = 'http://www.downers.us/public/cgi/submitInspection.py';
            //var url = 'http://gis.vodg.us/inspections/support_files/submitInspection_dev.py';
            var location = $('#address').val() + " (X:" + geoLocation.x + " Y:"+geoLocation.y+")";
            var description = $('#contactname').val() + ", " + $('#contactphone').val() + ", " + $('#contactemail').val();
            var summary = $('#permitno').val() + " - " + $('#address').val();
            var comments = $('#comments').val();
            if (typeof calendarDate != 'string'){
                calendarDate = formatDate(calendarDate);
                console.log(calendarDate);
            }
            var d = {d:calendarDate.substring(0,10), i:calendarId, s:summary, l:location, desc:description, st:calculateDateTime(calendarDate,$('#times').val()), end:calculateDateTime(calendarDate,addThirtyMinutes($('#times').val())),cn:$('#contactname').val(),ce:$('#contactemail').val(),com:comments};
            console.log(d);
            //console.log(calculateDateTime(calendarDate,addThirtyMinutes($('#times').val())));
            //console.log(calculateDateTime(calendarDate,$('#times').val()));
            $.ajax({
                type:'POST',
                url:url,
                data:d,
                success:function(d){
                    console.log(d);
                    alert("Thank you for scheduling your inspection! An email confirmation will be sent to the address provided.");
                    resetForm("enter");
                    afterClientLoad();
                },
                error:function(error){
                    alert("There has been an error. Please try again or call in your inspection and report the error at 630-434-5529.");
                    console.log("error");
                    console.log(error.responseText);
                }
              });
        }
    }

    function addZero(s){
        var n = parseInt(s);
        var str = "";
        if (n < 10 || (n > 100 && n < 1000)) {
            str = "0"+n.toString();
        } else {
            str = n.toString();
        }
        return str;
    }

    function calculateDateTime(cd, t){
        
        if (cd.length > 10 || cd.indexOf("/") > -1){
            cd = formatDate(cd);
        }
        var cdtHour, cdtMin,ap;
        if (t.length == 5){
            cdtHour = parseInt(t.substring(0,1));
            cdtMin = parseInt(t.substring(2,4));
            ap = t.substring(4);
        } else if (t.length == 6){
            cdtHour = parseInt(t.substring(0,2));
            cdtMin = parseInt(t.substring(3,5));
            ap = t.substring(5);
        }
        if (ap == "p"){
            cdtHour += 12;
        }
        return cd+"T"+addZero(cdtHour) + ":" + addZero(cdtMin)+":00Z";
    }

    function checkDay(i){
        //console.log(i);
        //console.log(typeof i);
        if (typeof i == 'string'){
            var iArray = i.split("/");
            if (iArray.length == 1){
                iArray = i.split("-");
            }
            i = new Date(iArray[2],iArray[0]-1,iArray[1]);
            //console.log(i);
        }
        //console.log(i);
        //console.log(i.getTime());
        //console.log(today);
        //console.log(today.getTime());
        //var todayCompare = new Date(today.getFullYear(),today.getMonth(),today.getDate());
        //console.log(todayCompare.getTime());  
        if (i.getDay().toString() == "0" || i.getDay().toString() == "6"){
            //console.log("weekend");
            return false;
        } else if (i.getTime() <= today.getTime()){
            //console.log("today");
            return false;
        }else {
            //console.log("ok");
            return true;
        }
    }

    function clearValidate(){
        var elems = document.getElementById('enter').elements;
        for (var i = 0; i < elems.length; i++){
            var e = $(elems[i]);
            $(e[0].parentNode).removeClass("has-error");
            $(e[0].parentNode).removeClass("has-success");
        }
    }

    function createOpenTimeArray(){
        //console.log("Create Open Time");
        var apptCount = 0;
        if (allDayCount <= allDayMax){
            //console.log(perferredTimes);

            // Removed any filled times from the preferred dates
            for (var i = 0; i<perferredTimes.length;i++){
                for (var j = 0; j<filledTimes.length;j++){
                    if (perferredTimes[i] == filledTimes[j]){
                        perferredTimes.splice(i,1);
                    }
                }
            }
            var amCount = 0;
            var pmCount = 0;
            for (var i = 0; i < perferredTimes.length; i++){
                if (parseInt(perferredTimes[i]) > 800 && parseInt(perferredTimes[i]) < 1200){
                    amCount++;
                } else if (parseInt(perferredTimes[i]) > 1199){
                    pmCount++;
                }
            }

            if (amCount == 0) {
                setPerferredTimes(0,1);
            } 
            if (pmCount == 0) {
                setPerferredTimes(1,1);
            } 

            perferredTimes = perferredTimes.sort(function(a,b){return a - b});
            //console.log(perferredTimes);
            var perferredHTML = "";
            for (var i = 0; i<perferredTimes.length;i++){
                var time = perferredTimes[i];
                //console.log(time);
                apptCount++;
                perferredHTML += "<option value=\""+getTimeColumn(time)+"\">"+dayOfWeek(calendarDate)+" "+getTimeColumn(time)+"</option>";
            }

            var day = dayOfWeek(calendarDate);

            //Add any time appointment -- Need more information from Julie/Kerry
            //selectApptHTML += "<option class=\"preferred\" value=\"any\">Any Time</option>";
            selectApptHTML = "";
            for (var i = sHour; i<eHour; i = i + .5){
                var time;

                if (i % 1 > 0) {
                    time = addZero(parseInt(i)) + "30";
                } else {
                    time = addZero(parseInt(i)) + "00";
                }				

                var type = 0;
                if ((i == sHour && amClosest == -1) || (i == sPMHour && pmClosest == -1)) {
                    type = -1;
                }
                for (var j = 0; j < perferredTimes.length; j++) {
                    if (perferredTimes[j] == time){
                        type = -1;
                    }
                }

                for (var j = 0; j < filledTimes.length; j++){	
                    if (filledTimes[j] == time){
                        type = -1;
                    }
                }

                if (type == 0){
                    var t = "<option value=\""+getTimeColumn(time)+"\">"+day+" "+getTimeColumn(time)+"</option>";
                    if (perferredTimes.length > 0){
                        selectApptHTML += t;   
                    } else {
                        perferredHTML += t;
                        perferredTimes.push(time);
                    }
                    apptCount++;
                }
            }
        }
        
        var allHTML = "";
        if (apptCount > 0 && apptCount > anyTimeAppts) {
            allHTML += "<optgroup label=\"Preferred Times\">";
            allHTML += "<option value=\"6:00a\">" + day + " - Any time</option>";
            allHTML += perferredHTML;
            allHTML += "</optgroup>";
            allHTML += "<optgroup label=\"Other Times\">";
            allHTML += selectApptHTML;
            allHTML += "</optgroup>";
        } else if (allDayCount > allDayMax || apptCount == 0 || apptCount <= anyTimeAppts) {
            $('.loadSpinner').hide();
            document.getElementById("scheduleDate").disabled=false;
            allHTML += "<option>No available times</option>";
            //$("#times").addClass("noappts");
            document.getElementById("submit-button").disabled=true;
        }

        insertHTML("times",allHTML);
    }

    function dayOfWeek(i){
        //console.log(typeof i);
        if (typeof i == 'number' || typeof i == 'string'){
            i = new Date(i);
        }
        
        switch (i.getDay()){
            case 1:
                return "Mon";
            case 2:
                return "Tues";
            case 3:
                return "Wed";
            case 4:
                return "Thurs"
            case 5:
                return "Fri";
        }
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

    function filterFilledTimes(){
        //console.log("Filter");
        var tempFilled = filledTimes.slice(0);
        tempFilled.sort();
        var filteredFilled = [];
        for (var i = 0; i < tempFilled.length; i++){
            if (filteredFilled.indexOf(tempFilled[i]) == -1){
                var count = 0;
                var index = i;
                // console.log("Position: " + index);
                while (index > -1 && index < tempFilled.length){
                    //console.log("Index: " + index);            
                    index = tempFilled.indexOf(tempFilled[i], index);
                    //console.log("Index: " + index);
                    if (index > -1){
                        count++;
                        index++;
                    }
                }
                
                //console.log(tempFilled[i] + " - " + count);
                if (count > 1){
                    filteredFilled.push(tempFilled[i]);
                }
            }
        }
        //console.log(filteredFilled);
        filledTimes = filteredFilled;
    }
    
    function findNextPerferredTime(a, o){
        //console.log("Next Perferred");
        for (var i = 1; i < a.length; i++){
            var match = 0;
            var testIndex = o.indexOf(i);
            var time;
            if (testIndex != -1){
                var testArray = [];
                var previousAppt = getPreviousAppointment(a[testIndex]);
                var nextAppt = getNextAppointment(a[testIndex]);
                if (previousAppt > -1){testArray.push(previousAppt);}
                if (nextAppt > -1){testArray.push(nextAppt);
                    //console.log(testArray);
                    for (var k = 0; k < testArray.length; k++){
                        var match = 0;
                        for (var j = 0; j < filledTimes.length; j++){
                            if (testArray[k] == filledTimes[j]){
                                match++;    
                            }
                        }
                        if (match == 0){
                            perferredTimes.push(testArray[k]);
                            return testArray[k];
                        }
                    }
                }
            }
        }
    }

    function formatDate(d){
        if (typeof d != 'string'){
            d = d.toLocaleDateString();
            if (d.length > 10){
                d = new Date(d);
                console.log(d.getMonth()+1);
                d = addZero(d.getMonth()+1) + "/" + addZero(d.getDate()) + "/" + d.getFullYear();
                console.log(d);
            }
        }
        
        var cdArray = d.split("/");
        d = cdArray[2]+"-"+cdArray[0]+"-"+cdArray[1];
        return d; 
    }

    function formValidate(){
        //console.log('Form Validate');
        var validated = true;
        var elems = document.getElementById('enter').elements;
        //console.log(elems);
        for (var i = 0; i < elems.length; i++){
            var e = $(elems[i]);
            //console.log($(e).val());
            if ($(e[0].parentNode).hasClass('has-error') && $(e).val().length > 0){
                //console.log("Clear error");
                $(e[0].parentNode).removeClass("has-error");
                $(e[0].parentNode).addClass("has-success");
            } else if ($(e).val().length == 0 && $(e).attr('required') && !$(e).hasClass("tt-hint")){
                //console.log("Error");
                $(e[0].parentNode).addClass("has-error");
                validated = false;
            }
        }
        if (validated){
            $('.alert.alert-danger').hide("slow");
        } else {
            showAlert("fields");
        }
        return validated;
        //return true;
    }

    function geocodeAddress(a){
        //console.log("Geocode Address");
        geoLocation = "";
        if (a.length > 0) {
            var url = "http://parcels.downers.us/arcgis/rest/services/Locators/LAddress/GeocodeServer/findAddressCandidates?";
            a = a.replace(" ","+");
            url += "Street=&Single+Line+Input="+a+"&outFields=*&outSR=4326&searchExtent=&f=pjson";
            $.ajax({
                url:url,
                dataType:'json',
                success:function(data){
                    geoLocation = data.candidates[0].location;
                    if (geoLocation){
                        //$('#address').val(data.candidates[0].address);
                        if ($('#cbDisclaimer').is(':checked')){
                            document.getElementById("submit-button").disabled=false;
                            getDistances(geoLocation);
                        } else {
                            showAlert("disclaimer");
                        }
                    } else {
                        alert("Could not find address. Please call in your inspection at 630-434-5529");
                        document.getElementById("submit-button").disabled=true;
                    }
                },
                error:function(error){
                    alert("There has been an error. Please try again or call in your inspection and report the error at 630-434-5529.");
                    //console.log("error");
                    //console.log(error.responseText);
                }
              });
        } else {
            document.getElementById("submit-button").disabled=true;
        }
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
            console.log(datum);
            x = parseFloat(datum.x);
            y = parseFloat(datum.y);
            geoLocation = {'x':x,'y':y};
            if (geoLocation){
                //$('#address').val(data.candidates[0].address);
                if ($('#cbDisclaimer').is(':checked')){
                    document.getElementById("submit-button").disabled=false;
                    if (calendarId == 'Engineering'){
                        getDistances(geoLocation);
                    } else {
                        showOnlyAnyDayAppointments();
                    }
                } else {
                    showAlert("disclaimer");
                }
            } else {
                alert("Could not find address. Please call in your inspection at 630-434-5529");
                document.getElementById("submit-button").disabled=true;
            }
        });
    }

    function getAppointments() {
        apptRecd = false;
        $(".loadSpinner").show();
        document.getElementById("scheduleDate").disabled=true;
        allday = false;
        amClosest = -1, pmClosest = -1;
        
        amAppts = [], pmAppts = [], filledTimes = [], noLocationAppts = [];
        
        if (typeof calendarDate != 'string'){
            var pickedDateString = calendarDate.toISOString();
            pickedDateString = pickedDateString.substring(0,10);
        } else {
            var pickedDateString = formatDate(calendarDate);
        }
        
        insertHTML("disclaimer",disclaimers[selectedCalendarID]);
        if (checkDay(calendarDate)){
            getCalendarItems(pickedDateString);
            var times = "<option>Available times will generate after all information has been entered.</option>";
            $("#times").removeClass("noappts");
            insertHTML("times",times);
            document.getElementById("submit-button").disabled=true;
        } else {
            allDayCount = allDayMax + 1;
            allday=true;
            createOpenTimeArray();
        }
    }

    function getCalendarItems(d){
        if (calendarId == 'Engineering'){
            var url = 'http://www.downers.us/public/cgi/getAppointments.py';
            //DEBUG
            //var url = 'http://gis.vodg.us/inspections/support_files/getAppointments_dev.py';
            allDayCount = 0;
            if (xhr){
                xhr.abort();
            }
            xhr = $.ajax({
                type:'GET',
                url:url,
                data:{d:d.substring(0,10), i:calendarId},
                success:function(data){
                    //console.log(data);
                    eventArray = [];
                    for (var e in data.events){
                        var event = data.events[e];
                        if (typeof event.items != "undefined"){
                            for (var i = 0; i < event.items.length; i++) {
                                eventArray.push(event.items[i]);
                            }
                        }
                    }
                    apptRecd = true;
                    $(".loadSpinner").hide();
                    document.getElementById("scheduleDate").disabled=false;

                    var add = $("#address").val();
                    if (add.length > 0){    
                        getDistances(geoLocation);
                        if ($('#cbDisclaimer').is(':checked')){
                            document.getElementById("submit-button").disabled=false;
                        }
                    }
                },
                error:function(error){
                    console.log("error");
                    //console.log(error);
                    //console.log(error.responseText);
                    if (!$(".loadSpinner").is(":visible")){
                        alert("There was an error retrieving the available appointments. Please refresh the page and try again. If errors persists, please contact the Community Development Department at 630-434-5529 or send an email to the <a href=\"mailto:crc@downers.us\">Community Response Center</a>.");
                    }
                }
              });
        } else {
            loadingSpinnerHide();
            document.getElementById("scheduleDate").disabled=false;
            var times = "<option>Available times will generate after all information has been entered.</option>";
            $("#times").removeClass("noappts");
            insertHTML("times",times);
        }
    }

    function getDistanceFromLatitudeLongitude(lat1,lon1,lat2,lon2){
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +	Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      d = d * 0.621371; // Distance in Miles
      return d;
    }

    function getDistances(g){
        if (apptRecd){
            anyTimeAppts = 0;
            //console.log("Get Distances");
            //console.log(filledTimes);
            // Reset appointments
            amAppts = [];
            pmAppts = [];
            amDistances = [];
            pmDistances = [];
            $(eventArray).each(function() {
                var start = this.start.dateTime;
                if (typeof start != 'undefined'){
                    if (typeof this.location != 'undefined'){
                        var x_index = this.location.indexOf("X:");
                        var y_index = this.location.indexOf("Y:");
                        var x = this.location.substring(x_index+2,y_index-1);
                        var y = this.location.substring(y_index+2,this.location.length-1);
                    } else {
                        var x = -88.004711;
                        var y = 41.795262;
                    }
                    var s = parseInt(start.substring(11,13));
                    if (s < 12 && s > 7){
                        amAppts.push(this);
                        amDistances.push(getDistanceFromLatitudeLongitude(g.y,g.x,y,x));
                    } else if (s >= 12 && s < 18){
                        pmAppts.push(this);
                        pmDistances.push(getDistanceFromLatitudeLongitude(g.y,g.x,y,x));
                    } else if (s == 6){
                        anyTimeAppts++;
                    }
                } else {
                    allDayCount++;
                }
            });
            
            anyTimeAppts = anyTimeAppts/2;

            parseAppointments();
        }
    }

    function getDurationIntervals(event) {
        var s = event.start.dateTime;
        var e = event.end.dateTime;
        var start = parseInt(s.substring(11,13)+s.substring(14,16));
        var end = parseInt(e.substring(11,13)+e.substring(14,16));
        var endHour = parseInt(e.substring(11,13));
        var startHour = parseInt(s.substring(11,13));

        var startMinute = parseInt(s.substring(14,16));
        var endMinute = parseInt(e.substring(14,16));
        var diffHour = endHour - startHour;
        var diffMinute = (endMinute + startMinute)/15;
        if ((startMinute - endMinute) > 0){
            diffHour = diffHour - 1;
        } 
        if (diffMinute > 3){
            diffMinute = (diffMinute-4) / 15;
        }
        diffMinute = diffMinute * 15;
        /*console.log(interval);
        console.log(diffHour*2);
        console.log(diffMinute);*/
        return (diffHour*2) + (diffMinute/60);
    }

    function getFilledAppointments(t){
        for (var i = 0; i < t.length; i++){
            //console.log(t[i]);
            h = getStartHour(t[i]) + getStartMinutes(t[i]);
            var intervals = getDurationIntervals(t[i]);
            //console.log(intervals);
            //console.log(interval);
            for (var j = 0.0; j< (intervals*interval); j = j+interval){
                var time = getTime((h*1.0)+j);
                //console.log(time);
                filledTimes.push(time);
            }
        }
    }

    function getNextAppointment(appt){
        var afterHour = ((getStartHour(appt)*1.0)+getStartMinutes(appt))+getDurationIntervals(appt);
        //console.log(afterHour);
        if (afterHour >= sHour && afterHour < eHour){
            return getTime(afterHour);
        } else {
            return "-1";
        }
    }

    function getPreviousAppointment(appt){
        //console.log(appt);
        //console.log(interval);
        var startHour = (getStartHour(appt)*1.0+getStartMinutes(appt))-interval;
        //console.log(startHour);
        if (startHour >= sHour && startHour < eHour){
            return getTime(startHour);
        } else {
            return "-1";
        }
    }

    function getStartHour(event){
        var s = event.start.dateTime;
        return parseInt(s.substring(11,13));
    }

    function getStartMinutes(event){
        var s = event.start.dateTime;
        var m = parseInt(s.substring(14,16));
        if (m == 30) {
            return 0.5;
        } else {
            return 0.0;
        }
    }

    function getTime(hour){
        if (hour % 1 > 0) {
            time = addZero(hour) + "30";
        } else {
            time = addZero(hour) + "00";
        }
        return time;
    }

    function getTimeColumn(i){
        var min;
        if (i.length == 3){
            hour = parseInt(i.substring(0,1));
            min = i.substring(1,3);
        } else {
            hour = parseInt(i.substring(0,2));
            min = i.substring(2,4);
        }
        var ampm = "a";
        if (hour > 11){
            ampm = "p";
            if (hour > 12){
            hour = hour%12;
            }
        }
        var colTime = hour+":"+min+ampm;
        return colTime;
    }

    function loadingSpinnerHide(){
        $(".loadSpinner").hide();
    }

    function loadingSpinnerShow(){
    }

    function insertHTML(e, h){
        var div = document.getElementById(e);
        div.innerHTML = "";
        div.innerHTML = h;
    }

    function manageDisclaimer(d){
        //console.log("manage disclaimer");
        if ($(d).is(':checked') && $('#address').val().length > 0){
            $('#alert').hide("slow");
            document.getElementById("submit-button").disabled=false;
            if (calendarId == 'Engineering'){
                getDistances(geoLocation);
            } else {
                showOnlyAnyDayAppointments();
            }
        } else if (!($(d).is(':checked')) && $('#address').val().length > 0) {
            document.getElementById("submit-button").disabled=true;
            showAlert("disclaimer");       
        } else {
            document.getElementById("submit-button").disabled=true;
        }
    }

    function parseAppointments() {
        //console.log("Find Closest");
        perferredTimes = [];
        filledTimes = [];
        if (allDayCount <= allDayMax){
            setDistanceOrder();
            getFilledAppointments(amAppts);
            getFilledAppointments(pmAppts);
            //getFilledAppointments(noLocationAppts);
            //console.log(calendarId);
            if (calendarId == "Engineering") {
                filterFilledTimes();
            }
            
        } 
        createOpenTimeArray();
    }

    function populateCalendars(){
        var html = "";
        for (var i = 0; i < calendars.length; i++){
            html += "<option id=\""+ i + "\">" + calendars[i] + "</option>";
        }
        insertHTML("calendars",html);
    }

    function resetForm(f){
        var cForm = document.getElementById(f);
        cForm.reset();
        clearValidate();
        //afterClientLoad();
    }

    function setCalendar(calendar){
        calendarId = $('#calendars option:selected').val();
        $('#cbDisclaimer').prop('checked',false);
        selectedCalendarID = calendars.indexOf(calendarId);
        if (calendarId == 'Engineering'){
            allDayMax = 1;
            
        }
        getAppointments();
    }

    function setDate(d){
        calendarDate = $(d).val();
        var dateArray = calendarDate.split("/");
        //console.log(dateArray);
        calendarDate = new Date(dateArray[2],dateArray[0]-1,dateArray[1]);
        //calendarDate = dateArray[2]+"-"+dateArray[0]+"-"+dateArray[1];
        getAppointments();
    }

    function setDistanceOrder(a){
        var tempAmDistances = amDistances.slice();
        var tempPmDistances = pmDistances.slice();
        amPerferredOrder, pmPerferredOrder = [];
        tempAmDistances = tempAmDistances.sort(function(a,b){return a - b});
        tempPmDistances = tempPmDistances.sort(function(a,b){return a - b});
        amPerferredOrder = setDistanceOrderRanking(amDistances, tempAmDistances);
        pmPerferredOrder = setDistanceOrderRanking(pmDistances, tempPmDistances);
        //console.log(amPerferredOrder);
        //console.log(pmPerferredOrder);
        //set PerferrredTimes for am/pm
        
        setPerferredTimes(0,0);
        setPerferredTimes(1,0);
    }

    // Params -- a = actual, o = ordered
    function setDistanceOrderRanking(a, o){
        var td = a.slice();
        o = uniqueArray(o);
        //console.log(o);
        var dist = [];
        if (td.length >= 2){
            
            if (o.length > 1) {
                dist.push(td.indexOf(o[0]));
                dist.push(td.indexOf(o[1]));
            }
        } else if (td.length == 1){
            dist.push(td.indexOf(o[0]));
        }
        //console.log(dist);
        return dist;
    }

    // Param 1: Time of Day -- 0=AM 1=PM Param 2: Distance Rank -- 0 == first position
    function setPerferredTimes(tod, rank){
        var a;
        var index;
        if (tod == 0){
            a = amAppts;
            // Only set an index when there are more than one location to use. There is no other location than Village Hall and no perferences should be set.
            if (amPerferredOrder.length > 1){
                index = amPerferredOrder[rank];
            } else {
                index = -1;
            }
            
        } else {
            a = pmAppts;
            // Only set an index when there are more than one location to use. There is no other location than Village Hall and no perferences should be set.
            if (pmPerferredOrder.length > 1){
                index = pmPerferredOrder[rank];
            } else {
                index = -1;
            }
        }
        if (typeof index == "undefined") index = -1;
        if (index != -1){
            var startHour = (getStartHour(a[index])*1.0)-interval;
            if (startHour >= sHour && startHour < eHour){
                perferredTimes.push(getTime(startHour));
            }
            var afterHour = (getStartHour(a[index])*1.0)+getDurationIntervals(a[index])*interval;
            if (afterHour >= sHour && afterHour < eHour){
                perferredTimes.push(getTime(afterHour));
            }
        } else {
            if (rank == 0){
                if (tod == 0){
                    perferredTimes.push("0800");
                } else {
                    perferredTimes.push("1300");
                }
            }
        }
    }

    function showOnlyAnyDayAppointments(){
        var day = dayOfWeek(calendarDate);
        var allHTML = "<option value=\"6:00a\">" + day + " - Any time</option>";
        insertHTML("times",allHTML);
    }

    function showAlert(t){
        var text = "Please fill in missing fields";
        if (t == "disclaimer"){
            text = "Please agree to the terms by checking the checkbox in the red section above.";
            var times = "<option>Available times will generate all after information has been entered.</option>";
            $("#times").removeClass("noappts");
            insertHTML("times",times);
        }
        insertHTML("alert",text);
        $('.alert.alert-danger').show("slow");
    }

    function uniqueArray(a){
        //console.log("Filter");
        var tempArray = a.slice();
        tempArray.sort();
        var uArray = [];
        for (var i = 0; i < tempArray.length; i++){
            if (uArray.indexOf(tempArray[i]) == -1){
                uArray.push(tempArray[i]);
            }
        }
        //console.log(uArray);
        return uArray;
    }