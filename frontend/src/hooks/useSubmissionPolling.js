import { useEffect, useRef, useState } from 'react';

import { getSubmission } from '../services/submissionService.js';
import {
  getSubmissionId,
  isCompletedSubmission,
} from '../utils/submissionUtils.js';

const POLLING_INTERVAL_MS = 2000;
const POLLING_TIMEOUT_MS = 120000;

const useSubmissionPolling = ({ enabled, onComplete, retryKey = 0, submission }) => {
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [polledSubmission, setPolledSubmission] = useState(submission);
  const onCompleteRef = useRef(onComplete);
  const submissionId = getSubmissionId(submission);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!enabled || !submissionId || isCompletedSubmission(submission)) {
      setIsPolling(false);
      setPolledSubmission(submission || null);
      return undefined;
    }

    let isMounted = true;
    let timeoutId;
    let intervalId;

    const pollSubmission = async () => {
      try {
        const latestSubmission = await getSubmission(submissionId);

        if (!isMounted) return;

        setPolledSubmission(latestSubmission);

        if (isCompletedSubmission(latestSubmission)) {
          setIsPolling(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          onCompleteRef.current?.(latestSubmission);
        }
      } catch (requestError) {
        if (!isMounted) return;

        if (!requestError.response) {
          setError('Network error while polling submission status.');
        } else if (requestError.response.status === 401) {
          setError('Please login again to continue polling this submission.');
        } else if (requestError.response.status === 403) {
          setError('You are not allowed to view this submission.');
        } else if (requestError.response.status === 404) {
          setError('Submission not found.');
        } else {
          setError('Unable to refresh submission status.');
        }

        setIsPolling(false);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      }
    };

    setError('');
    setIsPolling(true);
    setPolledSubmission(submission);

    pollSubmission();
    intervalId = setInterval(pollSubmission, POLLING_INTERVAL_MS);
    timeoutId = setTimeout(() => {
      if (!isMounted) return;

      setError('Polling timed out. You can retry status refresh.');
      setIsPolling(false);
      clearInterval(intervalId);
    }, POLLING_TIMEOUT_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [enabled, retryKey, submissionId]);

  return {
    error,
    isPolling,
    polledSubmission,
  };
};

export default useSubmissionPolling;
