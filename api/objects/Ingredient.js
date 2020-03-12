class Ingredient {
    
    /*
    Categories:
        - dairy
        - produce
        - spices
        - legumes
        - baking
        - bread-cereal-grains
        - frozen
        - other-canned-goods
        - bread
        - condiments
        - seeds-nuts-oils
        - misc



    */
    constructor(data) {
        this.id = ('id' in data ? data.id : undefined);
        this.name = ('name' in data ? data.name : undefined);
        this.category = ('category' in data ? data.category : "misc");
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
    
    toFirebase(){
        var map = {}
        map["id"] = this.id 
        map["name"] = this.name 
        map["category"] = this.category 
        
        
        return map;
    }
    
    
}
    
ingredientConverter = {
  toFirestore: function(ingredient) {
      return ingredient.toFirebase()
  },
  fromFirestore: function(snapshot, options){
      return new Ingredient(snapshot)
  }
}

module.exports = Ingredient;

