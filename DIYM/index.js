console.log('START')

import request from 'request-promise-native'
'use strict'
import express from 'express'
const app = express()
app.use(express.json());


// todo - put URL, login, password in a config file - add dist of config file
const OpenHimURL = 'https://test:test@192-168-68-40.my.local-ip.co:5002'

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
    let lookupResult
    let sent = false
    let validId
    let cht_id
    let response = {'id':'','result':'error', 'error': ''}
    const foriegnSystem = req.params.foriegnSystem.toLowerCase()

    try {
        cht_id = req.body.identifier.value + 1
        validId = true
    } catch (e) {
        console.log('Error while reading POST data', e.message);
        response.error = 'Cannot read POST data. Error: ' + e.message
        response.result = 'error'

        let status = 500;
        res.status(status).send(response)
        validId = false
    }

    if (foriegnSystem == 'cht' && validId == true){
        getOpenHimIdByForiegnId(OpenHimURL, 'Patient', cht_id)
            .then(lookupResult => {
                if (lookupResult.result == 'found') {
                    let status = 200;
                    console.log('Found!', lookupResult);
                    res.status(status).send(lookupResult)
                } else if (lookupResult.result == 'not_found') {
                    let status = 404;
                    console.log('Note Found!', lookupResult);
                    res.status(status).send(lookupResult)
                } else {
                    let status = 500;
                    console.log('error!', lookupResult);
                    res.status(status).send(lookupResult)
                }
            })
            .catch(e => {
                let status = 500;
                res.status(status).send(lookupResult)
            })
    }
    console.log('   DONE')
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})

const getOpenHimIdByForiegnId = function(openHimURL, objectType, foriegnId){
    console.log('getOpenHimIdByForiegnId start ', openHimURL, objectType, foriegnId);
    let url
    let response = {'id':'','result':'error', 'error': ''}
    const queryPath = '/fhir/' + objectType + '?identifier=' + foriegnId

    try {
        url = new URL(queryPath, openHimURL);
    } catch (e) {
        console.log('Error while creating url. Error: ', e.message);
        response.error = e.message
        response.result = 'error'
        return response;
    }

    const options = {
        uri: url.href,
        json: true
    };

    return request.get(options)
        .then(result => {
            if (typeof result.entry == 'object' && result.entry[0].resource.id != undefined){
                response.id = result.entry[0].resource.id
                response.result = 'found'
                return response
            } else {
                response.result = 'not_found'
                return response
            }
        })
        .catch(e => {
            console.log('An error while getting the user - ', e.message)
            response.error = 'getOpenHimIdByForiegnId: ' + e.message
            response.result = 'error'
            return response
        })
}