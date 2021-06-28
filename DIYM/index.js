
console.log('START')
'use strict'
import express from 'express'
const app = express()
app.use(express.json());

// Allow port override for testing
let port = 5051
if(process.env.DEV_PORT){
    port = process.env.DEV_PORT
}

// process POSTs to /join_object/:foriegnSystem
// can test with:
//   curl -X POST -H "Content-Type: application/json" -d @cht-config/sample.patient.json http://localhost:5053/join_object/chT
// for dev use custom port with nodemon for reload
//   DEV_PORT=5053 nodemon index.js
app.post('/join_object/:foriegnSystem', function (req, res) {
    console.log('GOT POST')
    const foriegnSystem = req.params.foriegnSystem.toLowerCase()
    const cht_id = req.body.identifier.value
    if (foriegnSystem == 'cht' && cht_id != undefined){
        console.log('   GOT CHT ID: ' , cht_id)
    }
    res.send('  Thanks!')
})


app.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})

