var months = {'0':'January','1':'February','2':'March','3':'April','4':'May','5':'June','6':'July','7':'August','8':'September','9':'October','10':'November','11':'December'};

function capFirstLetter(s){
    return s.replace(/(\w)(\w*)/g,
        function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});
}

function capitalizeFirstLetter(s)
{
    return s[0].toUpperCase() + s.slice(1);
}

function cloneObjectInternal(value) {
    if (!value) { return value; }

    var returnVal;
    if (Object.prototype.toString.call(value) === '[object Array]') {
      returnVal = [];
      for(var i = 0; i < value.length; i++) {
        returnVal.push(cloneObjectInternal(value[i]));
      }

      return returnVal;
    }

    if (typeof value !== 'object') { return value;}

    returnVal = {};
    for(var prop in value) {
      returnVal[prop] = cloneObjectInternal(value[prop]);
    }

    return returnVal;
  }

function getCurrentDate(){
    var dt = new Date();
	dt = ( dt.getMonth()+1)+"/"+dt.getDate()+"/"+dt.getFullYear();
    return dt;
}

function getFormattedDate(m,d,y){
    return m + " " + d + ", " + y;
}

function getFormmatedFullDateTimeFromMilliseconds(d){
    var td = new Date(d);
    var ampm = "AM";
    if (td.getHours() > 11){
        ampm = "PM";
    }
    return months[td.getMonth()] + " " + td.getDate() + ", " + td.getFullYear() + " " + (td.getHours() % 12) + ":" + td.getMinutes() + " " + ampm;
}

function populateDropdownFromArray(a){
    var h = '';
    $.each(a,function(){
        h += "<option value=\"" + this + "\">" + this + "</option>";
    });
    return h;
}

function populateDropdownFromValue(r){
    var h = '';
    $.each(r,function(key,value){
        h += "<option value=\"" + value + "\">" + value + "</option>";
    });
    return h;
}

function populateDropdownFromKey(r){
    var h = '';
    $.each(r,function(key,value){
        h += "<option value=\"" + key + "\">" + key + "</option>";
    });
    return h;
}

function populateDropdownFromKeyValue(r){
    var h = '';
    $.each(r,function(key,value){
        h += "<option value=\"" + key + "\">" + value + "</option>";
    });
    return h;
}

// I use this function because it preserves the class and styling of an element while still being able to update the content
function insertHTML(e, h){
    var div = document.getElementById(e);
    // This is used to catch instances where request type lists are updated, but not yet created. 
    if (div === null){
        return;
    }
    //console.log(div);
    div.innerHTML = "";
    div.innerHTML = h;
}

function populateDropdownEmployee(r){
    r = sortDictionaryEmployeeToArray(r);
    var h = '';
    $.each(r,function(){
        var p = this.split('---');
        
        h += "<option value=\"" + p[1] + "\">" + p[0] + "</option>";
    });
    return h;
}

function populateDropdownViolations(r){
    var h = '';
    $.each(r,function(key,value){
        h += "<option value=\"" + value.SectionNumber + "\">" + key + "</option>";
    });
    return h;
}

function populateDropdownDict(r){
    var h = '';
    $.each(r,function(key, value){
        h += "<option value=\"" + key + "\">" + value + "</option>";
    });
    return h;
}


function populateDropdownHTML(f,r){
    var list = '';
    if (f == 'DaysOpen'){
        list = populateDropdownFromKey(r);
    } else {
        list = populateDropdownFromValue(r);
    }
    return '<th><select id="filter-' + f + '" class="form-control" type="text"><option value="all">All</option>'+ list + '</select></th>';
}

function populateDropdownHTMLForLocationFilter(f,r){
    var list = [];
    $.each(r,function(key,value){
        if (value.attributes.Type == f){
            list.push(key);
        }
    });
    list = populateDropdownFromArray(list);
    return '<th><select id="filter-' + f + '" class="form-control" type="text"><option value="all">All</option>'+ list + '</select></th>';
}

function populateDropdownHTMLFromDict(f,r){
    if (f == 'status'){
        return '<select id="filter-' + f + '" class="form-control" type="text">'+ populateDropdownDict(r)+ '</select>';
    } else if (f == 'assignEmp'){
        return '<th><select id="' + f + '" class="form-control" type="text"><option value="9999">Unassigned</option>'+ populateDropdownEmployee(r)+ '</select></th>';
    } else if (f !="assign"){
        return '<th><select id="'+active+'-' + f + '" class="form-control" type="text"><option value="all">All</option>'+ populateDropdownEmployee(r)+ '</select></th>';
    } else {
        return '<select id="filter-' + f + '" class="form-control">'+ populateDropdownEmployee(r)+ '</select>';
    }
}

function populateRequestListFromArray(a,href){
    var h = '';
    $.each(a,function(){
        h += '<li><a href="javascript:requestTypeSet(\''+this+'\')">' + this + "</a></li>";
    });
    
    return h;
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

function sortDictionaryEmployeeToArray(d){
    var a = [];
    $.each(d,function(key,value){
        a.push(value.name+'---'+key);
    });
    a.sort();
    return a;
}

function urlReset(){
    /*var url = document.location.href;
    var redirect = '/requests_dev/';
    if (url.search('/requests_dev/')>0){
        redirect = '/requests_dev/';
    }*/
    console.log(window.location.pathname);
    var redirect = window.location.pathname;
    redirect = redirect.replace('index.html','');
    window.history.pushState('object or string', 'Title', redirect);
}
