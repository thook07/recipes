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

//objects
const Recipe            = require('./objects/Recipe.js');
const RecipeIngredient  = require('./objects/RecipeIngredient.js');
const RecipeGroup       = require('./objects/RecipeGroup.js');
const Ingredient        = require('./objects/Ingredient.js');
const Tag               = require('./objects/Tag.js');



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
app.get("/ping", function(request, response) {
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
    
    var recipeIds = request.body.recipeIds

   buildRecipes(recipeIds, function(rsp) {
   
        console.log(rsp.nestedRecipes)
        if(rsp.success == false) {
            logger.error("error occurred...");
            return;
        }

        if(rsp.nestedRecipes.length > 0) {
            log.debug("There is a recipe with a nested recipe. Will need to re-build the response.");
            var recipeIds = [];
            var recipesToUpdate = [];
            for (var i=0; i<nestedRecipes.length; i++) {
                recipeIds.push(nestedRecipes[i].ingredientId);
                recipesToUpdate.push(nestedRecipes[i].recipeId);
            }
            var nestedRes = buildRecipes(recipeIds, function(nestedRes){
                var nestedRecipes = nestedRes.recipeGroup;
                var nestedRecipeMap = {};
                for(var i=0; i<nestedRecipes.length; i++) {
                    var recipe = nestedRecipes[i];
                    nestedRecipeMap[recipe.id] = recipe;
                }


                var recipes = rsp.recipeGroup
                for(var i=0; i<recipes.length; i++){
                    var recipe = recipes[i]
                    if( recipesToUpdate.includes(recipe.id) == false ) {
                        continue;
                    }
                    for(var j=0; j<recipe.recipeIngredients.length; j++) {
                        var ri = recipe.recipeIngredients[i];
                        if( recipeIds.includes(ri.ingredient.id) == false) {
                            continue;
                        }
                        ri.recipe = nestedRecipeMap[ri.ingredient.id]; //need to verify that this gets changed.
                        ri.ingredient = null;
                    }
                }

                newResponse["count"] = recipes.length;
                newResponse["recipeGroup"] = recipes;
                newResponse["success"] = "true";
            });

        }

        log.debug("Successfully got recipe!");
        response.send(newResponse)
    });
   

});

//helper function
function buildRecipes(recipeIds, onCompletion) {
    var newResponse = {};
    var whereClause = ""
    var values = [];
    if(recipeIds != undefined) {
        log.trace("Grabbing a subset of recipes!");

        whereClause = "?"
        for(var i=0; i<recipeIds.length; i++){
            if(i != 0){
                whereClause = whereClause + ",?" 
            }
        }
        whereClause = `
            WHERE r.id IN (` + whereClause + `)
            GROUP BY ri.id;`;

        values = recipeIds

    } else {
        log.trace("Grabbing all recipes.");
        whereClause = "GROUP BY ri.id;";
    }
    
    log.trace("Where Clause: " + whereClause);

     
    var query = ""
    query = `
        SELECT 
            r.id,
            r.name, 
            r.cookTime,
            r.prepTime,
            r.attAuthor as author,
            r.attLink as link,
            r.instructions,
            r.notes,
            r.images,
            ri.id as recipeIngredientId, 
            ri.amount, 
            ri.ingredient as ingredientDescription,
            ri.isRecipe,
            ri.ingredientId,
            i.name as ingredientName,
            i.category,
            GROUP_CONCAT(t.id) as tagIds,
            GROUP_CONCAT(t.name) as tagNames
        FROM recipes r
        JOIN recipeIngredients ri on ri.recipeId = r.id
        LEFT JOIN ingredients i on i.id = ri.ingredientId
        LEFT JOIN recipe2tags rt on rt.recipeId = r.id
        LEFT JOIN tags t on t.id = rt.tagId
        `+whereClause+`
    `
    
    log.trace(query);
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
            onCompletion(newResponse);
        } else {
            log.trace("Parcing Recipes SQL response.");
            var recipes = [];
            var prevId = "";
            var recipe = {};
            var nestedRecipes = [];
            for(var i=0; i<rows.length; i++){
                currId = rows[i].id;
                if(currId != prevId) {
                    if(Object.keys(recipe).length != 0) {
                        log.trace("Adding prev recipe ["+prevId+"] to the array!");
                        recipe.recipeIngredients = recipeIngredients;
                        recipes.push(recipe);
                    } else {
                        log.trace("First time through. no need to add recipes");
                    }
                    log.trace("new recipe ["+currId+"] Setting initial recipe attributes");
                    recipe = {};
                    var recipeIngredients = [];
                    recipe.id = rows[i].id;
                    recipe.name = rows[i].name;
                    recipe.cookTime = rows[i].cookTime;
                    recipe.prepTime = rows[i].prepTime;
                    recipe.attribution = {
                        author: rows[i].author,
                        link: rows[i].link
                    }
                    recipe.notes = JSON.parse(rows[i].notes);
                    recipe.instructions = JSON.parse(rows[i].instructions);
                    recipe.images = JSON.parse(rows[i].images);
                    recipe.tags = rows[i].tagIds.split(",");
                }
                var recipeIngredient = {};
                recipeIngredient.id = rows[i].recipeIngredientId
                recipeIngredient.amount = rows[i].amount;
                recipeIngredient.ingredientDescription = rows[i].ingredientDescription;
                recipeIngredient.isRecipe = rows[i].isRecipe;
                if( rows[i].isRecipe == 1 ) nestedRecipes.push({ recipeId: recipe.id, ingredientId: rows[i].ingredientId });
                var ingredient = {};
                ingredient.id = rows[i].ingredientId;
                ingredient.name = rows[i].ingredientName;
                ingredient.category = rows[i].category;
                recipeIngredient.ingredient = ingredient;
                recipeIngredients.push(recipeIngredient);
                
                prevId = rows[i].id;
            }
            log.trace("Done looping need to add the last recipe to the array");
            recipe.recipeIngredients = recipeIngredients;
            recipes.push(recipe);
            log.debug("Recipes have been downloaded. There are ["+recipes.length+"] recipes in total")

            newResponse["nestedRecipes"] = nestedRecipes;
            newResponse["count"] = recipes.length;
            newResponse["recipeGroup"] = recipes;
            newResponse["success"] = "true"
            onCompletion(newResponse);
        }
    });

    log.trace("Done with mysql...");

}


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

/*** Probably should be deprecated. Need to use getRecipeGroup */
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
            var recipes = []; //slimmed down version of a recipe
            var prevId = "";
            var recipe = {};
            for(var i=0; i<rows.length; i++){
                var item = {};
                item.ingredientId = rows[i].ingredientId;
                item.category = rows[i].category;
                item.amount = rows[i].amount;
                item.recipe = {
                    id: rows[i].id,
                    name: rows[i].name,
                    images: JSON.parse(rows[i].images),
                    attribution: {
                        author:rows[i].author
                    }
                }
                groceryItems.push(item);
                
                currId = rows[i].id;
                if(currId != prevId) {
                    if(Object.keys(recipe).length != 0) {
                        log.trace("Adding prev recipe ["+prevId+"] to the array!");
                        recipes.push(recipe);
                    } else {
                        log.trace("First time through. no need to add recipe");
                    }
                    log.trace("new recipe ["+currId+"] Setting initial recipe attributes");
                    recipe = {};
                    recipe.id = rows[i].id;
                    recipe.name = rows[i].name;
                    recipe.attribution = {
                        author: rows[i].author
                    }
                    recipe.images = JSON.parse(rows[i].images);
                }
                prevId = rows[i].id;
            }
            log.trace("Done looping need to add the last recipe to the array");
            recipes.push(recipe);
            log.debug("Recipes have been downloaded. There are ["+recipes.length+"] recipes in total")
            log.debug("Grocery Items have been downloaded. There are ["+groceryItems.length+"] items in total")
            
            
            newResponse["recipes"] = recipes;
            newResponse["items"] = groceryItems;
            newResponse["success"] = "true"
            log.debug("Successfully got recipe!");
            response.send(newResponse)
        }
    });
    

});



/******
 *  Writing to database
 */
app.use("/createRecipe", router)
app.post("/createRecipe", function (request, response){


});








