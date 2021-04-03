// Middleware
const functions = require("firebase-functions");
const firebase = require('firebase-admin')
const express = require('express')
const cors = require('cors')
firebase.initializeApp()
const db = firebase.firestore()

// Local resources
const gasFeeStore = require('./gas_fee/gas_fee_store')(db)
const gasFeeApi = require('./gas_fee/gas_fee_api')(gasFeeStore)

// Region
functions.region('europe-west2')

/**
 * Check Gas Price
 */
 exports.checkGasPrice = functions.pubsub.schedule('every 1 minutes').onRun((context) => {
    return gasFeeApi.check()
})