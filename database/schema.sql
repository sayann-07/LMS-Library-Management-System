-- =============================================================================
-- Database Schema: library_db
-- Target Engine: MySQL 8.0+
-- Description: Production-ready relational schema with constraints and performance indexes
-- =============================================================================

CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- -----------------------------------------------------------------------------
-- Table 1: admins
-- Stores library administrator credentials for authentication
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table 2: books
-- Stores library book catalog and inventory stock
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(30) UNIQUE,
    category VARCHAR(80),
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_books_category (category),
    INDEX idx_books_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table 3: members
-- Stores registered library patrons/students
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_members_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table 4: transactions
-- Tracks issuance and return of books by library members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    status ENUM('Issued', 'Returned') DEFAULT 'Issued',

    INDEX idx_transactions_status_due (status, due_date),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
