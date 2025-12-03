import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API configuration with automatic token injection
const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:5001/api',
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    // Always set content type for JSON
    headers.set('content-type', 'application/json');
    
    return headers;
  },
});

// Base API slice with caching configuration
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Components',
    'Component',
    'BorrowingRecords',
    'BorrowingRecord',
    'Procurement',
    'ProcurementRequest',
    'Dashboard',
    'SmartLab',
    'Chat',
    'User',
  ],
  endpoints: () => ({}), // Endpoints will be injected by other API slices
});

