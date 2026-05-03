import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { dateOnly, money } from '../utils/format.js';

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [error, setError] = useState('');
  const [resolutionDrafts, setResolutionDrafts] = useState({});

  async function loadAll() {
    const [summaryData, usersData, listingsData, disputesData] = await Promise.all([api.get('/admin/summary'), api.get('/admin/users'), api.get('/admin/listings'), api.get('/admin/disputes')]);
    setSummary(summaryData.summary); setUsers(usersData.users || []); setListings(listingsData.listings || []); setDisputes(disputesData.disputes || []);
  }

  useEffect(() => { loadAll().catch((err) => setError(err.message)); }, []);

  function updateDraft(disputeId, field, value) {
    setResolutionDrafts((current) => ({
      ...current,
      [disputeId]: { ...(current[disputeId] || { resolutionNotes: '', refundAmount: '' }), [field]: value }
    }));
  }

  async function updateUserStatus(userId, status) { try { await api.patch(`/admin/users/${userId}`, { status }); await loadAll(); } catch (err) { setError(err.message); } }
  async function updateListingStatus(listingId, status) { try { await api.patch(`/admin/listings/${listingId}`, { status }); await loadAll(); } catch (err) { setError(err.message); } }

  async function resolveDispute(event, disputeId) {
    event.preventDefault();
    const draft = resolutionDrafts[disputeId] || { resolutionNotes: '', refundAmount: '' };
    if (!draft.resolutionNotes.trim()) {
      setError('Resolution notes are required before resolving a dispute.');
      return;
    }
    try {
      await api.patch(`/admin/disputes/${disputeId}`, {
        status: 'resolved',
        resolutionNotes: draft.resolutionNotes.trim(),
        refundAmount: Number(draft.refundAmount || 0)
      });
      setResolutionDrafts((current) => {
        const next = { ...current };
        delete next[disputeId];
        return next;
      });
      setError('');
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Platform administration</span><h1>Admin dashboard</h1></div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      {summary ? <div className="stats-grid"><div className="stat-card"><span className="stat-label">Users</span><strong className="stat-value">{summary.userCount}</strong></div><div className="stat-card"><span className="stat-label">Listings</span><strong className="stat-value">{summary.listingCount}</strong></div><div className="stat-card"><span className="stat-label">Open disputes</span><strong className="stat-value">{summary.openDisputeCount}</strong></div><div className="stat-card"><span className="stat-label">Gross payments</span><strong className="stat-value">{money(summary.totalProcessed)}</strong></div></div> : null}
      <div className="panel page-stack"><h2>Users</h2>{users.map((user) => <div key={user.id} className="row-card"><div><strong>{user.name}</strong><p className="muted">{user.email} · {user.role} · {user.status}</p></div><div className="row-card-actions"><button className="ghost-button" onClick={() => updateUserStatus(user.id, 'active')}>Activate</button><button className="ghost-button" onClick={() => updateUserStatus(user.id, 'suspended')}>Suspend</button><button className="ghost-button danger-button" onClick={() => updateUserStatus(user.id, 'banned')}>Ban</button></div></div>)}</div>
      <div className="panel page-stack"><h2>Listings</h2>{listings.map((listing) => <div key={listing.id} className="row-card"><div><strong>{listing.title}</strong><p className="muted">{listing.category} · {listing.campus} · {dateOnly(listing.createdAt)}</p></div><div className="row-card-actions"><span className="chip">{listing.status}</span><button className="ghost-button" onClick={() => updateListingStatus(listing.id, 'active')}>Approve</button><button className="ghost-button danger-button" onClick={() => updateListingStatus(listing.id, 'blocked')}>Block</button></div></div>)}</div>
      <div className="panel page-stack">
        <h2>Disputes</h2>
        {!disputes.length ? <p className="muted">No disputes to review.</p> : null}
        {disputes.map((dispute) => {
          const draft = resolutionDrafts[dispute.id] || { resolutionNotes: '', refundAmount: '' };
          const isResolved = dispute.status === 'resolved';
          return (
            <div key={dispute.id} className="row-card vertical-row-card">
              <div className="section-heading-row compact-heading">
                <strong>{dispute.reason}</strong>
                <span className="chip">{dispute.status}</span>
              </div>
              <p>{dispute.details}</p>
              <p className="muted">Booking {dispute.bookingId.slice(0, 8)}</p>
              {isResolved ? (
                <>
                  {dispute.refundAmount ? <p><strong>Refund issued:</strong> {money(dispute.refundAmount)}</p> : null}
                  {dispute.resolutionNotes ? <p><strong>Resolution notes:</strong> {dispute.resolutionNotes}</p> : null}
                </>
              ) : (
                <form className="page-stack compact-gap" onSubmit={(event) => resolveDispute(event, dispute.id)}>
                  <div className="form-grid two-columns">
                    <label>Refund amount<input type="number" min="0" step="0.01" value={draft.refundAmount} onChange={(e) => updateDraft(dispute.id, 'refundAmount', e.target.value)} placeholder="0.00" /></label>
                    <label className="span-two">Resolution notes<textarea rows="3" value={draft.resolutionNotes} onChange={(e) => updateDraft(dispute.id, 'resolutionNotes', e.target.value)} placeholder="Summarize the decision and any follow-up actions." required /></label>
                  </div>
                  <div className="row-card-actions start-actions">
                    <button className="solid-button small-button" type="submit">Resolve dispute</button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
