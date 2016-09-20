var tasks = {general:"General",garbage:"Refuse Collection"};
$(document).ready(init);

function init(){
    $("#admin-pane").addClass("active");
    insertHTML('taskList',populateTaskList(tasks));
    setDateTimePicker();
}

function populateTaskList(){
    var h = '';
    var first = true;
    $.each(tasks,function(key,value){
        if (first){
            first = !first;
            h += '<li class="active"><a href="javascript:updateView(\''+key+'\')">'+value+'<span class="sr-only">(current)</span></a></li>';
        } else {
            h += '<li><a href="javascript:updateView(\''+key+'\')">'+value+'</a></li>';
        }
    });
    return h;
}

function updateView(viewName){
    console.log(viewName);
}

function setDateTimePicker(){
    $('.datepicker').daterangepicker({
        format: 'M/D/YYYY',
        singleDatePicker: true,
        showDropdowns: true,
        timePicker: true,
        timePickerIncrement: 30,
        timePicker12Hour: true,
        timePickerSeconds: false,
        drops: 'up',
        format: 'MM/DD/YYYY hh:mm A'
    });

}

function sendNotification(notificationType){
    console.log('Sending Notifications');
    
    var d = formParse($('#general-notification'));
    d['nType'] = notificationType;
    
    if (d['message-link'] == 'http://' || d['message-link'].length == 0){
        delete d['message-link']
    }
    console.log(d);
    var messageURL = "http://gis.vodg.us:1337/notification/";
    console.log(messageURL);
    
    $.ajax({
        type:'POST',
        url:messageURL,
        contentType: 'application/json',
        data:JSON.stringify(d),
        dataType:'json',
        success:function(data){
            console.log(data);
            if (data.success){
                alert(data.notifications + ' Notifications Sent');
            }
        },
        error:function(error){
            console.log(error);
            console.log("error");
            console.log(error.responseText);
        }
    });
    
}

function formParse(f){
    var d = {};
    $.each(f[0].elements,function(){
            var v = this.value;
            var i = this.id;
            if (v && i && v.length > 0){
             d[i] = v;
            }
    });
    return d;
}
