
'use strict'

import express from 'express'

const app = express()

// Any request regardless of request type or url path to the mediator port will be caught here
// and trigger the Hello World response.
app.all('*', (_req, res) => {
    res.send('Hello World')
})

app.listen(5051, () => {
    console.log('Server listening on port 5051...')
})

