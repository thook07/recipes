# Recipe API

## /recipes

### GET
Returns a list of all the recipes in the database. Might need to consider limiting this as we get items in the database

#### Parameters 

**filter** - any filter thats required. will default to none

#### Responses

* Code: **200** - Success

```javascript
[
    {
        id: chocolate-chip-cookies,
        name: Chocolate Chip Cookies,
        tags: [
            { id: cookie,
              name: Cookie
            },
            { id: dessert,
              name: Dessert
            }
        ]
    },
    {
        id: jalapeno-mac-and-cheese,
        name: Jalapeno Mac and Cheese,
        tags: [
            { id: pasta,
              name: Pasta
            },
            { id: dinner,
              name: Dinner
            }
        ]
    }
]
```

* Code: **403** - Forbidden

## /recipes/{recipe-id}

### GET
Returns a single recipe based on the id supplied

#### Parameters 

**recipe-id** - id of the recipe to retreive

#### Responses

* **200** - Success

```javascript
{
    id: chocolate-chip-cookies,
    name: Chocolate Chip Cookies,
    tags: [
        { id: cookie,
          name: Cookie
        },
        { id: dessert,
          name: Dessert
        }
    ]
}
```

* **404** - recipe-id was not found in database

