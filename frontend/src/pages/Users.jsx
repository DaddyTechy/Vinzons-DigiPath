import { useState, useEffect } from 'react';
import { usersAPI, officesAPI } from '../services/api';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [form, setForm] = useState({
    fname: '', lname: '', mname: '', email: '', password: '',
    role: 'office_user', office_id: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, officesRes] = await Promise.all([usersAPI.getAll(), officesAPI.getAll()]);
      setUsers(usersRes.data);
      setOffices(officesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (editUser && !data.password) delete data.password;
      if (editUser) {
        await usersAPI.update(editUser.user_id, data);
      } else {
        await usersAPI.create(data);
      }
      setShowModal(false);
      setEditUser(null);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving user');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      await usersAPI.delete(userId);
      loadData();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const resetForm = () => {
    setForm({ fname: '', lname: '', mname: '', email: '', password: '', role: 'office_user', office_id: '' });
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      fname: u.fname, lname: u.lname, mname: u.mname || '',
      email: u.email, password: '', role: u.role, office_id: u.office_id || '',
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="table-wrapper">
        <div className="table-header">
          <h2>Users</h2>
          <button className="btn btn-primary" onClick={() => { setEditUser(null); resetForm(); setShowModal(true); }}>
            <HiOutlinePlus /> Add User
          </button>
        </div>
        {users.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">👤</div><h3>No users</h3></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Office</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.fname} {u.mname ? u.mname + '. ' : ''}{u.lname}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role.replace('_', ' ')}</span></td>
                  <td>{u.office_name || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(u)}><HiOutlinePencil /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(u.user_id)} style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
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
              <h2>{editUser ? 'Edit User' : 'Add User'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input className="form-input" value={form.fname} onChange={(e) => setForm({ ...form, fname: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input className="form-input" value={form.lname} onChange={(e) => setForm({ ...form, lname: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input className="form-input" value={form.mname} onChange={(e) => setForm({ ...form, mname: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                  <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} {...(!editUser ? { required: true, minLength: 6 } : {})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="admin">Admin</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="office_user">Office User</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Office</label>
                    <select className="form-select" value={form.office_id} onChange={(e) => setForm({ ...form, office_id: e.target.value })}>
                      <option value="">No Office</option>
                      {offices.map((o) => (
                        <option key={o.office_id} value={o.office_id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
