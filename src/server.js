const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables before importing configuration that consumes them.
dotenv.config();

const app = require('./app');
const connectDatabase = require('./config/db');
const { closeSubmissionQueue } = require('./queues/submissionQueue');
const {
  closeSubmissionWorker,
  startSubmissionWorker,
} = require('./workers/submissionWorker');

const PORT = process.env.PORT || 5000;
let httpServer;

/**
 * Connect to MongoDB before accepting traffic so the application never starts
 * in a partially initialized state.
 */
const startServer = async () => {
  try {
    await connectDatabase();
    startSubmissionWorker();

    httpServer = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down gracefully`);

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  await Promise.allSettled([
    closeSubmissionWorker(),
    closeSubmissionQueue(),
  ]);
  await mongoose.disconnect();
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

startServer();
