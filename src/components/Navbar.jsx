import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaClipboardCheck, FaUsers, FaChartBar, FaUserShield, FaUserCircle, FaMoneyBillWave, FaSignOutAlt, FaCog, FaExclamationTriangle, FaFileAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const location = useLocation();
    const { userRole, logout } = useAuth(); // Get Role from Context
    const isActive = (path) => location.pathname === path;

    // Defaults
    let tabs = [];

    if (userRole === 'Admin') {
        tabs = [
            { id: 'dashboard', label: 'Dashboard', path: '/', icon: FaClipboardCheck },
            { id: 'staff', label: 'Staff', path: '/staff', icon: FaUsers },
            { id: 'requests', label: 'Requests', path: '/miss-punch-requests', icon: FaExclamationTriangle },
            { id: 'reports', label: 'Reports', path: '/reports', icon: FaFileAlt },
            { id: 'payroll', label: 'Payroll', path: '/payroll', icon: FaMoneyBillWave },
            { id: 'history', label: 'History', path: '/history', icon: FaChartBar },
            { id: 'settings', label: 'Settings', path: '/settings', icon: FaCog },
        ];
    } else {
        // Staff / Default - Single route with internal tabs
        tabs = [
            { id: 'employee', label: 'My Portal', path: '/employee', icon: FaUserCircle },
        ];
    }

    return (
        <nav style={{
            backgroundColor: 'white',
            borderBottom: '1px solid var(--border-color)',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '64px'
            }}>
                <div className="logo flex-center" style={{
                    gap: '0.75rem',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)'
                }}>
                    <FaClipboardCheck style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
                    <span>Presenz</span>
                </div>

                <div className="nav-links" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {tabs.map(tab => (
                        <Link
                            key={tab.id}
                            to={tab.path}
                            style={{
                                textDecoration: 'none',
                                color: isActive(tab.path) ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive(tab.path) ? 'var(--primary-light)' : 'transparent',
                                fontWeight: isActive(tab.path) ? '600' : '500',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.5rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(tab.path)) {
                                    e.target.style.backgroundColor = 'var(--bg-hover)';
                                    e.target.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(tab.path)) {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            <tab.icon />
                            {tab.label}
                        </Link>
                    ))}

                    <button
                        onClick={() => logout()}
                        className="btn-secondary"
                        style={{
                            marginLeft: '0.5rem',
                            color: 'var(--danger)',
                            borderColor: 'var(--danger-light)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--danger-light)';
                            e.target.style.borderColor = 'var(--danger)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-card)';
                            e.target.style.borderColor = 'var(--danger-light)';
                        }}
                    >
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
