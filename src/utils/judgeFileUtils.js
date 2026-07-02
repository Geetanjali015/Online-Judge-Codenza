const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const TEMP_DIRECTORY_PREFIX = 'codenza-judge-';

/**
 * Creates an isolated host directory that is mounted into one judge container.
 */
const createTempDirectory = async () =>
  fs.mkdtemp(path.join(os.tmpdir(), TEMP_DIRECTORY_PREFIX));

/**
 * Writes the submitted C++ source without interpreting any part of its content.
 */
const writeSourceCode = async (directory, sourceCode) => {
  if (typeof sourceCode !== 'string' || sourceCode.length === 0) {
    throw new TypeError('Source code must be a non-empty string');
  }

  const sourcePath = path.join(directory, 'main.cpp');
  await fs.writeFile(sourcePath, sourceCode, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });

  return sourcePath;
};

/**
 * Stores standard input as data, avoiding interpolation into a shell command.
 */
const writeInputFile = async (directory, input = '') => {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  const inputPath = path.join(directory, 'input.txt');
  await fs.writeFile(inputPath, input, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });

  return inputPath;
};

/**
 * Recursively removes all files created for one execution attempt.
 */
const deleteTempDirectory = async (directory) => {
  if (!directory) return;
  await fs.rm(directory, { recursive: true, force: true });
};

module.exports = {
  createTempDirectory,
  deleteTempDirectory,
  writeInputFile,
  writeSourceCode,
};
