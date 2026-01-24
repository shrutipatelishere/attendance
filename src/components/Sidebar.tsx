import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { USER_ROLES } from '../types/User';
import './Sidebar.css';

// SVG Icon Components
const Icons = {
  menu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  logo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18"/>
      <path d="M18 17V9"/>
      <path d="M13 17V5"/>
      <path d="M8 17v-3"/>
    </svg>
  ),
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9"/>
      <rect x="14" y="3" width="7" height="5"/>
      <rect x="14" y="12" width="7" height="9"/>
      <rect x="3" y="16" width="7" height="5"/>
    </svg>
  ),
  leads: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="15" y2="16"/>
    </svg>
  ),
  addLead: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  addUser: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  roles: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  chevronUp: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Check if user can access admin features
  const canAccessUsers = currentUser?.role === 'admin' || currentUser?.role === 'team_leader';
  const canAddUsers = currentUser?.role === 'admin';
  const canAccessRoles = currentUser?.role === 'admin' || currentUser?.role === 'team_leader';

  const getRoleColor = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo?.color || '#666';
  };

  const getRoleLabel = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo?.label || role;
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={toggleMobileSidebar}>
          {isMobileOpen ? Icons.close : Icons.menu}
        </button>
        <span className="mobile-brand">
          <span className="brand-icon">{Icons.logo}</span>
          <span>CRM App</span>
        </span>
        <div className="mobile-user-avatar" style={{ backgroundColor: getRoleColor(currentUser?.role || '') }}>
          {currentUser?.name.charAt(0) || '?'}
        </div>
      </header>

      {/* Overlay */}
      {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
        <span className="brand-icon">{Icons.logo}</span>
        <span className="brand-text">CRM App</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">Main</span>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <span className="nav-icon">{Icons.dashboard}</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          <NavLink to="/leads" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{Icons.leads}</span>
            <span className="nav-text">All Leads</span>
          </NavLink>
          <NavLink to="/add-lead" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{Icons.addLead}</span>
            <span className="nav-text">Add Lead</span>
          </NavLink>
        </div>

        {/* Team section - only for admin and TL */}
        {(canAccessUsers || canAccessRoles) && (
          <div className="nav-section">
            <span className="nav-section-title">Team</span>
            {canAccessUsers && (
              <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{Icons.users}</span>
                <span className="nav-text">All Users</span>
              </NavLink>
            )}
            {canAddUsers && (
              <NavLink to="/add-user" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{Icons.addUser}</span>
                <span className="nav-text">Add User</span>
              </NavLink>
            )}
            {canAccessRoles && (
              <NavLink to="/roles" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{Icons.roles}</span>
                <span className="nav-text">Team Hierarchy</span>
              </NavLink>
            )}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        {currentUser && (
          <>
            <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar" style={{ backgroundColor: getRoleColor(currentUser.role) }}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">{getRoleLabel(currentUser.role)}</span>
              </div>
              <span className="switch-icon">{showUserMenu ? Icons.chevronUp : Icons.chevronDown}</span>
            </div>

            {showUserMenu && (
              <div className="user-menu">
                <div className="menu-user-info">
                  <span className="menu-email">{currentUser.email}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  {Icons.logout}
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
