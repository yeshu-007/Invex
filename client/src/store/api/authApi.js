import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login mutation
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // Auth doesn't need caching, but we can invalidate user data
      invalidatesTags: ['User'],
    }),

    // Get current user info (if endpoint exists)
    getCurrentUser: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
      keepUnusedDataFor: 300, // Cache user data for 5 minutes
    }),

    // Logout (if endpoint exists)
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
} = authApi;

