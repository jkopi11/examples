// exporting CRM data to a CSV

var list = [];

$("document").ready(function(){
	getRequestList();
});

function getRequestList(){
	console.log("get request list");
	//console.log("e.length " + e.length);
	
	var query = "where=OBJECTID%20IS%20NOT%20NULL";
	
	query += "&objectIds=&time=&geometry=&geometryType=&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=%2a&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&gdbVersion=GISUSER.Requests&returnIdsOnly=false&returnCountOnly=false&orderByFields=OBJECTID&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&f=pjson";
	
	$.ajax({
		type:'GET',
		url:'http://parcels.downers.us/arcgis/rest/services/Public/Requests311/FeatureServer/0/query?',
		dataType: 'json',
		data: query,
		success: function (result){
			$(result.features).each(function(){
				var count = result.features.length;
				if (count > 0){
					list = [["Type","Address","Submit Date", "RequestID", "Description"]];
					var listDetails = "<table id=\"tRequests\">";
					listDetails += "<tr><td>Type</td><td>Address</td><td>Submitted Date</td><td>Request ID</td><td collspan=\"2\">Description</td></tr>";
					var i = 0;
					$(result.features).each(function(){
						
						//console.log(this);
						var listType = checkNull(this.attributes.Type);
						var listAddress = checkNull(this.attributes.Address);
						var listSubmitDate = checkNull(this.attributes.sDate);
						var listRequestID = checkNull(this.attributes.RequestID);
						var listDesc = checkNull(this.attributes.Description);
						
						list.push([listType, listAddress, listSubmitDate, listRequestID, listDesc]);
						listDetails += "<tr class=\"white_row\"><td>"+ listType + "</td><td>" + listAddress + "</td><td>"+ listSubmitDate + "</td><td>" +
							listRequestID + "</td><td>"+ listDesc + "</td></tr>";
						i++;
					});
					listDetails += "</table>";
					var requestListTable = document.getElementById("list");
					requestListTable.innerHTML = listDetails;
				}
				});
				createCSV();
		},
		error: function (xhr, status, error){
			console.log(error);
			console.log(xhr.responseText);
	}});
	 
}

function createCSV(){
	console.log("Create CSV");
	var csvContent = "";
	$(list).each(function(){
		console.log(this);
		var dataString = "";
		var count = this.length;
		console.log(count);
		var i = 0;
		$(this).each(function (){
			i++;
			if (i < count){
				dataString += this + ",";
			} else {
				console.log("\n");
				dataString += this + "\n";
			}
		});
		csvContent += dataString;
	});
	console.log(csvContent);
	var encodedUri = encodeURI(csvContent);
	var download = document.getElementById('csv');
	download.setAttribute('href', 'data:application/octet-stream,' + encodeURIComponent(csvContent));
	download.setAttribute('download', 'test.csv');
}

function checkNull(c){
	if (c == null){
		return "";
	} else {
		return c;
	}
}