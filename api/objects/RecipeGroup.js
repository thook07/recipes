class User {
    
    constructor(data) {
        this.email = ('email' in data ? data.email : undefined);
        this.groceryList =  ('groceryList' in data ? data.groceryList : undefined);
    }
    
    toString() {
        var map = {};
        map[this.id] = {
            "id":this.id,
            "name":this.name
        }
        return map;
    }
    
    toFirebase(){
        var map = {}
        map["email"] = this.email
        if(this.groceryList != undefined || this.groceryList.length == 0) { map['groceryList'] = this.groceryList }
        /*map["ingredients"] = this.ingredients 
        map["instructions"] = this.instructions 
        if(this.notes != undefined) { map['notes'] = this.notes }
        if(this.tags != undefined) { map['tags'] = this.tags }
        if(this.cookTime != undefined) { map['cookTime'] = this.cookTime }
        if(this.prepTime != undefined) { map['prepTime'] = this.prepTime }
        if(this.attribution != undefined) { map['attribution'] = this.attribution }
        if(this.images != undefined) { map['images'] = this.images }*/
        
        return map;
    }
    
    removeItemFromGroceryList(recipeId){
        if(this.groceryList == undefined) {
            //
            return null;
        }
        
        var index = this.groceryList.indexOf(recipeId);
        if (index !== -1) this.groceryList.splice(index, 1);
        
        return this.groceryList.length;
    }
    
    addItemToGroceryList(recipeId){
        console.log("adding ",recipeId,' to the grocery list', this.groceryList);
        if(this.groceryList == undefined) {
            this.groceryList = []
        }
        
        console.log('checking to see if it already exists');
        for(var i=0;i<this.groceryList.length;i++) {
            if(recipeId.localeCompare(this.groceryList[i]) == 0){
                console.log("Already existed. Not adding. Returning null..");
               //already existed
               return null;
            } 
        }
        console.log("didnt exist. Will add to the list!")
        this.groceryList.push(recipeId);
        
        console.log("Grocery List now has ", this.groceryList.length, ' recipes in it.');
        return this.groceryList.length;
    }
    
    save(fn) {
        db.collection("users").doc(this.email)
        .withConverter(userConverter)
        .set(this).then(fn);
    }
    
    
    
}
    
userConverter = {
  toFirestore: function(recipe) {
      return recipe.toFirebase()
  },
  fromFirestore: function(snapshot, options){
      return new User(snapshot)
  }
}



module.exports = User;