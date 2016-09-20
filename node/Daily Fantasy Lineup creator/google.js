var GoogleSpreadsheet = require("google-spreadsheet"),
    sheet             = new GoogleSpreadsheet('16Zg06trEnXSxja7cp52QwXP9anVDJ-9Kwo0izupuB9A'),
    creds             = require('./gdrive.json'),
    mongo             = require('mongodb').MongoClient,
    uri               = 'mongodb://localhost/fantasynfl',
    mdb,
    dbPlayers,
    dbLineups,
    worksheets,
    worksheet,
    row,
    proj,
    playerCopy,
    updatePlayer,
    week,
    updateNum         = 0;

mongo.connect(uri, function (err, db) {
    if (err) console.log(err);
    mdb     = db;
    dbPlayers = db.collection('players');
    //mdb.createCollection('lineups');
    dbLineups = db.collection('lineups');
    // true for projections, false for real stats
    //getGData(true);
    //getSalaries();
    //calculateTeams('projections','Week15');
    getTopLineups(10,{'QB.name':'Carson Palmer'});
});

function calculateTeams(statType,week) {
    var p,
        ogQBsPool  = [],
        ogRBs      = [],
        ogWRs      = [],
        ogTEsPool  = [],
        ogDEFsPool = [],
        ogKsPool   = [],
        ogRBsPool  = [],
        ogWRsPool  = [],
        lineups    = [],
        teamSalary = 0.0, teamPoints = 0.0,
        position, points,
        rbs, wrs, lp, lineupsPerQB = 0,
        lineup,initHighPoints = 0, highPoints;
    dbLineups.remove({});
    dbPlayers.find({}).toArray(function (err, docs) {
        // Loop through players and place them in position arrays
        for (var i = 0; i < docs.length; i++) {
            p = docs[i];
            position = p.position;
            if (typeof p[statType] === 'undefined' || typeof p[statType][week] === 'undefined' || typeof p.salary === 'undefined'){
                continue;
            } else {

                points = p[statType][week]['fantasypoints'];
                console.log(points);
                if (points < 17.5 && /QB/.test(position)){
                    continue;
                } else if (points < 13 && /WR|RB/.test(position)){
                    continue;
                } else if (points < 10 && /TE/.test(position)) {
                    continue;
                } else if (points < 8.1 && /K/.test(position)) {
                    continue;
                } else if (points < 6 && /DST/.test(position)) {
                    continue;
                }
            }
            p = getStats(p,statType,week);
            if (!p){
                continue;
            }
            if (position == 'QB') {
                ogQBsPool.push(p);
            } else if (position == 'RB') {
                ogRBs.push(p);
            } else if (position == 'WR') {
                ogWRs.push(p);
            } else if (position == 'TE') {
                ogTEsPool.push(p);
            } else if (position == 'K') {
                ogKsPool.push(p);
            } else if (position == 'DST') {
                ogDEFsPool.push(p);
            }
        }
        console.log(ogQBsPool.length, ogRBs.length, ogWRs.length, ogTEsPool.length, ogKsPool.length, ogDEFsPool.length);
        // Run combinations for RBs and WRs
        ogRBsPool = getRBCombos(ogRBs);
        ogWRsPool = getWRCombos(ogWRs);
        ogRBs = null;
        ogWRs = null;
        for (var a = 0; a < ogQBsPool.length; a++) {
            console.log(lineupsPerQB);
            console.log(ogQBsPool[a].name);
            console.log(highPoints);
            lineupsPerQB = 0;
            highPoints = initHighPoints;
            for (var b = 0; b < ogRBsPool.length; b++) {
                for (var c = 0; c < ogWRsPool.length; c++) {
                    for (var d = 0; d < ogTEsPool.length; d++) {
                        //for (var e = 0; e < ogDEFsPool.length; e++) {
                        //    for (var f = 0; f < ogKsPool.length; f++) {
                                rbs = ogRBsPool[b];
                                wrs = ogWRsPool[c];
                                lineup = {
                                    QB : ogQBsPool[a],
                                    RB1 : rbs['RB1'],
                                    RB2 : rbs['RB2'],
                                    WR1 : wrs['WR1'],
                                    WR2 : wrs['WR2'],
                                    WR3 : wrs['WR3'],
                                    TE  : ogTEsPool[d]
                                    //DST : ogDEFsPool[e],
                                    //K   : ogKsPool[f]
                                }
                                for (var pos in lineup) {
                                    lp = lineup[pos];
                                    teamPoints += lp.points;
                                    teamSalary += lp.salary;
                                }
                                lineup['points'] = teamPoints;
                                lineup['salary'] = teamSalary;
                                //console.log(teamPoints);
                                if (teamPoints > highPoints && teamSalary < 50000){
                                    highPoints = teamPoints;
                                    console.log(highPoints);
                                    lineups.push(lineup);
                                    for (var i in lineup) {
                                        if (!/points|salary/.test(i)){
                                            console.log(i,lineup[i].name);
                                        } else {
                                            console.log(i,lineup[i]);
                                        }
                                    }
                                    console.log('-------');
                                    lineupsPerQB++;
                                    //if (teamPoints > 123) {
                                    //    for (var i in lineup) {
                                    //        if (!/points|salary/.test(i)){
                                    //            console.log(i,lineup[i].player);
                                    //        } else {
                                    //            console.log(i,lineup[i]);
                                    //        }
                                    //    }
                                    //    console.log('-------');
                                    //}
                                    //if (lineups.length % 40000 == 0) {
                                    //    for (var i in lineup) {
                                    //        if (!/points|salary/.test(i)){
                                    //            console.log(i,lineup[i].name);
                                    //        } else {
                                    //            console.log(i,lineup[i]);
                                    //        }
                                    //    }
                                    //    console.log('-------');
                                    //}
                                }
                                teamPoints = 0;
                                teamSalary = 0;
                        //    }
                        //}
                    }
                }
            }
        }

        dbLineups.insertMany(lineups,function(err,result){
            if (err) {
                console.log('error',err);
                return;
            }
            console.log('result',result.length);
            mdb.close();
            process.exit(0);
        });

        //for (var xx = 0; xx < lineups.length; xx + 40000) {
        //    lineup = lineups[xx];
        //
        //}



    });
}

function getStats(pl,statType,week){
    var pr;
    if (typeof pl[statType] === 'undefined' || typeof pl[statType][week] === 'undefined'){
        return false;
    }
    if (typeof pl.salary === 'undefined'){
        console.log('salary',pl.player);
        return false;
    }
    pr =  pl[statType][week];
    console.log(pr);
    return {
        name   : pl.player,
        points : parseFloat(pr['fantasypoints']),
        position : pl.position,
        opp : pr.opp,
        salary : parseInt(pl.salary)
    }
}

function getRBCombos(rbs) {
    var rb1   = rbs.slice(0),
        rb2   = rbs.slice(0),
        final = [], combo, p1, p2;
    for (var i = 0; i < rb1.length; i++) {
        p1 = rb1[i];
        for (var j = 0; j < rb2.length; j++) {
            p2 = rb2[j];
            if (p1 != p2) {
                final.push({
                    RB1 : p1,
                    RB2 : p2
                });
            }
        }
    }
    return final;
}

function getWRCombos(wrs) {
    var wr1   = wrs.slice(0),
        wr2   = wrs.slice(0),
        wr3   = wrs.slice(0),
        final = [], combo, p1, p2, p3;

    for (var i = 0; i < wr1.length; i++) {
        p1 = wr1[i];
        for (var j = 0; j < wr2.length; j++) {
            p2 = wr2[j];
            for (var k = 0; k < wr3.length; k++) {
                p3 = wr3[k];
                if (p1 != p2 && p1 != p3 && p2 != p3) {
                    final.push({
                        WR1 : p1,
                        WR2 : p2,
                        WR3 : p3
                    });
                }
            }
        }
    }
    return final
}

function getGData(proj) {
    var regex,test;
    sheet.useServiceAccountAuth(creds, function (err) {
        if (err) {
            console.log(err);
            return;
        }
        sheet.getInfo(function (err, info) {
            if (err) {
                console.log(err);
                return;
            }
            worksheets = info.worksheets;

            for (var i = 1; i < worksheets.length; i++) {
                worksheet = worksheets[i];
                regex = new RegExp(proj ? 'Proj' : 'Real');
                test      = regex.test(worksheet.title);
                if (test) {
                    console.log(worksheet.title);
                    worksheet.getRows(function (err, rows) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        for (var j = 0; j < rows.length; j++) {
                            row          = rows[j];
                            playerCopy   = JSON.parse(JSON.stringify(row));
                            updatePlayer = {
                                name     : playerCopy.player,
                                position : playerCopy.pos,
                                team     : playerCopy.team
                            };
                            delete playerCopy.Player;
                            delete playerCopy.Pos;
                            delete playerCopy.Team;
                            delete playerCopy.Gms;
                            delete playerCopy.id;
                            delete playerCopy.title;
                            delete playerCopy.content;
                            delete playerCopy._links;
                            delete playerCopy.save;
                            delete playerCopy.del;
                            delete playerCopy._xml;
                            week         = 'Week' + playerCopy.week;
                            delete playerCopy.Week;
                            week         = (proj ? 'projections.' : 'statistics.') + week;

                            updatePlayer[week] = playerCopy;
                            //if (updateNum < 500){
                            //    console.log(updatePlayer);
                            //}
                            dbPlayers.update({
                                player : row.player
                            }, {
                                $set : updatePlayer
                            }, {
                                upsert : true
                            }, function (err, result) {
                                if (err) {
                                    console.log('upsert error: ', err);
                                }
                                updateNum++;
                                console.log(updateNum);
                            });
                        }

                    });
                }
            }

        });
    });
}

function getSalaries() {
    sheet.useServiceAccountAuth(creds, function (err) {
        if (err) {
            console.log(err);
            return;
        }
        sheet.getInfo(function (err, info) {
            if (err) {
                console.log(err);
                return;
            }
            worksheets = info.worksheets;
            worksheet  = worksheets[0];
            worksheet.getRows(function (err, rows) {
                if (err) {
                    console.log(err);
                    return;
                }
                for (var j = 0; j < rows.length; j++) {
                    row = rows[j];
                    dbPlayers.update({
                        player : row.name
                    }, {
                        $set : {
                            salary  : row.salary,
                            injured : row.injury
                        }
                    }, {
                        upsert : false
                    }, function (err, result) {
                        if (err) {
                            console.log('upsert error: ', err);
                        }
                        updateNum++;
                        console.log(updateNum);
                    });
                }
            });
        });
    });
}

function getTopLineups (count,query) {
    var lineup;

    dbLineups.find(query).sort({points: -1}).toArray(function (err, docs) {
        if (err) {
            console.log('error',err);
            return;
        }
        console.log(docs.length);
        for (var j = 0; j < count; j++) {
            lineup = docs[j];
            for (var i in lineup) {
                if (!/points|salary/.test(i)){
                    console.log(i,lineup[i].name);
                } else {
                    console.log(i,lineup[i]);
                }
            }
            console.log('-------');
        }
        mdb.close();
        process.exit(0);
    });
}
