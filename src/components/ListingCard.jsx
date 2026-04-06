import { Link } from 'react-router-dom';
import { money } from '../utils/format.js';

export default function ListingCard({ listing }) {
  const image = listing.images?.[0] || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';
  return (
    <article className="listing-card">
      <img className="listing-card-image" src={image} alt={listing.title} />
      <div className="listing-card-body">
        <div className="listing-meta-row">
          <span className="chip">{listing.category}</span>
          <span className="muted">{listing.campus}</span>
        </div>
        <h3>{listing.title}</h3>
        <p className="muted two-line-clamp">{listing.description}</p>
        <div className="listing-price-row">
          <div><strong>{money(listing.pricing?.daily || listing.pricing?.hourly || 0)}</strong><span className="muted"> / default rate</span></div>
          <span className="muted">Deposit {money(listing.depositAmount)}</span>
        </div>
        <div className="listing-actions-row">
          <span className="owner-name">By {listing.owner?.name || 'Student Lister'}</span>
          <Link className="solid-button small-button" to={`/listings/${listing.id}`}>View</Link>
        </div>
      </div>
    </article>
  );
}
