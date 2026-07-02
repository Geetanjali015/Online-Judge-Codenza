const { validationResult } = require('express-validator');

const hiddenTestService = require('../services/hiddenTestService');

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
  if (error.statusCode === 404) {
    return res.status(404).json({ message: error.message });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }

  console.error(`Failed to ${operation} hidden test:`, error);
  return res.status(500).json({ message: 'Internal server error' });
};

const createHiddenTest = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const { problemId, input, expectedOutput } = req.body;
    const hiddenTest = await hiddenTestService.createHiddenTest(
      problemId,
      input,
      expectedOutput
    );

    return res.status(201).json({
      success: true,
      message: 'Hidden test created successfully',
      hiddenTest,
    });
  } catch (error) {
    return sendServiceError(res, error, 'create');
  }
};

const getHiddenTestsByProblem = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const hiddenTests = await hiddenTestService.getHiddenTestsByProblem(
      req.params.problemId
    );

    return res.status(200).json({ success: true, hiddenTests });
  } catch (error) {
    return sendServiceError(res, error, 'retrieve');
  }
};

const updateHiddenTest = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const hiddenTest = await hiddenTestService.updateHiddenTest(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Hidden test updated successfully',
      hiddenTest,
    });
  } catch (error) {
    return sendServiceError(res, error, 'update');
  }
};

const deleteHiddenTest = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    await hiddenTestService.deleteHiddenTest(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Hidden test deleted successfully',
    });
  } catch (error) {
    return sendServiceError(res, error, 'delete');
  }
};

module.exports = {
  createHiddenTest,
  deleteHiddenTest,
  getHiddenTestsByProblem,
  updateHiddenTest,
};
