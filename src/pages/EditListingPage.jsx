import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = {
  title: '',
  description: '',
  category: 'Electronics',
  campus: 'CPP',
  imageUrlsText: '',
  hourly: '',
  daily: '',
  weekly: '',
  depositAmount: '',
  pickupInstructions: '',
  dropoffInstructions: '',
  availabilityStart: '',
  availabilityEnd: '',
  status: 'active'
};

function imageArrayToText(images) {
  return Array.isArray(images) ? images.join('\n') : '';
}

function imageTextToArray(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function EditListingPage() {
  const { listingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    api.get(`/listings/${listingId}`).then((data) => {
      if (!mounted) return;

      const listing = data.listing;

      if (user && listing.ownerId !== user.id && user.role !== 'admin') {
        setError('You do not have permission to edit this listing.');
        setLoading(false);
        return;
      }

      const availability = listing.availability?.[0] || {};

      setForm({
        title: listing.title || '',
        description: listing.description || '',
        category: listing.category || 'Electronics',
        campus: listing.campus || '',
        imageUrlsText: imageArrayToText(listing.images),
        hourly: listing.pricing?.hourly ? String(listing.pricing.hourly) : '',
        daily: listing.pricing?.daily ? String(listing.pricing.daily) : '',
        weekly: listing.pricing?.weekly ? String(listing.pricing.weekly) : '',
        depositAmount: listing.depositAmount != null ? String(listing.depositAmount) : '',
        pickupInstructions: listing.pickupInstructions || '',
        dropoffInstructions: listing.dropoffInstructions || '',
        availabilityStart: toDateTimeLocal(availability.start),
        availabilityEnd: toDateTimeLocal(availability.end),
        status: ['active', 'paused'].includes(listing.status) ? listing.status : 'paused'
      });

      setLoading(false);
    }).catch((err) => {
      if (mounted) {
        setError(err.message);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [listingId, user]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.patch(`/listings/${listingId}`, {
        title: form.title,
        description: form.description,
        category: form.category,
        campus: form.campus,
        images: imageTextToArray(form.imageUrlsText),
        pricing: {
          hourly: Number(form.hourly || 0),
          daily: Number(form.daily || 0),
          weekly: Number(form.weekly || 0)
        },
        depositAmount: Number(form.depositAmount || 0),
        pickupInstructions: form.pickupInstructions,
        dropoffInstructions: form.dropoffInstructions,
        availability: form.availabilityStart && form.availabilityEnd
          ? [{ start: form.availabilityStart, end: form.availabilityEnd }]
          : [],
        status: form.status
      });

      navigate(`/listings/${listingId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Remove this listing? It will no longer appear in browse results.')) return;

    setSaving(true);
    setError('');

    try {
      await api.delete(`/listings/${listingId}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="panel">Loading listing...</div>
      </div>
    );
  }

  return (
    <div className="container page-pad page-stack">
      <div>
        <span className="eyebrow">Lister workflow</span>
        <h1>Edit listing</h1>
      </div>

      {error ? <div className="alert error-alert">{error}</div> : null}

      <form className="panel page-stack" onSubmit={handleSubmit}>
        <div className="form-grid two-columns">
          <label>
            Title
            <input name="title" value={form.title} onChange={updateField} required />
          </label>

          <label>
            Category
            <select name="category" value={form.category} onChange={updateField}>
              <option>Electronics</option>
              <option>Books</option>
              <option>Tools</option>
              <option>Appliances</option>
              <option>Sports</option>
            </select>
          </label>

          <label>
            Campus
            <input name="campus" value={form.campus} onChange={updateField} required />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={updateField}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </label>

          <label className="span-two">
            Image URLs
            <textarea
              name="imageUrlsText"
              value={form.imageUrlsText}
              onChange={updateField}
              rows="4"
              placeholder="Put one image URL per line"
            />
          </label>

          <label className="span-two">
            Description
            <textarea name="description" value={form.description} onChange={updateField} rows="4" required />
          </label>

          <label>
            Hourly rate
            <input type="number" name="hourly" value={form.hourly} onChange={updateField} min="0" step="0.01" />
          </label>

          <label>
            Daily rate
            <input type="number" name="daily" value={form.daily} onChange={updateField} min="0" step="0.01" />
          </label>

          <label>
            Weekly rate
            <input type="number" name="weekly" value={form.weekly} onChange={updateField} min="0" step="0.01" />
          </label>

          <label>
            Deposit amount
            <input type="number" name="depositAmount" value={form.depositAmount} onChange={updateField} min="0" step="0.01" required />
          </label>

          <label>
            Availability start
            <input type="datetime-local" name="availabilityStart" value={form.availabilityStart} onChange={updateField} />
          </label>

          <label>
            Availability end
            <input type="datetime-local" name="availabilityEnd" value={form.availabilityEnd} onChange={updateField} />
          </label>

          <label>
            Pickup instructions
            <input name="pickupInstructions" value={form.pickupInstructions} onChange={updateField} required />
          </label>

          <label>
            Drop-off instructions
            <input name="dropoffInstructions" value={form.dropoffInstructions} onChange={updateField} required />
          </label>
        </div>

        <div className="button-row">
          <button className="solid-button" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>

          <button className="ghost-button danger-button" type="button" onClick={handleDelete} disabled={saving}>
            Remove listing
          </button>
        </div>
      </form>
    </div>
  );
}