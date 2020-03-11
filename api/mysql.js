var mysql = require("mysql"); 

con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "recipes"
  /*dateStrings: 'date'*/
});

con.connect(function(err){
  if(err){
    log.error('RENDER DB Error! Cannot Connect to Database.');
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