const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\nConnection Info:');
    console.log('----------------');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Connected to Host:', mongoose.connection.host);
    console.log('Connection State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    
    // List all collections
    console.log('\nCollections:');
    console.log('------------');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkDatabase();
