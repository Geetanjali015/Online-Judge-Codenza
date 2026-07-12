const { executeCode } = require('./judgeService');

const DEFAULT_RUN_TIME_LIMIT_MS = 5000;
const DEFAULT_RUN_MEMORY_LIMIT_MB = 256;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Executes user code against custom input only.
 *
 * This intentionally does not create a Submission, enqueue BullMQ jobs, load
 * hidden tests, compare output, assign verdicts, or update user statistics.
 */
const runCode = async ({ code, input = '', language }) => {
  if (language !== 'cpp') {
    throw createHttpError(400, 'Run Code currently supports only cpp');
  }

  const result = await executeCode({
    language,
    code,
    input,
    timeLimitMs: DEFAULT_RUN_TIME_LIMIT_MS,
    memoryLimitMb: DEFAULT_RUN_MEMORY_LIMIT_MB,
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    runtimeMs: result.runtimeMs,
    memoryKb: result.memoryKb,
    exitCode: result.exitCode,
  };
};

module.exports = {
  runCode,
};
