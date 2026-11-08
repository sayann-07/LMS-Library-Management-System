-- =============================================================================
-- Seed Data: library_db
-- Description: Production seed data with initial books, members, and administrator
-- Safety: Uses INSERT IGNORE to prevent duplicate rows if data exists
-- =============================================================================

USE library_db;

-- -----------------------------------------------------------------------------
-- Seed: Books
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO books (title, author, isbn, category, total_copies, available_copies)
VALUES
('Atomic Habits', 'James Clear', 'ISBN001', 'Self Help', 5, 5),
('Clean Code', 'Robert C. Martin', 'ISBN002', 'Programming', 3, 3),
('The Alchemist', 'Paulo Coelho', 'ISBN003', 'Fiction', 4, 4),
('Python Crash Course', 'Eric Matthes', 'ISBN004', 'Programming', 6, 6),
('Rich Dad Poor Dad', 'Robert Kiyosaki', 'ISBN005', 'Finance', 2, 2);

-- -----------------------------------------------------------------------------
-- Seed: Members
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO members (name, email, phone)
VALUES
('Rahul Sharma', 'rahul@example.com', '9876543210'),
('Priya Das', 'priya@example.com', '9876543211'),
('Aman Roy', 'aman@example.com', '9876543212');

-- -----------------------------------------------------------------------------
-- Seed: Admin (Credentials: admin / admin1123)
-- Password hash generated with bcrypt (10 rounds): admin1123
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO admins (username, password_hash)
VALUES
('admin', '$2b$10$bFyIlvogjLr4/9RZptDw0u1nhXY0ZKQxCc4vmjfqU9Vg1Jcx79b2C');
