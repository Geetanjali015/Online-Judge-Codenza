const { validationResult } = require('express-validator');

const aiService = require('../services/aiService');

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
  if ([403, 404].includes(error.statusCode)) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error.statusCode === 502) {
    console.error(`AI provider failed during ${operation}:`, error.cause || error);
    return res.status(502).json({ message: 'AI provider request failed' });
  }

  if (error.statusCode === 500) {
    console.error(`AI configuration error during ${operation}:`, error.message);
    return res.status(500).json({ message: error.message });
  }

  console.error(`Failed to ${operation}:`, error);
  return res.status(500).json({ message: 'Internal server error' });
};

const generateHint = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const hint = await aiService.generateHint(req.body.problemId);
    return res.status(200).json({ success: true, hint });
  } catch (error) {
    return sendServiceError(res, error, 'generate hint');
  }
};

const explainError = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const explanation = await aiService.explainSubmissionError(
      req.body.submissionId,
      req.user
    );
    return res.status(200).json({ success: true, explanation });
  } catch (error) {
    return sendServiceError(res, error, 'explain submission error');
  }
};

module.exports = {
  explainError,
  generateHint,
};
