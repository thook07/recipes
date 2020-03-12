class Recipe {
    
    constructor(data) {
        this.id = ('id' in data ? data.id : undefined);
        this.name = ('name' in data ? data.name : undefined);
        this.cookTime = ('cookTime' in data ? data.cookTime : undefined);
        this.prepTime = ('prepTime' in data ? data.prepTime : undefined);
        this.attribution = ('attribution' in data ? data.attribution : undefined);
        this.instructions = ('instructions' in data ? data.instructions : undefined);
        this.notes = ('notes' in data ? data.notes : undefined);
        this.recipeIngredients = ('recipeIngredients' in data ? data.recipeIngredients : undefined);
        this.tags = ('tags' in data ? data.tags : undefined);
        this.images = ('images' in data ? data.images : undefined);
    }

    setRecipeIngredients(recipeIngredients) {
        
    }

    setTags(tags) {

    }
    
    toString() {
        var map = {};
        map[this.id] = {
            "id":this.id,
            "name":this.name,
            "ingredients":this.ingredients,
            "instructions": this.instructions
        }
        return map;
    }
    
    
}

