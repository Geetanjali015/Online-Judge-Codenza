const HiddenTest = require('../models/HiddenTest');
const Problem = require('../models/Problem');

const createNotFoundError = (resource) => {
  const error = new Error(`${resource} not found`);
  error.statusCode = 404;
  throw error;
};

const serializeHiddenTest = (hiddenTest) => ({
  id: hiddenTest._id,
  problem: hiddenTest.problem,
  input: hiddenTest.input,
  expectedOutput: hiddenTest.expectedOutput,
  createdAt: hiddenTest.createdAt,
  updatedAt: hiddenTest.updatedAt,
});

const ensureProblemExists = async (problemId) => {
  const problemExists = await Problem.exists({ _id: problemId });
  if (!problemExists) createNotFoundError('Problem');
};

const createHiddenTest = async (problemId, input, expectedOutput) => {
  await ensureProblemExists(problemId);

  const hiddenTest = await HiddenTest.create({
    problem: problemId,
    input,
    expectedOutput,
  });

  return serializeHiddenTest(hiddenTest);
};

const getHiddenTestsByProblem = async (problemId) => {
  await ensureProblemExists(problemId);

  const hiddenTests = await HiddenTest.find({ problem: problemId })
    .select('problem input expectedOutput createdAt updatedAt')
    .sort({ createdAt: 1 })
    .lean();

  return hiddenTests.map(serializeHiddenTest);
};

const updateHiddenTest = async (id, data) => {
  const updates = {};
  if (Object.hasOwn(data, 'input')) updates.input = data.input;
  if (Object.hasOwn(data, 'expectedOutput')) updates.expectedOutput = data.expectedOutput;

  const hiddenTest = await HiddenTest.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select('problem input expectedOutput createdAt updatedAt');

  if (!hiddenTest) createNotFoundError('Hidden test');

  return serializeHiddenTest(hiddenTest);
};

const deleteHiddenTest = async (id) => {
  const hiddenTest = await HiddenTest.findByIdAndDelete(id).select('_id');
  if (!hiddenTest) createNotFoundError('Hidden test');
};

module.exports = {
  createHiddenTest,
  deleteHiddenTest,
  getHiddenTestsByProblem,
  updateHiddenTest,
};
