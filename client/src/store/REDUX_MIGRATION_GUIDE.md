# Redux Toolkit Query (RTK Query) Migration Guide

This guide explains how to use Redux with RTK Query for API caching in the Invex application.

## Overview

RTK Query provides:
- ✅ **Automatic caching** - API responses are cached and reused
- ✅ **Request deduplication** - Multiple components requesting the same data only trigger one API call
- ✅ **Automatic cache invalidation** - Mutations automatically refresh related queries
- ✅ **Loading/error states** - Built-in state management
- ✅ **Background refetching** - Automatically refetches stale data

## Architecture

```
src/store/
├── store.js              # Redux store configuration
└── api/
    ├── baseApi.js        # Base API configuration with auth headers
    ├── adminApi.js       # Admin API endpoints
    ├── studentApi.js     # Student API endpoints
    ├── authApi.js        # Authentication API endpoints
    └── chatbotApi.js     # Chatbot API endpoints
```

## How Caching Works

### Cache Duration
- Components list: **60 seconds**
- Individual component: **60 seconds**
- Borrowing records: **30 seconds** (frequently changing)
- Dashboard: **30 seconds**

After the cache expires, data is considered "stale" but still served from cache. On component mount or window focus, stale data will be refetched in the background.

### Cache Invalidation
When you perform mutations (create, update, delete), the cache is automatically invalidated using tags:

```javascript
// Example: Creating a component invalidates 'Components' tag
createComponent: builder.mutation({
  invalidatesTags: ['Components'], // This refetches all Components queries
})
```

## Migration Examples

### 1. Fetching Data (Query Hook)

**Before (with fetch):**
```javascript
const [components, setComponents] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchComponents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/components', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setComponents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchComponents();
}, []);
```

**After (with RTK Query):**
```javascript
import { useGetComponentsQuery } from '../../store/api/adminApi';

const { data: components, isLoading: loading, error } = useGetComponentsQuery();
```

### 2. Creating/Updating Data (Mutation Hook)

**Before (with fetch):**
```javascript
const handleSubmit = async (formData) => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5001/api/admin/components', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (response.ok) {
      // Manually refetch components
      fetchComponents();
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

**After (with RTK Query):**
```javascript
import { useCreateComponentMutation } from '../../store/api/adminApi';

const [createComponent, { isLoading: loading }] = useCreateComponentMutation();

const handleSubmit = async (formData) => {
  try {
    const data = await createComponent(formData).unwrap();
    // Cache is automatically invalidated - no need to refetch!
  } catch (error) {
    console.error(error?.data?.message);
  }
};
```

## Available Hooks

### Admin API Hooks

#### Queries (Read Data)
- `useGetComponentsQuery()` - Get all components
- `useGetComponentByIdQuery(componentId)` - Get single component
- `useGetBorrowingRecordsQuery()` - Get all borrowing records
- `useGetDashboardDataQuery()` - Get dashboard stats
- `useGetProcurementRequestsQuery()` - Get procurement requests
- `useGetProcurementRequestByIdQuery(requestId)` - Get single request
- `useGetSmartLabDataQuery()` - Get smart lab data

#### Mutations (Write Data)
- `useCreateComponentMutation()` - Create new component
- `useUpdateComponentMutation()` - Update component
- `useDeleteComponentMutation()` - Delete component
- `useCreateProcurementRequestMutation()` - Create procurement request
- `useUpdateProcurementRequestMutation()` - Update procurement request

### Student API Hooks

- `useGetStudentComponentsQuery()` - Get components (student view)
- `useBorrowComponentMutation()` - Borrow a component
- `useGetStudentBorrowingHistoryQuery(userId)` - Get borrowing history

### Auth API Hooks

- `useLoginMutation()` - Login user
- `useGetCurrentUserQuery()` - Get current user
- `useLogoutMutation()` - Logout user

### Chatbot API Hooks

- `useChatMutation()` - Send chat message
- `useGetChatHistoryQuery(sessionId)` - Get chat history

## Query Hook Return Values

All query hooks return an object with:

```javascript
const {
  data,           // The fetched data
  error,          // Error object if request failed
  isLoading,      // True on initial load
  isFetching,     // True when refetching
  isError,        // True if error occurred
  isSuccess,      // True if successful
  refetch,        // Function to manually refetch
  isUninitialized // True if query hasn't been triggered yet
} = useGetComponentsQuery();
```

## Mutation Hook Return Values

All mutation hooks return a tuple:

```javascript
const [
  triggerMutation,  // Function to trigger the mutation
  {
    data,           // Response data after successful mutation
    error,          // Error object if mutation failed
    isLoading,      // True while mutation is in progress
    isError,        // True if mutation failed
    isSuccess,      // True if mutation succeeded
    reset           // Function to reset mutation state
  }
] = useCreateComponentMutation();

// Usage
await triggerMutation(payload).unwrap();
```

## Manual Cache Control

### Refetch on Demand
```javascript
const { refetch } = useGetComponentsQuery();

// Manually refetch
refetch();
```

### Manual Cache Invalidation
```javascript
import { store } from '../store/store';
import { adminApi } from '../store/api/adminApi';

// Invalidate specific tag
store.dispatch(adminApi.util.invalidateTags(['Components']));

// Invalidate specific resource
store.dispatch(adminApi.util.invalidateTags([{ type: 'Component', id: '123' }]));
```

### Skip Queries Conditionally
```javascript
// Don't fetch if condition is false
const { data } = useGetComponentByIdQuery(componentId, {
  skip: !componentId, // Skip if componentId is falsy
});
```

## Advanced: Polling

Automatically refetch at intervals:

```javascript
const { data } = useGetComponentsQuery(undefined, {
  pollingInterval: 5000, // Refetch every 5 seconds
});
```

## Components Already Migrated

✅ `Inventory.js` - Uses `useGetComponentsQuery` and `useDeleteComponentMutation`
✅ `AddItemModal.js` - Uses `useCreateComponentMutation`

## Next Steps for Migration

1. **Dashboard.js** - Migrate to `useGetDashboardDataQuery` or use multiple queries
2. **EditItemModal.js** - Migrate to `useUpdateComponentMutation`
3. **Procurement.js** - Migrate to `useGetProcurementRequestsQuery`
4. **StudentView.js** - Migrate to `useGetStudentComponentsQuery`
5. **BorrowModal.js** - Migrate to `useBorrowComponentMutation`
6. **Login components** - Migrate to `useLoginMutation`
7. **Chatbox.js** - Migrate to `useChatMutation`

## Best Practices

1. **Don't manually refetch after mutations** - Cache invalidation handles it automatically
2. **Use isLoading for initial load, isFetching for refetches** - Better UX
3. **Handle errors gracefully** - Check `isError` and display `error.data.message`
4. **Use skip option** - Don't fetch if required parameters are missing
5. **Leverage cache** - Same query in multiple components = single API call

## Troubleshooting

### Cache not updating?
- Check that mutations have `invalidatesTags` configured
- Verify tag names match between queries and mutations

### Unwanted refetches?
- Adjust `keepUnusedDataFor` value in API slice
- Use `skip` option to prevent automatic fetching

### Token not included?
- Token is automatically added via `prepareHeaders` in `baseApi.js`
- Make sure token is in localStorage with key 'token'

## Resources

- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [RTK Query Examples](https://redux-toolkit.js.org/rtk-query/usage/examples)

