const { PassThrough } = require('stream');
const { performance } = require('perf_hooks');

const Docker = require('dockerode');

const HiddenTest = require('../models/HiddenTest');
const Submission = require('../models/Submission');
const User = require('../models/User');

const {
  createTempDirectory,
  deleteTempDirectory,
  writeInputFile,
  writeSourceCode,
} = require('../utils/judgeFileUtils');

const DOCKER_IMAGE = 'gcc:latest';
const WORKSPACE_PATH = '/workspace';
const COMPILE_ERROR_EXIT_CODE = 125;
const CPP_COMMAND = [
  'sh',
  '-c',
  'g++ -std=c++17 -O2 -pipe main.cpp -o main 2> compile-error.txt; ' +
    'compile_status=$?; ' +
    'if [ "$compile_status" -ne 0 ]; then cat compile-error.txt >&2; exit 125; fi; ' +
    './main < input.txt; runtime_status=$?; ' +
    'if [ "$runtime_status" -eq 125 ]; then exit 124; fi; exit "$runtime_status"',
];

const docker = new Docker();
let imageReadyPromise;

const pullImage = () =>
  new Promise((resolve, reject) => {
    docker.pull(DOCKER_IMAGE, (pullError, stream) => {
      if (pullError) {
        reject(pullError);
        return;
      }

      docker.modem.followProgress(stream, (progressError) => {
        if (progressError) reject(progressError);
        else resolve();
      });
    });
  });

/**
 * Reuses a local gcc image when available and pulls it once when absent.
 */
const ensureDockerImage = async () => {
  if (!imageReadyPromise) {
    imageReadyPromise = (async () => {
      try {
        await docker.getImage(DOCKER_IMAGE).inspect();
      } catch (error) {
        if (error.statusCode !== 404) throw error;
        await pullImage();
      }
    })().catch((error) => {
      imageReadyPromise = undefined;
      throw error;
    });
  }

  return imageReadyPromise;
};

const getContainerUser = () => {
  if (typeof process.getuid !== 'function' || typeof process.getgid !== 'function') {
    return undefined;
  }

  // Matching the host owner allows a non-root container process to use the bind mount.
  return `${process.getuid()}:${process.getgid()}`;
};

const createCppContainer = async (tempDirectory) => {
  const containerUser = getContainerUser();

  return docker.createContainer({
    Image: DOCKER_IMAGE,
    Cmd: CPP_COMMAND,
    WorkingDir: WORKSPACE_PATH,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    ...(containerUser ? { User: containerUser } : {}),
    HostConfig: {
      Binds: [`${tempDirectory}:${WORKSPACE_PATH}:rw`],
      NetworkMode: 'none',
      ReadonlyRootfs: true,
      CapDrop: ['ALL'],
      PidsLimit: 64,
      SecurityOpt: ['no-new-privileges'],
      Tmpfs: {
        '/tmp': 'rw,noexec,nosuid,size=67108864',
      },
    },
  });
};

/**
 * Compiles and executes one C++ source file synchronously inside Docker.
 * This method returns raw process output only; it does not assign a verdict.
 */
const executeCode = async ({ language, code, input = '' }) => {
  if (language !== 'cpp') {
    throw new Error('Judge execution currently supports only cpp');
  }

  let tempDirectory;
  let container;

  try {
    tempDirectory = await createTempDirectory();
    await Promise.all([
      writeSourceCode(tempDirectory, code),
      writeInputFile(tempDirectory, input),
    ]);

    await ensureDockerImage();
    container = await createCppContainer(tempDirectory);

    const outputStream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
    });
    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();
    const stdoutChunks = [];
    const stderrChunks = [];

    stdoutStream.on('data', (chunk) => stdoutChunks.push(chunk));
    stderrStream.on('data', (chunk) => stderrChunks.push(chunk));
    docker.modem.demuxStream(outputStream, stdoutStream, stderrStream);

    // Attach before starting so even immediate compiler failures are captured.
    const outputComplete = new Promise((resolve, reject) => {
      outputStream.once('end', resolve);
      outputStream.once('error', reject);
    });

    await container.start();
    const executionResult = await container.wait();
    await outputComplete;

    return {
      stdout: Buffer.concat(stdoutChunks).toString('utf8'),
      stderr: Buffer.concat(stderrChunks).toString('utf8'),
      exitCode: executionResult.StatusCode,
    };
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (error) {
        // A missing container is already clean; surface every other cleanup failure.
        if (error.statusCode !== 404) {
          console.error('Failed to remove judge container:', error);
        }
      }
    }

    if (tempDirectory) {
      try {
        await deleteTempDirectory(tempDirectory);
      } catch (error) {
        console.error('Failed to remove judge temporary directory:', error);
      }
    }
  }
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Runs all hidden tests sequentially and persists the submission's final result.
 * No output is converted into time-limit or memory-limit verdicts in this phase.
 */
const judgeSubmission = async (submissionId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw createHttpError(404, 'Submission not found');

  if (submission.language !== 'cpp') {
    throw createHttpError(400, 'Judge currently supports only cpp submissions');
  }

  const hiddenTests = await HiddenTest.find({ problem: submission.problem })
    .select('input expectedOutput')
    .sort({ createdAt: 1 })
    .lean();

  if (hiddenTests.length === 0) {
    throw createHttpError(404, 'Hidden tests not found');
  }

  const wasAlreadyAccepted = submission.verdict === 'Accepted';

  submission.status = 'Running';
  submission.verdict = null;
  submission.passedTestCases = 0;
  submission.totalTestCases = hiddenTests.length;
  submission.runtimeMs = null;
  submission.memoryKb = null;
  await submission.save();

  let verdict = 'Accepted';
  let passedTestCases = 0;
  let runtimeMs = 0;

  // Tests intentionally run one at a time; no queue or parallel worker is involved.
  for (const hiddenTest of hiddenTests) {
    const startedAt = performance.now();
    const result = await executeCode({
      language: submission.language,
      code: submission.code,
      input: hiddenTest.input,
    });
    runtimeMs += performance.now() - startedAt;

    if (result.exitCode === COMPILE_ERROR_EXIT_CODE) {
      verdict = 'Compilation Error';
      break;
    }

    if (result.exitCode !== 0 || result.stderr.trim().length > 0) {
      verdict = 'Runtime Error';
      break;
    }

    if (result.stdout.trim() !== hiddenTest.expectedOutput.trim()) {
      verdict = 'Wrong Answer';
      break;
    }

    passedTestCases += 1;
  }

  submission.status = verdict;
  submission.verdict = verdict;
  submission.passedTestCases = passedTestCases;
  submission.totalTestCases = hiddenTests.length;
  submission.runtimeMs = Math.round(runtimeMs);
  // Memory measurement and memory-limit verdicts are outside Judge Part 2.
  submission.memoryKb = null;
  await submission.save();

  if (verdict === 'Accepted' && !wasAlreadyAccepted) {
    const previousAcceptedSubmission = await Submission.exists({
      _id: { $ne: submission._id },
      user: submission.user,
      problem: submission.problem,
      verdict: 'Accepted',
    });

    if (!previousAcceptedSubmission) {
      await User.findByIdAndUpdate(submission.user, {
        $inc: { solvedProblems: 1 },
      });
    }
  }

  return {
    verdict,
    passedTestCases,
    totalTestCases: hiddenTests.length,
    runtimeMs: submission.runtimeMs,
    memoryKb: submission.memoryKb,
  };
};

module.exports = {
  executeCode,
  judgeSubmission,
};
