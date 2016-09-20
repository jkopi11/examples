var requestHandlerURL = "../public/cgi/crc/requests-lookup-handler.py";

function lookupRequest(){
  
  var lookupID = $('#RequestID').val();
  console.log(lookupID);
  if (lookupID.length > 0){
    $.ajax({
      type:'POST',
      url:requestHandlerURL,
      data:{RequestID:lookupID},
      dataType:'json',
      success:function(data){
          lookupHandler(data);
      },
      error:function(error){
          console.log("error");
          console.log(error.responseText);
      }
    });
  }
}

function insertHTML(e, h){
    var div = document.getElementById(e);
    //console.log(div);
    div.innerHTML = "";
    div.innerHTML = h;
}

function lookupHandler(request){
  var request = request.result;
  console.log(request);
  var dateFormat = "MM/DD/YYYY hh:mm A";
  
  var html = '<h3>Result</h3>';
  if (request.length > 0){
    request = request[0];
    html += '<dl class="dl-horizontal"><dt>RequestID</dt><dd>'+request.RequestID + '</dd>';
    html += '<dt>Request Type</dt><dd>'+request.RequestTypeText+'</dd>';
    html += '<dt>Submitted</dt><dd>'+moment.utc(request.SubmittedDate).format(dateFormat)+'</dd>';
    html += '<dt>Status</dt><dd>'+ request.StatusText + '</dd>';
    html += '<dt>Status Changed On</dt><dd>' + moment.utc(request.StatusDate).format(dateFormat) + '</dd></dl>';
  } else {
    html += 'No request found.';
  }
  insertHTML('lookup-result',html);
}