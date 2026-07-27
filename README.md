# ft_trandandan - Ping Pong Tournament Platform

A modern, full-stack ping pong tournament platform built with microservices architecture. This project includes real-time chat functionality, user management, tournament systems, and comprehensive authentication.

## 🏗️ Architecture Overview

This project follows a **microservices architecture** with the following components:

```
ft_trandandan/
├── srcs/
│   ├── docker-compose.yaml     # Container orchestration
│   ├── gateway/                # API Gateway & Load Balancer
│   ├── user-service/          # User management & authentication
│   ├── log-service/           # Logging & analytics
│   ├── front/                 # React frontend
│   └── prisma/                # Database schema & migrations
├── postman/                   # API testing collections
└── logs.sh                    # Log management script
```

## 🚀 Features

### Core Features

- **User Authentication & Authorization** (JWT-based)
- **Real-time Chat System** (Direct & Group messaging)
- **Tournament Management**
- **Friend System**
- **File Upload & Sharing**
- **Game Invitations & Lobbies**
- **Notification System**
- **User Profiles & Status Management**

### Technical Features

- **Microservices Architecture**
- **Docker Containerization**
- **API Gateway with Load Balancing**
- **Database Migrations with Prisma**
- **Real-time Communication**
- **Comprehensive Logging**
- **CORS & Security Headers**

## 🛠️ Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Fastify** - Web framework
- **Prisma ORM** - Database management
- **SQLite** - Database
- **JWT** - Authentication
- **Nodemailer** - Email services
- **Docker** - Containerization

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Infrastructure

- **Docker Compose** - Container orchestration
- **Nginx** - API Gateway
- **Postman** - API testing

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/v1/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "jwt-token"
  }
}
```

#### POST `/api/v1/auth/login`

Authenticate user and get access token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### POST `/api/v1/auth/logout`

Logout user and invalidate token.

#### GET `/api/v1/auth/verify-email`

Verify user email with token.

### User Management Endpoints

#### GET `/api/v1/user`

Get all users (with optional search).

**Query Parameters:**

- `search` (optional): Search term for user names

#### GET `/api/v1/user/profile`

Get current user profile.

#### PUT `/api/v1/user/profile`

Update user profile information.

**Request Body:**

```json
{
  "name": "Updated Name",
  "avatar": "avatar-url",
  "status": "online"
}
```

#### GET `/api/v1/user/search`

Search users by name.

**Query Parameters:**

- `name`: Search term

### Chat System Endpoints

#### GET `/api/v1/chats`

Get all chat conversations for the current user.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "chat-id",
      "isGroup": false,
      "name": "Chat Name",
      "avatar": "avatar-url",
      "lastMessage": {
        "content": "Last message",
        "createdAt": "2023-10-20T10:00:00Z"
      },
      "participants": [
        {
          "id": "user-id",
          "name": "User Name",
          "avatar": "avatar-url",
          "onlineStatus": true,
          "isSelf": true
        }
      ]
    }
  ]
}
```

#### POST `/api/v1/chats`

Create a new chat (direct or group).

**For Direct Chat:**

```json
{
  "userId": "target-user-id"
}
```

**For Group Chat:**

```json
{
  "isGroup": true,
  "name": "Group Name",
  "participantIds": ["user-id-1", "user-id-2"]
}
```

#### GET `/api/v1/chats/:chatId/messages`

Get messages from a specific chat.

**Query Parameters:**

- `page` (default: 1): Page number
- `limit` (default: 50): Messages per page

#### POST `/api/v1/chats/:chatId/messages`

Send a message to a chat.

**Request Body:**

```json
{
  "content": "Message content",
  "type": "text" // "text", "image", "file"
}
```

#### PUT `/api/v1/chats/:chatId`

Update chat information (group chats only).

**Request Body:**

```json
{
  "name": "New Group Name",
  "avatar": "new-avatar-url"
}
```

#### DELETE `/api/v1/chats/:chatId`

Delete a chat conversation.

### Chat Participants Management

#### POST `/api/v1/chats/:chatId/participants`

Add participants to a group chat.

**Request Body:**

```json
{
  "userIds": ["user-id-1", "user-id-2"]
}
```

#### DELETE `/api/v1/chats/:chatId/participants/:userId`

Remove a participant from a group chat.

### Friends System Endpoints

#### GET `/api/v1/friends`

Get user's friends list.

#### POST `/api/v1/friends/request`

Send a friend request.

**Request Body:**

```json
{
  "userId": "target-user-id"
}
```

#### PUT `/api/v1/friends/request/:requestId`

Accept or decline a friend request.

**Request Body:**

```json
{
  "action": "accept" // "accept" or "decline"
}
```

#### DELETE `/api/v1/friends/:friendId`

Remove a friend.

#### POST `/api/v1/friends/block`

Block a user.

**Request Body:**

```json
{
  "userId": "user-to-block-id"
}
```

### Notification Endpoints

#### GET `/api/v1/notifications`

Get user notifications.

#### PUT `/api/v1/notifications/:notificationId/read`

Mark notification as read.

#### DELETE `/api/v1/notifications/:notificationId`

Delete a notification.

### File Upload Endpoints

#### POST `/api/v1/upload`

Upload a file.

**Request:**

- Content-Type: `multipart/form-data`
- Field name: `file`

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "uploaded-file-url",
    "filename": "original-filename",
    "size": 1024
  }
}
```

## 🗄️ Database Schema

The application uses **Prisma ORM** with **SQLite** database. Key models include:

### User Model

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String?
  name          String
  avatar        String?
  onlineStatus  Boolean  @default(false)
  isVerified    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Chat Model

```prisma
model Chat {
  id              String   @id @default(cuid())
  isGroup         Boolean  @default(false)
  name            String?
  avatar          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastMessageAt   DateTime?
}
```

### Message Model

```prisma
model Message {
  id         String      @id @default(cuid())
  content    String
  type       MessageType @default(TEXT)
  fileUrl    String?
  fileName   String?
  fileSize   Int?
  chatId     String
  senderId   String
  createdAt  DateTime    @default(now())
}
```

## 🐳 Docker Setup

### Prerequisites

- Docker
- Docker Compose

### Environment Setup

1. **Clone the repository:**

```bash
git clone <repository-url>
cd ft_trandandan
```

2. **Set up environment variables:**
   Create `.env` files in each service directory with required variables.

**Gateway (.env):**

```env
PORT=3000
NODE_ENV=development
```

**User Service (.env):**

```env
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-password"
```

**Log Service (.env):**

```env
PORT=3002
DATABASE_URL="file:./logs.db"
```

### Running the Application

1. **Start all services:**

```bash
docker-compose up -d
```

2. **Run database migrations:**

```bash
cd srcs/prisma
npx prisma migrate dev
```

3. **Seed the database (optional):**

```bash
npx prisma db seed
```

### Service Ports

- **Gateway:** http://localhost:3000
- **Frontend:** http://localhost:5173
- **User Service:** http://localhost:3001
- **Log Service:** http://localhost:3002

## 🔧 Development Setup

### Backend Development

1. **Navigate to a service directory:**

```bash
cd srcs/user-service/tools
```

2. **Install dependencies:**

```bash
npm install
```

3. **Run in development mode:**

```bash
npm run dev
```

### Frontend Development

1. **Navigate to frontend directory:**

```bash
cd srcs/front/tools
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start development server:**

```bash
npm run dev
```

### Database Management

**Generate Prisma client:**

```bash
cd srcs/prisma
npx prisma generate
```

**Create migration:**

```bash
npx prisma migrate dev --name migration-name
```

**View database:**

```bash
npx prisma studio
```

## 🚦 API Flow Examples

### User Registration Flow

1. **Register User:**

```bash
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

2. **Verify Email:**

```bash
GET /api/v1/auth/verify-email?token=verification-token
```

3. **Login:**

```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Chat Creation Flow

1. **Create Direct Chat:**

```bash
POST /api/v1/chats
{
  "userId": "target-user-id"
}
```

2. **Send Message:**

```bash
POST /api/v1/chats/chat-id/messages
{
  "content": "Hello!",
  "type": "text"
}
```

3. **Get Messages:**

```bash
GET /api/v1/chats/chat-id/messages?page=1&limit=20
```

### Group Chat Flow

1. **Create Group:**

```bash
POST /api/v1/chats
{
  "isGroup": true,
  "name": "My Group",
  "participantIds": ["user-id-1", "user-id-2"]
}
```

2. **Add Members:**

```bash
POST /api/v1/chats/group-id/participants
{
  "userIds": ["user-id-3"]
}
```

3. **Update Group Info:**

```bash
PUT /api/v1/chats/group-id
{
  "name": "Updated Group Name"
}
```

## 📊 Logging & Monitoring

### Log Service

The application includes a dedicated logging service that:

- Captures all API requests and responses
- Tracks user activities
- Monitors system performance
- Provides error tracking

### Log Access

```bash
# View logs in real-time
./logs.sh

# Access log service directly
curl http://localhost:3002/api/v1/logs
```

## 🧪 Testing

### API Testing with Postman

The project includes Postman collections in the `/postman` directory:

- `auth.postman_collection.json` - Authentication endpoints
- `user-service.postman_collection.json` - User management endpoints
- `friends.postman_collection.json` - Friends system endpoints

### Import Collections

1. Open Postman
2. Import the collection files
3. Set up environment variables
4. Run the tests

### Manual Testing

```bash
# Test authentication
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test protected endpoint
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer your-jwt-token"
```

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcrypt
- **Input Validation** on all endpoints
- **CORS Configuration** for cross-origin requests
- **Rate Limiting** to prevent abuse
- **SQL Injection Protection** via Prisma ORM
- **File Upload Security** with type validation

## 🚀 Deployment

### Production Setup

1. **Update environment variables:**

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="secure-production-secret"
```

2. **Build and deploy:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Run production migrations:**

```bash
npx prisma migrate deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues:**

```bash
# Reset database
cd srcs/prisma
npx prisma migrate reset
```

**Port Conflicts:**

```bash
# Check port usage
lsof -i :3000
# Kill process
kill -9 <PID>
```

**Docker Issues:**

```bash
# Rebuild containers
docker-compose down
docker-compose up --build
```

### Support

For support and questions:

1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include error logs and environment details

---

**Built with ❤️ by [Your Name]**
