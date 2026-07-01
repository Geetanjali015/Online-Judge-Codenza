const express = require('express');
const { body } = require('express-validator');

const { register } = require('../controllers/authController');

const router = express.Router();

const registrationValidation = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isString()
    .withMessage('Email must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .customSanitizer((email) => email.toLowerCase()),
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .bail()
    .custom((password) => {
      if (Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('Password cannot exceed 72 bytes');
      }

      return true;
    }),
];

router.post('/register', registrationValidation, register);

module.exports = router;

