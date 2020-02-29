const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => 
    res.send('Hello World!')
)

app.get('/recipes/', (req, res) => 
    
    res.statusCode = 200
    res.json([{
            'id': 'chocolate-chip-cookies-2',
            'name': 'Chocolate Chip Cookies',
            'tags': [{
                'id': 'cookie',
                'name': 'Cookie'
            },
            {
                'id': 'dessert',
                'name': 'Dessert'
            }],
            'id': 'jalapeno-mac-and-cheese',
            'name': 'Jalapeno-mac-and-cheese',
            'tags': [{
                'id': 'cookie',
                'id': 'dessert'
            }]
        }]
    })
    return res
)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))