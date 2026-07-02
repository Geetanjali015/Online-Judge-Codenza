const mongoose = require('mongoose');

const hiddenTestSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem is required'],
      index: true,
      immutable: true,
    },
    input: {
      type: String,
      required: [true, 'Input is required'],
      maxlength: [1000000, 'Input cannot exceed 1000000 characters'],
    },
    expectedOutput: {
      type: String,
      required: [true, 'Expected output is required'],
      maxlength: [1000000, 'Expected output cannot exceed 1000000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const HiddenTest = mongoose.model('HiddenTest', hiddenTestSchema);

module.exports = HiddenTest;
