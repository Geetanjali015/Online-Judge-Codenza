import api from './api.js';

export const submitCode = async ({ code, language, problemId }) => {
  const response = await api.post('/submissions', {
    problemId,
    language,
    code,
  });

  return response.data.submission;
};

export const getSubmission = async (submissionId) => {
  const response = await api.get(`/submissions/${submissionId}`);
  return response.data.submission;
};

export const getSubmissionHistory = async () => {
  const response = await api.get('/submissions/me');
  return response.data.submissions || [];
};
