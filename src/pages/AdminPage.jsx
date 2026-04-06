import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { dateOnly, money } from '../utils/format.js';

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [error, setError] = useState('');

  async function loadAll() {
    const [summaryData, usersData, listingsData, disputesData] = await Promise.all([api.get('/admin/summary'), api.get('/admin/users'), api.get('/admin/listings'), api.get('/admin/disputes')]);
    setSummary(summaryData.summary); setUsers(usersData.users || []); setListings(listingsData.listings || []); setDisputes(disputesData.disputes || []);
  }

  useEffect(() => { loadAll().catch((err) => setError(err.message)); }, []);

  async function updateUserStatus(userId, status) { try { await api.patch(`/admin/users/${userId}`, { status }); await loadAll(); } catch (err) { setError(err.message); } }
  async function updateListingStatus(listingId, status) { try { await api.patch(`/admin/listings/${listingId}`, { status }); await loadAll(); } catch (err) { setError(err.message); } }
  async function resolveDispute(disputeId) { try { await api.patch(`/admin/disputes/${disputeId}`, { status: 'resolved', resolutionNotes: 'Resolved through the demo admin panel after reviewing booking records, messages, and condition reports.', refundAmount: 15 }); await loadAll(); } catch (err) { setError(err.message); } }

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Platform administration</span><h1>Admin dashboard</h1></div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      {summary ? <div className="stats-grid"><div className="stat-card"><span className="stat-label">Users</span><strong className="stat-value">{summary.userCount}</strong></div><div className="stat-card"><span className="stat-label">Listings</span><strong className="stat-value">{summary.listingCount}</strong></div><div className="stat-card"><span className="stat-label">Open disputes</span><strong className="stat-value">{summary.openDisputeCount}</strong></div><div className="stat-card"><span className="stat-label">Gross payments</span><strong className="stat-value">{money(summary.totalProcessed)}</strong></div></div> : null}
      <div className="panel page-stack"><h2>Users</h2>{users.map((user) => <div key={user.id} className="row-card"><div><strong>{user.name}</strong><p className="muted">{user.email} · {user.role} · {user.status}</p></div><div className="row-card-actions"><button className="ghost-button" onClick={() => updateUserStatus(user.id, 'active')}>Activate</button><button className="ghost-button" onClick={() => updateUserStatus(user.id, 'suspended')}>Suspend</button><button className="ghost-button danger-button" onClick={() => updateUserStatus(user.id, 'banned')}>Ban</button></div></div>)}</div>
      <div className="panel page-stack"><h2>Listings</h2>{listings.map((listing) => <div key={listing.id} className="row-card"><div><strong>{listing.title}</strong><p className="muted">{listing.category} · {listing.campus} · {dateOnly(listing.createdAt)}</p></div><div className="row-card-actions"><span className="chip">{listing.status}</span><button className="ghost-button" onClick={() => updateListingStatus(listing.id, 'active')}>Approve</button><button className="ghost-button danger-button" onClick={() => updateListingStatus(listing.id, 'blocked')}>Block</button></div></div>)}</div>
      <div className="panel page-stack"><h2>Disputes</h2>{!disputes.length ? <p className="muted">No disputes to review.</p> : null}{disputes.map((dispute) => <div key={dispute.id} className="row-card vertical-row-card"><div className="section-heading-row compact-heading"><strong>{dispute.reason}</strong><span className="chip">{dispute.status}</span></div><p>{dispute.details}</p><div className="row-card-actions start-actions"><span className="muted">Booking {dispute.bookingId.slice(0, 8)}</span>{dispute.status !== 'resolved' ? <button className="solid-button small-button" onClick={() => resolveDispute(dispute.id)}>Resolve</button> : null}</div></div>)}</div>
    </div>
  );
}
