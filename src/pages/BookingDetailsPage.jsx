import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { dateTime, money } from '../utils/format.js';

export default function BookingDetailsPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [conditionForm, setConditionForm] = useState({ stage: 'pre', notes: '', photoUrls: '', conditionRating: 5 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [disputeForm, setDisputeForm] = useState({ reason: '', details: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadBooking() {
    const data = await api.get(`/bookings/${bookingId}`);
    setBooking(data.booking);
  }

  useEffect(() => { loadBooking().catch((err) => setError(err.message)); }, [bookingId]);
  const canComplete = useMemo(() => booking && ['paid', 'active'].includes(booking.status), [booking]);
  const counterpartId = booking ? (booking.renterId === user?.id ? booking.listerId : booking.renterId) : null;

  async function handlePay() {
    try {
      const data = await api.post(`/payments/checkout/${bookingId}`, {});
      await loadBooking();
      setMessage(`Payment recorded via ${data.payment.provider}. Transaction ${data.payment.providerReference}.`);
      setError('');
    } catch (err) { setError(err.message); }
  }

  async function handleComplete() {
    try { await api.post(`/bookings/${bookingId}/complete`, {}); await loadBooking(); setMessage('Booking marked complete and the deposit escrow was updated.'); setError(''); } catch (err) { setError(err.message); }
  }

  async function handleConditionSubmit(event) {
    event.preventDefault();
    try {
      await api.post(`/condition-reports/${bookingId}`, { stage: conditionForm.stage, notes: conditionForm.notes, photoUrls: conditionForm.photoUrls.split(',').map((item) => item.trim()).filter(Boolean), conditionRating: Number(conditionForm.conditionRating) });
      setConditionForm({ stage: 'pre', notes: '', photoUrls: '', conditionRating: 5 });
      await loadBooking();
      setMessage('Condition report submitted.'); setError('');
    } catch (err) { setError(err.message); }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();
    try {
      await api.post('/reviews', { bookingId, rating: Number(reviewForm.rating), comment: reviewForm.comment, revieweeId: counterpartId });
      setReviewForm({ rating: 5, comment: '' });
      await loadBooking();
      setMessage('Review submitted.'); setError('');
    } catch (err) { setError(err.message); }
  }

  async function handleDisputeSubmit(event) {
    event.preventDefault();
    try {
      await api.post('/disputes', { bookingId, reason: disputeForm.reason, details: disputeForm.details });
      setDisputeForm({ reason: '', details: '' });
      await loadBooking();
      setMessage('Dispute opened.'); setError('');
    } catch (err) { setError(err.message); }
  }

  if (!booking) return <div className="container page-pad"><div className="panel">Loading booking...</div></div>;

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Booking detail workflow</span><h1>{booking.listingTitle}</h1></div>
      {message ? <div className="alert success-alert">{message}</div> : null}
      {error ? <div className="alert error-alert">{error}</div> : null}
      <div className="detail-grid two-columns-layout">
        <div className="page-stack">
          <div className="panel page-stack compact-gap">
            <h2>Booking summary</h2>
            <p><strong>Status:</strong> {booking.status}</p>
            <p><strong>Start:</strong> {dateTime(booking.startAt)}</p>
            <p><strong>End:</strong> {dateTime(booking.endAt)}</p>
            <p><strong>Pickup window:</strong> {booking.pickupWindow}</p>
            <p><strong>Drop-off window:</strong> {booking.dropoffWindow}</p>
            <p><strong>Rental subtotal:</strong> {money(booking.subtotal)}</p>
            <p><strong>Service fee:</strong> {money(booking.serviceFee)}</p>
            <p><strong>Deposit:</strong> {money(booking.depositAmount)}</p>
            <p><strong>Total charged:</strong> {money(booking.totalAmount)}</p>
            <div className="button-row">
              {booking.status === 'requested' ? <button className="solid-button" onClick={handlePay}>Pay rental + deposit</button> : null}
              {canComplete ? <button className="ghost-button" onClick={handleComplete}>Mark returned / complete</button> : null}
              <Link className="ghost-button" to={`/messages?conversationId=${booking.conversationId}`}>Open messages</Link>
            </div>
          </div>
          <form className="panel page-stack" onSubmit={handleConditionSubmit}>
            <h2>Condition report</h2>
            <div className="form-grid two-columns">
              <label>Stage<select value={conditionForm.stage} onChange={(e) => setConditionForm((prev) => ({ ...prev, stage: e.target.value }))}><option value="pre">Pre-rental</option><option value="post">Post-rental</option></select></label>
              <label>Condition rating<input type="number" min="1" max="5" value={conditionForm.conditionRating} onChange={(e) => setConditionForm((prev) => ({ ...prev, conditionRating: e.target.value }))} /></label>
              <label className="span-two">Notes<textarea value={conditionForm.notes} onChange={(e) => setConditionForm((prev) => ({ ...prev, notes: e.target.value }))} rows="3" required /></label>
              <label className="span-two">Photo URLs (comma separated)<input value={conditionForm.photoUrls} onChange={(e) => setConditionForm((prev) => ({ ...prev, photoUrls: e.target.value }))} placeholder="https://image1, https://image2" /></label>
            </div>
            <button className="solid-button">Submit report</button>
          </form>
        </div>
        <div className="page-stack">
          <div className="panel page-stack compact-gap">
            <h2>Submitted condition reports</h2>
            {!booking.conditionReports.length ? <p className="muted">No reports submitted yet.</p> : null}
            {booking.conditionReports.map((report) => <div key={report.id} className="row-card vertical-row-card"><strong>{report.stage.toUpperCase()} · rating {report.conditionRating}/5</strong><span className="muted">{dateTime(report.createdAt)}</span><p>{report.notes}</p></div>)}
          </div>
          <form className="panel page-stack" onSubmit={handleReviewSubmit}>
            <h2>Leave a review</h2>
            <div className="form-grid"><label>Rating<input type="number" min="1" max="5" value={reviewForm.rating} onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))} /></label><label>Comment<textarea value={reviewForm.comment} onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))} rows="3" required /></label></div>
            <button className="solid-button">Submit review</button>
          </form>
          <form className="panel page-stack" onSubmit={handleDisputeSubmit}>
            <h2>Open a dispute</h2>
            <div className="form-grid"><label>Reason<input value={disputeForm.reason} onChange={(e) => setDisputeForm((prev) => ({ ...prev, reason: e.target.value }))} required /></label><label>Details<textarea value={disputeForm.details} onChange={(e) => setDisputeForm((prev) => ({ ...prev, details: e.target.value }))} rows="3" required /></label></div>
            <button className="ghost-button">Submit dispute</button>
          </form>
        </div>
      </div>
    </div>
  );
}
