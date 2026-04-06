import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { dateTime } from '../utils/format.js';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  async function loadNotifications() {
    const data = await api.get('/notifications');
    setNotifications(data.notifications || []);
  }

  useEffect(() => { loadNotifications().catch((err) => setError(err.message)); }, []);

  async function markRead(id) {
    try { await api.post(`/notifications/${id}/read`, {}); await loadNotifications(); } catch (err) { setError(err.message); }
  }

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Notifications</span><h1>Activity center</h1></div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      {!notifications.length ? <div className="panel">No notifications yet.</div> : null}
      {notifications.map((notification) => <div key={notification.id} className="panel row-card vertical-row-card"><div className="section-heading-row compact-heading"><strong>{notification.title}</strong>{!notification.readAt ? <button className="ghost-button" onClick={() => markRead(notification.id)}>Mark read</button> : <span className="chip">Read</span>}</div><p>{notification.message}</p><span className="muted">{dateTime(notification.createdAt)}</span></div>)}
    </div>
  );
}
