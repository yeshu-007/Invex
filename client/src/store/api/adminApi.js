import { baseApi } from './baseApi';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Components API
    getComponents: builder.query({
      query: () => '/admin/components',
      providesTags: ['Components'],
      // Cache for 60 seconds, refetch on mount or window focus
      keepUnusedDataFor: 60,
    }),

    getComponentById: builder.query({
      query: (componentId) => `/admin/components/${componentId}`,
      providesTags: (result, error, componentId) => [
        { type: 'Component', id: componentId },
        'Components',
      ],
      keepUnusedDataFor: 60,
    }),

    createComponent: builder.mutation({
      query: (newComponent) => ({
        url: '/admin/components',
        method: 'POST',
        body: newComponent,
      }),
      // Invalidate components list to refetch after creation
      invalidatesTags: ['Components'],
    }),

    updateComponent: builder.mutation({
      query: ({ componentId, ...componentData }) => ({
        url: `/admin/components/${componentId}`,
        method: 'PUT',
        body: componentData,
      }),
      // Invalidate both the specific component and the list
      invalidatesTags: (result, error, { componentId }) => [
        { type: 'Component', id: componentId },
        'Components',
      ],
    }),

    deleteComponent: builder.mutation({
      query: (componentId) => ({
        url: `/admin/components/${componentId}`,
        method: 'DELETE',
      }),
      // Invalidate components list after deletion
      invalidatesTags: ['Components'],
    }),

    // Borrowing Records API
    getBorrowingRecords: builder.query({
      query: () => '/admin/borrowing-records',
      providesTags: ['BorrowingRecords'],
      keepUnusedDataFor: 30, // Shorter cache for frequently changing data
    }),

    // Dashboard API - combines multiple queries
    getDashboardData: builder.query({
      query: () => ({
        url: '/admin/dashboard',
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
      keepUnusedDataFor: 30,
    }),

    // Procurement API
    getProcurementRequests: builder.query({
      query: () => '/admin/procurement',
      providesTags: ['Procurement'],
      keepUnusedDataFor: 60,
    }),

    getProcurementRequestById: builder.query({
      query: (requestId) => `/admin/procurement/${requestId}`,
      providesTags: (result, error, requestId) => [
        { type: 'ProcurementRequest', id: requestId },
        'Procurement',
      ],
      keepUnusedDataFor: 60,
    }),

    createProcurementRequest: builder.mutation({
      query: (newRequest) => ({
        url: '/admin/procurement',
        method: 'POST',
        body: newRequest,
      }),
      invalidatesTags: ['Procurement'],
    }),

    updateProcurementRequest: builder.mutation({
      query: ({ requestId, ...requestData }) => ({
        url: `/admin/procurement/${requestId}`,
        method: 'PUT',
        body: requestData,
      }),
      invalidatesTags: (result, error, { requestId }) => [
        { type: 'ProcurementRequest', id: requestId },
        'Procurement',
      ],
    }),

    // Smart Lab API
    getSmartLabData: builder.query({
      query: () => '/admin/smart-lab',
      providesTags: ['SmartLab'],
      keepUnusedDataFor: 60,
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetComponentsQuery,
  useGetComponentByIdQuery,
  useCreateComponentMutation,
  useUpdateComponentMutation,
  useDeleteComponentMutation,
  useGetBorrowingRecordsQuery,
  useGetDashboardDataQuery,
  useGetProcurementRequestsQuery,
  useGetProcurementRequestByIdQuery,
  useCreateProcurementRequestMutation,
  useUpdateProcurementRequestMutation,
  useGetSmartLabDataQuery,
} = adminApi;

