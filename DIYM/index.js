'use strict'
import request from 'request-promise-native'
import express from 'express'
import yaml_config from 'node-yaml-config'

const app = express()
app.use(express.json());
let port, OpenHimURL, chtUrl, configFile
let config = {}

// Allow port and config file override  for testing
if(process.env.DEV_PORT){
    port = process.env.DEV_PORT
    configFile = '../DIYM/config/diym.conf.yml'
} else {
    port = 5003
    configFile = '/etc/diym/diym.conf.yml'
}

app.post('/join_object/:foriegnSystem', function (req, res) {
    console.log('')
    console.log('START')

    let sent = false
    let okToGo = true
    let status = 201
    let chtId, lookupResult, result

    try {
        config = yaml_config.reload(configFile)
    } catch (e) {
        // don't exit here, we want the app to start even if it will always fail
        // this enables users to go back and add a config file
        console.log('   No or invalid config file, DIYM will always fail: ', e.message)
    }

    try {
        verfiyConfig()
        OpenHimURL = buildUrl(config.openhim)
        chtUrl = buildUrl(config.chw_systems.cht)
    } catch (e) {
        status = 500
        console.log('   Bad config: ', e.message)
        res.status(status).send({ 'id':'','result':'error', 'error': 'Bad config. Error: ' + e.message})
        okToGo = false
    }

    if (okToGo && !authenticate(req)){
        status = 401
        console.log('   Bad auth passed to DIYM')
        res.status(status).send({ 'id':'','result':'error', 'error': 'Bad auth passed to DIYM'})
        okToGo = false
    }

    if (okToGo) {
        try {
            chtId = req.body.identifier.value
        } catch (e) {
            console.log('   Error in POST data from client', e.message);
            status = 500;
            res.status(status).send({
                'id': '',
                'result': 'error',
                'error': 'Error in POST data from client. Error: ' + e.message
            })
            okToGo = false
        }
    }

    const foriegnSystem = req.params.foriegnSystem.toLowerCase()
    if (okToGo && foriegnSystem == 'cht'){
        getOpenHimId(OpenHimURL, 'Patient', chtId)
            .then(lookupResult => {
                if (lookupResult.result == 'found') {
                    if (chtId.indexOf('cht/') !== -1) {
                        chtId = chtId.split('/')[1]
                    }
                    return setChtExternalId(chtUrl, chtId, lookupResult.id)
                        .then(lookupResult2 => {
                            sendResult(res, lookupResult2)
                        })
                }
                sendResult(res, lookupResult)
            })
            .catch(e => {
                status = 500;
                res.status(status).send(lookupResult)
                console.log('   Error: ', e.message, e.stack)
            })
    }
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})

const authenticate = function (req){
    let login, password
    if(req.headers.authorization) {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
        [login, password] = credentials.split(':');
    }
    let i = 0;
    let found = false
    do {
        if (login == config.diym_credentials[i].login && password == config.diym_credentials[i].password){
            found = true
            break
        }
        i++
    } while (config.diym_credentials.length > i );
    return found
}

const buildUrl = function (parts){
    return parts.transport  + '://' +
        parts.user + ':' +
        parts.password + '@' +
        parts.url + ':' +
        parts.port
}

const verfiyConfig = function (){
    if(config.diym_credentials == undefined || config.diym_credentials.length == 0){
        throw Error('Missing credentials for DIYM');
    }
    if (config.openhim == undefined){
        throw Error('Missing config.openhim section');
    }
    if (config.openhim.user == undefined ||
        config.openhim.password == undefined ||
        config.openhim.url == undefined ||
        config.openhim.port == undefined ||
        config.openhim.transport == undefined
    ){
        throw Error('Incomplete config.openhim section');
    }
}

const sendResult = function(res, result){
    let status = 500
    if (result != undefined) {
        if ((result.result == 'success' || result.result == 'found')) {
            status = 200;
        } else if (result.result == 'not_found') {
            status = 404;
        } else if (result.result == 'auth_error') {
            status = 401;
        }
    }
    res.status(status).send(result)
}

const getChtUser = function(chtUrl, chtId){
    console.log('   getChtUser start ', chtUrl, chtId)
    let url
    let user = []
    let response = {'user':{},'result':'', 'error': ''}
    try {
        url = new URL('/medic/' + chtId, chtUrl)
    } catch(e) {
        console.log('   Error while creating url', e.message)
        response.error = 'getChtUser: Error creating URL ' + e.message
        response.result = 'error'
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
                console.log('   getChtUser success: ' , user.name)
            } else {
                response.result = 'not_found'
                response.error = 'user not found in CHT'
            }
            return response
        })
        .catch(e => {
            // todo - these errors aren't getting pushed up such that if auth fails against CHT,
            // upstream callers don't get 'auth_error' in 'result'
            if (e.statusCode == 401) {
                response.result = 'auth_error'
                console.log('   Bad authentication when getting the CHT user ', e.message)
                response.error = 'setChtExternalId: Bad authentication when getting the CHT user ' + e.message
            } else {
                response.result = 'error'
                console.log('   An error while getting the CHT user - ', e.stack)
                response.error = 'setChtExternalId: ' + e.message
            }
            return response
        })
}

const setChtExternalId = function(chtUrl, chtId, externalId){
    console.log('   setChtExternalId start ', chtUrl, chtId, externalId)
    let result, url
    let user = []
    let response = {'user':{},'result':'', 'error': ''}
    return getChtUser(chtUrl, chtId)
        .then(chtUser => {
            if(chtUser.result == 'found') {
                try {
                    url = new URL('/medic/' + chtId, chtUrl)
                } catch(e) {
                    console.log('   Error while creating url', e.message)
                    response.error = 'setChtExternalId: Error creating URL ' + e.message
                    response.result = 'error'
                    return response
                }
                const options = {
                    uri: url.href,
                    json: true
                };

                const postOptions = Object.assign({}, options)
                postOptions.uri = url.href + '?rev=' + chtUser.user._rev
                chtUser.user['external_id'] = externalId
                postOptions.body = chtUser.user

                try {
                    result = request.put(postOptions)
                    response.result = 'success'
                    console.log('   setChtExternalId: success - ', response);
                    return response
                } catch (e) {
                    console.log('   setChtExternalId: An error while updating the user - ', e.message);
                    response.error = 'setChtExternalId: Error setting URL in CHT ' + e.message
                    response.result = 'error'
                    return response
                }
            } else {
                // failed to fetch user, return chtUser instead of response like above
                return chtUser
            }
        })
        .catch(e => {
            console.log('   setChtExternalId: An error while getting the user - ', e.statusCode)
            response.error = 'setChtExternalId: ' + e.message
            response.result = 'error'
            return response
        })
}

const getOpenHimId = function(openHimURL, objectType, foriegnId, attempt = 0){
    console.log('   getOpenHimId start ', openHimURL, objectType, foriegnId);
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
                response.error = 'user not found in OpenHIM'
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
                response.result = 'auth_error'
                console.log('   Bad authentication when getting the user from OpenHIM ', e.message)
                response.error = 'getOpenHimIdByForiegnId: Bad authentication when getting the user from OpenHIM ' + e.message
            } else {
                response.result = 'error'
                console.log('   An error while getting the user - ', e.statusCode)
                response.error = 'getOpenHimIdByForiegnId: ' + e.message
            }
            return response
        })
}