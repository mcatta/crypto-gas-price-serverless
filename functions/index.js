// Middleware
const functions = require("firebase-functions");
const firebase = require('firebase-admin')
const express = require('express')
const cors = require('cors')
require('dotenv').config()
firebase.initializeApp()
const db = firebase.firestore()
const gasApiApp = express()
gasApiApp.use(cors({ origin: true }))

// Local resources
const gasFeeStore = require('./gas_fee/gas_fee_store')(db)
const gasFeeApi = require('./gas_fee/gas_fee_api')(gasFeeStore)

const CHECK = 5

/**
 * Check Gas Price
 */
exports.checkGasPrice = functions.pubsub.schedule('every ' + CHECK + ' minutes').onRun((context) => {
    return gasFeeApi.check()
})

/**
 * Get last 100 records
 */
gasApiApp.get('/', (req, res) => {
    gasFeeStore.getAll((60 * 24) / CHECK).then( (histories) => {
        // Last 24 hours, but I want to reduce the series to 1/3
        res.json(histories.filter((item, i) => i % 3 == 0))
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
 * Exposes client rest API and region
 */
exports.histories = functions.region('europe-west2').https.onRequest(gasApiApp);