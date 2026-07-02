const { PassThrough } = require('stream');
const { performance } = require('perf_hooks');

const Docker = require('dockerode');

const HiddenTest = require('../models/HiddenTest');
const Problem = require('../models/Problem');
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
const BYTES_PER_MB = 1024 * 1024;
const NANO_CPUS_PER_CPU = 1_000_000_000;
const COMPILE_MEMORY_BYTES = 512 * BYTES_PER_MB;
const CPP_COMPILE_COMMAND = ['g++', '-std=c++17', '-O2', '-pipe', 'main.cpp', '-o', 'main'];
const CPP_EXECUTE_COMMAND = ['sh', '-c', './main < input.txt'];

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

const createCppContainer = async ({
  tempDirectory,
  command,
  memoryBytes,
  readOnlyWorkspace,
}) => {
  const containerUser = getContainerUser();

  return docker.createContainer({
    Image: DOCKER_IMAGE,
    Cmd: command,
    WorkingDir: WORKSPACE_PATH,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    ...(containerUser ? { User: containerUser } : {}),
    HostConfig: {
      AutoRemove: true,
      Binds: [
        `${tempDirectory}:${WORKSPACE_PATH}:${readOnlyWorkspace ? 'ro' : 'rw'}`,
      ],
      Memory: memoryBytes,
      MemorySwap: memoryBytes,
      NanoCpus: NANO_CPUS_PER_CPU,
      NetworkMode: 'none',
      Privileged: false,
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

const createOutputCapture = (outputStream) => {
  const stdoutStream = new PassThrough();
  const stderrStream = new PassThrough();
  const stdoutChunks = [];
  const stderrChunks = [];

  stdoutStream.on('data', (chunk) => stdoutChunks.push(chunk));
  stderrStream.on('data', (chunk) => stderrChunks.push(chunk));
  docker.modem.demuxStream(outputStream, stdoutStream, stderrStream);

  const complete = new Promise((resolve, reject) => {
    outputStream.once('end', resolve);
    outputStream.once('error', reject);
  });

  return {
    complete,
    getStderr: () => Buffer.concat(stderrChunks).toString('utf8'),
    getStdout: () => Buffer.concat(stdoutChunks).toString('utf8'),
  };
};

const createMemoryMonitor = async (container) => {
  try {
    const stream = await container.stats({ stream: true });
    let bufferedJson = '';
    let peakMemoryBytes = 0;

    const processStatsLine = (line) => {
      if (!line.trim()) return;

      try {
        const stats = JSON.parse(line);
        const usage = stats.memory_stats?.usage;
        if (Number.isFinite(usage)) peakMemoryBytes = Math.max(peakMemoryBytes, usage);
      } catch {
        // A partial JSON object remains buffered until the next stream chunk.
      }
    };

    stream.on('data', (chunk) => {
      bufferedJson += chunk.toString('utf8');
      const lines = bufferedJson.split(/\r?\n/);
      bufferedJson = lines.pop() || '';
      lines.forEach(processStatsLine);
    });

    return {
      stop: () => {
        processStatsLine(bufferedJson);
        stream.destroy();
        // Docker may emit no sample when a process exits between stats intervals.
        return peakMemoryBytes > 0 ? Math.ceil(peakMemoryBytes / 1024) : null;
      },
    };
  } catch {
    // Very short-lived containers can disappear before Docker opens the stats stream.
    return { stop: () => null };
  }
};

const runContainer = async ({
  tempDirectory,
  command,
  memoryBytes,
  readOnlyWorkspace,
  timeLimitMs,
  measureMemory,
}) => {
  let container;
  let timeoutHandle;
  let memoryMonitor = { stop: () => null };

  try {
    container = await createCppContainer({
      tempDirectory,
      command,
      memoryBytes,
      readOnlyWorkspace,
    });

    const outputStream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
    });
    const output = createOutputCapture(outputStream);

    await container.start();
    const startedAt = performance.now();
    const waitPromise = container.wait();
    const memoryMonitorPromise = measureMemory
      ? createMemoryMonitor(container)
      : Promise.resolve(memoryMonitor);

    let timedOut = false;
    let executionResult;

    if (timeLimitMs) {
      const timeoutPromise = new Promise((resolve) => {
        timeoutHandle = setTimeout(() => resolve({ timedOut: true }), timeLimitMs);
      });
      const completed = await Promise.race([
        waitPromise.then((result) => ({ result })),
        timeoutPromise,
      ]);

      if (completed.timedOut) {
        timedOut = true;
        try {
          await container.kill({ signal: 'SIGKILL' });
        } catch (error) {
          if (error.statusCode !== 404 && error.statusCode !== 409) throw error;
        }
        executionResult = await waitPromise;
      } else {
        executionResult = completed.result;
      }
    } else {
      executionResult = await waitPromise;
    }

    clearTimeout(timeoutHandle);
    await output.complete;
    memoryMonitor = await memoryMonitorPromise;
    const memoryKb = memoryMonitor.stop();
    const runtimeMs = Math.max(0, Math.round(performance.now() - startedAt));
    const exitCode = executionResult.StatusCode;

    return {
      stdout: output.getStdout(),
      stderr: output.getStderr(),
      exitCode,
      timedOut,
      memoryExceeded: !timedOut && exitCode === 137,
      runtimeMs,
      memoryKb,
    };
  } finally {
    clearTimeout(timeoutHandle);
    memoryMonitor.stop();

    if (container) {
      try {
        // AutoRemove normally wins this race; force removal covers setup failures.
        await container.remove({ force: true });
      } catch (error) {
        if (![404, 409].includes(error.statusCode)) {
          console.error('Failed to remove judge container:', error);
        }
      }
    }
  }
};

/**
 * Compiles and executes one C++ source file synchronously inside Docker.
 * It returns raw output plus resource signals; verdict assignment stays in the judge pipeline.
 */
const executeCode = async ({
  language,
  code,
  input = '',
  timeLimitMs = 5000,
  memoryLimitMb = 256,
}) => {
  if (language !== 'cpp') {
    throw new Error('Judge execution currently supports only cpp');
  }

  if (!Number.isInteger(timeLimitMs) || timeLimitMs <= 0) {
    throw new TypeError('Time limit must be a positive integer');
  }

  if (!Number.isInteger(memoryLimitMb) || memoryLimitMb <= 0) {
    throw new TypeError('Memory limit must be a positive integer');
  }

  let tempDirectory;

  try {
    tempDirectory = await createTempDirectory();
    await Promise.all([
      writeSourceCode(tempDirectory, code),
      writeInputFile(tempDirectory, input),
    ]);

    await ensureDockerImage();
    const compilation = await runContainer({
      tempDirectory,
      command: CPP_COMPILE_COMMAND,
      memoryBytes: COMPILE_MEMORY_BYTES,
      readOnlyWorkspace: false,
      measureMemory: false,
    });

    if (compilation.exitCode !== 0) {
      return {
        stdout: compilation.stdout,
        stderr: compilation.stderr,
        exitCode: compilation.exitCode,
        compilationFailed: true,
        timedOut: false,
        memoryExceeded: false,
        runtimeMs: 0,
        memoryKb: null,
      };
    }

    // Await here so the surrounding finally cannot delete files mid-execution.
    return await runContainer({
      tempDirectory,
      command: CPP_EXECUTE_COMMAND,
      memoryBytes: memoryLimitMb * BYTES_PER_MB,
      readOnlyWorkspace: true,
      timeLimitMs,
      measureMemory: true,
    });
  } finally {
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
 * Runs all hidden tests sequentially with the Problem's resource limits and
 * persists the submission's final result.
 */
const judgeSubmission = async (submissionId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw createHttpError(404, 'Submission not found');

  if (submission.language !== 'cpp') {
    throw createHttpError(400, 'Judge currently supports only cpp submissions');
  }

  const problem = await Problem.findById(submission.problem)
    .select('timeLimitMs memoryLimitMb')
    .lean();
  if (!problem) throw createHttpError(404, 'Problem not found');

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
  let memoryKb = null;

  // Tests intentionally run one at a time; no queue or parallel worker is involved.
  for (const hiddenTest of hiddenTests) {
    const result = await executeCode({
      language: submission.language,
      code: submission.code,
      input: hiddenTest.input,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
    });
    runtimeMs += result.runtimeMs;
    if (result.memoryKb !== null) {
      memoryKb = Math.max(memoryKb || 0, result.memoryKb);
    }

    if (result.compilationFailed) {
      verdict = 'Compilation Error';
      break;
    }

    if (result.timedOut) {
      verdict = 'Time Limit Exceeded';
      break;
    }

    if (result.memoryExceeded) {
      verdict = 'Memory Limit Exceeded';
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
  submission.runtimeMs = runtimeMs;
  submission.memoryKb = memoryKb;
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
