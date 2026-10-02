const r = require('express').Router(), pool = require('../config/db'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { ah, ok, HttpError } = require('../middleware/errorHandler'), { auth } = require('../middleware/auth');
const sign = u => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const COLS = 'id,name,email,role,phone,area,is_active,created_at';

r.post('/auth/register', ah(async (req, res) => {
  const { name, email, password, phone, area } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6)
    throw new HttpError(400, 'Name, valid email and a password of 6+ characters are required');
  const { rows: [u] } = await pool.query(`INSERT INTO users(name,email,password_hash,phone,area) VALUES($1,$2,$3,$4,$5) RETURNING ${COLS}`,
    [name, email.toLowerCase(), await bcrypt.hash(password, 10), phone, area]);
  ok(res, { user: u, token: sign(u) }, 'Registered', 201);
}));

r.post('/auth/login', ah(async (req, res) => {
  const { rows: [u] } = await pool.query('SELECT * FROM users WHERE email=$1', [(req.body.email || '').toLowerCase()]);
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password_hash))) throw new HttpError(401, 'Invalid email or password');
  if (!u.is_active) throw new HttpError(403, 'Account is deactivated');
  delete u.password_hash; ok(res, { user: u, token: sign(u) }, 'Logged in');
}));

r.get('/auth/me', auth, ah(async (req, res) => {
  const { rows: [u] } = await pool.query(`SELECT ${COLS} FROM users WHERE id=$1`, [req.user.id]);
  if (!u) throw new HttpError(404, 'User not found'); ok(res, u);
}));

r.put('/users/me', auth, ah(async (req, res) => {
  const { name, phone, area } = req.body;
  const { rows: [u] } = await pool.query(`UPDATE users SET name=COALESCE($1,name),phone=COALESCE($2,phone),area=COALESCE($3,area) WHERE id=$4 RETURNING ${COLS}`,
    [name, phone, area, req.user.id]);
  ok(res, u, 'Profile updated');
}));

r.delete('/users/me', auth, ah(async (req, res) => {
  const { rows: [{ n }] } = await pool.query(`SELECT COUNT(*)::int n FROM bookings b JOIN items i ON i.id=b.item_id
    WHERE b.status IN ('REQUESTED','APPROVED','PICKED_UP') AND (b.borrower_id=$1 OR i.owner_id=$1)`, [req.user.id]);
  if (n) throw new HttpError(409, 'Finish or cancel your open bookings first');
  await pool.query('UPDATE users SET is_active=false WHERE id=$1', [req.user.id]);
  await pool.query('UPDATE items SET is_active=false WHERE owner_id=$1', [req.user.id]);
  ok(res, null, 'Account deleted');
}));

r.get('/users/:id', ah(async (req, res) => {
  const { rows: [u] } = await pool.query('SELECT id,name,area,created_at FROM users WHERE id=$1 AND is_active', [req.params.id]);
  if (!u) throw new HttpError(404, 'User not found');
  const { rows: [t] } = await pool.query('SELECT ROUND(AVG(rating),1) trust_score, COUNT(*)::int review_count FROM reviews WHERE reviewee_id=$1', [u.id]);
  const { rows: reviews } = await pool.query(`SELECT rv.*, p.name reviewer_name FROM reviews rv JOIN users p ON p.id=rv.reviewer_id
    WHERE rv.reviewee_id=$1 ORDER BY rv.created_at DESC`, [u.id]);
  ok(res, { ...u, ...t, reviews });
}));
module.exports = r;
