import { useEffect, useState } from 'react';

import { getProblems } from '../services/problemService.js';

const useProblems = () => {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProblems = async () => {
      setIsLoading(true);
      setError('');

      try {
        const problemList = await getProblems();
        if (isMounted) setProblems(problemList);
      } catch (requestError) {
        if (!isMounted) return;

        if (!requestError.response) {
          setError('Unable to reach the backend. Please check that the server is running.');
        } else if (requestError.response.status === 401) {
          setError('Please login again to view problems.');
        } else {
          setError('Unable to load problems. Please try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProblems();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    error,
    isLoading,
    problems,
  };
};

export default useProblems;
