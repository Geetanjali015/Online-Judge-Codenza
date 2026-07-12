const { validationResult } = require('express-validator');

const readinessService = require('../services/readinessService');

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return false;

  res.status(400).json({
    success: false,
    errors: errors.array(),
  });

  return true;
};

const sendServiceError = (res, error) => {
  if ([400, 403, 404].includes(error.statusCode)) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error('Failed to generate readiness report:', error);
  return res.status(500).json({ message: 'Internal server error' });
};

const getReadinessReport = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const readiness = await readinessService.getReadinessReport(
      req.params.userId,
      req.user
    );

    return res.status(200).json({
      success: true,
      readiness,
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
};

module.exports = {
  getReadinessReport,
};
