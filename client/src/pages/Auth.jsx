import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
export default function Auth({ register }) {
  const { login, register: reg } = useAuth(), nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', area: '' });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault();
    if (register && !f.name.trim()) return toast.error('Enter your name');
    if (f.password.length < 6) return toast.error('Password needs 6+ characters');
    try { await (register ? reg(f) : login(f)); toast.success('Welcome to BorrowBox'); nav('/dashboard'); } catch (x) { toast.error(errMsg(x)); }
  };
  return (<form className="card form" onSubmit={submit}><h2>{register ? 'Create your account' : 'Log in'}</h2>
    {register && <input placeholder="Full name" value={f.name} onChange={set('name')} />}
    <input type="email" placeholder="Email" value={f.email} onChange={set('email')} />
    <input type="password" placeholder="Password" value={f.password} onChange={set('password')} />
    {register && <><input placeholder="Phone" value={f.phone} onChange={set('phone')} /><input placeholder="Area" value={f.area} onChange={set('area')} /></>}
    <button className="btn">{register ? 'Register' : 'Log in'}</button></form>);
}
