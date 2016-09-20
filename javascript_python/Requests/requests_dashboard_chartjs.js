Chart.defaults.global.responsive = true;

// el = is the boolean that either creates the HTML elements or inserts the charts
function dashboardCreateCharts(d){
    var i = 0;
    $.each(d,function(key,value){
        var chart = key;
        $.each(d[key],function(key,value){
            var e = key+i;
            var chartLabel = chart + " by " + key;
            var f = this;
            var h = '<div class="col-md-3"><h2>'+chartLabel+'</h2><canvas id="'+e+'"></canvas></div>';
            $('#Dashboard-Graphs').append(h);
            var d = {
                labels:f.labels,
                datasets: [{ 
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data:f.data
                }]
            };
            var max = f.max;
            var steps = 4;
            var ctx = document.getElementById(e).getContext("2d");
            var options = {responsive:true,
                           animation: true,
                           showScale: true,
                           showTooltips: true,
                           multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>",
                           scaleOverride: true,
                           scaleSteps: steps,
                           scaleStepWidth: Math.ceil(max / steps),
                           scaleStartValue: 0
            };
            var newChart = new Chart(ctx).Bar(d,options);
            newChart.getBarsAtEvent(
            $('#'+e).click(function(){
                console.log(this);
                var activeBars = newChart.getBarsAtEvent(this);
                console.log("Click: " + activeBars);
            });
            $('#'+e).hover(function(){
                console.log(this);
                var activeBars = newChart.getBarsAtEvent(this);
                console.log("Hover: " + activeBars);
            });
            
        });
        i++;
    });
}

function dashboardGetInfo(){
    console.log("Dashboad Get Info");
    var v = formatFilterDate($('#Dashboard-Timeframe option:selected').text());
    var url = './support_files/Dashboard_Handler.py';
    var d = {'timeframe':v};
    console.log(d);
    $.ajax({
        type:'GET',
        url:url,
        data:d,
        dataType:'json',
        success:function(data){
            dashboardCreateCharts(data,true);
        },
        error:function(error){
            console.log("error");
            console.log(error);
            console.log(error.responseText);
        }});
}

function loadDashboardTab(){
    var h ='';
    // Create Container
    h += '<div class="col-md-12"><form id="dashboard-filter" class="form-inline" role="form">';
    // Add dropdown for timeframe
    h += '<div class="form-group col-md-4"><label for="Dashboard-Timeframe" class="col-md-4">Timeframe</label><div class="col-md-8"><select id="Dashboard-Timeframe" class="form-control">'+populateDropdownDict(requestData.data.timeFrames)+'</select></div></div>';
    // Add dropdown for department
    h += '<div class="form-group col-md-4"><label for="Dashboard-Department" class="col-md-4">Department</label><div class="col-md-8"><select id="Dashboard-Department" class="form-control"><option value="all">All</option>'+populateDropdownFromArray(requestData.data.departments)+'</select></div></div>';
    // Close form and div
    h += '</form></div>';
    // Create div for charts
    h += '<div id=\'Dashboard-Graphs\'></div>';
    insertHTML('request-dashboard',h);
    dashboardGetInfo(); 
    $('#Dashboard-Timeframe').on('change',dashboardGetInfo);
}
