const { PassThrough } = require('stream');

const Docker = require('dockerode');

const {
  createTempDirectory,
  deleteTempDirectory,
  writeInputFile,
  writeSourceCode,
} = require('../utils/judgeFileUtils');

const DOCKER_IMAGE = 'gcc:latest';
const WORKSPACE_PATH = '/workspace';
const CPP_COMMAND = [
  'sh',
  '-c',
  'g++ -std=c++17 -O2 -pipe main.cpp -o main && ./main < input.txt',
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

module.exports = {
  executeCode,
};
