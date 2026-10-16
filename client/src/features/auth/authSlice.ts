import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import { storage } from '@/utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialToken = storage.getToken();
const initialRefreshToken = storage.getRefreshToken();
const initialUser = storage.getUser<User>();

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: Boolean(initialToken && initialUser),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.token = accessToken;
      if (refreshToken) {
        state.refreshToken = refreshToken;
        storage.setRefreshToken(refreshToken);
      }
      state.isAuthenticated = true;

      storage.setToken(accessToken);
      storage.setUser(user);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      storage.setUser(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      storage.clearAuth();
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
