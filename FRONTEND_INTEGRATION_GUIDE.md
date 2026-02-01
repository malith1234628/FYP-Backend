# Frontend Integration Guide

This guide shows how to integrate the authentication API with your React frontend.

## Backend URLs

- **Backend Server**: `http://localhost:5001`
- **Student Registration**: `POST http://localhost:5001/auth/register/student`
- **Agency Registration**: `POST http://localhost:5001/auth/register/agency`
- **Login**: `POST http://localhost:5001/auth/login`
- **Get Profile**: `GET http://localhost:5001/auth/profile` (Protected)

---

## Table of Contents

1. [API Endpoints Reference](#api-endpoints-reference)
2. [React Service Layer](#react-service-layer)
3. [Authentication Context](#authentication-context)
4. [Component Examples](#component-examples)
5. [Token Storage](#token-storage)

---

## API Endpoints Reference

### 1. Student Registration

**Endpoint**: `POST /auth/register/student`

**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "country": "United States",
  "date_of_birth": "2000-01-15"
}
```

**Success Response** (201):
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

**Error Response** (400):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Valid email is required", "Password must be at least 6 characters long"]
}
```

**Error Response** (409):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### 2. Agency Registration

**Endpoint**: `POST /auth/register/agency`

**Request Body**:
```json
{
  "email": "agency@example.com",
  "password": "password123",
  "agency_name": "Global Visa Services",
  "phone": "+1234567890",
  "address": "123 Main St, New York, NY 10001",
  "license_number": "LIC-12345"
}
```

**Success Response** (201):
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

---

### 3. Login (Student or Agency)

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Success Response** (200):
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

**Error Response** (401):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 4. Get Profile (Protected)

**Endpoint**: `GET /auth/profile`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):
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

**Error Response** (401):
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

## React Service Layer

Create a service file to handle all API calls:

**File**: `src/services/authService.js`

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Service
const authService = {
  // Student Registration
  registerStudent: async (userData) => {
    try {
      const response = await api.post('/auth/register/student', userData);

      // Save token and user data to localStorage
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Agency Registration
  registerAgency: async (userData) => {
    try {
      const response = await api.post('/auth/register/agency', userData);

      // Save token and user data to localStorage
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);

      // Save token and user data to localStorage
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Login failed' };
    }
  },

  // Get Profile (Protected)
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch profile' };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;
```

---

## Authentication Context

Create a context to manage authentication state across your app:

**File**: `src/contexts/AuthContext.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const registerStudent = async (userData) => {
    try {
      const response = await authService.registerStudent(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const registerAgency = async (userData) => {
    try {
      const response = await authService.registerAgency(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    registerStudent,
    registerAgency,
    login,
    logout,
    isAuthenticated: authService.isAuthenticated(),
    isStudent: user?.role === 'STUDENT',
    isAgency: user?.role === 'AGENCY'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Update**: `src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

---

## Component Examples

### Student Registration Component

**File**: `src/components/StudentRegister.jsx`

```javascript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentRegister = () => {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    country: '',
    date_of_birth: ''
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = await registerStudent(formData);
      console.log('Registration successful:', response);

      // Redirect to dashboard
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Registration failed:', error);

      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors([error.message || 'Registration failed']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Student Registration</h2>

      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <ul className="list-disc list-inside text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register as Student'}
        </button>
      </form>
    </div>
  );
};

export default StudentRegister;
```

---

### Agency Registration Component

**File**: `src/components/AgencyRegister.jsx`

```javascript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AgencyRegister = () => {
  const { registerAgency } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agency_name: '',
    phone: '',
    address: '',
    license_number: ''
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = await registerAgency(formData);
      console.log('Registration successful:', response);

      // Redirect to dashboard
      navigate('/agency-dashboard');
    } catch (error) {
      console.error('Registration failed:', error);

      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors([error.message || 'Registration failed']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Agency Registration</h2>

      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <ul className="list-disc list-inside text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Agency Name</label>
          <input
            type="text"
            name="agency_name"
            value={formData.agency_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">License Number (Optional)</label>
          <input
            type="text"
            name="license_number"
            value={formData.license_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register as Agency'}
        </button>
      </form>
    </div>
  );
};

export default AgencyRegister;
```

---

### Login Component

**File**: `src/components/Login.jsx`

```javascript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      console.log('Login successful:', response);

      // Redirect based on user role
      if (response.user.role === 'STUDENT') {
        navigate('/student-dashboard');
      } else if (response.user.role === 'AGENCY') {
        navigate('/agency-dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <p>Don't have an account?</p>
        <div className="mt-2 space-x-2">
          <a href="/register/student" className="text-blue-600 hover:underline">
            Register as Student
          </a>
          <span>|</span>
          <a href="/register/agency" className="text-blue-600 hover:underline">
            Register as Agency
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

---

### Protected Route Component

**File**: `src/components/ProtectedRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

**Usage in Routes**:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import StudentRegister from './components/StudentRegister';
import AgencyRegister from './components/AgencyRegister';
import StudentDashboard from './components/StudentDashboard';
import AgencyDashboard from './components/AgencyDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register/student" element={<StudentRegister />} />
        <Route path="/register/agency" element={<AgencyRegister />} />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agency-dashboard"
          element={
            <ProtectedRoute allowedRoles={['AGENCY']}>
              <AgencyDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Token Storage

### LocalStorage (Current Implementation)

**Pros**:
- Simple to implement
- Persists across browser sessions
- Easy to access

**Cons**:
- Vulnerable to XSS attacks
- Accessible via JavaScript

**Implementation**:
```javascript
// Store token
localStorage.setItem('token', token);

// Retrieve token
const token = localStorage.getItem('token');

// Remove token
localStorage.removeItem('token');
```

### Alternative: HTTP-Only Cookies (More Secure)

For production, consider storing JWT in HTTP-only cookies instead of localStorage. This requires backend changes to set cookies and frontend changes to send credentials with requests.

---

## Making API Calls with Token

### Using Axios Interceptor (Recommended)

Already included in `authService.js`:

```javascript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

### Manual Token Inclusion

```javascript
import axios from 'axios';

const token = localStorage.getItem('token');

axios.get('http://localhost:5001/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  console.log('Profile:', response.data.user);
})
.catch(error => {
  console.error('Error:', error.response?.data);
});
```

### Using Fetch API

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
.then(data => {
  console.log('Profile:', data.user);
})
.catch(error => {
  console.error('Error:', error);
});
```

---

## Complete Flow Example

### Registration → Login → Protected Route

```javascript
// 1. User registers as a student
const registerUser = async () => {
  try {
    const response = await authService.registerStudent({
      email: 'john@example.com',
      password: 'password123',
      full_name: 'John Doe',
      phone: '+1234567890',
      country: 'United States',
      date_of_birth: '2000-01-15'
    });

    console.log('Token:', response.token);
    console.log('User:', response.user);
    // Token is automatically stored in localStorage
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// 2. User logs in
const loginUser = async () => {
  try {
    const response = await authService.login({
      email: 'john@example.com',
      password: 'password123'
    });

    console.log('Logged in as:', response.user.role);
    // Token is automatically stored in localStorage
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// 3. Access protected route
const getProfile = async () => {
  try {
    const response = await authService.getProfile();
    console.log('Profile:', response.user);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    // Token might be expired, redirect to login
  }
};

// 4. Logout
const logoutUser = () => {
  authService.logout();
  console.log('Logged out successfully');
  // Redirect to login page
};
```

---

## Error Handling

### Common Error Responses

```javascript
// Validation Error (400)
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Valid email is required", "Password must be at least 6 characters long"]
}

// Unauthorized (401)
{
  "success": false,
  "message": "Invalid or expired token."
}

// Conflict (409)
{
  "success": false,
  "message": "Email already registered"
}

// Server Error (500)
{
  "success": false,
  "message": "Registration failed",
  "error": "Database connection error"
}
```

### Handling Errors in React

```javascript
try {
  const response = await authService.login(credentials);
  // Success
} catch (error) {
  if (error.errors) {
    // Validation errors (array)
    error.errors.forEach(err => console.error(err));
  } else if (error.message) {
    // Single error message
    console.error(error.message);
  } else {
    // Unknown error
    console.error('An unexpected error occurred');
  }
}
```

---

## Testing the API

### Using cURL

**Student Registration**:
```bash
curl -X POST http://localhost:5001/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "country": "United States",
    "date_of_birth": "2000-01-15"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

**Get Profile**:
```bash
curl -X GET http://localhost:5001/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Next Steps

1. Install `react-router-dom` if not already installed:
   ```bash
   npm install react-router-dom
   ```

2. Create the service layer (`authService.js`)
3. Set up the Auth Context (`AuthContext.jsx`)
4. Create your registration and login components
5. Set up protected routes
6. Test the complete flow

---

## Important Security Notes

1. **NEVER** commit `.env` files to version control
2. Change `JWT_SECRET` in production to a strong, random value
3. Use HTTPS in production
4. Consider implementing:
   - Token refresh mechanism
   - Password reset functionality
   - Email verification
   - Rate limiting on auth endpoints
   - Account lockout after failed attempts

---

## Troubleshooting

### CORS Issues
If you get CORS errors, make sure the backend has CORS enabled (already configured in `server.js`).

### Token Not Sent
Ensure the Authorization header is properly formatted: `Bearer <token>` (note the space).

### 401 Unauthorized
- Token might be expired (default: 7 days)
- Token might be invalid
- Token might not be sent in the request

### Database Connection Issues
Check your `.env` file and ensure MySQL is running.

---

For more help, check the backend logs or contact the development team.
