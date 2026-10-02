const r = require('express').Router(), pool = require('../config/db');
const { ah, ok, HttpError } = require('../middleware/errorHandler'), { auth } = require('../middleware/auth');
const BOOKED = "b.status IN ('APPROVED','PICKED_UP')";

r.get('/items', ah(async (req, res) => {
  const { search, category, from, to } = req.query, page = Math.max(+req.query.page || 1, 1), lim = 12, p = [], w = ['i.is_active', 'u.is_active'];
  if (search) { p.push(`%${search}%`); w.push(`(i.title ILIKE $${p.length} OR i.description ILIKE $${p.length})`); }
  if (category) { p.push(category); w.push(`i.category_id=$${p.length}`); }
  if (from && to) { p.push(from, to);
    w.push(`NOT EXISTS (SELECT 1 FROM bookings b WHERE b.item_id=i.id AND ${BOOKED} AND b.start_date<=$${p.length} AND b.end_date>=$${p.length - 1})`); }
  const base = `FROM items i JOIN users u ON u.id=i.owner_id JOIN categories c ON c.id=i.category_id WHERE ${w.join(' AND ')}`;
  const { rows: [{ n }] } = await pool.query(`SELECT COUNT(*)::int n ${base}`, p);
  const { rows } = await pool.query(`SELECT i.*, c.name category, (SELECT ROUND(AVG(rating),1) FROM reviews WHERE reviewee_id=i.owner_id) owner_rating
    ${base} ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${(page - 1) * lim}`, p);
  ok(res, { items: rows, total: n, page, pages: Math.ceil(n / lim) });
}));

r.get('/items/mine', auth, ah(async (req, res) =>
  ok(res, (await pool.query('SELECT i.*, c.name category FROM items i JOIN categories c ON c.id=i.category_id WHERE owner_id=$1 ORDER BY i.created_at DESC', [req.user.id])).rows)));

r.get('/items/:id', ah(async (req, res) => {
  const { rows: [i] } = await pool.query(`SELECT i.*, c.name category, u.name owner_name, u.area owner_area,
    (SELECT ROUND(AVG(rating),1) FROM reviews WHERE reviewee_id=i.owner_id) owner_rating,
    (SELECT COUNT(*)::int FROM reviews WHERE reviewee_id=i.owner_id) owner_reviews
    FROM items i JOIN users u ON u.id=i.owner_id JOIN categories c ON c.id=i.category_id WHERE i.id=$1`, [req.params.id]);
  if (!i) throw new HttpError(404, 'Item not found'); ok(res, i);
}));

r.get('/items/:id/availability', ah(async (req, res) =>
  ok(res, (await pool.query(`SELECT start_date, end_date FROM bookings b WHERE item_id=$1 AND ${BOOKED} ORDER BY start_date`, [req.params.id])).rows)));

const check = b => {
  if (!b.title || !b.category_id || !['new', 'good', 'fair'].includes(b.condition) || !(+b.max_days > 0))
    throw new HttpError(400, 'title, category_id, condition (new|good|fair) and max_days > 0 are required');
};

r.post('/items', auth, ah(async (req, res) => {
  const b = req.body; check(b);
  const { rows: [i] } = await pool.query(`INSERT INTO items(owner_id,category_id,title,description,condition,max_days,pickup_area,image_url)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [req.user.id, b.category_id, b.title, b.description, b.condition, b.max_days, b.pickup_area, b.image_url]);
  ok(res, i, 'Item added', 201);
}));

const own = async (req) => {
  const { rows: [i] } = await pool.query('SELECT * FROM items WHERE id=$1', [req.params.id]);
  if (!i) throw new HttpError(404, 'Item not found');
  if (i.owner_id !== req.user.id && !(req.method === 'DELETE' && req.user.role === 'admin')) throw new HttpError(403, 'Not your item');
  return i;
};

r.put('/items/:id', auth, ah(async (req, res) => {
  const cur = await own(req), b = { ...cur, ...req.body }; check(b);
  const { rows: [i] } = await pool.query(`UPDATE items SET category_id=$1,title=$2,description=$3,condition=$4,max_days=$5,pickup_area=$6,image_url=$7,is_active=$8 WHERE id=$9 RETURNING *`,
    [b.category_id, b.title, b.description, b.condition, b.max_days, b.pickup_area, b.image_url, !!b.is_active, cur.id]);
  ok(res, i, 'Item updated');
}));

r.delete('/items/:id', auth, ah(async (req, res) => {
  const it = await own(req);
  const { rows: [s] } = await pool.query(`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE status IN ('REQUESTED','APPROVED','PICKED_UP'))::int open FROM bookings WHERE item_id=$1`, [it.id]);
  if (s.open) throw new HttpError(409, 'Item has open bookings');
  if (s.total) { await pool.query('UPDATE items SET is_active=false WHERE id=$1', [it.id]); return ok(res, null, 'Item has history, so it was deactivated instead'); }
  await pool.query('DELETE FROM items WHERE id=$1', [it.id]); ok(res, null, 'Item deleted');
}));
module.exports = r;
