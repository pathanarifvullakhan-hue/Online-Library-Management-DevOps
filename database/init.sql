CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150) NOT NULL,
  isbn VARCHAR(30) UNIQUE,
  quantity INT NOT NULL DEFAULT 1,
  available INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  student_id INT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,
  status ENUM('ISSUED','RETURNED') NOT NULL DEFAULT 'ISSUED',
  fine DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loan_book FOREIGN KEY(book_id) REFERENCES books(id),
  CONSTRAINT fk_loan_student FOREIGN KEY(student_id) REFERENCES students(id)
);

INSERT IGNORE INTO books(title,author,isbn,quantity,available) VALUES
('Wings of Fire','A. P. J. Abdul Kalam','9788173711466',3,3),
('The Alchemist','Paulo Coelho','9780061122415',2,2),
('Introduction to Algorithms','Thomas H. Cormen','9780262046305',2,2);
