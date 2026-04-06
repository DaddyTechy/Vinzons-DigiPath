import { useState, useEffect } from 'react';
import { documentTypesAPI } from '../services/api';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';

export default function DocumentTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editType, setEditType] = useState(null);
  const [category, setCategory] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await documentTypesAPI.getAll();
      setTypes(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editType) {
        await documentTypesAPI.update(editType.document_type_id, { category });
      } else {
        await documentTypesAPI.create({ category });
      }
      setShowModal(false);
      setEditType(null);
      setCategory('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document type?')) return;
    try {
      await documentTypesAPI.delete(id);
      loadData();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="table-wrapper">
        <div className="table-header">
          <h2>Document Types</h2>
          <button className="btn btn-primary" onClick={() => { setEditType(null); setCategory(''); setShowModal(true); }}>
            <HiOutlinePlus /> Add Type
          </button>
        </div>
        {types.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📂</div><h3>No document types</h3></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type ID</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.document_type_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.82rem' }}>{t.document_type_id}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.category}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditType(t); setCategory(t.category); setShowModal(true); }}><HiOutlinePencil /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(t.document_type_id)} style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
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
              <h2>{editType ? 'Edit Type' : 'Add Document Type'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category</label>
                  <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Letter, Memorandum, Resolution" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editType ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
