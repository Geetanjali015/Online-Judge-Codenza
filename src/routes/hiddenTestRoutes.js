const express = require('express');
const { body, param } = require('express-validator');

const hiddenTestController = require('../controllers/hiddenTestController');
const { authorize, verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

const hiddenTestIdValidation = [
  param('id').isMongoId().withMessage('Invalid hidden test ID'),
];

const problemIdValidation = [
  param('problemId').isMongoId().withMessage('Invalid problem ID'),
];

const createHiddenTestValidation = [
  body('problemId').isMongoId().withMessage('A valid problem ID is required'),
  body('input')
    .isString()
    .withMessage('Input must be a string')
    .bail()
    .notEmpty()
    .withMessage('Input is required')
    .isLength({ max: 1000000 })
    .withMessage('Input cannot exceed 1000000 characters'),
  body('expectedOutput')
    .isString()
    .withMessage('Expected output must be a string')
    .bail()
    .notEmpty()
    .withMessage('Expected output is required')
    .isLength({ max: 1000000 })
    .withMessage('Expected output cannot exceed 1000000 characters'),
];

const updateHiddenTestValidation = [
  ...hiddenTestIdValidation,
  body('input')
    .optional()
    .isString()
    .withMessage('Input must be a string')
    .bail()
    .notEmpty()
    .withMessage('Input cannot be empty')
    .isLength({ max: 1000000 })
    .withMessage('Input cannot exceed 1000000 characters'),
  body('expectedOutput')
    .optional()
    .isString()
    .withMessage('Expected output must be a string')
    .bail()
    .notEmpty()
    .withMessage('Expected output cannot be empty')
    .isLength({ max: 1000000 })
    .withMessage('Expected output cannot exceed 1000000 characters'),
  body().custom((value) => {
    if (!Object.hasOwn(value, 'input') && !Object.hasOwn(value, 'expectedOutput')) {
      throw new Error('Input or expected output is required');
    }

    return true;
  }),
];

// Hidden grading data is available only to authenticated administrators.
router.use(verifyToken, authorize('admin'));

router.post('/', createHiddenTestValidation, hiddenTestController.createHiddenTest);
router.get(
  '/problem/:problemId',
  problemIdValidation,
  hiddenTestController.getHiddenTestsByProblem
);
router
  .route('/:id')
  .put(updateHiddenTestValidation, hiddenTestController.updateHiddenTest)
  .delete(hiddenTestIdValidation, hiddenTestController.deleteHiddenTest);

module.exports = router;
