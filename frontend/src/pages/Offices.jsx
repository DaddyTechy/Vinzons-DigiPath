import { useState, useEffect } from 'react';
import { officesAPI } from '../services/api';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';

export default function Offices() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOffice, setEditOffice] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await officesAPI.getAll();
      setOffices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editOffice) {
        await officesAPI.update(editOffice.office_id, { name });
      } else {
        await officesAPI.create({ name });
      }
      setShowModal(false);
      setEditOffice(null);
      setName('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving office');
    }
  };

  const handleDelete = async (officeId) => {
    if (!confirm('Delete this office?')) return;
    try {
      await officesAPI.delete(officeId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error deleting office');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="table-wrapper">
        <div className="table-header">
          <h2>Offices</h2>
          <button className="btn btn-primary" onClick={() => { setEditOffice(null); setName(''); setShowModal(true); }}>
            <HiOutlinePlus /> Add Office
          </button>
        </div>
        {offices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No offices yet</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Office ID</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offices.map((o) => (
                <tr key={o.office_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.82rem' }}>{o.office_id}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{o.name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditOffice(o); setName(o.name); setShowModal(true); }}><HiOutlinePencil /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(o.office_id)} style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editOffice ? 'Edit Office' : 'Add Office'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Office Name</label>
                  <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter office name" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editOffice ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
