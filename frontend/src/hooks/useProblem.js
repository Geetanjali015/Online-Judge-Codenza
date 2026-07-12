import { useEffect, useState } from 'react';

import { getProblemById } from '../services/problemService.js';

const useProblem = (problemId) => {
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProblem = async () => {
      setIsLoading(true);
      setError('');

      try {
        const problemDetails = await getProblemById(problemId);
        if (isMounted) setProblem(problemDetails);
      } catch (requestError) {
        if (!isMounted) return;

        if (!requestError.response) {
          setError('Unable to reach the backend. Please check that the server is running.');
        } else if (requestError.response.status === 404) {
          setError('Problem not found.');
        } else if (requestError.response.status === 401) {
          setError('Please login again to view this problem.');
        } else {
          setError('Unable to load problem details. Please try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (problemId) {
      loadProblem();
    }

    return () => {
      isMounted = false;
    };
  }, [problemId]);

  return {
    error,
    isLoading,
    problem,
  };
};

export default useProblem;
