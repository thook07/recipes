# Recipe API

## /recipes

### GET
Returns a list of all the recipes in the database. Might need to consider limiting this as we get items in the database

#### Parameters 
None at this time

#### Responses

**200** - Success 

```json
[
    {
        name: chocolate-chip-cookies,
        display_name: Chocolate Chip Cookies,
    },
    {
        name: jalapeno-mac-and-cheese,
        display_name: Jalapeno Mac and Cheese,
    }
]


```
