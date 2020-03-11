
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
    firebase.db.collection("recipes").withConverter(recipeConverter).get().then(function(docs) {
        docs.forEach(function(doc){
            var recipe = doc.data();
            storeRecipe(recipe);
            return
        });
        
        
        
    });
            
}

function storeRecipe(recipe) {
    
    var query = `
        INSERT INTO recipes (
            id,
            name,
            attAuthor,
            attLink,
            cookTime,
            prepTime,
            images
            instructions
            notes
        )
        VALUES (
            `+recipe.id+`,
            `+recipe.name+`,
            `+recipe.attribution.author+`,
            `+recipe.attribution.link+`,
            `+recipe.cookTime+`,
            `+recipe.prepTime+`,
            `+JSON.stringify(recipe.images)+`,
            `+JSON.stringify(recipe.instructions)+`,
            `+JSON.stringify(recipe.notes)+`
        );
    `
        
    log.trace("Sending SQL Query to grab all the order information.");
    mysql.con.query(query, function(err,rows){
        if(err) { 
            log.error("Error occurred while grabing order archive information.");
            log.error("Error Msg: " + err);
            newResponse["success"] = "false"
            newResponse["msg"] = err
            throw err;
        }
    }
}




main()
