//Render Logger
var dateFormat  = require('dateformat');
var os          = require('os');

var level = "trace";

exports.trace = function(msg, line) {
    var logMsg = getBeginningString(line, "T") + msg;
    
    if(level.toUpperCase() === "TRACE") {
        log(logMsg);
    }
}

exports.debug = function(msg, line) {
    var logMsg = getBeginningString(line, "D") + msg;
    
    if(level.toUpperCase() === "TRACE" || level.toUpperCase() === "DEBUG") {
        log(logMsg);
    }
}

exports.info = function(msg, line) {
    var logMsg = getBeginningString(line, "I") + msg;
    
    if(level.toUpperCase() === "TRACE" || level.toUpperCase() === "DEBUG" || level.toUpperCase() === "INFO") {
        log(logMsg);
    }
}

exports.warn = function(msg, line) {
    var logMsg = getBeginningString(line, "W") + msg;
    
    if(level.toUpperCase() === "TRACE" || level.toUpperCase() === "DEBUG" || level.toUpperCase() === "INFO" || level.toUpperCase() === "WARN") {
        log(logMsg);
    }
}

exports.error = function(msg, line) {
    var logMsg = getBeginningString(line, "E") + msg;
    
    if(level.toUpperCase() === "TRACE" || level.toUpperCase() === "DEBUG" || level.toUpperCase() === "INFO" || level.toUpperCase() === "WARN" || level.toUpperCase() === "ERROR") {
        log(logMsg);
    }
    
    emailError(logMsg);
    
}

exports.wtf = function(msg, subject) {
    var logMsg = getBeginningString("?", "WTF") + msg;
    
    log(logMsg);
    emailWTF(logMsg, subject);
    
}



function getBeginningString(line, level) {
    var now = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
    
    var newLine = line
    if(newLine == undefined || newLine == "NaN" || newLine == null || isNaN(newLine)) {
        newLine = "?";
    }
    return now + "," + newLine + " " + level + " ";
}


function log(msg) {
    console.log(msg);
}

function emailError(msg) {
    var subject = ""
    if(os.hostname() == "heybeermanapi") { //dev server
        subject = "*Error Occurred in DEV*";
    } else {
        subject = "**[HIGH PRIORITY] Error Occurred in PRODUCTION!**";
    }
    
    var emailBody = `
        <html><body>
        <p>An Error Occurred on host `+os.hostname()+`</p>
        <p>======================================================================================</p>
        <p>Error Message: <strong>`+msg+`</strong></p>
        <p>======================================================================================</p>
        <p>Current log level is <strong>`+level+`</strong>. If needed bump up this log level.</p>
        <p>Please check the latest logs for more details.</p>
        <br/>
        </body></html>
    `;
    
    
    /*framework.sendHTMLEmail("support@renderdelivers.com", "support@renderdelivers.com", subject, emailBody, function(mailResponse) {
        
    });*/
}

function emailWTF(msg, subject) {
    var tSubject = ""
    if(os.hostname() == "heybeermanapi") { //dev server
        tSubject = subject + " - DEV";
    } else {
        tSubject = subject + " - PROD";
    }
    
    var emailBody = `
        <html><body>
        <p>An Error Occurred on host `+os.hostname()+`</p>
        <p>======================================================================================</p>
        <p>Error Message: <strong>`+msg+`</strong></p>
        <p>======================================================================================</p>
        <p>Current log level is <strong>`+level+`</strong>. If needed bump up this log level.</p>
        <p>Please check the latest logs for more details.</p>
        <br/>
        </body></html>
    `;
    
    
    /*framework.sendHTMLEmail("support@renderdelivers.com", "support@renderdelivers.com", tSubject, emailBody, function(mailResponse) {
        
    });*/
}





