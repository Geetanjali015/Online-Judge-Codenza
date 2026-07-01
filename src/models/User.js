const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either user or admin',
      },
      default: 'user',
    },
    avatar: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => {
          if (value === null || value === '') return true;

          try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        message: 'Avatar must be a valid HTTP or HTTPS URL',
      },
    },
    solvedProblems: {
      type: Number,
      default: 0,
      min: [0, 'Solved problems cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Solved problems must be an integer',
      },
    },
    totalSubmissions: {
      type: Number,
      default: 0,
      min: [0, 'Total submissions cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Total submissions must be an integer',
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
