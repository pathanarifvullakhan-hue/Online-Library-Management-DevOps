const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'library_user',
  password: process.env.DB_PASSWORD || 'library_pass',
  database: process.env.DB_NAME || 'library_db',
  waitForConnections: true,
  connectionLimit: 10
};
const pool = mysql.createPool(config);
const finePerDay = Number(process.env.FINE_PER_DAY || 5);

function calculateFine(dueDate, returnedDate = new Date(), rate = finePerDay) {
  const due = new Date(dueDate);
  const returned = new Date(returnedDate);
  const daysLate = Math.max(0, Math.ceil((Date.UTC(returned.getFullYear(), returned.getMonth(), returned.getDate()) -
    Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())) / 86400000));
  return { daysLate, fine: daysLate * rate };
}
app.locals.calculateFine = calculateFine;

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (e) { res.status(503).json({ status: 'error', message: 'Database unavailable' }); }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === (process.env.ADMIN_USERNAME || 'admin') &&
      password === (process.env.ADMIN_PASSWORD || 'admin123')) {
    return res.json({ success: true, message: 'Login successful', username });
  }
  res.status(401).json({ success: false, message: 'Invalid username or password' });
});

app.get('/api/books', async (req, res) => {
  try {
    const q = `%${String(req.query.q || '').trim()}%`;
    const [rows] = await pool.execute(
      'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? ORDER BY id DESC', [q, q, q]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Could not load books' }); }
});
app.post('/api/books', async (req, res) => {
  const { title, author, isbn, quantity } = req.body || {};
  if (!title || !author) return res.status(400).json({ message: 'Title and author are required' });
  try {
    const [r] = await pool.execute('INSERT INTO books(title,author,isbn,quantity,available) VALUES(?,?,?,?,?)',
      [title, author, isbn || null, Number(quantity || 1), Number(quantity || 1)]);
    res.status(201).json({ id: r.insertId, message: 'Book added' });
  } catch (e) { res.status(500).json({ message: 'Could not add book. Check whether ISBN already exists.' }); }
});
app.put('/api/books/:id', async (req, res) => {
  const { title, author, isbn, quantity } = req.body || {};
  try {
    const [r] = await pool.execute('UPDATE books SET title=?, author=?, isbn=?, quantity=? WHERE id=?',
      [title, author, isbn || null, Number(quantity), req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book details updated' });
  } catch (e) { res.status(500).json({ message: 'Could not update book' }); }
});
app.delete('/api/books/:id', async (req, res) => {
  try {
    const [r] = await pool.execute('DELETE FROM books WHERE id=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (e) { res.status(409).json({ message: 'Cannot delete a book that has loan records' }); }
});
app.post('/api/students', async (req, res) => {
  const { name, email, phone } = req.body || {};
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
  try {
    const [r] = await pool.execute('INSERT INTO students(name,email,phone) VALUES(?,?,?)', [name,email,phone || null]);
    res.status(201).json({ id: r.insertId, message: 'Student registered' });
  } catch (e) { res.status(409).json({ message: 'Email already registered or invalid student details' }); }
});
app.get('/api/students', async (_req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM students ORDER BY id DESC'); res.json(rows); }
  catch (e) { res.status(500).json({ message: 'Could not load students' }); }
});
app.post('/api/loans/issue', async (req, res) => {
  const { bookId, studentId, days = 14 } = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[book]] = await conn.execute('SELECT * FROM books WHERE id=? FOR UPDATE', [bookId]);
    if (!book || book.available < 1) { await conn.rollback(); return res.status(409).json({ message: 'Book unavailable' }); }
    const [[student]] = await conn.execute('SELECT id FROM students WHERE id=?', [studentId]);
    if (!student) { await conn.rollback(); return res.status(404).json({ message: 'Student not found' }); }
    const due = new Date(); due.setDate(due.getDate() + Math.max(1, Number(days)));
    const [r] = await conn.execute('INSERT INTO loans(book_id,student_id,issue_date,due_date,status) VALUES(?,?,CURDATE(),?,"ISSUED")',
      [bookId, studentId, due.toISOString().slice(0,10)]);
    await conn.execute('UPDATE books SET available=available-1 WHERE id=?', [bookId]);
    await conn.commit();
    res.status(201).json({ id: r.insertId, dueDate: due.toISOString().slice(0,10), message: 'Book issued' });
  } catch (e) { await conn.rollback(); res.status(500).json({ message: 'Could not issue book' }); }
  finally { conn.release(); }
});
app.post('/api/loans/:id/return', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[loan]] = await conn.execute('SELECT * FROM loans WHERE id=? FOR UPDATE', [req.params.id]);
    if (!loan) { await conn.rollback(); return res.status(404).json({ message: 'Loan not found' }); }
    if (loan.status === 'RETURNED') { await conn.rollback(); return res.status(409).json({ message: 'Book already returned' }); }
    const result = calculateFine(loan.due_date);
    await conn.execute('UPDATE loans SET status="RETURNED", return_date=CURDATE(), fine=? WHERE id=?', [result.fine, req.params.id]);
    await conn.execute('UPDATE books SET available=available+1 WHERE id=?', [loan.book_id]);
    await conn.commit();
    res.json({ message: 'Book returned', daysLate: result.daysLate, fine: result.fine });
  } catch (e) { await conn.rollback(); res.status(500).json({ message: 'Could not return book' }); }
  finally { conn.release(); }
});
app.get('/api/loans', async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT l.*, b.title AS book_title, s.name AS student_name
      FROM loans l JOIN books b ON b.id=l.book_id JOIN students s ON s.id=l.student_id ORDER BY l.id DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Could not load loan records' }); }
});

const port = Number(process.env.PORT || 3000);
if (require.main === module) app.listen(port, () => console.log(`Library app running on port ${port}`));
module.exports = { app, calculateFine };
