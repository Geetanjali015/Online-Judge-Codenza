const mongoose = require('mongoose');

/**
 * Establishes the application's MongoDB connection.
 * The process fails fast when configuration is missing or Atlas is unreachable.
 */
const connectDatabase = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined in the environment');
  }

  await mongoose.connect(MONGO_URI);
  console.log('MongoDB Connected');
};

module.exports = connectDatabase;

