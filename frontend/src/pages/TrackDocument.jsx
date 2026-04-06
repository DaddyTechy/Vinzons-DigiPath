import { useState } from 'react';
import { documentsAPI } from '../services/api';
import { HiOutlineMagnifyingGlass, HiOutlineDocumentText } from 'react-icons/hi2';

export default function TrackDocument() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await documentsAPI.track(trackingNumber.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Document not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="tracking-page">
      <div className="tracking-header">
        <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
          <HiOutlineDocumentText size={28} color="white" />
        </div>
        <h1>Track Your Document</h1>
        <p>Enter your tracking number to see the current status</p>
      </div>

      <form onSubmit={handleTrack} className="tracking-search">
        <input
          type="text"
          className="form-input"
          placeholder="Enter tracking number (e.g. VDP-2026-A3X7)"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '...' : <><HiOutlineMagnifyingGlass /> Track</>}
        </button>
      </form>

      {error && (
        <div className="tracking-result">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
            <h3 style={{ color: 'var(--danger)', marginBottom: '4px' }}>Not Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="tracking-result">
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Tracking Number</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-light)' }}>{result.tracking_number}</div>
              </div>
              <span className={`badge badge-${result.status}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                {result.status.replace('_', ' ')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Subject</div>
                <div style={{ color: 'var(--text-primary)' }}>{result.subject}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Document Type</div>
                <div>{result.document_type || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Direction</div>
                <div>{result.document_direction}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Date Received</div>
                <div>{formatDate(result.date_received)}</div>
              </div>
              {result.sender_name && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Sender</div>
                  <div>{result.sender_name}</div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {result.transmissions && result.transmissions.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>Routing History</h3>
              <div className="timeline">
                {result.transmissions.map((t, i) => (
                  <div key={i} className={`timeline-item ${t.status}`}>
                    <div className="timeline-date">{formatDate(t.transmission_date)}</div>
                    <div className="timeline-title">{t.from_office} → {t.to_office}</div>
                    <div className="timeline-detail">
                      Via: {t.transmission_type.replace('_', ' ')} | Sent by: {t.sent_by}
                    </div>
                    <div className="timeline-detail">
                      {t.received_by ? (
                        <span style={{ color: 'var(--success)' }}>✓ Received by {t.received_by}</span>
                      ) : (
                        <span style={{ color: 'var(--warning)' }}>⏳ Awaiting receipt</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
