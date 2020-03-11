var http        = require('http');
var https       = require('https');
var fs          = require('fs');
var dateFormat  = require('dateformat');
var jwt         = require('jsonwebtoken');
//var tokenConfig = require('./tokenConfig.js')
var tokenExpiration = 60*60*24; //used in authenticate 
var firebase    = require("./firebase.js");
var bodyParser  = require('body-parser');
var log         = require('./logger.js');



/*var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};*/

var express = require('express');
var app = express();
var router = express.Router();

// your express configuration here

var httpServer = http.createServer(app);

/**** IF WE WANT TO GET FANCy WITH HTTPS
var options = {
    key: fs.readFileSync('/etc/letsencrypt/live/'+apiURL+'/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/'+apiURL+'/fullchain.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/'+apiURL+'/chain.pem')
};
var httpsServer = https.createServer(options, app);
****/

/*********************************************
 ************  Render APIs  ***************
**********************************************/
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());


//this API is used to authenticate a user and then send back a Auth Token.
//this token is required before the use of any protected APIs.
app.post('/authenticate', function(request, response) {
    log.trace("Entering /authenticate....");
    if( request.body == undefined ) {
        log.warn("No body sent..");
        response.send({
            "success":false,
            "msg":"No body sent"
        })
        return
    }
    
    var userId = request.body.userId
    var pswd   = request.body.password
    
    
    verifyCredentials(userId, pswd, function(verifyResponse, verifyError) {
        
        if(verifyError) throw verifyError;
        
        
        if(!verifyResponse.success) {
            log.warn("Failed to verify credentials. RESPONSE:" + verifyResponse.message);
            response.send({
                success: false,
                message: verifyResponse.message
            });
        } else {
            log.trace("Credentials Verified Successfully. Returning a token");
            var token = jwt.sign({ userId: userId}, tokenConfig.secret, {
                expiresIn: tokenExpiration
            });
            log.trace("Token: " + token);
            
            response.send({
                success: true,
                message: 'Enjoy your token.',
                token: token
            });
        }
        
        
    });
    
    
});

//onCompletion(response, error)
function verifyCredentials(userId, password, onCompletion) {
    /*log.trace("Entering verifyCredentials...userId: " + userId + " password *****");
    var DB_USER_REQUEST_PATH = "users";
    // Create a reference to the Braintree User Request node of the database
    var db = firebase.firebase.database();
    var userRef = db.ref(DB_USER_REQUEST_PATH);

    userRef.once('value').then(function(snapshot) {
        
        if(snapshot.hasChild(userId)) {
            var fbPassword = snapshot.child(userId).val().apiPwd
        
            log.trace("UserId: ["+userId+"]")
            log.trace("Password: ["+password+"]")
            log.trace("Firebase Pass: ["+fbPassword+"]")

            if(fbPassword == undefined) {
                log.warn("Password does not match [undefined]");
                var response = {
                    'success' : false,
                    'message' : 'Password does not match [undefined]'
                };
                onCompletion(response, null);

            } else if(password != fbPassword) {
                log.warn("Password does not match");
                var response = {
                    'success' : false,
                    'message' : 'Password does not match.'
                }; 
                onCompletion(response, null);
            } else {
                log.trace("Password Matches. Good to go.");
                var response = {
                    'success' : true,
                    'message' : 'Password Matches.'
                }; 
                onCompletion(response, null);
            }
            
        } else {
            log.warn("User Doesnt exist in firebase.");
            var response = {
                'success' : false,
                'message' : 'User doesnt exist.'
            };
            onCompletion(response, null);
        }
        
    });*/
    var response = {
        'success' : true,
        'message' : 'Password Matches.'
    }; 
    onCompletion(response,null);
    
}


//app.use("/ping", router)
app.post("/ping", function(request, response) {
    log.info("Ping Successful. Hello There!");
    
    response.send({
        "success" : "true",
        "msg": "Hello There!"
    })
});
