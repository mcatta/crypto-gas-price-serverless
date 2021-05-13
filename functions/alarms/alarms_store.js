const { v4: uuidv4 } = require('uuid')
const firebase = require('firebase-admin')

module.exports = (db) => {
  const modules = {}
  const ALARMS_COLLECTION = db.collection('alarms')

  /**
   * Create new alarm
   * @param _user_id User's id
   * @param _limit price limit
   */
  modules.create = (_user_id, _limit) => {
    let data = {
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now(),
      enabled: true,
      limit: _limit,
      user_id: _user_id
    }
    let id = uuidv4()
    return ALARMS_COLLECTION.doc(id).set(data).then((res) => {
      data.id = id
      return data
    })
  }

  /**
   * Get all alarms
   * @param _user_id User's id
   */
   modules.get = (_user_id) => {
    return ALARMS_COLLECTION.where('user_id', '==', _user_id).get().then((snapshot) => {
      if (snapshot.empty) {
        return []
      } else {
        return snapshot.docs.map( (item) => {
          let obj = item.data()
          obj.id = item.id
          return obj
        })
      }
    })
  }

  /**
   * Get all alarms
   * @param _user_id User's id
   */
  modules.delete = (_doc_id, _user_id) => {
    return ALARMS_COLLECTION.doc(_doc_id).get().then((doc) => {
      if (doc.exists) {
        if (doc.data().user_id == _user_id) {
          return doc.ref.delete()
        } else {
          throw 'INVALID_USER'
        }
      } else {
        throw 'NOT_FOUND'
      }
    })
  }

  return modules
}