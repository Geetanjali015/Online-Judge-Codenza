const { validationResult } = require('express-validator');

const { enqueueSubmission } = require('../queues/submissionQueue');
const submissionService = require('../services/submissionService');

const judgeSubmission = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    // Reuse the existing owner/admin rule before placing a rejudge job in Redis.
    const submission = await submissionService.getSubmissionById(
      req.params.submissionId,
      req.user
    );

    submission.status = 'Queued';
    submission.verdict = null;
    submission.passedTestCases = 0;
    submission.totalTestCases = 0;
    submission.runtimeMs = null;
    submission.memoryKb = null;
    await submission.save();

    await enqueueSubmission(submission._id, { forceNew: true });

    return res.status(202).json({
      success: true,
      message: 'Submission queued for judging',
      submission,
    });
  } catch (error) {
    if ([400, 403, 404].includes(error.statusCode)) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Failed to queue submission for judging:', error);
    return res.status(503).json({ message: 'Judging queue is unavailable' });
  }
};

module.exports = {
  judgeSubmission,
};
