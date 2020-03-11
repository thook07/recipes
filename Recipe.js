class Recipe {
    
    constructor(data) {
        this.id = ('id' in data ? data.id : undefined);
        this.name = ('name' in data ? data.name : undefined);
        this.ingredients = ('ingredients' in data ? data.ingredients : undefined);
        this.instructions = ('instructions' in data ? data.instructions : undefined);
        this.notes = ('notes' in data ? data.notes : undefined);
        this.tags = ('tags' in data ? data.tags : undefined);
        this.cookTime = ('cookTime' in data ? data.cookTime : undefined);
        this.prepTime = ('prepTime' in data ? data.prepTime : undefined);
        this.attribution = ('attribution' in data ? data.attribution : undefined);
        this.images = ('images' in data ? data.images : undefined);
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
    
    toFirebase(){
        var map = {}
        map["id"] = this.id 
        map["name"] = this.name 
        map["ingredients"] = this.ingredients 
        map["instructions"] = this.instructions 
        if(this.notes != undefined) { map['notes'] = this.notes }
        if(this.tags != undefined) { map['tags'] = this.tags }
        if(this.cookTime != undefined) { map['cookTime'] = this.cookTime }
        if(this.prepTime != undefined) { map['prepTime'] = this.prepTime }
        if(this.attribution != undefined) { map['attribution'] = this.attribution }
        if(this.images != undefined) { map['images'] = this.images }
        
        return map;
    }
    
    
}
    
recipeConverter = {
  toFirestore: function(recipe) {
      return recipe.toFirebase()
  },
  fromFirestore: function(snapshot, options){
      return new Recipe(snapshot)
  }
}

