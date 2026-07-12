import api from './api.js';

export const runCode = async ({ code, input, language }) => {
  const response = await api.post('/run', {
    language,
    code,
    input,
  });

  return response.data;
};
