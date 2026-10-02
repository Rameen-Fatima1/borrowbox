const pool = require('../config/db');
const { HttpError: E } = require('../middleware/errorHandler');
const OPEN = "('REQUESTED','APPROVED','PICKED_UP')";
const clash = (c, item, s, e) => c.query(
  `SELECT 1 FROM bookings WHERE item_id=$1 AND status IN ('APPROVED','PICKED_UP') AND start_date<=$3 AND end_date>=$2`, [item, s, e]);

async function validate(c, { item_id, borrower_id, start_date, end_date }, skipLimit) {
  const s = new Date(start_date), e = new Date(end_date);
  if (isNaN(s) || isNaN(e)) throw new E(400, 'Valid start_date and end_date required');
  if (start_date < new Date().toISOString().slice(0, 10)) throw new E(400, 'start_date cannot be in the past');
  if (e < s) throw new E(400, 'end_date must be on or after start_date');
  const { rows: [it] } = await c.query('SELECT i.*, u.is_active owner_active FROM items i JOIN users u ON u.id=i.owner_id WHERE i.id=$1', [item_id]);
  if (!it) throw new E(404, 'Item not found');
  if (it.owner_id === borrower_id) throw new E(403, 'You cannot borrow your own item');            // rule 1
  if (!it.is_active || !it.owner_active) throw new E(400, 'This item is not available');            // rule 5
  if ((e - s) / 864e5 + 1 > it.max_days) throw new E(400, `Maximum ${it.max_days} days allowed`);  // rule 3
  if ((await clash(c, item_id, start_date, end_date)).rowCount) throw new E(409, 'Dates overlap an existing booking'); // rule 4
  if (!skipLimit) {                                                                                  // rule 6
    const { rows: [{ n }] } = await c.query(`SELECT COUNT(*)::int n FROM bookings WHERE borrower_id=$1 AND status IN ${OPEN}`, [borrower_id]);
    if (n >= 3) throw new E(400, 'You can have at most 3 open bookings');
  }
}

exports.create = async (uid, b) => {
  const d = { item_id: +b.item_id, borrower_id: uid, start_date: b.start_date, end_date: b.end_date };
  await validate(pool, d);
  return (await pool.query('INSERT INTO bookings(item_id,borrower_id,start_date,end_date,message) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [d.item_id, uid, d.start_date, d.end_date, b.message])).rows[0];
};

exports.update = async (id, uid, b) => {
  const { rows: [cur] } = await pool.query('SELECT * FROM bookings WHERE id=$1', [id]);
  if (!cur) throw new E(404, 'Booking not found');
  if (cur.borrower_id !== uid) throw new E(403, 'Only the borrower can edit');
  if (cur.status !== 'REQUESTED') throw new E(409, 'Only REQUESTED bookings can be edited');
  const n = { ...cur, start_date: b.start_date || cur.start_date, end_date: b.end_date || cur.end_date };
  await validate(pool, n, true);
  return (await pool.query('UPDATE bookings SET start_date=$1,end_date=$2,message=$3,updated_at=NOW() WHERE id=$4 RETURNING *',
    [n.start_date, n.end_date, b.message ?? cur.message, id])).rows[0];
};

exports.remove = async (id, user) => {
  const { rows: [b] } = await pool.query('SELECT * FROM bookings WHERE id=$1', [id]);
  if (!b) throw new E(404, 'Booking not found');
  if (b.borrower_id !== user.id && user.role !== 'admin') throw new E(403, 'Not allowed');
  if (!['REJECTED', 'CANCELLED'].includes(b.status)) throw new E(409, 'Only REJECTED or CANCELLED bookings can be deleted');
  await pool.query('DELETE FROM bookings WHERE id=$1', [id]);
};

const T = { // action: [who, allowed from, to]
  approve: ['owner', ['REQUESTED'], 'APPROVED'], reject: ['owner', ['REQUESTED'], 'REJECTED'],
  cancel: ['borrower', ['REQUESTED', 'APPROVED'], 'CANCELLED'],
  pickup: ['owner', ['APPROVED'], 'PICKED_UP'], return: ['owner', ['PICKED_UP'], 'RETURNED'] };

exports.transition = async (id, user, action, note, condition) => {
  const t = T[action]; if (!t) throw new E(400, 'action must be approve|reject|cancel|pickup|return');
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const { rows: [b] } = await c.query('SELECT b.*, i.owner_id FROM bookings b JOIN items i ON i.id=b.item_id WHERE b.id=$1 FOR UPDATE OF b, i', [id]);
    if (!b) throw new E(404, 'Booking not found');
    if (user.id !== (t[0] === 'owner' ? b.owner_id : b.borrower_id)) throw new E(403, `Only the ${t[0]} can ${action}`);
    if (!t[1].includes(b.status)) throw new E(409, `Cannot ${action} a ${b.status} booking`);
    if (action === 'approve') {
      if ((await clash(c, b.item_id, b.start_date, b.end_date)).rowCount) throw new E(409, 'Dates overlap an existing booking');
      await c.query(`UPDATE bookings SET status='REJECTED', reject_reason='Auto-rejected: dates clash with an approved booking', updated_at=NOW()
        WHERE item_id=$1 AND id<>$2 AND status='REQUESTED' AND start_date<=$4 AND end_date>=$3`, [b.item_id, id, b.start_date, b.end_date]);
    }
    if (action === 'pickup' || action === 'return')
      await c.query('INSERT INTO condition_logs(booking_id,stage,condition,note,logged_by) VALUES($1,$2,$3,$4,$5)',
        [id, action === 'pickup' ? 'handover' : 'return', condition || null, note, user.id]);
    const { rows: [u] } = await c.query('UPDATE bookings SET status=$1, reject_reason=COALESCE($2,reject_reason), updated_at=NOW() WHERE id=$3 RETURNING *',
      [t[2], action === 'reject' ? note : null, id]);
    await c.query('COMMIT');
    return u;
  } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
};
