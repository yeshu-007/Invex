import { baseApi } from './baseApi';

export const studentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all components (student view)
    getStudentComponents: builder.query({
      query: () => '/components',
      providesTags: ['Components'],
      keepUnusedDataFor: 60,
    }),

    // Borrow component
    borrowComponent: builder.mutation({
      query: (borrowData) => ({
        url: '/student/borrow',
        method: 'POST',
        body: borrowData,
      }),
      // Invalidate components to update stock, and borrowing records
      invalidatesTags: ['Components', 'BorrowingRecords'],
    }),

    // Get student's borrowing history (if endpoint exists)
    getStudentBorrowingHistory: builder.query({
      query: (userId) => `/student/borrowing-history/${userId}`,
      providesTags: ['BorrowingRecords'],
      keepUnusedDataFor: 30,
    }),

    // Identify component from image
    identifyComponentFromImage: builder.mutation({
      query: (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        return {
          url: '/student/components/identify',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetStudentComponentsQuery,
  useBorrowComponentMutation,
  useGetStudentBorrowingHistoryQuery,
  useIdentifyComponentFromImageMutation,
} = studentApi;

