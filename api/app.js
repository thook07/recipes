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
   
        if(rsp.success == false) {
            logger.error("error occurred...");
            return;
        }

        if(rsp.nestedRecipes == undefined) {
            rsp.nestedRecipes = [];
        }

        if(rsp.nestedRecipes.length > 0) {
            log.debug("There is a recipe with a nested recipe. Will need to re-build the response.");
            var recipeIds = [];
            var recipesToUpdate = [];
            for (var i=0; i<rsp.nestedRecipes.length; i++) {
                recipeIds.push(rsp.nestedRecipes[i].ingredientId);
                recipesToUpdate.push(rsp.nestedRecipes[i].recipeId);
            }
            buildRecipes(recipeIds, function(nestedRsp){
                var nestedRecipes = nestedRsp.recipeGroup;
                var nestedRecipeMap = {};
                for(var i=0; i<nestedRecipes.length; i++) {
                    var recipe = nestedRecipes[i];
                    nestedRecipeMap[recipe.id] = recipe;
                }


                var recipes = rsp.recipeGroup
                for(var i=0; i<recipes.length; i++){
                    var recipe = recipes[i]
                    log.trace("Seeing if ["+recipe.id+"] has to be updated.")
                    if( recipesToUpdate.includes(recipes[i].id) == false ) {
                        continue;
                    }
                    log.trace("It does...["+recipe.id+"] Looping throught its recipeIngredients ["+recipe.recipeIngredients+"]")
                    for(var j=0; j<recipe.recipeIngredients.length; j++) {
                        var ri = recipe.recipeIngredients[j];
                        if( recipeIds.includes(ri.ingredient.id) == false) {
                            continue;
                        }
                        log.trace("Finally got to it. Adding recipe to ["+recipe.id+"]")
                        ri.recipe = nestedRecipeMap[ri.ingredient.id]; //need to verify that this gets changed.
                        ri.ingredient = null;
                    }
                }
                console.log(nestedRsp,rsp)
                newResponse["count"] = recipes.length;
                newResponse["recipeGroup"] = recipes;
                newResponse["nestedRecipes"] = nestedRsp.recipeGroup;
                newResponse["success"] = "true";
                log.debug("Successfully got recipe!");
                response.send(newResponse)
            });

        } else {
            log.debug("Successfully got recipe!");
            response.send(rsp)
        }


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
                    if(rows[i].tagIds != undefined) recipe.tags = rows[i].tagIds.split(",");
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

            if(rows[0].tags != undefined) data.tags = rows[0].tags.split(",");
            
            
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

/**** Get RecipeIngredient Issues ****/
app.use("/getRecipeIngredientIssues", router)
app.post("/getRecipeIngredientIssues", function (request, response){
    
    log.trace("Entering /getRecipeIngredientIssues....");

    var whereClause = "where ingredientId = '' or ingredientId = NULL;"
    console.log('request.body.filter',request.body.filter)
    if(request.body.filter == "all") {
        whereClause =";"
    }
    
    var newResponse = {};
    
   log.trace("Grabbing Issues from recipeIngredients");
     
    var query = ""
    query = `
        select * from recipeIngredients `+whereClause+`
    `
    mysql.con.query(query, [], function(err,rows){
        if(err) { 
            log.error("/getRecipeIngredientIssues Error Occurred getting data..");
            newResponse["success"] = "false"
            newResponse["msg"] = err
            throw err;
        }

        log.trace("Found [" + rows.length + "] rows.")
        if( rows.length <= 0) {
            newResponse["success"] = "true"
            newResponse["msg"] = "No Issues!"
            response.send(newResponse)
        } else {

            var recipeIngredients = [];
            
            for (var i = 0; i < rows.length; i++) {
                var ri = {}
                ri.id = rows[i].id;
                ri.ingredientDescription = rows[i].ingredient;
                ri.recipeId = rows[i].recipeId;
                ri.ingredientId = rows[i].ingredientId;
                ri.amount = rows[i].amount;
                ri.isRecipe = rows[i].isRecipe;
                recipeIngredients.push(ri);
            }
            newResponse["recipeIngredients"] = recipeIngredients;
            
            
            newResponse["success"] = "true"
            log.debug("Successfully got recipe!");
            response.send(newResponse)
        }
    });
    

});

app.use("/getRecipesTable", router);
app.post("/getRecipesTable", function (request, response){
    log.trace("Entering /getRecipesTable....");

    var newResponse = {};
    
   log.trace("Grabbing Issues from recipes");
     
    var query = ""
    query = `
        select * from recipes;
    `
    mysql.con.query(query, [], function(err,rows){
        if(err) { 
            log.error("/getRecipesTable Error Occurred getting data..");
            newResponse["success"] = "false"
            newResponse["msg"] = err
            throw err;
        }

        log.trace("Found [" + rows.length + "] rows.")
        if( rows.length <= 0) {
            newResponse["success"] = "true"
            newResponse["msg"] = "No Issues!"
            response.send(newResponse)
        } else {

            var recipes = [];
            
            for (var i = 0; i < rows.length; i++) {
                var recipe = {}
                recipe.id = rows[i].id;
                recipe.name = rows[i].name;
                recipe.cookTime = rows[i].cookTime;
                recipe.prepTime = rows[i].prepTime;
                recipe.attAuthor = rows[i].attAuthor;
                recipe.attLink = rows[i].attLink;
                recipe.notes = JSON.parse(rows[i].notes);
                recipe.instructions = JSON.parse(rows[i].instructions);
                recipe.images = JSON.parse(rows[i].images);
                recipes.push(recipe);
            }

            newResponse["recipes"] = recipes;
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

    log.trace("Entering /createRecipe....");
    if( request.body == undefined ) {
        log.error("/getRecipe No Body Sent.");
        response.send({
            "success":"false",
            "msg":"No body sent"
        })
        return;
    }

    var newResponse = {};
    var recipeData = request.body.recipe
    
    log.trace("Getting Recipe: " + recipeData);
    var recipe = new Recipe(recipeData);

    var query = ""
    query = `
        INSERT INTO recipes (
            id,
            name,
            attAuthor,
            attLink,
            cookTime,
            prepTime,
            images,
            instructions,
            notes
        ) VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    `

    var values = [
        recipe.id,
        recipe.name,
        recipe.attribution.author,
        recipe.attribution.link,
        recipe.cookTime,
        recipe.prepTime,
        JSON.stringify(recipe.images),
        JSON.stringify(recipe.instructions),
        JSON.stringify(recipe.notes)
    ]

    mysql.con.query(query, values, function(err,rows){

        if(err) { 
            log.error("Error occurred while grabing order archive information.");
            log.error("Error Msg: " + err);
            throw err;
        } else {
            log.debug("Success. ["+recipe.name+"] was written to the datbase")

            updateRecipeIngredients(recipe.id, null, recipe.recipeIngredients, function(riResponse) {
                updateTags(recipe.id, recipe.tags, function(tagResponse) {
                    response.status(200).send(tagResponse);
                });
            });
        }
    });

    //newResponse["recipe"] = recipe;



    //response.status(200).send(newResponse);


});


function updateRecipeIngredients(recipeId, ingredientId, recipeIngredients, onCompletion) {

    var values = []
    for(var i=0; i<recipeIngredients.length; i++) {
        values.push([
            recipeIngredients[i].ingredientDescription, 
            recipeId, 
            ingredientId, 
            recipeIngredients[i].amount, 
            recipeIngredients[i].isRecipe
        ])
    }

    query = `
    INSERT INTO recipeIngredients (
        ingredient,
        recipeId,
        ingredientId,
        amount,
        isRecipe
    ) VALUES ?
`
    mysql.con.query(query, [values], function(err,rows){
        if(err) { 
            log.error("Error occurred saving recipe ingredients");
            log.error("Error Msg: " + err);
            throw err;
        } else {
            log.debug("Success. ["+ rows.affectedRows+"] RecipeIngredients were written to the datbase");
            var newResponse = {
                "success":true
            }
            onCompletion(newResponse);
        }

    });

}

function updateTags(recipeId, tags, onCompletion){
    var values = []
    for(var i=0; i<tags.length; i++) {
        values.push([
            tags[i], 
            recipeId
        ])
    }

    query = `
    INSERT INTO recipe2tags (
        tagId,
        recipeId
    ) VALUES ?
`
    mysql.con.query(query, [values], function(err,rows){
        if(err) { 
            log.error("Error occurred saving tags");
            log.error("Error Msg: " + err);
            throw err;
        } else {
            log.debug("Success. ["+ rows.affectedRows+"] Tags were written to the datbase..");
            var newResponse = {
                "success":true,
            }
            onCompletion(newResponse);
        }

    });
}

app.use("/updateRecipe", router);
app.post("/updateRecipe", function (request, response) {
    log.trace("Entering /updateRecipe....");

    if( request.body == undefined ) {
        log.error("/updateRecipe No Body Sent.");
        response.send({
            "success":"false",
            "msg":"No body sent"
        })
        return;
    }

    var newResponse = {};
    var id = request.body.id


    var query = ""
    var values = [];
    if('images' in request.body ) {
        var images = request.body.images
        query = "UPDATE recipes SET images = ? WHERE id = ?";
        values.push(JSON.stringify(images));
        values.push(id);
    }
    if('name' in request.body ) {
        var name = request.body.name
        query = "UPDATE recipes SET name = ? WHERE id = ?";
        values.push(name);
        values.push(id);
    }
    if('cookTime' in request.body ) {
        var cookTime = request.body.cookTime
        query = "UPDATE recipes SET cookTime = ? WHERE id = ?";
        values.push(cookTime);
        values.push(id);
    }
    if('prepTime' in request.body ) {
        var prepTime = request.body.prepTime
        query = "UPDATE recipes SET prepTime = ? WHERE id = ?";
        values.push(prepTime);
        values.push(id);
    }
    

    mysql.con.query(query, values, function(err,rows){

        if(err) { 
            log.error("Error occurred while grabing order archive information.");
            log.error("Error Msg: " + err);
            throw err;
        } else {
            log.debug("Success. Recipe Ingredient with id of ["+id+"] was updated")
            response.status(200).send({ success: true, message: "Success. Recipe Ingredient with id of ["+id+"] was updated"});
        }
    });

});



app.use("/updateRecipeIngredient", router);
app.post("/updateRecipeIngredient", function (request, response) {
    log.trace("Entering /updateRecipeIngredient....");
    if( request.body == undefined ) {
        log.error("/updateRecipeIngredient No Body Sent.");
        response.send({
            "success":"false",
            "msg":"No body sent"
        })
        return;
    }

    var newResponse = {};
    var id = request.body.id

    var query = ""
    var values = [];
    if('isRecipe' in request.body ) {
        var isRecipe = request.body.isRecipe
        query = "UPDATE recipeIngredients SET isRecipe = ? WHERE id = ?";
        values.push(isRecipe);
        values.push(id);
    }

    if('ingredientId' in request.body ) {
        var ingredientId = request.body.ingredientId
        query = "UPDATE recipeIngredients SET ingredientId = ? WHERE id = ?";
        values.push(ingredientId);
        values.push(id);
    }

    mysql.con.query(query, values, function(err,rows){

        if(err) { 
            log.error("Error occurred while grabing order archive information.");
            log.error("Error Msg: " + err);
            throw err;
        } else {
            log.debug("Success. Recipe Ingredient with id of ["+id+"] was updated")
            response.status(200).send({ success: true, message: "Success. Recipe Ingredient with id of ["+id+"] was updated"});
        }
    });

});

