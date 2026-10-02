import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
export default function ItemForm() {
  const { id } = useParams(), nav = useNavigate(), [cats, setCats] = useState([]);
  const [f, setF] = useState({ title: '', description: '', category_id: '', condition: 'good', max_days: 3, pickup_area: '', image_url: '', is_active: true });
  useEffect(() => { api.get('/categories').then(r => setCats(r.data.data)); if (id) api.get(`/items/${id}`).then(r => setF(r.data.data)); }, [id]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const save = async e => { e.preventDefault();
    if (!f.title.trim() || !f.category_id || !(+f.max_days > 0)) return toast.error('Title, category and max days are required');
    try { await (id ? api.put(`/items/${id}`, f) : api.post('/items', f)); toast.success('Saved'); nav('/dashboard'); } catch (x) { toast.error(errMsg(x)); } };
  return (<form className="card form" onSubmit={save}><h2>{id ? 'Edit item' : 'Add an item'}</h2>
    <input placeholder="Title" value={f.title} onChange={set('title')} />
    <textarea placeholder="Description" value={f.description || ''} onChange={set('description')} />
    <select value={f.category_id} onChange={set('category_id')}><option value="">Category</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <select value={f.condition} onChange={set('condition')}><option>new</option><option>good</option><option>fair</option></select>
    <input type="number" min="1" placeholder="Max days" value={f.max_days} onChange={set('max_days')} />
    <input placeholder="Pickup area" value={f.pickup_area || ''} onChange={set('pickup_area')} />
    <input placeholder="Image URL" value={f.image_url || ''} onChange={set('image_url')} />
    {id && <label><input type="checkbox" checked={f.is_active} onChange={e => setF({ ...f, is_active: e.target.checked })} /> Active</label>}
    <button className="btn">Save item</button></form>);
}
