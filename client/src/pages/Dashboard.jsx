import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import StatusBadge from '../components/StatusBadge';
const URL = { items: '/items/mine', mine: '/bookings/mine', incoming: '/bookings/incoming' };
export default function Dashboard() {
  const [tab, setTab] = useState('items'), [rows, setRows] = useState(null), [err, setErr] = useState('');
  const load = useCallback(() => { setRows(null); setErr(''); api.get(URL[tab]).then(r => setRows(r.data.data)).catch(e => setErr(errMsg(e))); }, [tab]);
  useEffect(load, [load]);
  const run = async (fn, msg) => { try { const r = await fn(); toast.success(r?.data?.message || msg); load(); } catch (e) { toast.error(errMsg(e)); } };
  const act = (b, action, ask) => { const note = ask ? prompt('Condition / note (optional)') : null; if (ask && note === null) return; run(() => api.patch(`/bookings/${b.id}/status`, { action, note })); };
  const review = b => { const rating = prompt('Rating 1-5'); if (!rating) return; run(() => api.post(`/bookings/${b.id}/reviews`, { rating, comment: prompt('Comment (optional)') || '' })); };
  const del = (fn) => confirm('Are you sure?') && run(fn);
  return (<><h1>Dashboard</h1>
    <div className="tabs">{[['items', 'My Items'], ['mine', 'My Borrowings'], ['incoming', 'Incoming Requests']].map(([k, l]) => <button key={k} className={tab === k ? 'btn sm' : 'btn sm ghost'} onClick={() => setTab(k)}>{l}</button>)}</div>
    {err && <p className="msg err">{err}</p>}{!rows && !err && <p className="msg">Loading…</p>}
    {rows && !rows.length && <p className="msg">Nothing here yet.</p>}
    {rows?.map(x => tab === 'items' ? (
      <div className="card row" key={x.id}><div><b>{x.title}</b> <small>{x.category} · {x.is_active ? 'Active' : 'Inactive'}</small></div>
        <div><Link className="btn sm ghost" to={`/items/${x.id}/edit`}>Edit</Link> <button className="btn sm danger" onClick={() => del(() => api.delete(`/items/${x.id}`))}>Delete</button></div></div>
    ) : (
      <div className="card row" key={x.id}><div><b>{x.item_title}</b> <StatusBadge status={x.status} overdue={x.overdue} /><br />
        <small>{x.start_date} → {x.end_date} · {tab === 'mine' ? `Owner: ${x.owner_name}` : `Borrower: ${x.borrower_name}`}{x.reject_reason ? ` · ${x.reject_reason}` : ''}</small></div>
        <div>
          {tab === 'incoming' && x.status === 'REQUESTED' && <><button className="btn sm" onClick={() => act(x, 'approve')}>Approve</button> <button className="btn sm danger" onClick={() => act(x, 'reject', true)}>Reject</button></>}
          {tab === 'incoming' && x.status === 'APPROVED' && <button className="btn sm" onClick={() => act(x, 'pickup', true)}>Mark picked up</button>}
          {tab === 'incoming' && x.status === 'PICKED_UP' && <button className="btn sm" onClick={() => act(x, 'return', true)}>Mark returned</button>}
          {tab === 'mine' && ['REQUESTED', 'APPROVED'].includes(x.status) && <button className="btn sm danger" onClick={() => confirm('Cancel this booking?') && act(x, 'cancel')}>Cancel</button>}
          {tab === 'mine' && ['REJECTED', 'CANCELLED'].includes(x.status) && <button className="btn sm danger" onClick={() => del(() => api.delete(`/bookings/${x.id}`))}>Delete</button>}
          {x.status === 'RETURNED' && <button className="btn sm ghost" onClick={() => review(x)}>Leave review</button>}
        </div></div>))}
  </>);
}
