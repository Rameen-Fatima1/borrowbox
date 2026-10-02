const r = require('express').Router(), pool = require('../config/db');
const { ah, ok, HttpError } = require('../middleware/errorHandler'), { auth } = require('../middleware/auth');
const rating = v => { const n = Number(v); if (!Number.isInteger(n) || n < 1 || n > 5) throw new HttpError(400, 'rating must be 1 to 5'); return n; };

r.post('/bookings/:id/reviews', auth, ah(async (q, s) => {
  const { rows: [b] } = await pool.query('SELECT b.*, i.owner_id FROM bookings b JOIN items i ON i.id=b.item_id WHERE b.id=$1', [q.params.id]);
  if (!b) throw new HttpError(404, 'Booking not found');
  const me = q.user.id; if (me !== b.borrower_id && me !== b.owner_id) throw new HttpError(403, 'Not part of this booking');
  if (b.status !== 'RETURNED') throw new HttpError(409, 'You can review only after the item is RETURNED');
  const { rows: [rv] } = await pool.query('INSERT INTO reviews(booking_id,reviewer_id,reviewee_id,rating,comment) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [b.id, me, me === b.borrower_id ? b.owner_id : b.borrower_id, rating(q.body.rating), q.body.comment]);
  ok(s, rv, 'Review added', 201);
}));

const mine = async q => {
  const { rows: [rv] } = await pool.query('SELECT * FROM reviews WHERE id=$1', [q.params.id]);
  if (!rv) throw new HttpError(404, 'Review not found');
  if (rv.reviewer_id !== q.user.id && !(q.method === 'DELETE' && q.user.role === 'admin')) throw new HttpError(403, 'Not your review');
  return rv;
};
r.put('/reviews/:id', auth, ah(async (q, s) => {
  const rv = await mine(q);
  ok(s, (await pool.query('UPDATE reviews SET rating=$1, comment=$2 WHERE id=$3 RETURNING *', [rating(q.body.rating ?? rv.rating), q.body.comment ?? rv.comment, rv.id])).rows[0], 'Review updated');
}));
r.delete('/reviews/:id', auth, ah(async (q, s) => { const rv = await mine(q); await pool.query('DELETE FROM reviews WHERE id=$1', [rv.id]); ok(s, null, 'Review deleted'); }));
module.exports = r;
