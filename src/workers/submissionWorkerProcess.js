const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const connectDatabase = require('../config/db');
const {
  closeSubmissionWorker,
  startSubmissionWorker,
} = require('./submissionWorker');

const startWorkerProcess = async () => {
  try {
    await connectDatabase();
    startSubmissionWorker();
    console.log('Standalone submission worker started');
  } catch (error) {
    console.error('Failed to start submission worker:', error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received; stopping submission worker`);
  await closeSubmissionWorker();
  await mongoose.disconnect();
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

startWorkerProcess();
