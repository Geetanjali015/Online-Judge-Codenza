const { validationResult } = require('express-validator');

const problemService = require('../services/problemService');

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
    return res.status(404).json({ message: 'Problem not found' });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }

  console.error(`Failed to ${operation} problem:`, error);
  return res.status(500).json({ message: 'Internal server error' });
};

const createProblem = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const problem = await problemService.createProblem(req.body, req.user.userId);

    return res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      problem,
    });
  } catch (error) {
    return sendServiceError(res, error, 'create');
  }
};

const getProblems = async (_req, res) => {
  try {
    const problems = await problemService.getProblems();
    return res.status(200).json({ success: true, problems });
  } catch (error) {
    return sendServiceError(res, error, 'list');
  }
};

const getProblemById = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const problem = await problemService.getProblemById(req.params.id);
    return res.status(200).json({ success: true, problem });
  } catch (error) {
    return sendServiceError(res, error, 'retrieve');
  }
};

const updateProblem = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const problem = await problemService.updateProblem(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      problem,
    });
  } catch (error) {
    return sendServiceError(res, error, 'update');
  }
};

const deleteProblem = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    await problemService.deleteProblem(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Problem deleted successfully',
    });
  } catch (error) {
    return sendServiceError(res, error, 'delete');
  }
};

module.exports = {
  createProblem,
  deleteProblem,
  getProblemById,
  getProblems,
  updateProblem,
};
