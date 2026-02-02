# Visa Agency Marketplace - Backend

Node.js + Express backend with JWT authentication for the Visa Agency Marketplace application.

## Features

- Student and Agency registration
- Secure authentication with JWT
- Password hashing with bcrypt
- MySQL database with connection pooling
- Transaction support for data integrity
- Input validation
- Protected routes with role-based authorization
- CORS enabled for frontend integration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (mysql2 with promises)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Environment Variables**: dotenv
- **Development**: nodemon

## Folder Structure

```
Backend/
├── config/
│   └── database.js          # MySQL connection pool configuration
├── controllers/
│   └── authController.js    # Authentication logic (register, login, profile)
├── middleware/
│   └── auth.js              # JWT authentication & authorization middleware
├── routes/
│   └── authRoutes.js        # Authentication route definitions
├── utils/
│   ├── jwt.js               # JWT token generation and verification
│   └── validation.js        # Input validation helpers
├── .env                     # Environment variables (DO NOT COMMIT)
├── server.js                # Express server entry point
├── package.json             # Dependencies and scripts
├── README.md                # This file
└── FRONTEND_INTEGRATION_GUIDE.md  # Frontend integration examples
```

## Database Schema

### users table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('STUDENT', 'AGENCY') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### student_profiles table
```sql
CREATE TABLE student_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### agency_profiles table
```sql
CREATE TABLE agency_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  agency_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  license_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Installation

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
   ```bash
   cd Backend
   npm install
   ```

3. **Set up environment variables**:
   The `.env` file should already exist with your MySQL credentials:
   ```env
   # Server Configuration
   PORT=5001
   FLASK_URL=http://127.0.0.1:5002

   # MySQL Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=visa_marketplace
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
   JWT_EXPIRES_IN=7d
   ```

4. **Create database tables** (if not already created):
   Run the SQL schema above in your MySQL database.

5. **Start the server**:
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5001`

## API Endpoints

### Public Routes (No Authentication Required)

| Method | Endpoint                   | Description           |
|--------|----------------------------|-----------------------|
| POST   | `/auth/register/student`   | Register a student    |
| POST   | `/auth/register/agency`    | Register an agency    |
| POST   | `/auth/login`              | Login (student/agency)|

### Protected Routes (Authentication Required)

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | `/auth/profile`   | Get current user profile |

### Health Check Routes

| Method | Endpoint         | Description                  |
|--------|------------------|------------------------------|
| GET    | `/`              | Server health check          |
| GET    | `/api/db-health` | Database connection check    |

## API Usage Examples

### 1. Student Registration

**Request**:
```bash
POST http://localhost:5001/auth/register/student
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "country": "United States",
  "date_of_birth": "2000-01-15"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Student registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "role": "STUDENT",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "country": "United States",
    "date_of_birth": "2000-01-15",
    "created_at": "2024-01-31T10:30:00.000Z"
  }
}
```

### 2. Agency Registration

**Request**:
```bash
POST http://localhost:5001/auth/register/agency
Content-Type: application/json

{
  "email": "agency@example.com",
  "password": "password123",
  "agency_name": "Global Visa Services",
  "phone": "+1234567890",
  "address": "123 Main St, New York, NY 10001",
  "license_number": "LIC-12345"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Agency registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "agency@example.com",
    "role": "AGENCY",
    "agency_name": "Global Visa Services",
    "phone": "+1234567890",
    "address": "123 Main St, New York, NY 10001",
    "license_number": "LIC-12345",
    "created_at": "2024-01-31T10:35:00.000Z"
  }
}
```

### 3. Login

**Request**:
```bash
POST http://localhost:5001/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "role": "STUDENT",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "country": "United States",
    "date_of_birth": "2000-01-15",
    "created_at": "2024-01-31T10:30:00.000Z"
  }
}
```

### 4. Get Profile (Protected)

**Request**:
```bash
GET http://localhost:5001/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "student@example.com",
    "role": "STUDENT",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "country": "United States",
    "date_of_birth": "2000-01-15",
    "created_at": "2024-01-31T10:30:00.000Z"
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Valid email is required",
    "Password must be at least 6 characters long"
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Email Already Exists (409)
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Registration failed",
  "error": "Error details here"
}
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Tokens**: Secure token-based authentication with 7-day expiration
3. **Prepared Statements**: All database queries use prepared statements to prevent SQL injection
4. **Transactions**: Registration uses database transactions for data integrity
5. **Input Validation**: All inputs are validated before processing
6. **CORS**: Enabled for frontend integration

## Environment Variables

| Variable        | Description                          | Default              |
|----------------|--------------------------------------|----------------------|
| PORT           | Server port                          | 5001                 |
| DB_HOST        | MySQL host                           | localhost            |
| DB_USER        | MySQL username                       | root                 |
| DB_PASSWORD    | MySQL password                       | (required)           |
| DB_NAME        | MySQL database name                  | visa_marketplace     |
| DB_PORT        | MySQL port                           | 3306                 |
| JWT_SECRET     | Secret key for JWT signing           | (required)           |
| JWT_EXPIRES_IN | Token expiration time                | 7d                   |

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Testing with cURL

```bash
# Test server health
curl http://localhost:5001/

# Test database connection
curl http://localhost:5001/api/db-health

# Register a student
curl -X POST http://localhost:5001/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "phone": "+1234567890",
    "country": "United States"
  }'

# Login
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Frontend Integration

See [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) for complete examples of:
- React service layer with axios
- Authentication context
- Component examples (Login, Register, Protected Routes)
- Token management
- Error handling

## Troubleshooting

### MySQL Connection Error

If you see "MySQL connection error", check:
1. MySQL is running
2. Credentials in `.env` are correct
3. Database `visa_marketplace` exists
4. Required tables are created

### Port Already in Use

If port 5001 is already in use:
1. Change the PORT in `.env` to a different value
2. Update the frontend `.env` to match the new port

### JWT Secret Warning

In production, always use a strong, random JWT_SECRET. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Production Deployment

Before deploying to production:

1. Change `JWT_SECRET` to a strong random value
2. Use environment-specific `.env` files
3. Enable HTTPS
4. Implement rate limiting
5. Add logging middleware
6. Set up database backups
7. Consider using a process manager like PM2
8. Implement token refresh mechanism
9. Add email verification
10. Set up monitoring and alerts

## License

This project is part of the Visa Agency Marketplace application.

## Support

For issues or questions, contact the development team.
