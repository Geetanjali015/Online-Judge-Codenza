const { validationResult } = require('express-validator');

const submissionService = require('../services/submissionService');

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return false;

  res.status(400).json({
    success: false,
    errors: errors.array(),
  });

  return true;
};

const sendServiceError = (res, error, operation) => {
  if ([403, 404, 503].includes(error.statusCode)) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }

  console.error(`Failed to ${operation} submission:`, error);
  return res.status(500).json({ message: 'Internal server error' });
};

const createSubmission = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const { problemId, language, code } = req.body;
    const submission = await submissionService.createSubmission(
      req.user.userId,
      problemId,
      language,
      code
    );

    return res.status(201).json({
      success: true,
      message: 'Submission queued successfully',
      submission,
    });
  } catch (error) {
    return sendServiceError(res, error, 'create');
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const submissions = await submissionService.getMySubmissions(req.user.userId);
    return res.status(200).json({ success: true, submissions });
  } catch (error) {
    return sendServiceError(res, error, 'list');
  }
};

const getSubmissionById = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const submission = await submissionService.getSubmissionById(
      req.params.id,
      req.user
    );
    return res.status(200).json({ success: true, submission });
  } catch (error) {
    return sendServiceError(res, error, 'retrieve');
  }
};

module.exports = {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
};
