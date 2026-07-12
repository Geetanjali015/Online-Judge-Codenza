import { useCallback, useState } from 'react';

import { runCode } from '../services/runService.js';

const useRunCode = () => {
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  const execute = useCallback(async ({ code, input, language }) => {
    setError('');
    setIsRunning(true);

    try {
      const runResult = await runCode({
        code,
        input,
        language,
      });

      setResult(runResult);
      return runResult;
    } catch (requestError) {
      if (!requestError.response) {
        setError('Unable to reach the backend. Please check that the server is running.');
      } else if (requestError.response.status === 401) {
        setError('Please login again before running code.');
      } else if (requestError.response.status === 400) {
        const firstValidationError = requestError.response.data?.errors?.[0]?.msg;
        setError(firstValidationError || requestError.response.data?.message || 'Invalid run request.');
      } else {
        setError('Run Code failed. Please try again.');
      }

      return null;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setError('');
    setResult(null);
  }, []);

  return {
    clearResult,
    error,
    execute,
    isRunning,
    result,
  };
};

export default useRunCode;
