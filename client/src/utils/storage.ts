/**
 * Local storage abstraction with graceful fallback
 */

const TOKEN_KEY = 'gor_access_token';
const REFRESH_TOKEN_KEY = 'gor_refresh_token';
const USER_KEY = 'gor_auth_user';

export const storage = {
  getToken: (): string | null => {
    try {
      const val = localStorage.getItem(TOKEN_KEY);
      return val && val !== 'undefined' && val !== 'null' ? val : null;
    } catch {
      return null;
    }
  },

  setToken: (token?: string | null): void => {
    try {
      if (token && token !== 'undefined' && token !== 'null') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to save access token', e);
    }
  },

  getRefreshToken: (): string | null => {
    try {
      const val = localStorage.getItem(REFRESH_TOKEN_KEY);
      return val && val !== 'undefined' && val !== 'null' ? val : null;
    } catch {
      return null;
    }
  },

  setRefreshToken: (token?: string | null): void => {
    try {
      if (token && token !== 'undefined' && token !== 'null') {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to save refresh token', e);
    }
  },

  getUser: <T>(): T | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser: (user: any): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user session', e);
    }
  },

  clearAuth: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear auth storage', e);
    }
  },
};
