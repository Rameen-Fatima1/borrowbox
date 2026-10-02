import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';
const Ctx = createContext();
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(!!localStorage.getItem('token'));
  useEffect(() => { if (localStorage.getItem('token')) api.get('/auth/me').then(r => setUser(r.data.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false)); }, []);
  const save = d => { localStorage.setItem('token', d.token); setUser(d.user); };
  const login = async b => save((await api.post('/auth/login', b)).data.data);
  const register = async b => save((await api.post('/auth/register', b)).data.data);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
