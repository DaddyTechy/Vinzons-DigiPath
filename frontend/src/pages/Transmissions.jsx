import { useState, useEffect } from 'react';
import { transmissionsAPI, documentsAPI, officesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';

export default function Transmissions() {
  const { user } = useAuth();
  const [transmissions, setTransmissions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    document_id: '',
    from_office_id: '',
    to_office_id: '',
    transmission_type: 'hand_carry',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transRes, docsRes, officesRes] = await Promise.all([
        transmissionsAPI.getAll(),
        documentsAPI.getAll(),
        officesAPI.getAll(),
      ]);
      setTransmissions(transRes.data);
      setDocuments(docsRes.data);
      setOffices(officesRes.data);
    } catch (err) {
      console.error('Error loading transmissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await transmissionsAPI.create(form);
      setShowModal(false);
      setForm({ document_id: '', from_office_id: '', to_office_id: '', transmission_type: 'hand_carry' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating transmission');
    }
  };

  const handleReceive = async (transmissionId) => {
    try {
      await transmissionsAPI.receive(transmissionId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error receiving document');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const filtered = transmissions.filter((t) => {
    return (
      t.document_subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.from_office_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.to_office_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="table-wrapper">
        <div className="table-header">
          <h2>Transmissions</h2>
          <div className="table-actions">
            <div className="search-bar">
              <HiOutlineMagnifyingGlass className="search-icon" />
              <input
                className="form-input"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '220px' }}
              />
            </div>
            {(user?.role === 'admin' || user?.role === 'receptionist') && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <HiOutlinePlus /> New Transmission
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📨</div>
            <h3>No transmissions found</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Document</th>
                <th>From</th>
                <th>To</th>
                <th>Sent By</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.transmission_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.82rem' }}>
                    {t.tracking_number}
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{t.document_subject}</td>
                  <td>{t.from_office_name}</td>
                  <td>{t.to_office_name}</td>
                  <td>{t.sent_by_name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{t.transmission_type.replace('_', ' ')}</td>
                  <td style={{ fontSize: '0.82rem' }}>{formatDate(t.transmission_date)}</td>
                  <td>
                    <span className={`badge ${t.status === 'received' ? 'badge-delivered' : 'badge-pending'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {t.status !== 'received' && (
                      (user?.role === 'admin' || 
                       (user?.role === 'office_user' && user?.office_id === t.to_office_id) ||
                       user?.role === 'receptionist') && (
                        <button
                          className="btn btn-accent btn-sm"
                          onClick={() => handleReceive(t.transmission_id)}
                        >
                          <HiOutlineCheckCircle /> Receive
                        </button>
                      )
                    )}
                    {t.status === 'received' && t.received_by_name && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                        by {t.received_by_name}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Transmission</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Document</label>
                  <select
                    className="form-select"
                    value={form.document_id}
                    onChange={(e) => setForm({ ...form, document_id: e.target.value })}
                    required
                  >
                    <option value="">Select document</option>
                    {documents
                      .filter(d => d.status !== 'archived')
                      .map((d) => (
                        <option key={d.document_id} value={d.document_id}>
                          {d.tracking_number} - {d.subject}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>From Office</label>
                    <select
                      className="form-select"
                      value={form.from_office_id}
                      onChange={(e) => setForm({ ...form, from_office_id: e.target.value })}
                      required
                    >
                      <option value="">Select office</option>
                      {offices.map((o) => (
                        <option key={o.office_id} value={o.office_id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>To Office</label>
                    <select
                      className="form-select"
                      value={form.to_office_id}
                      onChange={(e) => setForm({ ...form, to_office_id: e.target.value })}
                      required
                    >
                      <option value="">Select office</option>
                      {offices.map((o) => (
                        <option key={o.office_id} value={o.office_id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Transmission Type</label>
                  <select
                    className="form-select"
                    value={form.transmission_type}
                    onChange={(e) => setForm({ ...form, transmission_type: e.target.value })}
                  >
                    <option value="hand_carry">Hand Carry</option>
                    <option value="courier">Courier</option>
                    <option value="email">Email</option>
                    <option value="fax">Fax</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
