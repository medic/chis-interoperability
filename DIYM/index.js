console.log('START')

import request from 'request-promise-native'
'use strict'
import express from 'express'
const app = express()
app.use(express.json());


// todo - put URL, login, password in a config file - add dist of config file
const OpenHimURL = 'https://test:tesst@192-168-68-40.my.local-ip.co:5002'

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
// todo - add authentication to this request
app.post('/join_object/:foriegnSystem', function (req, res) {
    let himId
    let sent = false
    const foriegnSystem = req.params.foriegnSystem.toLowerCase()
    const cht_id = req.body.identifier.value
    if (foriegnSystem == 'cht' && cht_id != undefined){
        getOpenHimIdByForiegnId(OpenHimURL, 'Patient', cht_id)
            .then(himId => {
                if (himId != false) {
                    let status = 200;
                    res.status(status).send({'id': himId, 'result': 'found'})
                } else {
                    let status = 404;
                    res.status(status).send({'id': '', 'result': 'not_found'})
                }
            })
            .catch(e => {
                let status = 500;
                res.status(status).send({ 'id': '', 'result' : 'error' })
            })
    }
    console.log('   DONE')
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})

const getOpenHimIdByForiegnId = function(openHimURL, objectType, foriegnId){
    let url
    let result
    const queryPath = '/fhir/' + objectType + '?identifier=' + foriegnId

    try {
        url = new URL(queryPath, openHimURL);
    } catch (e) {
        console.log('Error while creating url. Error: ', e.message);
    }

    const options = {
        uri: url.href,
        json: true
    };

    return request.get(options)
        .then(result => {
            if (typeof result.entry == 'object' && result.entry[0].resource.id != undefined){
                return result.entry[0].resource.id
            }
            return false
        })
        .catch(e => {
            console.log('An error while getting the user - ', e.message);
            return false
        })

}