const express = require('express');
const { body } = require('express-validator');

const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

const submissionIdValidation = body('submissionId')
  .isMongoId()
  .withMessage('A valid submission ID is required');

router.post(
  '/hint',
  body('problemId').isMongoId().withMessage('A valid problem ID is required'),
  aiController.generateHint
);

router.post(
  '/explain-error',
  submissionIdValidation,
  aiController.explainError
);

router.post('/code-review', submissionIdValidation, aiController.reviewCode);
router.post('/optimize', submissionIdValidation, aiController.suggestOptimizations);
router.post('/complexity', submissionIdValidation, aiController.estimateComplexity);

module.exports = router;
