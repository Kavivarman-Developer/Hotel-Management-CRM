import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, logout } from '../authSlice';
import { User } from '@/types';

describe('Auth Slice', () => {
  const dummyUser: User = {
    id: 'user_123',
    name: 'Front Desk Admin',
    email: 'admin@grandomrresidency.com',
    mobile: '8110018708',
    role: 'SUPER_ADMIN',
    permissions: ['dashboard.view', 'bookings.view', 'bookings.create'],
    isActive: true,
  };

  it('handles initial state cleanly', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state).toHaveProperty('isAuthenticated');
  });

  it('sets credentials and marks authenticated upon successful login', () => {
    const prevState = {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    };

    const nextState = authReducer(
      prevState,
      setCredentials({
        user: dummyUser,
        accessToken: 'access_token_xyz',
        refreshToken: 'refresh_token_xyz',
      })
    );

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user?.name).toBe('Front Desk Admin');
    expect(nextState.token).toBe('access_token_xyz');
    expect(nextState.refreshToken).toBe('refresh_token_xyz');
  });

  it('clears credentials upon logout', () => {
    const loggedInState = {
      user: dummyUser,
      token: 'access_token_xyz',
      refreshToken: 'refresh_token_xyz',
      isAuthenticated: true,
    };

    const nextState = authReducer(loggedInState, logout());
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
  });
});
