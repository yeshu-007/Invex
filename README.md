# IoT Lab Inventory Management System - Invex

A full-stack application for managing IoT lab inventory with admin and student access.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT tokens

## Project Structure

```
iot-inventory-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Login.js    # Login component
│   │   └── App.js
├── server/                 # Node.js backend
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── middleware/
│   │   └── auth.js
│   ├── scripts/
│   │   └── seedAdmin.js
│   └── index.js
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (already configured)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies (already done):
```bash
npm install
```

3. The `.env` file is already created with your MongoDB connection string. If you need to modify it:
```bash
# Edit .env file
MONGODB_URI=mongodb+srv://Cluster75532:Krishna1235@cluster75532.uhlhgzb.mongodb.net/iot-inventory?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

4. Seed the default admin user:
```bash
npm run seed
```

This will create an admin user with:
- **Username**: admin
- **Password**: admin123
- **User ID**: ADMIN001

5. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies (already done):
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

## Default Login Credentials

After running the seed script, you can login with:

- **User ID**: `admin` or `ADMIN001`
- **Password**: `admin123`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with userId and password
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout (client-side token removal)

### Example Login Request

```json
POST /api/auth/login
{
  "userId": "admin",
  "password": "admin123"
}
```

### Response

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "admin",
    "email": "admin@invex.com",
    "role": "admin",
    "userId": "ADMIN001"
  }
}
```

## Features Implemented

✅ Login UI matching the design exactly
✅ JWT-based authentication
✅ MongoDB Atlas integration
✅ Password hashing with bcrypt
✅ Protected routes middleware
✅ Admin user seeding script

## Next Steps

- Admin dashboard
- Component CRUD operations
- Student features
- CSV bulk upload
- Gemini integration for component identification
- Conversational chatbot

