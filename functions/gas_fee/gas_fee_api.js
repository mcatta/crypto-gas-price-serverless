const axios = require('axios').default
const functions = require("firebase-functions");
require('dotenv').config()


module.exports = (_store) => {
	let modules = []

	modules.check = () => {
		return axios.get('https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=' + process.env.DEFIPULSE_API_KEY).then((response) => {
			let data = response.data

			return _store.add({
					fast: data.fast,
					fastest: data.fastest,
					safeLow: data.safeLow,
					average: data.average,
					block_time: data.block_time,
					blockNum: data.blockNum,
					speed: data.speed,
					safeLowWait: data.safeLowWait,
					avgWait: data.avgWait,
					fastWait: data.fastWait,
					fastestWait: data.fastestWait
			})
		}).catch(function (error) {
			// handle error
			functions.logger.error("Error on fetch gas fee from defipulse", error);
		})
	}

	return modules
}