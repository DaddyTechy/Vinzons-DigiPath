import { useState, useEffect } from 'react';
import { documentsAPI, archivesAPI } from '../services/api';
import { HiOutlineArrowLeft, HiOutlineArchiveBox } from 'react-icons/hi2';

export default function DocumentDetail({ documentId, onBack }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const res = await documentsAPI.get(documentId);
      setDoc(res.data);
    } catch (err) {
      console.error('Error loading document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      await archivesAPI.create({ document_id: documentId });
      alert('Document archived!');
      loadDocument();
    } catch (err) {
      alert(err.response?.data?.detail || 'Archive failed');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!doc) {
    return (
      <div className="empty-state">
        <h3>Document not found</h3>
        <button className="btn btn-ghost" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: '20px' }}>
        <HiOutlineArrowLeft /> Back to Documents
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Document Info */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Document Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Tracking Number</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-light)' }}>{doc.tracking_number}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Subject</span>
              <div style={{ color: 'var(--text-primary)' }}>{doc.subject}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Status</span>
                <div><span className={`badge badge-${doc.status}`}>{doc.status.replace('_', ' ')}</span></div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Direction</span>
                <div><span className={`badge ${doc.document_direction === 'incoming' ? 'badge-received' : 'badge-delivered'}`}>{doc.document_direction}</span></div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Document Type</span>
                <div>{doc.document_type_name || '-'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Date Received</span>
                <div>{formatDate(doc.date_received)}</div>
              </div>
            </div>
            {doc.sender_name && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Sender</span>
                <div>{doc.sender_name}</div>
              </div>
            )}
            {doc.remarks && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Remarks</span>
                <div>{doc.remarks}</div>
              </div>
            )}
            {doc.created_by_name && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Created By</span>
                <div>{doc.created_by_name}</div>
              </div>
            )}
            {doc.scanned_copy_path && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Scanned Copy</span>
                <div>
                  <a href={`http://localhost:8000/uploads/${doc.scanned_copy_path}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: '4px' }}>
                    View File
                  </a>
                </div>
              </div>
            )}
          </div>
          {doc.status !== 'archived' && (
            <button className="btn btn-ghost" onClick={handleArchive} style={{ marginTop: '16px' }}>
              <HiOutlineArchiveBox /> Archive Document
            </button>
          )}
        </div>

        {/* Transmission Timeline */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Transmission History</h3>
          {(!doc.transmissions || doc.transmissions.length === 0) ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-icon">📨</div>
              <h3>No transmissions yet</h3>
              <p>This document hasn't been routed to any office</p>
            </div>
          ) : (
            <div className="timeline">
              {doc.transmissions.map((t) => (
                <div key={t.transmission_id} className={`timeline-item ${t.status}`}>
                  <div className="timeline-date">{formatDate(t.transmission_date)}</div>
                  <div className="timeline-title">
                    {t.from_office_name} → {t.to_office_name}
                  </div>
                  <div className="timeline-detail">
                    Sent by: {t.sent_by_name} | Type: {t.transmission_type.replace('_', ' ')}
                  </div>
                  <div className="timeline-detail">
                    {t.received_by_name ? (
                      <span style={{ color: 'var(--success)' }}>✓ Received by {t.received_by_name}</span>
                    ) : (
                      <span style={{ color: 'var(--warning)' }}>⏳ Pending receipt</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
