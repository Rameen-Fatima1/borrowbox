const r = require('express').Router(), pool = require('../config/db'), svc = require('../services/bookingService');
const { ah, ok, HttpError } = require('../middleware/errorHandler'), { auth } = require('../middleware/auth');
const SEL = `SELECT b.*, i.title item_title, i.owner_id, u.name borrower_name, o.name owner_name,
  (b.status='PICKED_UP' AND b.end_date < CURRENT_DATE) AS overdue
  FROM bookings b JOIN items i ON i.id=b.item_id JOIN users u ON u.id=b.borrower_id JOIN users o ON o.id=i.owner_id`;

r.post('/bookings', auth, ah(async (q, s) => ok(s, await svc.create(q.user.id, q.body), 'Request sent', 201)));
r.get('/bookings/mine', auth, ah(async (q, s) => ok(s, (await pool.query(`${SEL} WHERE b.borrower_id=$1 ORDER BY b.created_at DESC`, [q.user.id])).rows)));
r.get('/bookings/incoming', auth, ah(async (q, s) => ok(s, (await pool.query(`${SEL} WHERE i.owner_id=$1 ORDER BY b.created_at DESC`, [q.user.id])).rows)));
r.get('/bookings/:id', auth, ah(async (q, s) => {
  const { rows: [b] } = await pool.query(`${SEL} WHERE b.id=$1`, [q.params.id]);
  if (!b) throw new HttpError(404, 'Booking not found');
  if (![b.borrower_id, b.owner_id].includes(q.user.id) && q.user.role !== 'admin') throw new HttpError(403, 'Not allowed');
  b.condition_logs = (await pool.query('SELECT * FROM condition_logs WHERE booking_id=$1 ORDER BY logged_at', [b.id])).rows;
  ok(s, b);
}));
r.put('/bookings/:id', auth, ah(async (q, s) => ok(s, await svc.update(+q.params.id, q.user.id, q.body), 'Booking updated')));
r.delete('/bookings/:id', auth, ah(async (q, s) => { await svc.remove(+q.params.id, q.user); ok(s, null, 'Booking removed'); }));
r.patch('/bookings/:id/status', auth, ah(async (q, s) =>
  ok(s, await svc.transition(+q.params.id, q.user, q.body.action, q.body.note, q.body.condition), `Booking ${q.body.action} done`)));
module.exports = r;
