var mysql = require("mysql"); 
var log = require('./logger.js');

con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Pa$$w0rd",
  database: "recipes"
  /*dateStrings: 'date'*/
});

con.connect(function(err){
  if(err){
    log.error('MySQL DB Error! Cannot Connect to Database.');
    log.error(err);
    return;
  }
  log.info('DB Connection established');
});


/*** Keep MySQL Alive (call every 5 seconds) ***/
setInterval(function () {
    con.query('SELECT 1');
    log.trace("MySQL HeartBeat. Server is still alive!");
}, 300000);


exports.con = con
