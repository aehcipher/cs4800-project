import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const initialForm = { title: '', description: '', category: 'Electronics', campus: 'CPP', imageUrl: '', hourly: '', daily: '', weekly: '', depositAmount: '', pickupInstructions: '', dropoffInstructions: '', availabilityStart: '', availabilityEnd: '' };

export default function CreateListingPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const data = await api.post('/listings', {
        title: form.title,
        description: form.description,
        category: form.category,
        campus: form.campus,
        images: form.imageUrl ? [form.imageUrl] : [],
        pricing: { hourly: Number(form.hourly || 0), daily: Number(form.daily || 0), weekly: Number(form.weekly || 0) },
        depositAmount: Number(form.depositAmount || 0),
        pickupInstructions: form.pickupInstructions,
        dropoffInstructions: form.dropoffInstructions,
        availability: form.availabilityStart && form.availabilityEnd ? [{ start: form.availabilityStart, end: form.availabilityEnd }] : []
      });
      navigate(`/listings/${data.listing.id}`);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Lister workflow</span><h1>Create a rental listing</h1></div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      <form className="panel page-stack" onSubmit={handleSubmit}>
        <div className="form-grid two-columns">
          <label>Title<input name="title" value={form.title} onChange={updateField} required /></label>
          <label>Category<select name="category" value={form.category} onChange={updateField}><option>Electronics</option><option>Books</option><option>Tools</option><option>Appliances</option><option>Sports</option></select></label>
          <label>Campus<input name="campus" value={form.campus} onChange={updateField} required /></label>
          <label>Preview image URL<input name="imageUrl" value={form.imageUrl} onChange={updateField} placeholder="https://..." /></label>
          <label className="span-two">Description<textarea name="description" value={form.description} onChange={updateField} rows="4" required /></label>
          <label>Hourly rate<input type="number" name="hourly" value={form.hourly} onChange={updateField} min="0" step="0.01" /></label>
          <label>Daily rate<input type="number" name="daily" value={form.daily} onChange={updateField} min="0" step="0.01" /></label>
          <label>Weekly rate<input type="number" name="weekly" value={form.weekly} onChange={updateField} min="0" step="0.01" /></label>
          <label>Deposit amount<input type="number" name="depositAmount" value={form.depositAmount} onChange={updateField} min="0" step="0.01" required /></label>
          <label>Availability start<input type="datetime-local" name="availabilityStart" value={form.availabilityStart} onChange={updateField} /></label>
          <label>Availability end<input type="datetime-local" name="availabilityEnd" value={form.availabilityEnd} onChange={updateField} /></label>
          <label>Pickup instructions<input name="pickupInstructions" value={form.pickupInstructions} onChange={updateField} required /></label>
          <label>Drop-off instructions<input name="dropoffInstructions" value={form.dropoffInstructions} onChange={updateField} required /></label>
        </div>
        <button className="solid-button" disabled={saving}>{saving ? 'Saving...' : 'Publish listing'}</button>
      </form>
    </div>
  );
}
