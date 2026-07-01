const dotenv = require('dotenv');

// Load environment variables before importing configuration that consumes them.
dotenv.config();

const app = require('./app');
const connectDatabase = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Connect to MongoDB before accepting traffic so the application never starts
 * in a partially initialized state.
 */
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

