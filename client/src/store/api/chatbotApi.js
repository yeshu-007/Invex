import { baseApi } from './baseApi';

export const chatbotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Chat with chatbot
    chat: builder.mutation({
      query: (message) => ({
        url: '/chatbot/chat',
        method: 'POST',
        body: { message },
      }),
      // Chat messages don't need to be cached typically
      // But we can cache them if needed for conversation history
      invalidatesTags: [],
    }),

    // Get chat history (if endpoint exists)
    getChatHistory: builder.query({
      query: (sessionId) => `/chatbot/history/${sessionId}`,
      providesTags: ['Chat'],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useChatMutation,
  useGetChatHistoryQuery,
} = chatbotApi;

