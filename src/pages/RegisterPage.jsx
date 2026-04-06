import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', campus: 'CPP', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const result = await register(form);
      setMessage(`Account created. Verification code: ${result.verificationCode}`);
      setError('');
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="container page-pad auth-shell">
      <form className="panel auth-panel page-stack" onSubmit={handleSubmit}>
        <div><span className="eyebrow">Registration</span><h1>Create your student account</h1></div>
        {message ? <div className="alert success-alert">{message}</div> : null}
        {error ? <div className="alert error-alert">{error}</div> : null}
        <label>Full name<input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
        <label>Student email<input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required /></label>
        <label>Campus<input value={form.campus} onChange={(e) => setForm((p) => ({ ...p, campus: e.target.value }))} required /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required /></label>
        <button className="solid-button">Register</button>
        <p className="muted">Already registered? <Link to="/login">Go to login</Link>.</p>
      </form>
    </div>
  );
}
