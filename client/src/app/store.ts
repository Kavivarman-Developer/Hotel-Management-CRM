import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/services/api/baseApi';
import authReducer from '@/features/auth/authSlice';
import bookingSearchReducer from '@/features/availability/bookingSearchSlice';
import checkoutReducer from '@/features/bookings/checkoutSlice';
import uiReducer from '@/app/uiSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    bookingSearch: bookingSearchReducer,
    checkout: checkoutReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific actions or paths if needed
        ignoredActions: [],
      },
    }).concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
