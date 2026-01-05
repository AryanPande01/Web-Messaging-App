# Social Messaging App

A full-stack social messaging application built with the MERN stack (MongoDB, Express, React, Node.js) with real-time messaging capabilities using Socket.IO.

## Features

- 🔐 **Authentication**: Google OAuth and normal login/signup with JWT
- 👥 **Friend System**: Search users, send/accept/decline friend requests, mutual friends
- 💬 **Real-time Chat**: One-to-one messaging with Socket.IO
- 👨‍👩‍👧 **Group Chat**: Create groups and chat with multiple users
- 🔔 **Notifications**: Real-time notifications for friend requests and messages
- ⚙️ **Settings**: Dark/light theme, privacy settings, blocked users
- 🎨 **Modern UI**: Beautiful dark theme UI

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- Socket.IO for real-time communication
- JWT for authentication
- Passport.js for Google OAuth
- bcryptjs for password hashing

### Frontend
- React 18
- React Router for navigation
- Socket.IO Client
- Axios for API calls
- React Icons
- React Toastify

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Google OAuth credentials (for Google login)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:3000
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
.
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Auth middleware
│   ├── socket/          # Socket.IO handlers
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React Context providers
│   │   ├── services/   # API services
│   │   ├── styles/     # CSS files
│   │   └── utils/      # Utility functions
│   └── public/
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/settings` - Update settings
- `POST /api/users/block` - Block user
- `POST /api/users/unblock` - Unblock user

### Friends
- `GET /api/friends/search?q=query` - Search users
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept` - Accept friend request
- `POST /api/friends/decline` - Decline friend request
- `GET /api/friends/suggestions` - Get suggested users

### Messages
- `GET /api/messages/chats` - Get chat list
- `GET /api/messages/chat/:userId` - Get messages with user
- `GET /api/messages/group/:groupId` - Get group messages
- `PUT /api/messages/seen/:userId` - Mark messages as seen
- `DELETE /api/messages/:messageId` - Delete message

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user groups
- `GET /api/groups/:groupId` - Get group details
- `PUT /api/groups/:groupId` - Update group
- `POST /api/groups/:groupId/members` - Add members
- `DELETE /api/groups/:groupId/members` - Remove member

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Socket.IO Events

### Client to Server
- `sendMessage` - Send a message
- `typing` - Send typing indicator
- `messageSeen` - Mark message as seen

### Server to Client
- `newMessage` - New message received
- `typing` - User is typing
- `messageSeen` - Message was seen
- `userOnline` - User came online
- `userOffline` - User went offline
- `newNotification` - New notification

## Features in Detail

### Friend System
- Search for users by name, username, or email
- View mutual friends count
- Send friend requests
- Accept or decline friend requests
- Real-time notifications for friend requests

### Chat System
- One-to-one messaging between friends
- Real-time message delivery
- Message status (sent, delivered, seen)
- Typing indicators
- Online/offline presence
- Chat list sorted by latest activity

### Group Chat
- Create groups with multiple members
- Group admins can add/remove members
- Real-time group messaging
- Group information management

### Notifications
- Real-time notification updates
- Friend request notifications
- Message notifications
- Unread notification count
- Mark as read functionality

### Settings
- Dark/light theme toggle
- Privacy settings (last seen, read receipts)
- Blocked users management
- Profile customization

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Socket.IO authentication
- Input validation
- Error handling

## Future Enhancements

- Message reactions
- File sharing (images, videos)
- Voice/video calls
- Message search
- Message forwarding
- Profile status updates
- Last seen timestamps
- Read receipts toggle

## License

This project is open source and available for portfolio and interview purposes.

## Author

Built as a portfolio project demonstrating full-stack development skills.

