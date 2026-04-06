import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationToast from './NotificationToast';
import { useAuth } from '../context/AuthContext';
import { HiOutlineBell } from 'react-icons/hi2';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, notifications, removeNotification } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="page-header" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <h1>Vinzon's DigiPath</h1>
            <p>Document Tracking & Routing System</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="notif-bell">
              <HiOutlineBell size={22} color="var(--text-secondary)" />
              {notifications.length > 0 && (
                <span className="notif-count">{notifications.length}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {user?.fname} {user?.lname}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  {user?.office_name || user?.role}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="page-body">
          <Outlet />
        </div>
      </div>
      <NotificationToast notifications={notifications} onClose={removeNotification} />
    </div>
  );
}
