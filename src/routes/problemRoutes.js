const express = require('express');
const { body, param } = require('express-validator');

const problemController = require('../controllers/problemController');
const { authorize, verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

const problemIdValidation = [param('id').isMongoId().withMessage('Invalid problem ID')];

const validateProblemFields = (optional) => [
  body('title')
    .optional(optional)
    .isString()
    .withMessage('Title must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('statement')
    .optional(optional)
    .isString()
    .withMessage('Statement must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Statement is required')
    .isLength({ max: 50000 })
    .withMessage('Statement cannot exceed 50000 characters'),
  body('difficulty')
    .optional(optional)
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  body('timeLimitMs')
    .optional(optional)
    .isInt({ min: 1, max: 60000 })
    .withMessage('Time limit must be an integer between 1 and 60000 milliseconds')
    .toInt(),
  body('memoryLimitMb')
    .optional(optional)
    .isInt({ min: 1, max: 4096 })
    .withMessage('Memory limit must be an integer between 1 and 4096 MB')
    .toInt(),
  body('tags').optional().isArray({ max: 20 }).withMessage('Tags must be an array of at most 20 items'),
  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string')
    .bail()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must contain between 1 and 50 characters'),
  body('constraints').optional().isString().withMessage('Constraints must be a string'),
  body('sampleTests').optional().isArray().withMessage('Sample tests must be an array'),
  body('sampleTests.*.input').optional().isString().withMessage('Sample test input must be a string'),
  body('sampleTests.*.output').optional().isString().withMessage('Sample test output must be a string'),
  body('boilerplate')
    .optional()
    .isObject()
    .withMessage('Boilerplate must be an object keyed by language'),
];

const createProblemValidation = validateProblemFields(false);
const updateProblemValidation = [
  ...problemIdValidation,
  ...validateProblemFields(true),
  body().custom((value) => {
    const editableFields = [
      'title',
      'statement',
      'difficulty',
      'tags',
      'constraints',
      'sampleTests',
      'boilerplate',
      'timeLimitMs',
      'memoryLimitMb',
    ];

    if (!editableFields.some((field) => Object.hasOwn(value, field))) {
      throw new Error('At least one editable problem field is required');
    }

    return true;
  }),
];

router
  .route('/')
  .get(verifyToken, problemController.getProblems)
  .post(verifyToken, authorize('admin'), createProblemValidation, problemController.createProblem);

router
  .route('/:id')
  .get(verifyToken, problemIdValidation, problemController.getProblemById)
  .put(verifyToken, authorize('admin'), updateProblemValidation, problemController.updateProblem)
  .delete(verifyToken, authorize('admin'), problemIdValidation, problemController.deleteProblem);

module.exports = router;
