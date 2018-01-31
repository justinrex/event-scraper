const MongoClient = require('./mongoClient')

module.exports = {
  save: events => MongoClient.save('events', events),
  all: () => MongoClient.all('events')
}
