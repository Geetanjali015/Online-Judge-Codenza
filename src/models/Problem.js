const mongoose = require('mongoose');

const sampleTestSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: [true, 'Sample test input is required'],
    },
    output: {
      type: String,
      required: [true, 'Sample test output is required'],
    },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    statement: {
      type: String,
      required: [true, 'Statement is required'],
      trim: true,
      maxlength: [50000, 'Statement cannot exceed 50000 characters'],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) => tags.map((tag) => tag.trim()),
      validate: [
        {
          validator: (tags) => tags.length <= 20,
          message: 'A problem cannot have more than 20 tags',
        },
        {
          validator: (tags) => tags.every((tag) => tag.length > 0 && tag.length <= 50),
          message: 'Each tag must contain between 1 and 50 characters',
        },
      ],
    },
    constraints: {
      type: String,
      trim: true,
      default: '',
      maxlength: [10000, 'Constraints cannot exceed 10000 characters'],
    },
    sampleTests: {
      type: [sampleTestSchema],
      default: [],
    },
    boilerplate: {
      type: Map,
      of: String,
      default: {},
    },
    timeLimitMs: {
      type: Number,
      required: [true, 'Time limit is required'],
      min: [1, 'Time limit must be at least 1 millisecond'],
      max: [60000, 'Time limit cannot exceed 60000 milliseconds'],
      validate: {
        validator: Number.isInteger,
        message: 'Time limit must be an integer',
      },
    },
    memoryLimitMb: {
      type: Number,
      required: [true, 'Memory limit is required'],
      min: [1, 'Memory limit must be at least 1 MB'],
      max: [4096, 'Memory limit cannot exceed 4096 MB'],
      validate: {
        validator: Number.isInteger,
        message: 'Memory limit must be an integer',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Problem creator is required'],
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;
