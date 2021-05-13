// Middleware
const functions = require("firebase-functions");
const firebase = require('firebase-admin')
const express = require('express')

const cors = require('cors')
const cookieParser = require('cookie-parser')()
const gasApiApp = express()
const alarmsApiApp = express()

firebase.initializeApp()
const db = firebase.firestore()

// Local resources
const gasFeeStore = require('./gas_fee/gas_fee_store')(db)
const alarmsStore = require('./alarms/alarms_store')(db)
const gasFeeApi = require('./gas_fee/gas_fee_api')(gasFeeStore)

const CHECK = 1

/**
 * Check Gas Price
 */
exports.checkGasPrice = functions.region('europe-west2').pubsub.schedule('every ' + CHECK + ' minutes').onRun((context) => {
  return gasFeeApi.check()
})

/**
 * ============= API =============
 */

const validateFirebaseIdToken = async (req, res, next) => {
  functions.logger.log('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
    !(req.cookies && req.cookies.__session)) {
    functions.logger.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.'
    );
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    functions.logger.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if (req.cookies) {
    functions.logger.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await firebase.auth().verifyIdToken(idToken);
    functions.logger.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    functions.logger.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
    return;
  }
};

gasApiApp.use(cors({ origin: true }))
gasApiApp.use(cookieParser)
gasApiApp.use(validateFirebaseIdToken)

alarmsApiApp.use(cors({ origin: true }))
alarmsApiApp.use(cookieParser)
alarmsApiApp.use(validateFirebaseIdToken)
alarmsApiApp.use(express.urlencoded({
  extended: true
}))
alarmsApiApp.use(express.json())

/**
 * Get last 100 records
 */
gasApiApp.get('/', (req, res) => {
  gasFeeStore.getAll((60 * 24) / CHECK).then((histories) => {
    // Last 24 hours, but I want to reduce the series to 1/3
    res.json(histories.filter((item, i) => i % 5 == 0).reverse())
  })
})

/**
 * Get latest record
 */
gasApiApp.get('/latest', (req, res) => {
  gasFeeStore.getAll(1).then((histories) => {
    res.json(histories[0])
  })
})

/**
 * Get user's alarms
 */
alarmsApiApp.get('/', (req, res) => {
  let uuid = req.user.uid
  alarmsStore.get(uuid).then( (data) => {
    res.json(data)
  })
})

/**
 * Create user's alarm
 */
alarmsApiApp.post('/', (req, res) => {
  let uuid = req.user.uid
  let limit = req.body.limit

  alarmsStore.create(uuid, limit).then( (data) => {
    res.status(202).json(data)
  }).catch( (e) => {
    res.status(400).json(e)
  })
})

/**
 * Create user's alarm
 */
alarmsApiApp.delete('/:id', (req, res) => {
  let uuid = req.user.uid
  var id = req.params.id

  alarmsStore.delete(id, uuid).then( (data) => {
    res.status(204).send()
  }).catch( (e) => {
    res.status(400).json(e)
  })
})

/**
 * Exposes client rest API and region
 */
exports.histories = functions.region('europe-west2').https.onRequest(gasApiApp)
exports.alarms = functions.region('europe-west2').https.onRequest(alarmsApiApp)