import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getSubmissionHistory,
  submitCode,
} from '../services/submissionService.js';
import useSubmissionPolling from './useSubmissionPolling.js';
import {
  getSubmissionId,
  isCompletedSubmission,
} from '../utils/submissionUtils.js';

const useSubmission = (problemId) => {
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [pollingRetryKey, setPollingRetryKey] = useState(0);

  const problemHistory = useMemo(
    () =>
      history.filter((submission) => {
        const submissionProblem = submission.problem;
        const submissionProblemId =
          submissionProblem?._id || submissionProblem?.id || submissionProblem;

        return submissionProblemId?.toString() === problemId;
      }),
    [history, problemId]
  );

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError('');

    try {
      const submissions = await getSubmissionHistory();
      setHistory(submissions);
    } catch (requestError) {
      if (!requestError.response) {
        setHistoryError('Unable to reach the backend while loading submissions.');
      } else {
        setHistoryError('Unable to load submission history.');
      }
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const {
    error: pollingError,
    isPolling,
    polledSubmission,
  } = useSubmissionPolling({
    enabled: Boolean(activeSubmission),
    onComplete: (completedSubmission) => {
      setActiveSubmission(completedSubmission);
      loadHistory();
    },
    retryKey: pollingRetryKey,
    submission: activeSubmission,
  });

  useEffect(() => {
    if (!polledSubmission) return;

    setActiveSubmission(polledSubmission);
  }, [polledSubmission]);

  const createSubmission = async ({ code, language }) => {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const submission = await submitCode({
        code,
        language,
        problemId,
      });

      setActiveSubmission(submission);
      setHistory((currentHistory) => [submission, ...currentHistory]);
      return submission;
    } catch (requestError) {
      if (!requestError.response) {
        setSubmitError('Unable to reach the backend. Please check that the server is running.');
      } else if (requestError.response.status === 401) {
        setSubmitError('Please login again before submitting.');
      } else if (requestError.response.status === 403) {
        setSubmitError('You are not allowed to submit this code.');
      } else if (requestError.response.status === 404) {
        setSubmitError('Problem not found.');
      } else if (requestError.response.status === 503) {
        setSubmitError('Submission was saved, but the judging queue is unavailable.');
      } else {
        setSubmitError('Submission failed. Please try again.');
      }

      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryPolling = () => {
    if (!activeSubmission || isCompletedSubmission(activeSubmission)) return;

    setPollingRetryKey((currentKey) => currentKey + 1);
  };

  return {
    activeSubmission,
    createSubmission,
    historyError,
    isHistoryLoading,
    isPolling,
    isSubmitting,
    pollingError,
    problemHistory,
    retryPolling,
    submitError,
  };
};

export default useSubmission;
