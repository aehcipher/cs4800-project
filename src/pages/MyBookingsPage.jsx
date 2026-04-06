import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { dateOnly, money } from '../utils/format.js';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/bookings').then((data) => { if (mounted) setBookings(data.bookings || []); }).catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Booking & schedule flow</span><h1>My bookings</h1></div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      {!bookings.length ? <div className="panel">No bookings yet. Start from the browse page.</div> : null}
      {bookings.map((booking) => <div key={booking.id} className="panel row-card"><div><strong>{booking.listingTitle}</strong><p className="muted">{dateOnly(booking.startAt)} → {dateOnly(booking.endAt)}</p><p className="muted">Status: {booking.status}</p></div><div className="row-card-actions"><span>{money(booking.totalAmount)}</span><Link className="solid-button small-button" to={`/bookings/${booking.id}`}>Details</Link></div></div>)}
    </div>
  );
}
