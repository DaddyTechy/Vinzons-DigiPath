import { useState, useEffect } from 'react';
import { documentsAPI, documentTypesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineArrowUpTray,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
} from 'react-icons/hi2';
import DocumentDetail from './DocumentDetail';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({
    subject: '',
    document_direction: 'incoming',
    document_type_id: '',
    sender_name: '',
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, typesRes] = await Promise.all([
        documentsAPI.getAll(),
        documentTypesAPI.getAll(),
      ]);
      setDocuments(docsRes.data);
      setDocTypes(typesRes.data);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editDoc) {
        await documentsAPI.update(editDoc.document_id, form);
      } else {
        await documentsAPI.create(form);
      }
      setShowModal(false);
      setEditDoc(null);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving document');
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentsAPI.delete(docId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error deleting document');
    }
  };

  const handleUpload = async (docId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await documentsAPI.upload(docId, file);
          loadData();
          alert('File uploaded successfully!');
        } catch (err) {
          alert(err.response?.data?.detail || 'Upload failed');
        }
      }
    };
    input.click();
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setForm({
      subject: doc.subject,
      document_direction: doc.document_direction,
      document_type_id: doc.document_type_id,
      sender_name: doc.sender_name || '',
      remarks: doc.remarks || '',
      status: doc.status,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      subject: '',
      document_direction: 'incoming',
      document_type_id: docTypes[0]?.document_type_id || '',
      sender_name: '',
      remarks: '',
    });
  };

  const openNew = () => {
    setEditDoc(null);
    resetForm();
    setShowModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const filtered = documents.filter((d) => {
    const matchSearch =
      d.subject.toLowerCase().includes(search.toLowerCase()) ||
      d.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      (d.sender_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (viewDoc) {
    return <DocumentDetail documentId={viewDoc} onBack={() => { setViewDoc(null); loadData(); }} />;
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="table-wrapper">
        <div className="table-header">
          <h2>Documents</h2>
          <div className="table-actions">
            <div className="search-bar">
              <HiOutlineMagnifyingGlass className="search-icon" />
              <input
                className="form-input"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '220px' }}
              />
            </div>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="">All Status</option>
              <option value="received">Received</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="archived">Archived</option>
            </select>
            {(user?.role === 'admin' || user?.role === 'receptionist') && (
              <button className="btn btn-primary" onClick={openNew}>
                <HiOutlinePlus /> New Document
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No documents found</h3>
            <p>Create a new document to get started</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Status</th>
                <th>Sender</th>
                <th>Date Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.document_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.82rem' }}>
                    {doc.tracking_number}
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{doc.subject}</td>
                  <td>{doc.document_type_name || '-'}</td>
                  <td>
                    <span className={`badge ${doc.document_direction === 'incoming' ? 'badge-received' : 'badge-delivered'}`}>
                      {doc.document_direction}
                    </span>
                  </td>
                  <td><span className={`badge badge-${doc.status}`}>{doc.status.replace('_', ' ')}</span></td>
                  <td>{doc.sender_name || '-'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{formatDate(doc.date_received)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setViewDoc(doc.document_id)} title="View">
                        <HiOutlineEye />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleUpload(doc.document_id)} title="Upload Scan">
                        <HiOutlineArrowUpTray />
                      </button>
                      {(user?.role === 'admin' || user?.role === 'receptionist') && (
                        <>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(doc)} title="Edit">
                            <HiOutlinePencil />
                          </button>
                          {user?.role === 'admin' && (
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(doc.document_id)} title="Delete" style={{ color: 'var(--danger)' }}>
                              <HiOutlineTrash />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editDoc ? 'Edit Document' : 'New Document'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    className="form-input"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    placeholder="Document subject"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Direction</label>
                    <select
                      className="form-select"
                      value={form.document_direction}
                      onChange={(e) => setForm({ ...form, document_direction: e.target.value })}
                    >
                      <option value="incoming">Incoming</option>
                      <option value="outgoing">Outgoing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Document Type</label>
                    <select
                      className="form-select"
                      value={form.document_type_id}
                      onChange={(e) => setForm({ ...form, document_type_id: e.target.value })}
                      required
                    >
                      <option value="">Select type</option>
                      {docTypes.map((dt) => (
                        <option key={dt.document_type_id} value={dt.document_type_id}>{dt.category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Sender Name (External)</label>
                  <input
                    className="form-input"
                    value={form.sender_name}
                    onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                    placeholder="Name of external sender"
                  />
                </div>
                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    className="form-textarea"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                {editDoc && (
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="received">Received</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editDoc ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
