export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading content" className="dashboard-shell" role="status">
      <div className="skeleton skeleton-heading" />
      <div className="metric-grid">
        <div className="skeleton skeleton-metric" />
        <div className="skeleton skeleton-metric" />
        <div className="skeleton skeleton-metric" />
        <div className="skeleton skeleton-metric" />
      </div>
      <div className="visual-grid">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
