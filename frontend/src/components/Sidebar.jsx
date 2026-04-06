import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineArrowsRightLeft,
  HiOutlineArchiveBox,
  HiOutlineBuildingOffice,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineRectangleStack,
} from 'react-icons/hi2';

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = [
    { section: 'Main' },
    { to: '/dashboard', icon: <HiOutlineHome />, label: 'Dashboard', roles: ['admin', 'receptionist', 'office_user'] },
    { to: '/documents', icon: <HiOutlineDocumentText />, label: 'Documents', roles: ['admin', 'receptionist'] },
    { to: '/transmissions', icon: <HiOutlineArrowsRightLeft />, label: 'Transmissions', roles: ['admin', 'receptionist', 'office_user'] },
    { to: '/archives', icon: <HiOutlineArchiveBox />, label: 'Archives', roles: ['admin', 'receptionist', 'office_user'] },
    { section: 'Management', roles: ['admin'] },
    { to: '/offices', icon: <HiOutlineBuildingOffice />, label: 'Offices', roles: ['admin'] },
    { to: '/users', icon: <HiOutlineUsers />, label: 'Users', roles: ['admin'] },
    { to: '/document-types', icon: <HiOutlineRectangleStack />, label: 'Document Types', roles: ['admin'] },
    { to: '/reports', icon: <HiOutlineChartBar />, label: 'Reports', roles: ['admin'] },
    { section: 'Public' },
    { to: '/track', icon: <HiOutlineMagnifyingGlass />, label: 'Track Document', roles: ['admin', 'receptionist', 'office_user'] },
  ];

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">V</div>
        <div className="brand-text">
          <span className="brand-name">DigiPath</span>
          <span className="brand-sub">Vinzon's</span>
        </div>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            if (item.roles && !item.roles.includes(role)) return null;
            return (
              <div key={`section-${i}`} className="nav-section-title">
                {item.section}
              </div>
            );
          }
          if (item.roles && !item.roles.includes(role)) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="sidebar-toggle">
        <button onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
        </button>
      </div>
    </nav>
  );
}
