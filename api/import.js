
// BASE SETUP
// =============================================================================

// call the packages we need
var firebase = require('./firebase.js');
var log = require('./logger.js');
var mysql = require('./mysql.js');
var Recipe = require('./Recipe.js');

console.log("Starting Main!!!");

function recipes() {
    
    console.log("Getting Recipes");
    var recipes = [];
    firebase.db.collection("recipes").withConverter(recipeConverter).get().then(function(docs) {
        docs.forEach(function(doc){
            var recipe = doc.data();
            recipes.push(recipe);
            //storeRecipe(recipe);
        });
        console.log("Recipes: ["+recipes.length+"]")
        storeTags(recipes);
        
        
    });
            
}


function ingredients() {
    
    console.log("Getting Ingredients");
    var ingredients = [];
    firebase.db.collection("ingredients").get().then(function(docs) {
        docs.forEach(function(doc){
            var id = doc.data().id;
            var cat = doc.data().category;
            if( cat == undefined) {
                cat = "misc"
            }
            var ing = {};
            ing.id = id;
            ing.cat = cat;
            console.log(ing);
            ingredients.push(ing);
        });
        console.log("Ingredients: ["+ingredients.length+"]")
        storeIngredients(ingredients);
        
        
    });
            
}

function storeRecipe(recipe) {
    log.debug("recipe [" + recipe.name + "]");
    var query = `
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
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        );
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
    
    log.trace("query[" + query + "]");
    mysql.con.query(query, values, function(err,rows){
        if(err) { 
            log.error("Error occurred while grabing order archive information.");
            log.error("Error Msg: " + err);
            throw err;
        } else {
            log.debug("Success. ["+recipe.name+"] was written to the datbase")
        }
    });
}

function storeTags(recipes) {
    console.log("Recipes: ["+recipes.length+"]")
    var tags = [];
    for(var i=0; i < recipes.length; i++){
        console.log("Recipe: ["+recipes[i].name+"]");
        console.log("Recipe Tags: ["+recipes[i].tags+"]");
        for(var j=0; j < recipes[i].tags.length; j++) {
            var tag = recipes[i].tags[j]
            console.log("Tag ["+tag+"]");
            if(tags.indexOf(tag) == -1) {
                tags.push(tag);
            }
        }
    }
    console.log(tags);
    for(var i=0; i<tags.length; i++){
        storeTag(tags[i]);
    }
    
    
}

function storeTag(tag){
    log.debug("tag [" + tag + "]");
    var query = `
        INSERT INTO tags (
            id
        )
        VALUES (
            ?
        );
    `
    var values = [
        tag
    ]
    
    log.trace("query[" + query + "]");
    mysql.con.query(query, values, function(err,rows){
        if(err) { 
            log.error("Error occurred while grabing order archive information.");
            log.error("Error Msg: " + err);
            throw err;
        } else {
            log.debug("Success. ["+tag+"] was written to the datbase")
        }
    });
    
}

function storeIngredients(ingredients) {
    console.log("Ingredients: ["+ingredients.length+"]")
    for(var i=0; i < ingredients.length; i++){
        storeIngredient(ingredients[i])
    }
    console.log(tags);
    
}

function storeIngredient(ingredient) {
    log.debug("ingredient [" + ingredient.id + "]");
    var query = `
        INSERT INTO ingredients (
            id,
            category
        )
        VALUES (
            ?,
            ?
        );
    `
    var values = [
        ingredient.id,
        ingredient.category
    ]
    
    mysql.con.query(query, values, function(err,rows){
        if(err) { 
            log.error("Error occurred while grabing order archive information.");
            log.error("Error Msg: " + err);
            throw err;
        } else {
            log.debug("Success. ["+ingredient.id+"] was written to the datbase")
        }
    });    
}

//recipes()
ingredients()