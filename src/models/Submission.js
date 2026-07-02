const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
      immutable: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem is required'],
      index: true,
      immutable: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: {
        values: ['cpp', 'c', 'java', 'python', 'javascript'],
        message: 'Language must be cpp, c, java, python, or javascript',
      },
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
      maxlength: [1000000, 'Code cannot exceed 1000000 characters'],
    },
    status: {
      type: String,
      enum: [
        'Queued',
        'Running',
        'Accepted',
        'Wrong Answer',
        'Runtime Error',
        'Compilation Error',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
      ],
      default: 'Queued',
    },
    verdict: {
      type: String,
      default: null,
    },
    runtimeMs: {
      type: Number,
      default: null,
      min: [0, 'Runtime cannot be negative'],
    },
    memoryKb: {
      type: Number,
      default: null,
      min: [0, 'Memory usage cannot be negative'],
    },
    passedTestCases: {
      type: Number,
      default: 0,
      min: [0, 'Passed test cases cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Passed test cases must be an integer',
      },
    },
    totalTestCases: {
      type: Number,
      default: 0,
      min: [0, 'Total test cases cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Total test cases must be an integer',
      },
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ user: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
