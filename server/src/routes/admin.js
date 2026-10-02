const r = require('express').Router(), pool = require('../config/db');
const { ah, ok, HttpError } = require('../middleware/errorHandler'), { auth, admin } = require('../middleware/auth');
r.use('/admin', auth, admin);
r.get('/admin/stats', ah(async (q, s) => {
  const c = t => pool.query(`SELECT COUNT(*)::int n FROM ${t}`);
  const by = await pool.query('SELECT status, COUNT(*)::int n FROM bookings GROUP BY status');
  ok(s, { users: (await c('users')).rows[0].n, items: (await c('items')).rows[0].n, bookings: Object.fromEntries(by.rows.map(x => [x.status, x.n])) });
}));
r.get('/admin/users', ah(async (q, s) => ok(s, (await pool.query('SELECT id,name,email,role,area,is_active,created_at FROM users ORDER BY id')).rows)));
r.patch('/admin/users/:id/status', ah(async (q, s) => {
  if (typeof q.body.is_active !== 'boolean') throw new HttpError(400, 'is_active (boolean) required');
  const { rows: [u] } = await pool.query('UPDATE users SET is_active=$1 WHERE id=$2 AND role<>\'admin\' RETURNING id,name,is_active', [q.body.is_active, q.params.id]);
  if (!u) throw new HttpError(404, 'User not found'); ok(s, u, 'User updated');
}));
module.exports = r;
