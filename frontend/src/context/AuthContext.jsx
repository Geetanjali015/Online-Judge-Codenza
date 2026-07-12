import { createContext, useEffect, useMemo, useState } from 'react';

import api from '../services/api.js';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  storeAuthSession,
} from '../utils/authStorage.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    const hydrateUserFromToken = async () => {
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const authenticatedUser = response.data.user;

        setUser(authenticatedUser);
        storeAuthSession({ token, user: authenticatedUser });
      } catch {
        clearAuthSession();
        setToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    hydrateUserFromToken();
  }, [token]);

  const login = async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password });
    const authToken = response.data.token;
    const authenticatedUser = response.data.user;

    storeAuthSession({ token: authToken, user: authenticatedUser });
    setToken(authToken);
    setUser(authenticatedUser);

    return authenticatedUser;
  };

  const register = async ({ name, email, password }) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
    });

    return response.data;
  };

  const logout = () => {
    clearAuthSession();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      isBootstrapping,
      login,
      logout,
      register,
      token,
      user,
    }),
    [isBootstrapping, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
