const express = require('express');
const { body } = require('express-validator');

const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.post(
  '/hint',
  body('problemId').isMongoId().withMessage('A valid problem ID is required'),
  aiController.generateHint
);

router.post(
  '/explain-error',
  body('submissionId').isMongoId().withMessage('A valid submission ID is required'),
  aiController.explainError
);

module.exports = router;
