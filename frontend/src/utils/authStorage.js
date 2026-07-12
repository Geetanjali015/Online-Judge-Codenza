const TOKEN_STORAGE_KEY = 'codenza_token';
const USER_STORAGE_KEY = 'codenza_user';

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const storeAuthSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};
