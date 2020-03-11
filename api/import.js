
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
    for(recipe in recipes){
        console.log("Recipe: ["+recipe.name+"]");
        for(tag in recipe.tags) {
            if(tags.indexOf(tag) !== -1) {
                tags.push(tag);
            }
        }
    }
    console.log(tags);
    
}

main()
