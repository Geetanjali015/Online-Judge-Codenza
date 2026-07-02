const { Worker } = require('bullmq');

const { createRedisConnection } = require('../config/redis');
const { SUBMISSION_QUEUE_NAME } = require('../queues/queueNames');
const { judgeSubmission } = require('../services/judgeService');

let submissionWorker;
let workerConnection;
let lastWorkerErrorLogAt = 0;

const startSubmissionWorker = () => {
  if (submissionWorker) return submissionWorker;

  workerConnection = createRedisConnection({
    connectionName: 'submission-judge-worker',
    worker: true,
  });

  submissionWorker = new Worker(
    SUBMISSION_QUEUE_NAME,
    async (job) => {
      const { submissionId } = job.data;

      if (!submissionId) {
        throw new Error('Submission job is missing submissionId');
      }

      return judgeSubmission(submissionId);
    },
    {
      connection: workerConnection,
      concurrency: 1,
    }
  );

  submissionWorker.on('ready', () => {
    console.log('Submission worker connected to Redis');
  });

  submissionWorker.on('completed', (job, result) => {
    console.log(`Submission job ${job.id} completed with ${result.verdict}`);
  });

  submissionWorker.on('failed', (job, error) => {
    const attempts = job?.opts.attempts || 1;
    console.error(
      `Submission job ${job?.id || 'unknown'} failed ` +
        `(attempt ${job?.attemptsMade || 0}/${attempts}):`,
      error.message
    );
  });

  // BullMQ requires an error listener so connection errors do not stop the worker.
  submissionWorker.on('error', (error) => {
    if (Date.now() - lastWorkerErrorLogAt >= 5000) {
      console.error('Submission worker error:', error.message);
      lastWorkerErrorLogAt = Date.now();
    }
  });

  return submissionWorker;
};

const closeSubmissionWorker = async () => {
  if (submissionWorker) {
    await submissionWorker.close();
    submissionWorker = undefined;
  }

  if (workerConnection && workerConnection.status !== 'end') {
    await workerConnection.quit();
    workerConnection = undefined;
  }
};

module.exports = {
  closeSubmissionWorker,
  startSubmissionWorker,
};
