const express = require('express');
const { param } = require('express-validator');

const judgeController = require('../controllers/judgeController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/:submissionId',
  verifyToken,
  param('submissionId').isMongoId().withMessage('Invalid submission ID'),
  judgeController.judgeSubmission
);

module.exports = router;
