import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
export default function Home() {
  const [sp, setSp] = useSearchParams(), [data, setData] = useState(null), [cats, setCats] = useState([]), [err, setErr] = useState('');
  const [q, setQ] = useState({ search: sp.get('search') || '', category: sp.get('category') || '', from: sp.get('from') || '', to: sp.get('to') || '' });
  useEffect(() => { api.get('/categories').then(r => setCats(r.data.data)); }, []);
  useEffect(() => { setData(null); setErr('');
    api.get('/items', { params: Object.fromEntries(sp) }).then(r => setData(r.data.data)).catch(e => setErr(errMsg(e))); }, [sp]);
  const go = (e, page) => { e?.preventDefault(); const p = { ...q, ...(page ? { page } : {}) }; setSp(Object.fromEntries(Object.entries(p).filter(([, v]) => v))); };
  const set = k => e => setQ({ ...q, [k]: e.target.value });
  return (<>
    <h1>Borrow what you need. Lend what you don't.</h1>
    <form className="filters" onSubmit={go}>
      <input placeholder="Search tools & gadgets…" value={q.search} onChange={set('search')} />
      <input type="date" value={q.from} onChange={set('from')} /><input type="date" value={q.to} onChange={set('to')} />
      <select value={q.category} onChange={set('category')}><option value="">All categories</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <button className="btn">Search</button></form>
    {err && <p className="msg err">{err}</p>}
    {!data && !err && <p className="msg">Loading items…</p>}
    {data && (data.items.length === 0 ? <p className="msg">No items found. Try other dates or a different category.</p> :
      <><p>{data.total} items found</p><div className="grid">{data.items.map(i => (
        <Link key={i.id} to={`/items/${i.id}`} className="card item">
          {i.image_url ? <img src={i.image_url} alt="" /> : <div className="ph">{i.title[0]}</div>}
          <h3>{i.title}</h3><small>{i.category} · max {i.max_days} days</small>
          <div>{i.owner_rating ? `★ ${i.owner_rating}` : 'No ratings yet'}</div></Link>))}</div>
      <div className="pager">{Array.from({ length: data.pages }, (_, n) => <button key={n} className={n + 1 === data.page ? 'btn sm' : 'btn sm ghost'} onClick={() => go(null, n + 1)}>{n + 1}</button>)}</div></>)}
  </>);
}
