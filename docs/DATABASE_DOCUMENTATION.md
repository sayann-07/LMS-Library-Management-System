# Library Management System - Database Documentation

This document describes the schema design, Entity-Relationship (ER) architecture, integrity constraints, and indexing strategy for the `library_db` database in MySQL 8.0.

---

## 1. Relational Architecture & ER Diagram

```
 +--------------------+             +--------------------+
 |       ADMINS       |             |       BOOKS        |
 +--------------------+             +--------------------+
 | PK admin_id        |             | PK book_id         |
 |    username (UQ)   |             |    title           |
 |    password_hash   |             |    author          |
 |    created_at      |             |    isbn (UQ)       |
 +--------------------+             |    category        |
                                    |    total_copies    |
                                    |    available_copies|
                                    |    created_at      |
                                    +---------+----------+
                                              | 1
                                              |
                                              | N (has many)
 +--------------------+             +---------v----------+
 |      MEMBERS       |             |    TRANSACTIONS    |
 +--------------------+             +--------------------+
 | PK member_id       | 1         N | PK transaction_id  |
 |    name            +------------>| FK book_id         |
 |    email (UQ)      | (borrows)   | FK member_id       |
 |    phone           |             |    issue_date      |
 |    created_at      |             |    due_date        |
 +--------------------+             |    return_date     |
                                    |    status (ENUM)   |
                                    +--------------------+
```

---

## 2. Table Specifications

### 2.1 `admins` Table
Stores login accounts for library management staff.

```sql
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- **Candidate Key**: `username`
- **Primary Key**: `admin_id`
- **Security**: Raw passwords must never be stored. Uses bcrypt password hashes with a salt work factor of at least 10.

---

### 2.2 `books` Table
Stores library book catalog and copy inventory.

```sql
CREATE TABLE books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(30) UNIQUE,
    category VARCHAR(80),
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- **Candidate Key**: `isbn`
- **Business Invariant**: `available_copies <= total_copies` and `available_copies >= 0`.
- **Search Optimization**: Queries often filter by `title`, `author`, `category`, and `isbn`.

---

### 2.3 `members` Table
Stores student/faculty membership profiles.

```sql
CREATE TABLE members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- **Candidate Key**: `email`
- **Integrity**: `email` is strictly unique to prevent duplicate member registrations.

---

### 2.4 `transactions` Table
Maintains historical and active records of borrowed books.

```sql
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    status ENUM('Issued', 'Returned') DEFAULT 'Issued',

    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);
```

- **Primary Key**: `transaction_id`
- **Foreign Keys**:
  - `book_id` -> references `books(book_id)`
  - `member_id` -> references `members(member_id)`
- **Status Lifecycle**:
  1. Record created: `status = 'Issued'`, `return_date = NULL`, `available_copies` on book decremented by 1.
  2. Member returns book: `status = 'Returned'`, `return_date = CURRENT_DATE()`, `available_copies` on book incremented by 1.

---

## 3. Query Patterns & Parameterization

All queries executed from Express controllers MUST use parameterized prepared statements:

```javascript
// Example: Safe parameterized select
const [books] = await pool.query(
  'SELECT * FROM books WHERE category = ? ORDER BY title ASC',
  [category]
);
```

