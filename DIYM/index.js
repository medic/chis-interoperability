

import request from 'request-promise-native'
'use strict'
import express from 'express'
const app = express()
app.use(express.json());


// todo - put URL, login, password in a config file - add dist of config file
const OpenHimURL = 'https://test:test@192-168-68-40.my.local-ip.co:5002'
const chtUrl = 'https://medic:password@192-168-68-40.my.local-ip.co'

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
    console.log('')
    console.log('START')
    let sent = false
    let validId, chtId, status, lookupResult, result
    const foriegnSystem = req.params.foriegnSystem.toLowerCase()

    try {
        chtId = req.body.identifier.value
        validId = true
    } catch (e) {
        console.log('   Error in POST data from client', e.message);
        status = 500;
        res.status(status).send({ 'id':'','result':'error', 'error': 'Error in POST data from client. Error: ' + e.message })
        validId = false
    }

    if (foriegnSystem == 'cht' && validId == true){
        getOpenHimId(OpenHimURL, 'Patient', chtId)
            .then(lookupResult => {
                if (lookupResult.result == 'found') {
                    if(chtId.indexOf('cht/') !== -1){
                        chtId = chtId.split('/')[1]
                    }
                    console.log('   got him user: ', lookupResult)
                    console.log('   got cht id: ', chtId)
                    // result = getChtUser(chtUrl, chtId)
                    result = setChtExternalId(chtUrl, chtId, lookupResult.id)
                    status = 200;
                } else if (lookupResult.result == 'not_found') {
                    status = 404;
                } else {
                    status = 500;
                }
                res.status(status).send(lookupResult)
            })
            .catch(e => {
                status = 500;
                res.status(status).send(lookupResult)
                console.log('   Error: ', e.message, e.stack)
            })
    }
    console.log('   DONE')
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})

const getChtUser = function(chtUrl, chtId){
    console.log('   getChtUser start ', chtUrl, chtId)
    let url
    let user = []
    let response = {'user':{},'result':'', 'error': ''}
    try {
        url = new URL('/medic/' + chtId, chtUrl)
    } catch(e) {
        console.log('   Error while creating url', e.message)
        response.error = 'setChtExternalId: Error creating URL ' + e.message
        response.result = 'erorr'
        return response
    }

    const options = {
        uri: url.href,
        json: true
    };

    return request.get(options)
        .then(user => {
            if (typeof user.parent == 'object' ){
                response.user = user
                response.result = 'found'
                console.log('   getChtUser success: ', response.user.name)
            } else {
                response.result = 'not_found'
            }
            return response
        })
        .catch(e => {
            if (e.statusCode == 401) {
                console.log('   Bad authentication when getting the CHT user ', e.message)
                response.error = 'setChtExternalId: Bad authentication when getting the CHT user ' + e.message
            } else {
                console.log('   An error while getting the CHT user - ', e.stack)
                response.error = 'setChtExternalId: ' + e.message
            }
            response.result = 'erorr'
            response = 'error'
            return response
        })
}

const setChtExternalId = function(chtUrl, chtId, externalId){
    console.log('   setChtExternalId start ', chtUrl, chtId, externalId)
    let response
    getChtUser(chtUrl, chtId)
        .then(chtUser => {
            if(chtUser.result == 'found') {

                console.log('   setChtExternalId found cht user ', chtUser.name)
                const postOptions = Object.assign({}, options)
                postOptions.uri = url.href + '?rev=' + chtUser._rev
                chtUser['external_id'] = externalId
                postOptions.body = chtUser

                try {
                    result = request.put(postOptions)
                    console.log('success ', result);
                    return true
                } catch (e) {
                    console.log('   An error while updating the user - ', e.message);
                    return false
                }
            }
        })
}

const getOpenHimId = function(openHimURL, objectType, foriegnId, attempt = 0){
    console.log('   getOpenHimIdByForiegnId start ', openHimURL, objectType, foriegnId);
    let url
    let response = {'id':'','result':'', 'error': ''}
    const queryPath = '/fhir/' + objectType + '?identifier=' + foriegnId

    try {
        url = new URL(queryPath, openHimURL);
    } catch (e) {
        console.log('   Error while creating url. Error: ', e.message);
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
            } else {
                response.result = 'not_found'
                // try 4 times in case OpenHIM hasn't processed the data just yet
                // todo - add 500-1000ms sleep in here
                while (attempt != 4){
                    console.log('   failed to find ID, retrying, attemp ', attempt)
                    attempt++
                    return getOpenHimId(openHimURL, objectType, foriegnId, attempt)
                }
            }
            return response
        })
        .catch(e => {
            if (e.statusCode == 401) {
                console.log('   Bad authentication when getting the user ', e.message)
                response.error = 'getOpenHimIdByForiegnId: Bad authentication when getting the user ' + e.message
            } else {
                console.log('   An error while getting the user - ', e.statusCode)
                response.error = 'getOpenHimIdByForiegnId: ' + e.message
            }
            response.result = 'error'
            return response
        })
}