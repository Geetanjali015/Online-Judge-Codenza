const { validationResult } = require('express-validator');

const judgeService = require('../services/judgeService');
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
    // Reuse the existing owner/admin rule before any submitted code is executed.
    await submissionService.getSubmissionById(req.params.submissionId, req.user);

    const result = await judgeService.judgeSubmission(req.params.submissionId);
    const submission = await submissionService.getSubmissionById(
      req.params.submissionId,
      req.user
    );

    return res.status(200).json({
      success: true,
      result,
      submission,
    });
  } catch (error) {
    if ([400, 403, 404].includes(error.statusCode)) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Failed to judge submission:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  judgeSubmission,
};
