import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ListingCard from '../components/ListingCard.jsx';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/listings?limit=3')
      .then((data) => { if (mounted) setListings(data.listings || []); })
      .catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Student-to-student rental marketplace</span>
            <h1>Borrow what you need. Earn from what you already own.</h1>
            <p>Discover campus-friendly listings, secure deposits, in-app messaging, item condition reports, and dispute handling designed around trusted student rentals.</p>
            <div className="hero-actions">
              <Link className="solid-button large-button" to="/browse">Browse Items</Link>
              <Link className="ghost-button large-button" to="/create-listing">Start Listing</Link>
            </div>
            <div className="hero-highlights">
              <span className="chip">Verified student emails</span>
              <span className="chip">Deposits + escrow flow</span>
              <span className="chip">Condition reports</span>
              <span className="chip">Admin dispute tools</span>
            </div>
          </div>
          <div className="panel hero-panel">
            <h2>How it works</h2>
            <ol className="feature-list">
              <li>Register with a student email and verify your account.</li>
              <li>Browse listings by keyword, category, price range, and campus.</li>
              <li>Book a pickup/drop-off window and pay rental + deposit.</li>
              <li>Message the other party, submit condition reports, and leave reviews.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="container page-pad">
        <div className="section-heading-row">
          <div><span className="eyebrow">Top picks</span><h2>Popular rental items</h2></div>
          <Link className="ghost-button" to="/browse">See all listings</Link>
        </div>
        {error ? <div className="alert error-alert">{error}</div> : null}
        <div className="card-grid">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      </section>
    </div>
  );
}
