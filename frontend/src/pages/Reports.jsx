import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import {
  HiOutlineDocumentText,
  HiOutlineArrowsRightLeft,
  HiOutlineUsers,
  HiOutlineBuildingOffice,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArchiveBox,
  HiOutlineInboxArrowDown,
} from 'react-icons/hi2';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await reportsAPI.summary();
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!stats) return <div className="empty-state"><h3>No data available</h3></div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>System Reports</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Overview of all document activities</p>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon"><HiOutlineDocumentText /></div>
          <div className="stat-info"><h3>{stats.total_documents}</h3><p>Total Documents</p></div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon"><HiOutlineArrowsRightLeft /></div>
          <div className="stat-info"><h3>{stats.total_transmissions}</h3><p>Total Transmissions</p></div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon"><HiOutlineUsers /></div>
          <div className="stat-info"><h3>{stats.total_users}</h3><p>Total Users</p></div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"><HiOutlineBuildingOffice /></div>
          <div className="stat-info"><h3>{stats.total_offices}</h3><p>Offices</p></div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>Document Status Breakdown</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HiOutlineInboxArrowDown style={{ color: 'var(--info)' }} />
                <span>Received</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stats.status_breakdown.received}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HiOutlineClock style={{ color: 'var(--warning)' }} />
                <span>In Transit</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stats.status_breakdown.in_transit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HiOutlineCheckCircle style={{ color: 'var(--success)' }} />
                <span>Delivered</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stats.status_breakdown.delivered}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HiOutlineArchiveBox style={{ color: 'var(--text-tertiary)' }} />
                <span>Archived</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stats.status_breakdown.archived}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>Key Metrics</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <span>Pending Transmissions</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--warning)' }}>{stats.pending_transmissions}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <span>Documents (Last 7 Days)</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-light)' }}>{stats.recent_documents_7d}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Office Stats */}
      {stats.office_stats && (
        <div className="table-wrapper">
          <div className="table-header">
            <h2>Office Activity Report</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Office</th>
                <th>Documents Sent</th>
                <th>Documents Received</th>
                <th>Total Activity</th>
              </tr>
            </thead>
            <tbody>
              {stats.office_stats.map((os) => (
                <tr key={os.office_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{os.name}</td>
                  <td>{os.documents_sent}</td>
                  <td>{os.documents_received}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{os.documents_sent + os.documents_received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
