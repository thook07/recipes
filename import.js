
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
        });
        
        
        
    });
            
}

function storeRecipe(recipe) {
    
    console.log("Name:",recipe.name,"ID",recipe.id,"Instr:",recipe.instructions);
    
    
    
}




main()
