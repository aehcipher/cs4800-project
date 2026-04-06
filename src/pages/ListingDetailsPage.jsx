import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money } from '../utils/format.js';

export default function ListingDetailsPage() {
  const { listingId } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [booking, setBooking] = useState({ startAt: '', endAt: '', pricingUnit: 'daily', pickupWindow: '', dropoffWindow: '' });
  const [createdBooking, setCreatedBooking] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get(`/listings/${listingId}`)
      .then((data) => { if (mounted) setListing(data.listing); })
      .catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, [listingId]);

  const defaultPrice = useMemo(() => listing ? (listing.pricing?.daily || listing.pricing?.hourly || listing.pricing?.weekly || 0) : 0, [listing]);

  async function handleBook(event) {
    event.preventDefault();
    setMessage(''); setError('');
    try {
      const data = await api.post('/bookings', { listingId, ...booking });
      setCreatedBooking(data.booking);
      setMessage('Booking created. Open the booking page to pay, add condition reports, and message the other user.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !listing) return <div className="container page-pad"><div className="alert error-alert">{error}</div></div>;
  if (!listing) return <div className="container page-pad"><div className="panel">Loading listing...</div></div>;

  const image = listing.images?.[0] || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';
  const isOwner = user?.id === listing.ownerId;

  return (
    <div className="container page-pad page-stack">
      <div className="detail-grid">
        <div className="panel image-panel"><img className="detail-image" src={image} alt={listing.title} /></div>
        <div className="page-stack">
          <div className="panel page-stack compact-gap">
            <div className="listing-meta-row"><span className="chip">{listing.category}</span><span className="muted">{listing.campus}</span></div>
            <h1>{listing.title}</h1>
            <p>{listing.description}</p>
            <div className="two-column-info">
              <div>
                <h4>Pricing</h4>
                <p>Hourly: {money(listing.pricing?.hourly || 0)}</p>
                <p>Daily: {money(listing.pricing?.daily || 0)}</p>
                <p>Weekly: {money(listing.pricing?.weekly || 0)}</p>
                <p>Deposit: {money(listing.depositAmount)}</p>
              </div>
              <div>
                <h4>Pickup & drop-off</h4>
                <p>{listing.pickupInstructions}</p>
                <p>{listing.dropoffInstructions}</p>
                <p className="muted">Owner: {listing.owner?.name || 'Student Lister'}</p>
              </div>
            </div>
          </div>
          {message ? <div className="alert success-alert">{message}</div> : null}
          {error ? <div className="alert error-alert">{error}</div> : null}
          {!isOwner ? (
            <form className="panel page-stack" onSubmit={handleBook}>
              <div className="section-heading-row"><div><span className="eyebrow">Booking & scheduling</span><h2>Request this item</h2></div><strong>{money(defaultPrice)} default rate</strong></div>
              <div className="form-grid two-columns">
                <label>Start date/time<input type="datetime-local" value={booking.startAt} onChange={(e) => setBooking((p) => ({ ...p, startAt: e.target.value }))} required /></label>
                <label>End date/time<input type="datetime-local" value={booking.endAt} onChange={(e) => setBooking((p) => ({ ...p, endAt: e.target.value }))} required /></label>
                <label>Pricing unit<select value={booking.pricingUnit} onChange={(e) => setBooking((p) => ({ ...p, pricingUnit: e.target.value }))}><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
                <label>Pickup window<input value={booking.pickupWindow} onChange={(e) => setBooking((p) => ({ ...p, pickupWindow: e.target.value }))} placeholder="Friday 2pm–4pm" required /></label>
                <label>Drop-off window<input value={booking.dropoffWindow} onChange={(e) => setBooking((p) => ({ ...p, dropoffWindow: e.target.value }))} placeholder="Sunday 10am–12pm" required /></label>
              </div>
              <button className="solid-button">Create booking request</button>
              {createdBooking ? <Link className="ghost-button" to={`/bookings/${createdBooking.id}`}>Open booking details</Link> : null}
            </form>
          ) : <div className="panel">You own this listing. Use the dashboard to review activity and earnings.</div>}
        </div>
      </div>
    </div>
  );
}
