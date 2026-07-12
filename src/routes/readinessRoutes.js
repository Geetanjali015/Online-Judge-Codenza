const express = require('express');
const { param } = require('express-validator');

const readinessController = require('../controllers/readinessController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

const readinessReportValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
];

router.use(verifyToken);

router.get(
  '/:userId',
  readinessReportValidation,
  readinessController.getReadinessReport
);

module.exports = router;
