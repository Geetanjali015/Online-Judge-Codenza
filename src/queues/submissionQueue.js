const { Queue } = require('bullmq');
const { randomUUID } = require('crypto');

const { createRedisConnection } = require('../config/redis');
const { SUBMISSION_QUEUE_NAME } = require('./queueNames');

const queueConnection = createRedisConnection({
  connectionName: 'submission-queue-producer',
});

const submissionQueue = new Queue(SUBMISSION_QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

submissionQueue.on('error', (error) => {
  console.error('Submission queue error:', error.message);
});

const enqueueSubmission = async (submissionId, { forceNew = false } = {}) =>
  submissionQueue.add(
    'judge-submission',
    { submissionId: submissionId.toString() },
    {
      jobId: forceNew
        ? `submission-${submissionId}-${randomUUID()}`
        : `submission-${submissionId}`,
    }
  );

const closeSubmissionQueue = async () => {
  await submissionQueue.close();
  if (queueConnection.status !== 'end') await queueConnection.quit();
};

module.exports = {
  closeSubmissionQueue,
  enqueueSubmission,
  submissionQueue,
};
