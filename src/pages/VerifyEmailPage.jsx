import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: defaultEmail, code: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    try { await verifyEmail(form); setMessage('Email verified. You can now login.'); setError(''); setTimeout(() => navigate('/login'), 1000); } catch (err) { setError(err.message); }
  }

  return (
    <div className="container page-pad auth-shell">
      <form className="panel auth-panel page-stack" onSubmit={handleSubmit}>
        <div><span className="eyebrow">Verification</span><h1>Verify your student email</h1></div>
        {message ? <div className="alert success-alert">{message}</div> : null}
        {error ? <div className="alert error-alert">{error}</div> : null}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required /></label>
        <label>Verification code<input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required /></label>
        <button className="solid-button">Verify email</button>
        <p className="muted">Once verified, <Link to="/login">login here</Link>.</p>
      </form>
    </div>
  );
}
