import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  ['/', 'Home'],
  ['/browse', 'Browse'],
  ['/create-listing', 'List an Item'],
  ['/dashboard', 'Dashboard'],
  ['/bookings', 'Bookings'],
  ['/messages', 'Messages'],
  ['/notifications', 'Notifications'],
  ['/disputes', 'Disputes']
];

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="container header-inner">
          <Link className="brand" to="/">Rent.it</Link>
          <nav className="nav-links">
            {navItems.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}>{label}</NavLink>
            ))}
            {user?.role === 'admin' ? <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}>Admin</NavLink> : null}
          </nav>
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <span className="user-pill">{user.name} · {user.role}</span>
                <button className="ghost-button" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="ghost-button" to="/register">Register</Link>
                <Link className="solid-button small-button" to="/login">Login</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div><h4>Trusted student rentals</h4><p>Campus-focused listings, secure deposits, messaging, reviews, and dispute handling.</p></div>
          <div><h4>Local setup</h4><p>The app ships with mock external APIs and a persistent local datastore.</p></div>
          <div><h4>Architecture</h4><p>Presentation, access, services, data, and provider layers are separated for later expansion.</p></div>
        </div>
      </footer>
    </div>
  );
}
