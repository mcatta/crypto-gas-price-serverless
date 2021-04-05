// Middleware
const functions = require("firebase-functions");
const firebase = require('firebase-admin')
const express = require('express')
const cors = require('cors')
firebase.initializeApp()
const db = firebase.firestore()
const gasApiApp = express()
gasApiApp.use(cors({ origin: true }))

// Local resources
const gasFeeStore = require('./gas_fee/gas_fee_store')(db)
const gasFeeApi = require('./gas_fee/gas_fee_api')(gasFeeStore)

// Region
functions.region('europe-west2')

/**
 * Check Gas Price
 */
exports.checkGasPrice = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
    return gasFeeApi.check()
})

/**
 * Get last 100 records
 */
gasApiApp.get('/', (req, res) => {
    gasFeeStore.getAll(100).then( (histories) => {
        res.json(histories)
    })
})

/**
 * Get latest record
 */
gasApiApp.get('/latest', (req, res) => {
    gasFeeStore.getAll(1).then( (histories) => {
        res.json(histories[0])
    })
})

/**
 * Exposes client rest API
 */
exports.histories = functions.https.onRequest(gasApiApp);