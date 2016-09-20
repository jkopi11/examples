var mongo  = require('mongodb').MongoClient,
    fs        = require('fs'),
    dataRoot  = './data/',
    projs     = dataRoot + 'projections.csv',
    salaries  = dataRoot + 'salaries.csv',
    resultStr = '',
    Converter = require("csvtojson").Converter,
    converter = new Converter({}),
    uri       = 'mongodb://localhost/fantasynfl',
    mdb,players,cursor,player;

mongo.connect(uri, function(err, db) {
    if (err) console.log(err);
    mdb = db;
    players = db.collection('players');
    lineups = db.collection('lineups');
    //players.removeMany();
    //readAndSetSalaries(salaries,players);
    //readAndSetProjections(projs,players);
    //lookupPlayers(players);
    lookupLineups(lineups);
});

function lookupPlayers(col){
    cursor = col.find({team:'NE'}).toArray(function(err,docs){
        console.log('players',docs.length);
        for (var j = 0; j < docs.length; j++){
            console.log(docs[j]);
        }
        mdb.close();
        process.exit(0);
    });
}

function lookupLineups(col){
    cursor = col.find().toArray(function(err,docs){
        console.log('lineups',docs.length);
        for (var j = 0; j < docs.length; j++){
            console.log(docs[j]);
        }
        mdb.close();
        process.exit(0);
    });
}
