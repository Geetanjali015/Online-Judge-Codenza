const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const populateSubmission = (submission) =>
  submission.populate([
    { path: 'user', select: 'name email' },
    { path: 'problem', select: 'title' },
  ]);

const createSubmission = async (userId, problemId, language, code) => {
  const problemExists = await Problem.exists({ _id: problemId });
  if (!problemExists) throw createHttpError(404, 'Problem not found');

  const user = await User.findById(userId);
  if (!user) throw createHttpError(404, 'User not found');

  const submission = await Submission.create({
    user: userId,
    problem: problemId,
    language,
    code,
    status: 'Queued',
    verdict: null,
    runtimeMs: null,
    memoryKb: null,
  });

  user.totalSubmissions += 1;

  try {
    await user.save();
  } catch (error) {
    // Keep the aggregate counter and submission collection consistent if saving fails.
    await Submission.findByIdAndDelete(submission._id).catch((cleanupError) => {
      console.error('Failed to roll back submission after user update failure:', cleanupError);
    });
    throw error;
  }

  return populateSubmission(submission);
};

const getSubmissionById = async (submissionId, authenticatedUser) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw createHttpError(404, 'Submission not found');

  const ownerId = submission.user._id
    ? submission.user._id.toString()
    : submission.user.toString();

  if (authenticatedUser.role !== 'admin' && ownerId !== authenticatedUser.userId) {
    throw createHttpError(403, 'Forbidden');
  }

  return populateSubmission(submission);
};

const getMySubmissions = async (userId) =>
  Submission.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate([
      { path: 'user', select: 'name email' },
      { path: 'problem', select: 'title' },
    ]);

module.exports = {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
};
