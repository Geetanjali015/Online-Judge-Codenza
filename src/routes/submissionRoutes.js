const express = require('express');
const { body, param } = require('express-validator');

const submissionController = require('../controllers/submissionController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

const createSubmissionValidation = [
  body('problemId').isMongoId().withMessage('A valid problem ID is required'),
  body('language')
    .isIn(['cpp', 'c', 'java', 'python', 'javascript'])
    .withMessage('Language must be cpp, c, java, python, or javascript'),
  body('code')
    .isString()
    .withMessage('Code must be a string')
    .bail()
    .custom((code) => code.trim().length > 0)
    .withMessage('Code is required')
    .isLength({ max: 1000000 })
    .withMessage('Code cannot exceed 1000000 characters'),
];

const submissionIdValidation = [
  param('id').isMongoId().withMessage('Invalid submission ID'),
];

router.use(verifyToken);

router.post('/', createSubmissionValidation, submissionController.createSubmission);
router.get('/me', submissionController.getMySubmissions);
router.get('/:id', submissionIdValidation, submissionController.getSubmissionById);

module.exports = router;
