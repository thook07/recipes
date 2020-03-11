var http        = require('http');
var https       = require('https');
var fs          = require('fs');
var dateFormat  = require('dateformat');
var jwt         = require('jsonwebtoken');
var tokenConfig = require('./tokenConfig.js')
var tokenExpiration = 60*60*24; //used in authenticate 
var firebase    = require("./firebase.js");
var bodyParser  = require('body-parser');
var log         = require('./logger.js');
var mysql       = require('./mysql.js');



/*var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};*/

var express = require('express');
var app = express();
var router = express.Router();

// your express configuration here

var httpServer = http.createServer(app);
httpServer.listen(1338);

/**** IF WE WANT TO GET FANCy WITH HTTPS
var options = {
    key: fs.readFileSync('/etc/letsencrypt/live/'+apiURL+'/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/'+apiURL+'/fullchain.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/'+apiURL+'/chain.pem')
};
var httpsServer = https.createServer(options, app);
httpsServer.listen(1339);
****/

router.use(function(req, res, next) {
    //check header or url params or post params for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'] 
    
    if(token) {
        log.trace("Token provided to authenticator. Checking for validity.");
        jwt.verify(token, tokenConfig.secret, function(err, decoded) {
            if(err) {
                log.error("Failed to autenticate token!");
                return res.send({success: false, message: 'Failed to authenticate token.'})
            } else {
                log.debug("Token decoded!");
                req.decoded = decoded;
                next();
            }
        });
    } else {
        log.error("No Token provided!")
        return res.status(403).send({
            success: false,
            messge: 'No token provided.'
        });
    }
    
    
});

/*********************************************
 ************   Recipe APIs   ****************
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

app.use("/getRecipe", router)
app.post("/getRecipe", function (request, response){
    
    log.trace("Entering /getRecipe....");
    
    if( request.body == undefined ) {
        log.error("/getRecipe No Body Sent.");
        response.send({
            "success":"false",
            "msg":"No body sent"
        })
        return;
    }
    var newResponse = {};
    
    var recipeId = request.body.recipeId
    
    log.trace("Getting Recipe: " + recipeId);
     
    var query = ""
    query = `
        SELECT 
            r.id as id,
            r.name as name, 
            r.cookTime as cookTime,
            r.prepTime as prepTime,
            r.attAuthor as author,
            r.attLink as link,
            r.notes
            ri.amount, 
            ri.ingredientId, 
            i.category
        FROM recipes r
        JOIN recipeIngredient ri on ri.recipeId = r.id
        JOIN ingredients i on i.id = ri.ingredientId
        WHERE r.id = ?
    `
    values = [
        recipeId
    ]
    
      
    mysql.con.query(query, values, function(err,rows){
        if(err) { 
            log.error("/getRecipe Error Occurred getting Rating Data..");
            newResponse["success"] = "false"
            newResponse["msg"] = err
            throw err;
        }

        log.trace("Found [" + rows.length + "] rows.")
        if( rows.length <= 0) {
            newResponse["success"] = "true"
            newResponse["msg"] = "No Recipe with Id: " + recipeId
            log.trace("No Rating Found for key: " + key);
            response.send(newResponse)
        } else {
            log.trace("Parcing Rating SQL response.");
            
            var data = {};
            data.id = rows[0].id;
            data.name = rows[0].name;
            data.cookTime = rows[0].cookTime;
            data.prepTime = rows[0].prepTime;
            data.notes = rows[0].notes;
            
            newResponse["data"] = data;
            
            /*for (var i = 0; i < rows.length; i++) {
                newResponse["numberOfRatings"] = rows[i].numberOfRatings
                newResponse["averageRating"] = rows[i].averageRating
                newResponse["maxRating"] = rows[i].maxRating
                newResponse["minRating"] = rows[i].minRating
                log.trace(">>Avg Rating  : " + rows[i].averageRating);
                log.trace(">># of Ratings: " + rows[i].numberOfRatings);
                log.trace(">>and more...");
            }*/
            
            newResponse["success"] = "true"
            log.debug("Successfully got rating data!");
            response.send(newResponse)
        }
    });
    

});