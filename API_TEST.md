# API Testing Guide

Quick reference for testing the authentication endpoints using different tools.

## Prerequisites

- Backend server running on `http://localhost:5001`
- MySQL database is running and tables are created
- Use the credentials from your registration or login requests

---

## Using cURL (Command Line)

### 1. Test Server Health

```bash
curl http://localhost:5001/
```

Expected Response:
```json
{"status":"ok","message":"Node backend running"}
```

---

### 2. Test Database Connection

```bash
curl http://localhost:5001/api/db-health
```

Expected Response:
```json
{"status":"ok","message":"Database connection successful","database":"visa_marketplace"}
```

---

### 3. Register a Student

```bash
curl -X POST http://localhost:5001/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.student@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "country": "United States",
    "date_of_birth": "2000-01-15"
  }'
```

Save the token from the response!

---

### 4. Register an Agency

```bash
curl -X POST http://localhost:5001/auth/register/agency \
  -H "Content-Type: application/json" \
  -d '{
    "email": "global.agency@example.com",
    "password": "password123",
    "agency_name": "Global Visa Services",
    "phone": "+1987654321",
    "address": "123 Main Street, New York, NY 10001",
    "license_number": "LIC-12345"
  }'
```

---

### 5. Login (Student or Agency)

```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.student@example.com",
    "password": "password123"
  }'
```

Copy the token from the response for the next request!

---

### 6. Get Profile (Protected Route)

Replace `YOUR_TOKEN_HERE` with the actual token from login/registration:

```bash
curl -X GET http://localhost:5001/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Example with a real token:
```bash
curl -X GET http://localhost:5001/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3MDY3MDAwMDAsImV4cCI6MTcwNzMwNDgwMH0.abcd1234efgh5678"
```

---

## Using Postman

### Setup

1. Download and install [Postman](https://www.postman.com/downloads/)
2. Create a new collection called "Visa Marketplace Auth"

### Test Requests

#### Student Registration

- **Method**: POST
- **URL**: `http://localhost:5001/auth/register/student`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "john.student@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "country": "United States",
    "date_of_birth": "2000-01-15"
  }
  ```

#### Agency Registration

- **Method**: POST
- **URL**: `http://localhost:5001/auth/register/agency`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "global.agency@example.com",
    "password": "password123",
    "agency_name": "Global Visa Services",
    "phone": "+1987654321",
    "address": "123 Main Street, New York, NY 10001",
    "license_number": "LIC-12345"
  }
  ```

#### Login

- **Method**: POST
- **URL**: `http://localhost:5001/auth/login`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "john.student@example.com",
    "password": "password123"
  }
  ```

#### Get Profile

- **Method**: GET
- **URL**: `http://localhost:5001/auth/profile`
- **Headers**:
  - `Authorization`: `Bearer YOUR_TOKEN_HERE`

**Tip**: In Postman, you can save the token to a collection variable and reuse it:
1. In the login response, add a Test script:
   ```javascript
   pm.environment.set("auth_token", pm.response.json().token);
   ```
2. In subsequent requests, use: `Bearer {{auth_token}}`

---

## Using Thunder Client (VS Code Extension)

Thunder Client is a REST API client extension for VS Code.

### Installation

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X on Mac, Ctrl+Shift+X on Windows)
3. Search for "Thunder Client"
4. Install it

### Usage

Same as Postman, but integrated in VS Code:
1. Click the Thunder Client icon in the sidebar
2. Create a new request
3. Follow the same method, URL, headers, and body as shown in Postman section

---

## Using JavaScript (Fetch API)

### Student Registration

```javascript
fetch('http://localhost:5001/auth/register/student', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.student@example.com',
    password: 'password123',
    full_name: 'John Doe',
    phone: '+1234567890',
    country: 'United States',
    date_of_birth: '2000-01-15'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  localStorage.setItem('token', data.token);
})
.catch(error => console.error('Error:', error));
```

### Login

```javascript
fetch('http://localhost:5001/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.student@example.com',
    password: 'password123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login successful:', data);
  localStorage.setItem('token', data.token);
})
.catch(error => console.error('Error:', error));
```

### Get Profile

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5001/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Profile:', data))
.catch(error => console.error('Error:', error));
```

---

## Using Axios (Recommended for React)

### Installation

```bash
npm install axios
```

### Student Registration

```javascript
import axios from 'axios';

const registerStudent = async () => {
  try {
    const response = await axios.post('http://localhost:5001/auth/register/student', {
      email: 'john.student@example.com',
      password: 'password123',
      full_name: 'John Doe',
      phone: '+1234567890',
      country: 'United States',
      date_of_birth: '2000-01-15'
    });

    console.log('Registration successful:', response.data);
    localStorage.setItem('token', response.data.token);
  } catch (error) {
    console.error('Registration failed:', error.response?.data);
  }
};

registerStudent();
```

### Login

```javascript
const login = async () => {
  try {
    const response = await axios.post('http://localhost:5001/auth/login', {
      email: 'john.student@example.com',
      password: 'password123'
    });

    console.log('Login successful:', response.data);
    localStorage.setItem('token', response.data.token);
  } catch (error) {
    console.error('Login failed:', error.response?.data);
  }
};

login();
```

### Get Profile

```javascript
const getProfile = async () => {
  try {
    const token = localStorage.getItem('token');

    const response = await axios.get('http://localhost:5001/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Profile:', response.data);
  } catch (error) {
    console.error('Failed to fetch profile:', error.response?.data);
  }
};

getProfile();
```

---

## Common Test Scenarios

### Scenario 1: Complete Registration Flow

1. Register a student
2. Copy the token from the response
3. Use the token to get the profile
4. Verify the profile data matches registration data

### Scenario 2: Login Flow

1. Login with registered credentials
2. Copy the token from the response
3. Use the token to access protected routes

### Scenario 3: Error Handling

1. Try to register with an existing email (should get 409 error)
2. Try to login with wrong password (should get 401 error)
3. Try to access profile without token (should get 401 error)
4. Try to access profile with invalid token (should get 401 error)

### Scenario 4: Validation Testing

1. Try to register with invalid email format
2. Try to register with password < 6 characters
3. Try to register with missing required fields
4. Verify you get 400 validation errors

---

## Expected Response Formats

### Success Response (201/200)

```json
{
  "success": true,
  "message": "Student registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john.student@example.com",
    "role": "STUDENT",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "country": "United States",
    "date_of_birth": "2000-01-15",
    "created_at": "2024-01-31T10:30:00.000Z"
  }
}
```

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

### Authentication Error (401)

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Conflict Error (409)

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
  "error": "Detailed error message"
}
```

---

## Quick Test Checklist

- [ ] Server is running on port 5001
- [ ] Database connection is successful
- [ ] Can register a student
- [ ] Can register an agency
- [ ] Cannot register with duplicate email
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong credentials
- [ ] Can access profile with valid token
- [ ] Cannot access profile without token
- [ ] Token is stored correctly in localStorage (browser)
- [ ] Validation errors are displayed correctly

---

## Troubleshooting

### "Failed to connect to localhost"
- Make sure the backend server is running (`npm run dev`)
- Check the port number (should be 5001)

### "Database connection failed"
- Ensure MySQL is running
- Verify credentials in `.env` file
- Check if database `visa_marketplace` exists

### "Email already registered"
- Use a different email address
- Or delete the existing user from the database

### "Invalid or expired token"
- Token might have expired (default: 7 days)
- Login again to get a new token
- Make sure you're including "Bearer " before the token

### CORS errors
- Make sure you're running the backend server
- CORS is already enabled in the backend

---

## Next Steps

After successful testing:
1. Integrate with your React frontend
2. Implement password reset functionality
3. Add email verification
4. Implement token refresh mechanism
5. Add rate limiting for production

For frontend integration examples, see [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
