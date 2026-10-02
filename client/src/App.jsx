import { Link, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Home from './pages/Home';
import ItemDetail from './pages/ItemDetail';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ItemForm from './pages/ItemForm';

export default function App() {
  const { user, logout } = useAuth();
  const P = c => <ProtectedRoute>{c}</ProtectedRoute>;
  return (<>
    <nav className="nav"><Link to="/" className="brand">BorrowBox</Link>
      <div>{user ? <><Link to="/dashboard">Dashboard</Link><Link to="/items/new">Lend an item</Link><button className="link" onClick={logout}>Log out ({user.name})</button></>
        : <><Link to="/login">Log in</Link><Link to="/register" className="btn sm">Register</Link></>}</div></nav>
    <main className="wrap"><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/items/new" element={P(<ItemForm />)} />
      <Route path="/items/:id/edit" element={P(<ItemForm />)} />
      <Route path="/items/:id" element={<ItemDetail />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />
      <Route path="/dashboard" element={P(<Dashboard />)} />
      <Route path="*" element={<p className="msg">Page not found.</p>} />
    </Routes></main></>);
}
