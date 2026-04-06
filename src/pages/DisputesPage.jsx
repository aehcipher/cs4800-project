import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { dateTime, money } from '../utils/format.js';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/disputes').then((data) => { if (mounted) setDisputes(data.disputes || []); }).catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">Dispute resolution</span><h1>My disputes</h1></div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      {!disputes.length ? <div className="panel">No disputes have been opened.</div> : null}
      {disputes.map((dispute) => <div key={dispute.id} className="panel page-stack compact-gap"><div className="section-heading-row compact-heading"><strong>{dispute.reason}</strong><span className="chip">{dispute.status}</span></div><p>{dispute.details}</p><p className="muted">Booking: {dispute.bookingId.slice(0, 8)} · {dateTime(dispute.createdAt)}</p>{dispute.refundAmount ? <p>Refund amount: {money(dispute.refundAmount)}</p> : null}{dispute.resolutionNotes ? <p><strong>Resolution:</strong> {dispute.resolutionNotes}</p> : null}</div>)}
    </div>
  );
}
