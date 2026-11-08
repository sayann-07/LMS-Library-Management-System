# Library Management System - REST API Documentation

This document describes the API contract, request/response formats, authentication, and error handling for the backend REST service.

- **Base URL**: `http://localhost:5000/api`
- **Default Format**: JSON (`Content-Type: application/json`)

---

## 1. Authentication & Security

- **Scheme**: Bearer JWT in `Authorization` header (`Authorization: Bearer <token>`)
- **Protected Endpoints**: Admin-level routes require a valid JWT issued during admin login.
- **Passwords**: Salted bcrypt hashing.
- **SQL Security**: All database interactions use parameterized queries (`mysql2/promise` with placeholder `?`) to prevent SQL injection.

---

## 2. Common HTTP Status Codes

| Code | Meaning | Usage |
|---|---|---|
| `200 OK` | Success | Successful GET, PUT, or DELETE request |
| `201 Created` | Created | Successful POST creation |
| `400 Bad Request` | Client Error | Missing required fields, invalid format |
| `401 Unauthorized` | Auth Error | Missing or invalid JWT token |
| `404 Not Found` | Resource Error | Route or record does not exist |
| `409 Conflict` | Duplicate | Unique constraint violation (e.g. existing email or ISBN) |
| `500 Server Error` | Internal Error | Centralized error handler catches server exceptions |

---

## 3. Endpoints

### 3.1 System Health Check

#### `GET /api/health`
Check server and database connectivity status.

**Response `200 OK`**:
```json
{
  "status": "success",
  "message": "Library Management System API is running smoothly",
  "timestamp": "2026-11-08T11:55:00.000Z",
  "database": "connected"
}
```

---

### 3.2 Authentication (`/api/auth`)

#### `POST /api/auth/login`
Authenticate an administrator and receive a JWT.

**Request Body**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response `200 OK`**:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "admin": {
      "admin_id": 1,
      "username": "admin"
    }
  }
}
```

#### `GET /api/auth/profile` *(Protected)*
Fetch current logged-in admin profile.

**Headers**:
```http
Authorization: Bearer <token>
```

---

### 3.3 Books (`/api/books`)

#### `GET /api/books`
Retrieve all books cataloged in the library.

**Query Parameters** (optional):
- `category` (string): Filter by genre/category
- `search` (string): Search in title, author, or ISBN

**Response `200 OK`**:
```json
{
  "status": "success",
  "count": 5,
  "data": [
    {
      "book_id": 1,
      "title": "Atomic Habits",
      "author": "James Clear",
      "isbn": "ISBN001",
      "category": "Self Help",
      "total_copies": 5,
      "available_copies": 5,
      "created_at": "2026-11-08T11:45:00.000Z"
    }
  ]
}
```

#### `GET /api/books/:id`
Fetch single book details by ID.

#### `POST /api/books` *(Protected)*
Add a new book to the catalog.

---

### 3.4 Members (`/api/members`)

#### `GET /api/members`
Retrieve all registered library members.

**Response `200 OK`**:
```json
{
  "status": "success",
  "count": 3,
  "data": [
    {
      "member_id": 1,
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "phone": "9876543210",
      "created_at": "2026-11-08T11:48:00.000Z"
    }
  ]
}
```

#### `GET /api/members/:id`
Fetch single member details by ID.

#### `POST /api/members` *(Protected)*
Register a new library member.

---

### 3.5 Transactions (`/api/transactions`)

#### `GET /api/transactions`
List all borrowing transactions with member and book join details.

**Response `200 OK`**:
```json
{
  "status": "success",
  "count": 0,
  "data": []
}
```

#### `POST /api/transactions/issue` *(Protected)*
Issue a book to a member. Decrements `available_copies` in `books`.

**Request Body**:
```json
{
  "book_id": 1,
  "member_id": 2,
  "due_date": "2026-11-22"
}
```

#### `PUT /api/transactions/return/:id` *(Protected)*
Record a book return. Increments `available_copies` in `books` and updates status to `Returned`.

