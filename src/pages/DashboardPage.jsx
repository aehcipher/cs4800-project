import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import { dateOnly, money } from '../utils/format.js';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([api.get('/dashboard/earnings'), api.get('/listings/mine')])
      .then(([earnings, listings]) => { if (mounted) { setDashboard(earnings.dashboard); setMyListings(listings.listings || []); } })
      .catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Lister dashboard</span><h1>Earnings and listing activity</h1></div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      {!dashboard ? <div className="panel">Loading dashboard...</div> : null}
      {dashboard ? (
        <>
          <div className="stats-grid">
            <StatCard label="Total earnings" value={money(dashboard.totalEarnings)} subtext="Completed bookings credited" />
            <StatCard label="Active listings" value={String(myListings.length)} subtext="Listings you currently own" />
            <StatCard label="Upcoming bookings" value={String(dashboard.upcomingBookings.length)} subtext="Future reservations" />
            <StatCard label="Escrow held" value={money(dashboard.escrowHeld)} subtext="Deposits still held" />
          </div>
          <div className="panel page-stack">
            <div className="section-heading-row"><h2>Upcoming bookings</h2><Link className="ghost-button" to="/bookings">Open all bookings</Link></div>
            {!dashboard.upcomingBookings.length ? <p className="muted">No upcoming bookings yet.</p> : null}
            {dashboard.upcomingBookings.map((booking) => <div key={booking.id} className="row-card"><div><strong>{booking.listingTitle}</strong><p className="muted">{dateOnly(booking.startAt)} → {dateOnly(booking.endAt)}</p></div><div className="row-card-actions"><span>{money(booking.totalAmount)}</span><Link className="ghost-button" to={`/bookings/${booking.id}`}>View</Link></div></div>)}
          </div>
          <div className="panel page-stack">
            <div className="section-heading-row"><h2>My listings</h2><Link className="solid-button small-button" to="/create-listing">New listing</Link></div>
            {!myListings.length ? <p className="muted">You have not published any listings yet.</p> : null}
            {myListings.map((listing) => <div key={listing.id} className="row-card"><div><strong>{listing.title}</strong><p className="muted">{listing.category} · {listing.campus} · Deposit {money(listing.depositAmount)}</p></div><div className="row-card-actions"><span className="chip">{listing.status}</span><Link className="ghost-button" to={`/listings/${listing.id}`}>Open</Link></div></div>)}
          </div>
        </>
      ) : null}
    </div>
  );
}
