axios = require('axios');
gls = require('./glsFiles');
mysql = require('mysql');

deviceId = 'daisyrover_oWL-X4u6d';
updateArray = [];
insertArray = [];
sqlIndex = 0;
var yesterday = Math.floor(new Date().getTime()/1000)-10*60;
console.log(yesterday);
console.log(new Date((yesterday-4*60*60)*1000));

axios_config = {
    url: '',
    method: 'post',
    baseURL: 'https://www.fieldpop.io/rest/method/fieldpop-api',
    headers: {
        'setHost': 'true',
        'cache-control': 'no-cache',
        'Connection': 'keep-alive',
        'accept-encoding': 'gzip deflate',
        'Host': 'www.fieldpop.io',
        'Accept': '*/*',
        'Authorization': 'Basic bW9oYW1lZC5mYXllZEBwZGljb3JwLmNvbTpAbWZheWVkMjk5OA=='
    },
    params: {
        'deviceID': deviceId,
        'deviceAPIVersion': '2.0.0',
        'username': 'mohamed.fayed@devicedatacorp.com',
        'password': '@mfayed2998',
        'happn_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.ImlkfDM4ZDQ4OWM1LWI3YzUtNDE1Ni05ZWJlLWJmYzViMmJkODk1OXx0eXBlfHRpbWVzdGFtcHxpc0VuY3J5cHRlZHxvcmlnaW58MTAtMC0yOC0xODFfNTcwMDB8cG9saWN5fDB8dHRsfGluYWN0aXZpdHlfdGhyZXNob2xkfDF8aXNUb2tlbnx1c2VybmFtZXxtb2hhbWVkLmZheWVkQHBkaWNvcnAuY29tXjB8SlcxMk5CS0x8MHwwXl4kMHwxfDJ8RnwzfEd8NHwtMnw1fDZ8N3wkOHwkOXxIfEF8LTNdfEJ8JDl8SXxBfC0zXV18Q3wtMXxEfEVdIg.PaQdlILLK9lCgptuvUIlWN8zjmthTgWY_r72HLG7oBw',
        'startUTCsec': yesterday
    },
    timeout: 20000,
    withCredentials: false,
    // `auth` indicates that HTTP Basic auth should be used, and supplies credentials.
    // This will set an `Authorization` header, overwriting any existing
    // `Authorization` custom headers you have set using `headers`.
    // auth: {
    //   username: 'janedoe',
    //   password: 's00pers3cret'
    // },
    responseType: 'json', // default 
    // `maxContentLength` defines the max size of the http response content allowed
    maxContentLength: 2000000,
}
console.log(axios_config);
function connectToDatabase(callback) {
    var connection = mysql.createConnection({
        host: "public-scratch.cvwwn9esnrpn.us-east-1.rds.amazonaws.com",
        port: 3306,
        user: "root",
        password: "hokxan9AWS",
        database: "pdi"
    });

    connection.connect(function (err) {
        if (err) throw err;
        console.log("connected as id " + connection.threadId);
        callback(connection, insertRows);
    });
    return connection;
}

function getData(connection, callback) {
    axios.get('/deviceDataLog', axios_config)
        .then(function (response) {
            callback(connection, response.data.data);
            //console.log(data);
            //gls.writeFile("data.json", JSON.stringify(data));
        })
        .catch(function (error) {
            console.log(error);
        });
}

function toUTC_Time(ms) {
    return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

function insertRows(connection, data) {
    console.log(data);
    var device = deviceId;
    for (var point in data) {
        //console.log(point);
        var samples = data[point];
        for (var sampleId in samples) {
            var sample = samples[sampleId];
            //console.log('  ' + sampleId);
            for (var i in sample) {
                //console.log('      ' + i);
                var ms = new Date(sample[i].time * 1000);
                var datetime = toUTC_Time(ms);
                var value = sample[i].value;
                var updateSQL =
                    `UPDATE devicedata 
                    SET device='${device}', point='${point}', sample='${sampleId}', datetime='${datetime}', value='${value}'
                    WHERE device='${device}' AND point='${point}' AND sample='${sampleId}' AND datetime='${datetime}'`;
                var insertSQL =
                    `INSERT INTO devicedata (device, point, sample, datetime, value) 
                    VALUES ('${device}', '${point}', '${sampleId}', '${datetime}', '${value}')`
                    updateArray.push(updateSQL);
                    insertArray.push(insertSQL);
            }
        }
    }
    sqlIndex = 0;
    updateInsertSQL(connection);
}

function updateInsertSQL(connection) {
    if (sqlIndex >= insertArray.length) {
        connection.end();
        return;
    }
    console.log(`iteration ${sqlIndex} of ${insertArray.length}`)
    var insertSQL = insertArray[sqlIndex];
    var updateSQL = updateArray[sqlIndex];
    connection.query(updateSQL, function (err, res) {
        //console.log(updateSQL);
        //console.log("update response...");
        //console.log(res.affectedRows);
        if (err) {throw err;}
        if (res.affectedRows === 0) {
            connection.query(insertSQL, function (err, res) {
                //console.log(insertSQL);
                console.log("insert response..." + res.insertId);
                if (err) {throw err;}
                sqlIndex++;
                updateInsertSQL(connection);
            });
        } else {
            //console.log(res.message);
            sqlIndex++;
            updateInsertSQL(connection);
        }
    });
}

function runSQL(connection, sql) {
    console.log(sql);
    connection.query(sql, function (err, res) {
        console.log(res);
        if (err) {
            throw err;
        }
    });
    connection.end();
}

dropTableSQL = `
DROP TABLE devicedata
`
createTableSQL = `
CREATE TABLE devicedata (
    id INT NOT NULL AUTO_INCREMENT,
    device VARCHAR(100) NOT NULL,
    point VARCHAR(100) NOT NULL,
    sample VARCHAR(100) NOT NULL,
    datetime DATETIME NOT NULL,
    value DOUBLE NOT NULL,
    PRIMARY KEY (id)
  )
`

dumpTableSQL = `SELECT * FROM devicedata LIMIT 50`;

countTableSQL = `SELECT count(*) FROM devicedata`;

function dropTable(connection) {
    runSQL(connection, dropTableSQL);
}

function createTable(connection) {
    runSQL(connection, createTableSQL);
}

function dumpTable(connection) {
    runSQL(connection, dumpTableSQL);
}

function countTable(connection) {
    runSQL(connection, countTableSQL);
}

function main() {
    switch (process.argv[2]) {
        case "drop": connectToDatabase(dropTable); break;
        case "dump": connectToDatabase(dumpTable); break;
        case "create": connectToDatabase(createTable); break;
        case "count": connectToDatabase(countTable); break;
        case "get":
        default: connectToDatabase(getData); break;

    }
}

main();