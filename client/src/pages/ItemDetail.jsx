import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
export default function ItemDetail() {
  const { id } = useParams(), { user } = useAuth();
  const [item, setItem] = useState(null), [booked, setBooked] = useState([]), [f, setF] = useState({ start_date: '', end_date: '', message: '' }), [err, setErr] = useState('');
  useEffect(() => { api.get(`/items/${id}`).then(r => setItem(r.data.data)).catch(e => setErr(errMsg(e)));
    api.get(`/items/${id}/availability`).then(r => setBooked(r.data.data)); }, [id]);
  if (err) return <p className="msg err">{err}</p>; if (!item) return <p className="msg">Loading…</p>;
  const days = f.start_date && f.end_date ? Math.round((new Date(f.end_date) - new Date(f.start_date)) / 864e5) + 1 : 0;
  const clash = booked.some(b => f.start_date <= b.end_date && f.end_date >= b.start_date);
  const today = new Date().toISOString().slice(0, 10);
  const problem = !days ? 'Pick your dates' : days < 1 ? 'End date must be after start date' : f.start_date < today ? 'Start date is in the past'
    : days > item.max_days ? `Maximum ${item.max_days} days` : clash ? 'Those dates are already booked' : '';
  const send = async () => { try { await api.post('/bookings', { item_id: item.id, ...f }); toast.success('Request sent'); setF({ start_date: '', end_date: '', message: '' }); } catch (e) { toast.error(errMsg(e)); } };
  return (<div className="two">
    <div>{item.image_url ? <img className="hero" src={item.image_url} alt="" /> : <div className="ph big">{item.title[0]}</div>}
      <h1>{item.title}</h1><p><span className="tag">{item.category}</span><span className="tag">Condition: {item.condition}</span><span className="tag">Max {item.max_days} days</span></p>
      <p>{item.description}</p>
      <div className="card">Owner: <b>{item.owner_name}</b> · Pickup: {item.pickup_area || item.owner_area}<br />{item.owner_rating ? `★ ${item.owner_rating} (${item.owner_reviews} reviews)` : 'No reviews yet'} · <Link to={`/profile/${item.owner_id}`}>Owner id {item.owner_id}</Link></div></div>
    <div className="card form"><h3>Request to borrow</h3>
      {booked.length > 0 && <small>Already booked: {booked.map(b => `${b.start_date} → ${b.end_date}`).join(', ')}</small>}
      {!user ? <Link className="btn" to="/login">Log in to book</Link> : user.id === item.owner_id ? <Link className="btn" to={`/items/${item.id}/edit`}>Edit item</Link> : <>
        <label>From<input type="date" min={today} value={f.start_date} onChange={e => setF({ ...f, start_date: e.target.value })} /></label>
        <label>To<input type="date" min={f.start_date || today} value={f.end_date} onChange={e => setF({ ...f, end_date: e.target.value })} /></label>
        <small className={problem ? 'err' : 'okk'}>{problem || `${days} days selected (max ${item.max_days})`}</small>
        <textarea placeholder="Message to the owner" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} />
        <button className="btn" disabled={!!problem} onClick={send}>Send request</button></>}</div></div>);
}
