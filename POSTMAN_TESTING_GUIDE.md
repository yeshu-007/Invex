# Postman Testing Guide for Invex API

This guide will help you set up and test all API endpoints using Postman.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Importing the Collection](#importing-the-collection)
3. [Setting Up Environment Variables](#setting-up-environment-variables)
4. [Testing Workflow](#testing-workflow)
5. [API Endpoints Overview](#api-endpoints-overview)
6. [Common Testing Scenarios](#common-testing-scenarios)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Postman installed** - Download from [postman.com](https://www.postman.com/downloads/)
2. **Server running** - Make sure your backend server is running on `http://localhost:5001`
3. **MongoDB connected** - Ensure your MongoDB connection is working

## Importing the Collection

### Method 1: Import from File

1. Open Postman
2. Click **Import** button (top left)
3. Select the file: `Invex_API.postman_collection.json`
4. Click **Import**

### Method 2: Import from URL (if hosted)

1. Open Postman
2. Click **Import**
3. Paste the collection URL
4. Click **Import**

## Setting Up Environment Variables

### Create a New Environment

1. Click the **Environments** icon (left sidebar) or click the gear icon (top right)
2. Click **+** to create a new environment
3. Name it: `Invex Local`
4. Add these variables:

| Variable Name | Initial Value | Current Value |
|--------------|---------------|---------------|
| `base_url` | `http://localhost:5001` | `http://localhost:5001` |
| `auth_token` | (leave empty) | (leave empty) |
| `component_id` | (leave empty) | (leave empty) |
| `record_id` | (leave empty) | (leave empty) |

5. Click **Save**

### Select the Environment

1. In the top right corner, click the environment dropdown
2. Select **Invex Local**

**Note:** The `auth_token` will be automatically saved when you run the Login request (it's set up in the test script).

## Testing Workflow

### Step 1: Test Server Health

1. Open the collection: **Invex API Collection**
2. Navigate to **Public/General** → **Health Check**
3. Click **Send**
4. You should get: `{"status": "OK", "message": "Server is running"}`

### Step 2: Login (Required for Most Endpoints)

1. Navigate to **Authentication** → **Login**
2. The request body is pre-filled with:
   ```json
   {
     "userId": "admin",
     "password": "admin123"
   }
   ```
3. Click **Send**
4. Check the **Test Results** tab - you should see:
   - ✅ Status code is 200
   - ✅ Response has token
   - ✅ Response has user object
5. The token is automatically saved to `auth_token` environment variable

### Step 3: Test Protected Endpoints

Now you can test any endpoint that requires authentication. The token is automatically included in the `Authorization` header.

## API Endpoints Overview

### 🔓 Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server status |
| GET | `/api/components/` | Get all components |
| GET | `/api/components/tags` | Get all tags |
| GET | `/api/components/categories` | Get all categories |

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Create new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/verify` | Verify token | Yes |
| POST | `/api/auth/logout` | Logout | Yes |

### 👨‍💼 Admin Endpoints (Admin Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/components` | Add component |
| GET | `/api/admin/components` | Get all components |
| GET | `/api/admin/components/:componentId` | Get component details |
| PUT | `/api/admin/components/:componentId` | Update component |
| DELETE | `/api/admin/components/:componentId` | Delete component |
| GET | `/api/admin/procurement` | Get procurement analysis |
| POST | `/api/admin/components/upload` | Bulk upload CSV |

### 👨‍🎓 Student Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/components` | Search components |
| POST | `/api/student/borrow` | Borrow component |
| POST | `/api/student/components/:componentId/return` | Return component |
| GET | `/api/student/recommendations` | Get recommendations |
| GET | `/api/student/components/identify` | Identify component (Gemini) |

## Common Testing Scenarios

### Scenario 1: Complete Admin Workflow

1. **Login as Admin**
   - Run: `Authentication → Login`
   - Use: `userId: "admin"`, `password: "admin123"`

2. **Add a Component**
   - Run: `Admin → Add Component`
   - Modify the request body as needed
   - Component ID is automatically saved

3. **Get Component Details**
   - Run: `Admin → Get Component Details`
   - Uses the saved `component_id` automatically

4. **Update Component**
   - Run: `Admin → Update Component`
   - Modify fields in the request body

5. **Delete Component**
   - Run: `Admin → Delete Component`

### Scenario 2: Student Workflow

1. **Login as Student**
   - First, create a student account via Signup
   - Then login with student credentials

2. **Search Components**
   - Run: `Student → Search Components`
   - Modify query parameters: `?q=arduino` or `?tag=iot`

3. **Borrow Component**
   - Run: `Student → Borrow Component`
   - Update `userId` and `componentId` in request body
   - Set `expectedReturnDate` (format: YYYY-MM-DD)

4. **Return Component**
   - Run: `Student → Return Component`
   - Uses saved `record_id` from borrow operation

### Scenario 3: Testing Error Cases

1. **Test Invalid Login**
   - Run: `Authentication → Login`
   - Change password to wrong value
   - Should get: `401 Unauthorized`

2. **Test Without Token**
   - Manually remove `Authorization` header from any protected endpoint
   - Should get: `401 Unauthorized`

3. **Test Invalid Component ID**
   - Run: `Admin → Get Component Details`
   - Change `componentId` to invalid value
   - Should get: `404 Not Found`

## Understanding Request Headers

### Content-Type Header
- **When to use:** For POST/PUT requests with JSON body
- **Value:** `application/json`
- **Already included** in all POST/PUT requests in the collection

### Authorization Header
- **When to use:** For all protected endpoints
- **Format:** `Bearer <token>`
- **Example:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Auto-included** in all protected requests using `{{auth_token}}`

## Understanding Request Bodies

### Login Request
```json
{
  "userId": "admin",
  "password": "admin123"
}
```

### Add Component Request
```json
{
  "name": "Arduino Uno",
  "category": "Microcontroller",
  "totalQuantity": 10,
  "description": "Popular microcontroller board",
  "threshold": 5,
  "tags": ["arduino", "microcontroller", "iot"],
  "datasheetLink": "https://example.com/datasheet",
  "condition": "good",
  "remarks": "New stock"
}
```

### Borrow Component Request
```json
{
  "userId": "STUDENT001",
  "componentId": "COMP-1234567890-ABC12",
  "quantity": 1,
  "expectedReturnDate": "2024-12-31"
}
```

## Automatic Test Scripts

The collection includes automatic test scripts that:

1. **Check Status Codes** - Verify responses are successful
2. **Validate Response Structure** - Ensure responses have expected fields
3. **Save Tokens** - Automatically save `auth_token` after login
4. **Save IDs** - Save `component_id` and `record_id` for later use

You can see test results in the **Test Results** tab after sending a request.

## Troubleshooting

### Issue: "No token provided"
**Solution:** Make sure you've run the Login request first, and the environment is selected.

### Issue: "Invalid or expired token"
**Solution:** 
- Token expires after 24 hours
- Run Login again to get a new token

### Issue: "Access denied. Admin privileges required."
**Solution:** 
- Make sure you're logged in as an admin user
- Check the user's role in the database

### Issue: Connection refused
**Solution:**
- Make sure the server is running: `cd server && npm start`
- Check the port in `base_url` environment variable (default: 5001)

### Issue: Environment variables not working
**Solution:**
- Make sure you've selected the correct environment (top right dropdown)
- Check that variable names match exactly (case-sensitive)

## Tips for Efficient Testing

1. **Use Collection Runner** - Run multiple requests in sequence
   - Click **Run** button on the collection
   - Select requests to run
   - Click **Run Invex API Collection**

2. **Save Responses** - Click **Save Response** to save example responses

3. **Duplicate Requests** - Right-click a request → **Duplicate** to create variations

4. **Use Variables** - Reference variables in request bodies:
   - `{{auth_token}}` - Current auth token
   - `{{component_id}}` - Last created component ID
   - `{{base_url}}` - API base URL

5. **Organize with Folders** - The collection is already organized by category

## Next Steps

- Create more test scenarios
- Add more test assertions
- Set up automated test runs
- Export test results
- Share collection with team

---

**Happy Testing! 🚀**

For issues or questions, check the server logs or MongoDB connection.

