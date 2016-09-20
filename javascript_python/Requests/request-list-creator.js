// simple node app to extract data from MSSQL

var sql = require('mssql');

var config = {
    user: 'vodg\jkopinski',
    password: '1234567890',
    server: 'localhost', // You can use 'localhost\\instance' to connect to named instance 
    database: 'sde'
}

sql.connect(config, function(err) {
    if (err) {
        console.dir(err);
    }
    
    console.log("Connected");
    
    var request = new sql.Request();
    request.query('SELECT * FROM [sde].[data].[Requests_311] WHERE RequestID IS NOT NULL', function(err, recordset) {
        if (err) {
            console.dir("Query Error");
            console.dir(err);
        }
 
        console.dir(recordset);
    });
    
    sql.close()
});

sql.close();