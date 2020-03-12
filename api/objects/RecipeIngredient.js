class RecipeIngredient {

    constructor(data) {
        this.id = ('id' in data ? data.id : undefined);
        this.amount = ('amount' in data ? data.amount : undefined);
        this.ingredientDescription ('ingredientDescription' in data ? data.ingredientDescription : undefined);
        this.ingredient ('ingredient' in data ? data.ingredient : undefined);
    }
    
    toString() {
        var map = {};
        map[this.id] = {
            "id":this.id,
            "name":this.name,
            "category":this.category
        }
        return map;
    }
    
    
    
}

module.exports = RecipeIngredient;

