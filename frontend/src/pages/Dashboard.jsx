import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, documentsAPI, transmissionsAPI } from '../services/api';
import {
  HiOutlineDocumentText,
  HiOutlineArrowsRightLeft,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArchiveBox,
  HiOutlineBuildingOffice,
} from 'react-icons/hi2';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentTransmissions, setRecentTransmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, transRes] = await Promise.all([
        documentsAPI.getAll(),
        transmissionsAPI.getAll(),
      ]);

      setRecentDocs(docsRes.data.slice(0, 5));
      setRecentTransmissions(transRes.data.slice(0, 5));

      // Try to load admin reports
      if (user?.role === 'admin') {
        try {
          const reportRes = await reportsAPI.summary();
          setStats(reportRes.data);
        } catch (e) {
          // Not admin, compute basic stats
          computeBasicStats(docsRes.data, transRes.data);
        }
      } else {
        computeBasicStats(docsRes.data, transRes.data);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const computeBasicStats = (docs, trans) => {
    setStats({
      total_documents: docs.length,
      status_breakdown: {
        received: docs.filter(d => d.status === 'received').length,
        in_transit: docs.filter(d => d.status === 'in_transit').length,
        delivered: docs.filter(d => d.status === 'delivered').length,
        archived: docs.filter(d => d.status === 'archived').length,
      },
      total_transmissions: trans.length,
      pending_transmissions: trans.filter(t => !t.received_by).length,
    });
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

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.fname}!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Here's what's happening with your documents today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginTop: '20px' }}>
        <div className="stat-card primary">
          <div className="stat-icon"><HiOutlineDocumentText /></div>
          <div className="stat-info">
            <h3>{stats?.total_documents || 0}</h3>
            <p>Total Documents</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon"><HiOutlineClock /></div>
          <div className="stat-info">
            <h3>{stats?.status_breakdown?.in_transit || 0}</h3>
            <p>In Transit</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"><HiOutlineCheckCircle /></div>
          <div className="stat-info">
            <h3>{stats?.status_breakdown?.delivered || 0}</h3>
            <p>Delivered</p>
          </div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon"><HiOutlineArrowsRightLeft /></div>
          <div className="stat-info">
            <h3>{stats?.pending_transmissions || 0}</h3>
            <p>Pending Transmissions</p>
          </div>
        </div>
      </div>

      {/* Office Stats (Admin only) */}
      {user?.role === 'admin' && stats?.office_stats && (
        <div className="table-wrapper" style={{ marginBottom: '24px' }}>
          <div className="table-header">
            <h2><HiOutlineBuildingOffice style={{ marginRight: '8px', verticalAlign: 'middle' }} />Office Activity</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Office</th>
                <th>Documents Sent</th>
                <th>Documents Received</th>
              </tr>
            </thead>
            <tbody>
              {stats.office_stats.map((os) => (
                <tr key={os.office_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{os.name}</td>
                  <td>{os.documents_sent}</td>
                  <td>{os.documents_received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Documents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="table-wrapper">
          <div className="table-header">
            <h2>Recent Documents</h2>
          </div>
          {recentDocs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>No documents yet</h3>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((doc) => (
                  <tr key={doc.document_id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.82rem' }}>
                      {doc.tracking_number}
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{doc.subject}</td>
                    <td><span className={`badge badge-${doc.status}`}>{doc.status.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDate(doc.date_received)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-wrapper">
          <div className="table-header">
            <h2>Recent Transmissions</h2>
          </div>
          {recentTransmissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📨</div>
              <h3>No transmissions yet</h3>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>From → To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransmissions.map((t) => (
                  <tr key={t.transmission_id}>
                    <td style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{t.document_subject}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {t.from_office_name} → {t.to_office_name}
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'received' ? 'badge-delivered' : 'badge-pending'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
