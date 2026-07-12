import api from './api.js';

export const getProblems = async () => {
  const response = await api.get('/problems');
  return response.data.problems || [];
};

export const getProblemById = async (problemId) => {
  const response = await api.get(`/problems/${problemId}`);
  return response.data.problem;
};
