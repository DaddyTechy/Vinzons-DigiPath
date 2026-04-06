import { useState, useEffect } from 'react';
import { archivesAPI } from '../services/api';
import { HiOutlineArrowUturnLeft, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

export default function Archives() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await archivesAPI.getAll();
      setArchives(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRestore = async (archiveId) => {
    if (!confirm('Restore this document from archives?')) return;
    try {
      await archivesAPI.delete(archiveId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error restoring');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const filtered = archives.filter((a) =>
    a.document_subject?.toLowerCase().includes(search.toLowerCase()) ||
    a.tracking_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="table-wrapper">
        <div className="table-header">
          <h2>Archives</h2>
          <div className="search-bar">
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input className="form-input" placeholder="Search archives..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '220px' }} />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗄️</div>
            <h3>No archived documents</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Subject</th>
                <th>Archived By</th>
                <th>Date Archived</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.archive_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.82rem' }}>{a.tracking_number}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{a.document_subject}</td>
                  <td>{a.user_name}</td>
                  <td style={{ fontSize: '0.82rem' }}>{formatDate(a.date)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleRestore(a.archive_id)}>
                      <HiOutlineArrowUturnLeft /> Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
