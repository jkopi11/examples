function getEventItems(){
  $.getJSON("/requests/support_files/eventItems.json",function(data){
    eventItems = data.eventItems;
    showEventItem();
    $('.event-container').removeClass('hide');
  });
}

function showEventItem(){
  $('#eventItemContext').fadeTo(3000,0,updateEventItem);
}

function updateEventItem(){
  var eventItem = eventItems[eventItemIndex];
  var eventParagraph = "";
  if (eventItem.title){
    eventParagraph += "<p class=\"text-left\"><b>"+eventItem.title+"</b></p>";
  }
  eventParagraph += "<p class=\"text-center\">"+eventItem.description+"</p>";
  eventParagraph += "<p class=\"text-right help-block\">"+moment(eventItem.timestamp*1000).format("MM/DD/YYYY hh:mm A")+"</p>";
  insertHTML("eventItemContext",eventParagraph);
  $('#eventItemContext').fadeTo(3000,1);
  eventItemIndex++;
  if (eventItemIndex >= eventItems.length){
    eventItemIndex = 0;
  }
  setTimeout(showEventItem,10000);
}