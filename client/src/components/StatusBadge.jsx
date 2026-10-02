const C = { REQUESTED: '#D98E04', APPROVED: '#1E8FD5', PICKED_UP: '#5B4BC4', RETURNED: '#2E9E5B', REJECTED: '#D64545', CANCELLED: '#6B7280' };
export default function StatusBadge({ status, overdue }) {
  return <><span className="badge" style={{ background: C[status] }}>{status}</span>{overdue && <span className="badge" style={{ background: '#B42318' }}>OVERDUE</span>}</>;
}
