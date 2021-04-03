const { v4: uuidv4 } = require('uuid')
const firebase = require('firebase-admin')

module.exports = (db) => {
  const modules = {}
  const HISTORIES_COLLECTION = db.collection('histories')
  
  /**
   * Create a new history
   * @param {Object} _data
   */
  modules.add = (_data) => {
      // Add dates
      _data.createdAt = admin.firestore.Timestamp.now()
      let id = uuidv4()
      return HISTORIES_COLLECTION.doc(id).set(_data).then( () => {
          return _data
      })
  }

  /**
   * Get history series with limit
   * @param {Integer} _limit records 
   */
  modules.getAll = (_limit) => {
      return HISTORIES_COLLECTION.orderBy('createdAt').limit(_limit).then( (doc) => {
          if (doc.exists) {
              return doc.data()
          } else {
              return []
          }
      })
  }

  return modules
}