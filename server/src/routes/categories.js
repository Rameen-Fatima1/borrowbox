const r = require('express').Router(), pool = require('../config/db');
const { ah, ok, HttpError } = require('../middleware/errorHandler'), { auth, admin } = require('../middleware/auth');
const name = req => { const n = (req.body.name || '').trim(); if (!n) throw new HttpError(400, 'name is required'); return n; };
r.get('/categories', ah(async (q, s) => ok(s, (await pool.query('SELECT * FROM categories ORDER BY name')).rows)));
r.post('/categories', auth, admin, ah(async (q, s) => ok(s, (await pool.query('INSERT INTO categories(name) VALUES($1) RETURNING *', [name(q)])).rows[0], 'Category added', 201)));
r.put('/categories/:id', auth, admin, ah(async (q, s) => {
  const { rows: [c] } = await pool.query('UPDATE categories SET name=$1 WHERE id=$2 RETURNING *', [name(q), q.params.id]);
  if (!c) throw new HttpError(404, 'Category not found'); ok(s, c, 'Category renamed');
}));
r.delete('/categories/:id', auth, admin, ah(async (q, s) => {
  const { rows: [{ n }] } = await pool.query('SELECT COUNT(*)::int n FROM items WHERE category_id=$1', [q.params.id]);
  if (n) throw new HttpError(409, 'Category is used by items');
  await pool.query('DELETE FROM categories WHERE id=$1', [q.params.id]); ok(s, null, 'Category deleted');
}));
module.exports = r;
