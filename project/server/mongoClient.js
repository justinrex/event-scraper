const { MongoClient } = require('mongodb');

function createStore(clientFactory = () => new MongoClient(
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  { serverSelectionTimeoutMS: 5000 },
)) {
  async function withCollection(name, operation) {
    const client = clientFactory();
    try {
      await client.connect();
      const collection = client.db(process.env.MONGODB_DATABASE || 'event_scraper').collection(name);
      return await operation(collection);
    } finally {
      await client.close();
    }
  }

  return {
    save: (name, documents) => documents.length === 0 ? Promise.resolve() : withCollection(
      name,
      collection => collection.bulkWrite(documents.map(document => ({
        updateOne: {
          filter: { title: document.title, date: document.date },
          update: { $set: document },
          upsert: true,
        },
      }))),
    ),
    all: name => withCollection(name, collection => collection.find().toArray()),
  };
}

module.exports = { ...createStore(), createStore };
