const express = require('express');
const { body } = require('express-validator');

const runController = require('../controllers/runController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

const runCodeValidation = [
  body('language')
    .isIn(['cpp'])
    .withMessage('Language must be cpp'),
  body('code')
    .isString()
    .withMessage('Code must be a string')
    .bail()
    .custom((code) => code.trim().length > 0)
    .withMessage('Code is required')
    .isLength({ max: 1000000 })
    .withMessage('Code cannot exceed 1000000 characters'),
  body('input')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Input must be a string')
    .isLength({ max: 100000 })
    .withMessage('Input cannot exceed 100000 characters'),
];

router.post('/', verifyToken, runCodeValidation, runController.runCode);

module.exports = router;
