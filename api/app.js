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
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


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

/**** Get All Recipe ****/
app.use("/getRecipes", router)
app.post("/getRecipes", function (request, response){
    
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
    
    log.trace("Getting All Recipes: " + recipeId);
     
    var query = ""
    query = `
        SELECT 
            r.id,
            r.name, 
            r.cookTime,
            r.prepTime,
            r.attAuthor as author,
            r.attLink as link,
            r.notes,
            r.instructions,
            r.images,
            ri.amount, 
            ri.ingredientId,
            ri.ingredient,
            i.category,
            GROUP_CONCAT(t.id) as tags
        FROM recipes r
        JOIN recipeIngredients ri on ri.recipeId = r.id
        JOIN ingredients i on i.id = ri.ingredientId
        JOIN recipe2tags rt on rt.recipeId = r.id
        JOIN tags t on t.id = rt.tagId
        GROUP BY ri.id;
    `
    values = [
    ]
    
      
    mysql.con.query(query, values, function(err,rows){
        if(err) { 
            log.error("/getRecipes Error Occurred getting recipe data..");
            newResponse["success"] = "false"
            newResponse["msg"] = err
            throw err;
        }

        log.trace("Found [" + rows.length + "] rows.")
        if( rows.length <= 0) {
            newResponse["success"] = "true"
            newResponse["msg"] = "No Recipes found?! Somethings up."
            log.trace("No Recipes found?! Somethings up.");
            response.send(newResponse)
        } else {
            log.trace("Parcing Recipes SQL response.");
            
            var recipes = [];
            var prevId = "";
            var data = {};
            for(var i=0; i<rows.length; i++){
                currId = rows[i].id;
                if(currId != prevId) {
                    if(Object.keys(data).length != 0) {
                        log.trace("Adding prev recipe ["+prevId+"] to the array!");
                        data.ingredients = ingredients;
                        recipes.push(data);
                    } else {
                        log.trace("First time through. no need to add recipes");
                    }
                    log.trace("new recipe ["+currId+"] Setting initial recipe attributes");
                    data = {};
                    var ingredients = [];
                    data.id = rows[i].id;
                    data.name = rows[i].name;
                    data.cookTime = rows[i].cookTime;
                    data.prepTime = rows[i].prepTime;
                    data.attribution = {
                        author: rows[i].author,
                        link: rows[i].link
                    }
                    data.notes = JSON.parse(rows[i].notes);
                    data.instructions = JSON.parse(rows[i].instructions);
                    data.images = JSON.parse(rows[i].images);
                    data.tags = rows[i].tags.split(",");
                }
                var ing = {}
                ing.amount = rows[i].amount;
                ing.ingredientId = rows[i].ingredientId;
                ing.ingredient = rows[i].ingredient;
                ing.category = rows[i].category;
                ingredients.push(ing);
                
                prevId = rows[i].id;
            }
            log.trace("Done looping need to add the last recipe to the array");
            data.ingredients = ingredients;
            recipes.push(data);
            log.debug("Recipes have been downloaded. There are ["+recipes.length+"] recipes in total")
                    
            newResponse["recipes"] = recipes;
            newResponse["success"] = "true"
            log.debug("Successfully got recipe!");
            response.send(newResponse)
        }
    });
});

/**** Get Individual Recipe ****/
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
            r.id,
            r.name, 
            r.cookTime,
            r.prepTime,
            r.attAuthor as author,
            r.attLink as link,
            r.notes,
            r.instructions,
            r.images,
            ri.amount, 
            ri.ingredientId,
            ri.ingredient,
            i.category,
            GROUP_CONCAT(t.id) as tags
        FROM recipes r
        JOIN recipeIngredients ri on ri.recipeId = r.id
        JOIN ingredients i on i.id = ri.ingredientId
        JOIN recipe2tags rt on rt.recipeId = r.id
        JOIN tags t on t.id = rt.tagId
        WHERE r.id = ?
        GROUP BY ri.id;
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
            log.trace("No Recipe Found with Id: " + recipeId);
            response.send(newResponse)
        } else {
            log.trace("Parcing Recipe SQL response.");
            
            var data = {};
            data.id = rows[0].id;
            data.name = rows[0].name;
            data.cookTime = rows[0].cookTime;
            data.prepTime = rows[0].prepTime;
            data.attribution = {
                author: rows[0].author,
                link: rows[0].link
            }
            data.notes = JSON.parse(rows[0].notes);
            data.instructions = JSON.parse(rows[0].instructions);
            data.images = JSON.parse(rows[0].images);
            data.tags = rows[0].tags.split(",");
            
            
            var ingredients = [];
            var tags = [];
            for (var i = 0; i < rows.length; i++) {
                var ing = {}
                ing.amount = rows[i].amount;
                ing.ingredientId = rows[i].ingredientId;
                ing.ingredient = rows[i].ingredient;
                ing.category = rows[i].category;
                ingredients.push(ing);
                
                
            }
            data.ingredients = ingredients;
            newResponse["recipe"] = data;
            
            
            newResponse["success"] = "true"
            log.debug("Successfully got recipe!");
            response.send(newResponse)
        }
    });
    

});

app.use("/getGroceryList", router)
app.post("/getGroceryList", function (request, response){
    
    log.trace("Entering /getGroceryList....");
    
    if( request.body == undefined ) {
        log.error("/getGroceryList No Body Sent.");
        response.send({
            "success":"false",
            "msg":"No body sent"
        })
        return;
    }
    var newResponse = {};
    
    var recipeIds = request.body.recipeIds
    
    log.trace("Building Grocery List off of: " + recipeIds.length);
    
    if(recipeIds.length <= 0) {
        log.error("/getGroceryList RecipeIds weren't sent.");
        response.send({
            "success":"false",
            "msg":"No IDs supplied"
        })
        return;
    }
    
    var whereClause = "?"
    for(var i=0; i<recipeIds.length; i++){
        if(i != 0){
            whereClause = whereClause + ",?" 
        }
    }
     
    var query = ""
    query = `
        SELECT 
            r.id,
            r.name,
            r.attAuthor as author,
            r.images,
            ri.amount, 
            ri.ingredientId,
            i.category
        FROM recipes r
        JOIN recipeIngredients ri on ri.recipeId = r.id
        JOIN ingredients i on i.id = ri.ingredientId
        WHERE r.id IN (`+whereClause+`);
    `
    log.trace("QUERY: " + query);
    mysql.con.query(query, recipeIds, function(err,rows){
        if(err) { 
            log.error("/getGroceryList Error Occurred getting data..");
            newResponse["success"] = "false"
            newResponse["msg"] = err
            throw err;
        }

        log.trace("Found [" + rows.length + "] rows.")
        if( rows.length <= 0) {
            newResponse["success"] = "true"
            newResponse["msg"] = "No Recipes with these IDs were found" + recipeIds
            log.trace("No Recipes with these IDs were found" + recipeIds);
            response.send(newResponse)
        } else {
            log.trace("Parcing Grocery List SQL response.");
            var groceryItems = [];
            var prevId = "";
            var data = {};
            for(var i=0; i<rows.length; i++){
                data.ingredientId = rows[i].ingredientId;
                data.category = rows[i].category;
                data.amount = rows[i].amount;
                data.recipe = {
                    id: rows[i].id,
                    name: rows[i].name,
                    images: JSON.parse(rows[i].images),
                    attribution: {
                        author:rows[i].author
                    }
                }
                groceryItems.push(data);
            }
            
            log.debug("Grocery Items have been downloaded. There are ["+groceryItems.length+"] items in total")
            
            
            newResponse["items"] = groceryItems;
            newResponse["success"] = "true"
            log.debug("Successfully got recipe!");
            response.send(newResponse)
        }
    });
    

});












