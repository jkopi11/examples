function showEmergencyModeOptions(){
  var html = '';
  var emergencyMode = false;
  html += '<ol class="breadcrumb"><li><a href="javascript:showSettings()">Settings</a></li>';
  if (!emergencyMode){
      html += '<li class="active">Activate Emergency Mode</li>';
  } else {
      html += '<li class="active">Update/Deactivate Emergency Mode</li>';
  }
  html += '</ol>';
  html += '<form class="form" action="javascript:updateEmergencyOptions()"><div class="col-md-12">';
  $.each(requestData.data.types,function(key,value){
      html += '<div class="col-md-3 checkbox"><label><input name="'+key+'" type="checkbox">'+key+'</label></div>';
  });
  html += '</div><button type="submit" class="btn btn-primary">Submit</button>';
  html += '</form>';
  insertHTML("settings-main",html);
}

function showSettings(){
  var html = '';
  if (localRequests && !isLoadingRequests){
      html += '<h3 class="h4">Sync Requests</h3>'
      html += '<p>With Google Chrome, requests are saved locally to your computer. It is possible, but not likely, they may not all sync correctly. Use this button to resync your requests. This process may take a minute or two to complete.</p>';
      html += '<div class="small-indent"><a href="javascript:syncRequests()" class="btn btn-default">Sync Requests</a></div>';
  }
  if (email == 'jkopinski@downers.us'){
      html += '<h3 class="h4">Emergency Mode</h3>';
      html += '<div class="small-indent"><a href="javascript:showEmergencyModeOptions()" class="btn btn-danger">Active/Update Emergency Mode</a></div>';
  } 
  if (isChromeDesktop){
    html += '<h3 class="h4">Local Requests</h3>';
    html += '<div class="small-indent"><a href="javascript:toggleLocalRequestsSettingForChromeDesktop()" class="btn btn-default">Turn ' + (localRequests ? 'Off' : 'On' ) + ' Local Requests</a></div>';
  }
  html += '<h3 class="h4">Log in/out</h3>';
  html += '<div class="small-indent">';
  html += '<a href="javascript:showLoginOptions()" class="btn btn-default">'+(email != undefined || email != null ? 'Not ' + email + '?' : 'Log In') +'</a></div>';
  // Remove active class so that another tab longer appears active in the navigation bar
  $(".tab-content > .active").removeClass("active");
  $("#settings-pane").addClass("active");
  active = "Settings";
  insertHTML("settings-main",html);
}

function syncRequests(){
  localStorage.removeItem('requests_local');
  localStorage.removeItem('requests_lastupdate');
  requestsUpdated = false;
  var callback = function (){
      $('#new-tab > a').click();
  }
  getRequestsFeatureData(null,null,null,null,"newmap",callback);
}

function toggleLocalRequestsSettingForChromeDesktop(){
  // Local Storage booleans are stored as a string. Need to check string first and then convert it back to a boolean
  var local = (localStorage.getItem('requests_local') && localStorage.getItem('requests_local') == 'false' ? true : false);
  localStorage.setItem('requests_local',local);
  localStorage.removeItem('requests_lastupdate');
  if (!local){
    deleteRequestsFromLocalStorage();
  }
  window.location.reload();
  
}