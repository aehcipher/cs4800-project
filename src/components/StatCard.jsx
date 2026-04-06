export default function StatCard({ label, value, subtext }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {subtext ? <span className="stat-subtext">{subtext}</span> : null}
    </div>
  );
}
