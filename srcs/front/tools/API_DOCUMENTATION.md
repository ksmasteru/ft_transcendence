# Complete API Documentation for Frontend

## Authentication APIs

### User Registration & Login
- `POST /api/v1/auth/sign-up` - Register new user
- `POST /api/v1/auth/sign-in` - User login
- `POST /api/v1/auth/sign-out` - User logout
- `GET /api/v1/auth/checkAuthCookie` - Verify authentication status

### Email Verification
- `GET /api/v1/auth/verify/:userId/:uniqueString` - Verify email
- `POST /api/v1/auth/resend-verification` - Resend verification email

### Password Management
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/change-password` - Change password (authenticated)

### Two-Factor Authentication
- `POST /api/v1/auth/enable-2fa` - Setup 2FA (returns QR code)
- `POST /api/v1/auth/verify-2fa` - Verify 2FA code
- `POST /api/v1/auth/disable-2fa` - Disable 2FA
- `POST /api/v1/auth/reset-2fa` - Reset 2FA if lost device

## User Management APIs

### User Profile
- `GET /api/v1/user/me` - Get current user profile
- `PUT /api/v1/user/:id` - Update user profile
- `GET /api/v1/user/:id` - Get user by ID
- `DELETE /api/v1/user/:id` - Delete user account

### User Avatar
- `POST /api/v1/user/avatar` - Upload user avatar
- `DELETE /api/v1/user/avatar` - Delete user avatar

## Friends & Social APIs

### Friendships
- `GET /api/v1/friends` - Get user's friends list
- `POST /api/v1/friends/request` - Send friend request
- `PUT /api/v1/friends/:requestId/accept` - Accept friend request  
- `PUT /api/v1/friends/:requestId/decline` - Decline friend request
- `DELETE /api/v1/friends/:friendId` - Remove friend
- `GET /api/v1/friends/requests` - Get pending friend requests
- `POST /api/v1/friends/block` - Block user
- `DELETE /api/v1/friends/block/:userId` - Unblock user

### User Search
- `GET /api/v1/users/search?query=:searchTerm` - Search users
- `GET /api/v1/users/online` - Get online users

## Chat & Messaging APIs

### Chat Management
- `GET /api/v1/chats` - Get user's chats
- `POST /api/v1/chats` - Create new chat
- `PUT /api/v1/chats/:chatId` - Update chat (name, avatar)
- `DELETE /api/v1/chats/:chatId` - Delete chat
- `POST /api/v1/chats/:chatId/participants` - Add participants to chat
- `DELETE /api/v1/chats/:chatId/participants/:userId` - Remove participant

### Messages
- `GET /api/v1/chats/:chatId/messages` - Get chat messages (with pagination)
- `POST /api/v1/chats/:chatId/messages` - Send message
- `PUT /api/v1/messages/:messageId` - Edit message
- `DELETE /api/v1/messages/:messageId` - Delete message
- `POST /api/v1/messages/:messageId/reactions` - Add reaction to message
- `DELETE /api/v1/messages/:messageId/reactions/:reactionId` - Remove reaction

### File Uploads
- `POST /api/v1/messages/upload` - Upload file for message
- `GET /api/v1/messages/files/:fileId` - Download message file

## Gaming & Achievement APIs

### Games
- `GET /api/v1/games` - Get user's games
- `POST /api/v1/games` - Add new game
- `PUT /api/v1/games/:gameId` - Update game
- `DELETE /api/v1/games/:gameId` - Delete game

### Achievements
- `GET /api/v1/achievements` - Get all available achievements
- `GET /api/v1/user/achievements` - Get user's unlocked achievements
- `POST /api/v1/user/achievements/:achievementId` - Award achievement to user

### Leaderboard & XP
- `GET /api/v1/leaderboard` - Get leaderboard (top users by XP)
- `POST /api/v1/user/xp` - Add XP to user
- `GET /api/v1/user/level` - Calculate user level based on XP

## Activity & Logging APIs

### Recent Activity
- `GET /api/v1/user/activities` - Get user's recent activities
- `POST /api/v1/user/activities` - Log new activity
- `GET /api/v1/activities/feed` - Get activity feed from friends

### System Logs (for Security page)
- `GET /api/v1/log/logs` - Get user's security logs
- `POST /api/v1/logs` - Create new log entry

## Real-time APIs (WebSocket/Socket.IO)

### Chat Real-time
- `socket.emit('join-chat', { chatId })` - Join chat room
- `socket.emit('leave-chat', { chatId })` - Leave chat room  
- `socket.emit('send-message', { chatId, content, type })` - Send message
- `socket.on('new-message', callback)` - Listen for new messages
- `socket.on('message-updated', callback)` - Listen for message updates
- `socket.on('message-deleted', callback)` - Listen for message deletions

### User Status
- `socket.emit('user-online')` - Set user online
- `socket.emit('user-offline')` - Set user offline
- `socket.on('user-status-changed', callback)` - Listen for status changes

### Notifications
- `socket.on('friend-request', callback)` - Listen for friend requests
- `socket.on('achievement-unlocked', callback)` - Listen for achievements

## Additional Utility APIs

### Statistics
- `GET /api/v1/stats/dashboard` - Get dashboard statistics
- `GET /api/v1/stats/user/:userId` - Get user statistics

### Settings
- `GET /api/v1/user/preferences` - Get user preferences
- `PUT /api/v1/user/preferences` - Update user preferences

### Moderation
- `POST /api/v1/reports` - Report user/content
- `GET /api/v1/reports` - Get user's reports (admin)

## API Response Format

All APIs should return consistent JSON responses:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional message",
  "error": null
}
```

For errors:
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## Authentication

Most APIs require authentication via:
- JWT Token in Authorization header: `Bearer <token>`
- Or httpOnly cookies for session-based auth

## Pagination

For list endpoints, use query parameters:
- `?page=1&limit=20&sort=createdAt&order=desc`

## File Upload

Use FormData for file uploads:
- Maximum file size: 10MB
- Supported formats: images (jpg, png, gif), documents (pdf, doc)