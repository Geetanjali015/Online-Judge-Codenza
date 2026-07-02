const Problem = require('../models/Problem');

const EDITABLE_FIELDS = [
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

const createNotFoundError = () => {
  const error = new Error('Problem not found');
  error.statusCode = 404;
  return error;
};

const pickEditableFields = (input) =>
  EDITABLE_FIELDS.reduce((fields, field) => {
    if (Object.hasOwn(input, field)) fields[field] = input[field];
    return fields;
  }, {});

const serializeProblemSummary = (problem) => ({
  id: problem._id,
  title: problem.title,
  difficulty: problem.difficulty,
  tags: problem.tags,
});

const serializeProblemDetail = (problem) => ({
  id: problem._id,
  title: problem.title,
  statement: problem.statement,
  constraints: problem.constraints,
  sampleTests: problem.sampleTests,
  boilerplate:
    problem.boilerplate instanceof Map
      ? Object.fromEntries(problem.boilerplate)
      : problem.boilerplate,
  timeLimitMs: problem.timeLimitMs,
  memoryLimitMb: problem.memoryLimitMb,
  difficulty: problem.difficulty,
  tags: problem.tags,
});

const createProblem = async (input, createdBy) => {
  const problem = await Problem.create({
    ...pickEditableFields(input),
    createdBy,
  });

  return serializeProblemDetail(problem);
};

const getProblems = async () => {
  const problems = await Problem.find({})
    .select('title difficulty tags')
    .sort({ createdAt: -1 })
    .lean();

  return problems.map(serializeProblemSummary);
};

const getProblemById = async (problemId) => {
  const problem = await Problem.findById(problemId)
    .select(
      'title statement constraints sampleTests boilerplate timeLimitMs memoryLimitMb difficulty tags'
    )
    .lean();

  if (!problem) throw createNotFoundError();

  return serializeProblemDetail(problem);
};

const updateProblem = async (problemId, input) => {
  const problem = await Problem.findByIdAndUpdate(problemId, pickEditableFields(input), {
    new: true,
    runValidators: true,
  }).select(
    'title statement constraints sampleTests boilerplate timeLimitMs memoryLimitMb difficulty tags'
  );

  if (!problem) throw createNotFoundError();

  return serializeProblemDetail(problem);
};

const deleteProblem = async (problemId) => {
  const problem = await Problem.findByIdAndDelete(problemId).select('_id');

  if (!problem) throw createNotFoundError();
};

module.exports = {
  createProblem,
  deleteProblem,
  getProblemById,
  getProblems,
  updateProblem,
};
