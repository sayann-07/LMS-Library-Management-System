# Database Documentation: `library_db`

This directory documents the relational schema and seed data for the **Library Management System** DBMS project running on **MySQL 8.0**.

---

## 1. Overview & Status

- **Database Engine**: MySQL 8.0
- **Database Name**: `library_db`
- **Default Port**: `3306`
- **State**: Already created and active in MySQL Workbench.
- **Existing Records**: Contains 5 sample books and 3 sample members.

> **CRITICAL NOTE**: Do not drop or recreate `library_db`. The files in this folder exist to document the schema in version control and provide idempotent seed scripts using `INSERT IGNORE`.

---

## 2. Table Specifications

### `admins`
Stores authentication credentials for library managers.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `admin_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for admin |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Login handle |
| `password_hash` | VARCHAR(255) | NOT NULL | Salted bcrypt password hash |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp of creation |

### `books`
Stores physical catalog and available inventory counts.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `book_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique book ID |
| `title` | VARCHAR(150) | NOT NULL | Book title |
| `author` | VARCHAR(100) | NOT NULL | Author name |
| `isbn` | VARCHAR(30) | UNIQUE | International Standard Book Number |
| `category` | VARCHAR(80) | NULL | Subject category / genre |
| `total_copies` | INT | NOT NULL, DEFAULT 1 | Total inventory count |
| `available_copies` | INT | NOT NULL, DEFAULT 1 | Current copies available for issue |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Catalog entry timestamp |

### `members`
Stores registered library members / patrons.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `member_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique member ID |
| `name` | VARCHAR(100) | NOT NULL | Member full name |
| `email` | VARCHAR(100) | UNIQUE | Contact email address |
| `phone` | VARCHAR(15) | NULL | Contact phone number |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### `transactions`
Tracks book issues and returns with referential integrity.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `transaction_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique transaction record |
| `book_id` | INT | NOT NULL, FK -> books(book_id) | Borrowed book reference |
| `member_id` | INT | NOT NULL, FK -> members(member_id) | Borrower member reference |
| `issue_date` | DATE | NOT NULL | Date book was issued |
| `due_date` | DATE | NOT NULL | Date by which book is expected back |
| `return_date` | DATE | NULL | Actual return date |
| `status` | ENUM | 'Issued', 'Returned' (DEFAULT 'Issued') | Status of transaction |

---

## 3. Relationships & Foreign Keys

- `transactions.book_id` references `books.book_id`
  - Action on update: `CASCADE`
  - Action on delete: `RESTRICT` (Prevents deleting a book that has transaction history)
- `transactions.member_id` references `members.member_id`
  - Action on update: `CASCADE`
  - Action on delete: `RESTRICT` (Prevents deleting a member with transaction history)

---

## 4. Verification Commands

To check the tables and record counts via MySQL CLI or MySQL Workbench:

```sql
USE library_db;

SHOW TABLES;

SELECT COUNT(*) AS total_books FROM books;
SELECT COUNT(*) AS total_members FROM members;
SELECT COUNT(*) AS total_transactions FROM transactions;
SELECT COUNT(*) AS total_admins FROM admins;
```

