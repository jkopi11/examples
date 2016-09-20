var dashboardRequests;

// d -- Dashboard Data, f - filter
// if f is false, it will clear out all the existing charts and repopulate them.
function dashboardCreateCharts(f){
    var d = dashboardRequests;
    
    Highcharts.setOptions({
        chart: {
            style: {
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            }
        }
    });
    console.log(d);
    insertHTML('Dashboard-Graphs','');
    
    var i = 0;
    // st - Subtype
    var st = $('#Dashboard-Subtypes').val();
    if (st != 'Category'){
        $('#dashboardPreviousView').addClass('hide');
    } else {
        $('#dashboardPreviousView').removeClass('hide');
        insertHTML('dashboardPreviousView','<p class="text-info text-center">Click a bar or line to see data on the request types within that category');
    }
    if (f) {
        st = 'Type';
        
        insertHTML('dashboardPreviousView','<a href="javascript:dashboardCreateCharts(false)" class="btn btn-primary">Show All</a>');
    }
    var colors = {};
    // dv - Dashboard View
    var dv = $('#Dashboard-Views').val();
    d = d[dv];
    $.each(d,function(key,value){
        
        var chart = key;
        $.each(d[key],function(key,value){
            if (st == key){
                var e = 'chart-'+i;
                console.log(e);
                var c = 'col-md-3';
                if (dv == 'Performance' || st != 'All'){
                    c = 'col-md-6';
                }
                var h = '<div class="'+c+'" id="'+e+'"></div>';
                $('#Dashboard-Graphs').append(h);
                if (st != 'All' || (st == 'All' && dv == 'Performance')){
                    var chartType = 'bar';
                    var labels = value.labels;
                    var dSeries = value.data;
                    var c = 0;
                    if (dv == 'Performance'){
                        chartType = 'line';
                        labels = d[chart].labels;
                        dSeries = this;
                    }
                    if (f) {
                        var tempArray = [];
                        $.each(dSeries,function(index,data){
                            if (requestData.data.types[this.name] === undefined){
                                console.log(this.name);
                                return;
                            }
                            if (requestData.data.types[this.name].category == f){
                                tempArray.push(this);
                            }
                        });
                        dSeries = tempArray;
                    }
                    console.log(value);
                    console.log(dSeries);
                    var showLabels = true;
                    if (dv == 'Snapshot' && chart != 'Days Open Range'){
                        showLabels = false;
                    }
                    $('#'+e).highcharts({
                        chart:{
                            type:chartType,
                        },
                        exporting:{
                            width: 600,
                        },
                        title:{text:chart},
                        subtitle:{text:d[chart].subtitle},
                        xAxis:{
                            categories:labels,
                            labels: {enabled: showLabels},
                        },
                        /*yAxis:{title:{
                            text: '# of Requests'
                        }},*/
                        series: dSeries,
                        plotOptions: {
                            series: {
                                cursor: 'pointer',
                                point: {
                                    events: {
                                        click: function (e) {
                                            console.log(st);
                                            console.log(e);
                                            if (st == 'Category'){
                                                var filter = false;
                                                if (dv == 'Snapshot'){
                                                    filter = this.name;
                                                } else if (dv == 'Performance'){
                                                    filter = this.series.name;
                                                }
                                                dashboardCreateCharts(filter);
                                            } else {
                                                var target = e.currentTarget;
                                                var chartTitle = target.series.chart.title.textStr;
                                                var daysOpen;
                                                var barLineName = target.name;
                                                console.log(chartTitle);
                                                if (chartTitle === 'Days Open Range'){
                                                    daysOpen = e.point.name;
                                                    barLineName = target.series.name;
                                                }
                                                console.log(daysOpen);
                                                updateFilterForChartClick(target.series.chart.title.textStr,daysOpen); 
                                                if (st === 'Dept'){
                                                    filters['DeptText'].query = "DeptText = '"+barLineName+"'";
                                                    filters['DeptText'].queryText = "Department is "+barLineName;
                                                    filters['DeptText'].visible = true;
                                                } else if (st == 'Type'){
                                                    filters['RequestTypeText'].query = "RequestTypeText = '"+barLineName+"'";
                                                    filters['RequestTypeText'].queryText = "RequestTypeText is "+barLineName;
                                                    filters['RequestTypeText'].visible = true;
                                                }
                                                var dashboardCallback = function(){
                                                if ($("#request-list .table-container").length != 0){
                                                        populateTable(filteredRequests,'request-list',true,{purpose:'List'});
                                                    }
                                                    setTimeout(function(){queryInsertDescription(filteredRequests.length,{purpose:'List'});},2000);
                                                    $('#list-tab > a').click();                                      
                                                }
                                                listFilterSortLocal(null,null,null,dashboardCallback);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    var c = 'text-info';
                    if (value > 100){
                        c = 'dashboard-bg-danger';
                    }
                    console.log(value);
                    var h = '<h3 class="h4 text-center">'+chart+'<br><small>'+d[chart].subtitle+'</small></h3><p class="text-center dashboard-stats '+c+'">'+value.data[0].y+'</p>';
                    insertHTML(e,h);
                }
                i++;
            }
        });
    });
    if (st == 'Type'){
        $('#Dashboard-Subtypes').val('Type');
    }
    loadingHide();
}

function dashboardGetInfo(){
    loadingShow();
    //var v = formatFilterDate($('#Dashboard-Timeframe option:selected').text());
    //var url = './support_files/Dashboard_Handler.py';
    var url = 'http://www.downers.us/public/json/request_dashboard.json';
    //var d = {'timeframe':v};
    //console.log(d);
    $.ajax({
        type:'GET',
        url:url,
        //data:d,
        dataType:'json',
        success:function(data){
            data = JSON.parse(data);
            dashboardRequests = data;
            dashboardCreateCharts(false);
        },
        error:function(error){
            console.log("error");
            console.log(error);
            console.log(error.responseText);
        }});
}

function loadDashboardTab(){
    if ($('#request-dashboard-container').length == 0){
        var h ='';
        // Create Container
        h += '<div id="request-dashboard-container" class="col-md-12"><form id="dashboard-filter" class="form-inline" role="form">';
        // Add dropdown for view
        h += '<div class="form-group col-md-4"><label for="Dashboard-Views" class="col-md-4">View</label><div class="col-md-8"><select id="Dashboard-Views" class="form-control">'+populateDropdownDict(requestData.data.dashboardViews)+'</select></div></div>';
        // Add dropdown for subtype
        h += '<div class="form-group col-md-4"><label for="Dashboard-Subtypes" class="col-md-4">Type</label><div class="col-md-8"><select id="Dashboard-Subtypes" class="form-control">'+populateDropdownDict(requestData.data.dashboardTypes)+'</select></div></div>';
        h += '<div id="dashboardPreviousView" class="col-md-4 hide"></div>';
        // Add dropdown for subtype filter
        //console.log(requestData);
        /*h += '<div id="subfilter-div" class="form-group col-md-4"><label for="Dashboard-SubFilters" class="col-md-4">Department</label><div class="col-md-8"><select id="Dashboard-SubFilters" class="form-control"><option value="all">All</option>'+populateDropdownFromArray(requestData.data.departments)+'</select></div></div>';*/
        // Close form and div
        h += '</form></div>';

        // Create div for charts
        h += '<div id=\'Dashboard-Graphs\' class="col-md-12"></div>';
        // Add tool container
        insertHTML('request-dashboard',h);
        $('#Dashboard-Tools').hide();
        dashboardGetInfo();
        $('#Dashboard-Views').val('Snapshot');
        $('#Dashboard-Subtypes').val('All');

        // Show Charts for Subtype
        // If there are requests, just repopulate charts with existing data
        var f = function(e){
            if (typeof dashboardRequests != 'undefined'){
                dashboardCreateCharts(false);
            } else {
                dashboardGetInfo();
            }
            if ($('#Dashboard-Subtypes').val() != 'All'){
                $('#Dashboard-Tools').show();
            } else {
                $('#Dashboard-Tools').hide();
            }
        };
        $('#Dashboard-Subtypes').on('change',f);
        $('#Dashboard-Views').on('change',f);
    }
}

function updateFilterForChartClick(chartTitle,daysOpenRange){
    listFilterReset();
    var chartFilters = {'Open Requests':function(){
            var allOpen = "StatusText <> 'Completed' AND StatusText <> 'Complete' AND StatusText <> 'Delete' AND StatusText <> 'Outside Jurisdiction'";
            filters['StatusText'].query = allOpen;
            filters['StatusText'].queryText = 'Status is not completed or outside jurisdiction';
        },'Acted On Requests':function(){
            filters['StatusText'].query = 'StatusText <> \'New Request\'';
            filters['StatusText'].queryText = 'Status is not New Request';
            filters['StatusText'].visible = true;
            filters['StatusDate'].query = 'StatusDate > ' + moment().subtract(30,'days').unix();
            filters['StatusDate'].queryText = 'Status has changed in the last 30 days';
            filters['StatusDate'].visible = true;
            filters['Description'].visible = false;
        },'Requests w/o Actions':function(){
            filters['StatusText'].query = 'StatusText <> \'Completed\' AND StatusText <> \'Complete\' AND StatusText <> \'Delete\' AND StatusText <> \'Outside Jurisdiciton\'';
            filters['StatusText'].queryText = 'Status is New Request';
            filters['StatusText'].visible = true;
            filters['StatusDate'].query = 'StatusDate == SubmittedDate';
            filters['StatusDate'].queryText = 'No updates have taken place since being submitted';
            filters['StatusDate'].visible = true;
            filters['Description'].visible = false;
        },'Days Open Range':function(daysOpenRange){
            console.log(daysOpenRange);
            filters['DaysOpen'].query = getDaysOpenRangeQuery(daysOpenRange);
            filters['DaysOpen'].queryText = getDaysOpenRangeQueryText(daysOpenRange);
            filters['DaysOpen'].visible = true;
            filters['Description'].visible = false;
        },'Closed Requests':function(){
            filters['StatusText'].query = 'StatusText = \'Completed\'';
            filters['StatusText'].queryText = 'Requests that have been completed';
            filters['StatusText'].visible = true;
            filters['StatusDate'].query = 'StatusDate > ' + moment().subtract(30,'days').unix();
            filters['StatusDate'].queryText = 'Status has changed in the last 30 days';
            filters['StatusDate'].visible = true;
            filters['Description'].visible = false;
        },'Days Open':function(){
        },'# of Actions':function(){
        },'New Requests':function(){
            filters['SubmittedDate'].query = 'SubmittedDate > ' + moment().subtract(30,'days').unix();
            filters['SubmittedDate'].queryText = 'Submitted in the last 30 days';
            filters['SubmittedDate'].visible = true;
            filters['Description'].visible = false;
        }
    };
           
    return chartFilters[chartTitle](daysOpenRange);
}

function getDaysOpenRangeQuery(daysOpen){
    var daysOpenQuery = {
        '0':function(){
            return 'DaysOpen < 31';
        },
        '31':function(){
            return 'DaysOpen > 30 AND DaysOpen < 91';
        },
        '91':function(){
            return 'DaysOpen > 90 AND DaysOpen < 181';
        },
        '181':function(){
            return 'DaysOpen > 180 AND DaysOpen < 270';
        },
        '271':function(){
            return 'DaysOpen > 270 AND DaysOpen < 366';
        },
        '365':function(){
            return 'DaysOpen > 365';
        }
    };
    return daysOpenQuery[daysOpen]();
}

function getDaysOpenRangeQueryText(daysOpen){
    var daysOpenQueryText = {
        '0':function(){
            return 'Between 0-30 days open';
        },
        '31':function(){
            return 'Between 31-90 days open';
        },
        '91':function(){
            return 'Between 91-180 days open';
        },
        '181':function(){
            return 'Between 181-270 days open';
        },
        '271':function(){
            return 'Between 271-365 days open';
        },
        '365':function(){
            return 'Over 365 days open';
        }
    };
    return daysOpenQueryText[daysOpen]();
}
