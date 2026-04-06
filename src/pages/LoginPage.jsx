import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', mfaCode: '' });
  const [needsMfa, setNeedsMfa] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const result = await login(form);
      if (result.requiresMfa) {
        setNeedsMfa(true);
        setMessage('This account requires MFA. Demo admin code: 123456.');
        setError('');
        return;
      }
      navigate(location.state?.from || '/dashboard');
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="container page-pad auth-shell">
      <form className="panel auth-panel page-stack" onSubmit={handleSubmit}>
        <div><span className="eyebrow">Login</span><h1>Access your student rental account</h1></div>
        {message ? <div className="alert success-alert">{message}</div> : null}
        {error ? <div className="alert error-alert">{error}</div> : null}
        <label>Student email<input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required /></label>
        {needsMfa ? <label>MFA code<input value={form.mfaCode} onChange={(e) => setForm((p) => ({ ...p, mfaCode: e.target.value }))} required /></label> : null}
        <button className="solid-button">Login</button>
        <p className="muted">Need an account? <Link to="/register">Register here</Link>.</p>
      </form>
    </div>
  );
}
