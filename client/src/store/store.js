import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
// Import all API slices to ensure they're injected
import './api/adminApi';
import './api/studentApi';
import './api/authApi';
import './api/chatbotApi';

export const store = configureStore({
  reducer: {
    // Add the API reducer
    [baseApi.reducerPath]: baseApi.reducer,
    // Add other reducers here if needed in the future
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(baseApi.middleware),
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

