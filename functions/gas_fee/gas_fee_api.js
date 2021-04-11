const axios = require('axios').default
const functions = require("firebase-functions");


module.exports = (_store) => {
	let modules = []

	modules.check = () => {
		return axios.get('https://www.gasnow.org/api/v3/gas/price?utm_source=android').then((response) => {
			let data = response.data.data

			return _store.add({
					fast: data.fast,
					rapid: data.rapid,
					standard: data.standard,
					slow: data.slow,
					timestamp: data.timestamp
			})
		}).catch(function (error) {
			// handle error
			functions.logger.error("Error on fetch gas fee from defipulse", error);
		})
	}

	return modules
}