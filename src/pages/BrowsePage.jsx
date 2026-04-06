import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import ListingCard from '../components/ListingCard.jsx';

const initialFilters = { q: '', category: '', campus: '', minPrice: '', maxPrice: '' };

export default function BrowsePage() {
  const [filters, setFilters] = useState(initialFilters);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/listings${queryString ? `?${queryString}` : ''}`)
      .then((data) => { if (mounted) { setListings(data.listings || []); setError(''); } })
      .catch((err) => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [queryString]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Search & discovery</span><h1>Browse available items</h1></div>
      <div className="panel search-panel">
        <div className="form-grid four-columns">
          <label>Search<input name="q" value={filters.q} onChange={handleChange} placeholder="Headphones, camera, textbook..." /></label>
          <label>Category<select name="category" value={filters.category} onChange={handleChange}><option value="">All categories</option><option value="Books">Books</option><option value="Electronics">Electronics</option><option value="Tools">Tools</option><option value="Appliances">Appliances</option><option value="Sports">Sports</option></select></label>
          <label>Campus<input name="campus" value={filters.campus} onChange={handleChange} placeholder="CPP, UCLA, USC..." /></label>
          <label>Min price<input name="minPrice" type="number" value={filters.minPrice} onChange={handleChange} /></label>
          <label>Max price<input name="maxPrice" type="number" value={filters.maxPrice} onChange={handleChange} /></label>
        </div>
      </div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      {loading ? <div className="panel">Loading listings...</div> : null}
      {!loading && !listings.length ? <div className="panel">No listings matched your filters.</div> : null}
      <div className="card-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
    </div>
  );
}
