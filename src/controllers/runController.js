const { validationResult } = require('express-validator');

const runService = require('../services/runService');

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return false;

  res.status(400).json({
    success: false,
    errors: errors.array(),
  });

  return true;
};

const runCode = async (req, res) => {
  if (sendValidationErrors(req, res)) return undefined;

  try {
    const result = await runService.runCode(req.body);

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Failed to run code:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  runCode,
};
