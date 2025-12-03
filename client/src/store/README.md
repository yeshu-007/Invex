# Redux Store with RTK Query

This directory contains the Redux store configuration using Redux Toolkit Query (RTK Query) for API caching.

## Quick Start

Redux is now set up and ready to use! The store is automatically configured in `index.js`.

### Example: Using in a Component

```javascript
import { useGetComponentsQuery } from '../store/api/adminApi';

function MyComponent() {
  // Automatically cached, loading states managed, errors handled
  const { data, isLoading, error } = useGetComponentsQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* Use data here */}</div>;
}
```

## What's Cached?

All API calls are automatically cached with the following durations:
- Components: 60 seconds
- Individual Component: 60 seconds  
- Borrowing Records: 30 seconds
- Dashboard Data: 30 seconds
- Procurement Requests: 60 seconds

After cache expires, data is still served from cache but will be refetched in the background on:
- Component remount
- Window focus
- Network reconnect

## Cache Invalidation

When you create, update, or delete data, the cache is **automatically invalidated** and related queries refetch. No manual refetching needed!

## File Structure

- `store.js` - Main Redux store configuration
- `api/baseApi.js` - Base API configuration with auth headers
- `api/adminApi.js` - Admin endpoints (components, procurement, etc.)
- `api/studentApi.js` - Student endpoints (borrow, components)
- `api/authApi.js` - Authentication endpoints
- `api/chatbotApi.js` - Chatbot endpoints
- `REDUX_MIGRATION_GUIDE.md` - Detailed migration guide

## See Also

Check out `REDUX_MIGRATION_GUIDE.md` for:
- Complete API reference
- Migration examples
- Best practices
- Troubleshooting tips

