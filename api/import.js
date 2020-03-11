
// BASE SETUP
// =============================================================================

// call the packages we need
var firebase = require('./firebase.js');
var log = require('./logger.js');
var mysql = require('./mysql.js');
var Recipe = require('./Recipe.js');

console.log("Starting Main!!!");

function main() {
    
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

function storeInstructions(recipes) {
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
    
}

main()
