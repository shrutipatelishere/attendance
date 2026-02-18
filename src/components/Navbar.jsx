import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaClipboardCheck, FaUsers, FaChartBar, FaUserCircle, FaMoneyBillWave, FaSignOutAlt, FaCog, FaExclamationTriangle, FaFileAlt, FaBars, FaTimes, FaCamera, FaHistory, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const location = useLocation();
    const { userRole, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const isActive = (path) => location.pathname === path;

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Close menu on resize to desktop
    useEffect(() => {
        const handleResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    let tabs = [];

    if (userRole === 'Admin') {
        tabs = [
            { id: 'dashboard', label: 'Dashboard', path: '/', icon: FaClipboardCheck },
            { id: 'staff', label: 'Staff', path: '/staff', icon: FaUsers },
            { id: 'requests', label: 'Requests', path: '/miss-punch-requests', icon: FaExclamationTriangle },
            { id: 'leaves', label: 'Leaves', path: '/leave-requests', icon: FaCalendarAlt },
            { id: 'reports', label: 'Reports', path: '/reports', icon: FaFileAlt },
            { id: 'payroll', label: 'Payroll', path: '/payroll', icon: FaMoneyBillWave },
            { id: 'history', label: 'History', path: '/history', icon: FaChartBar },
            { id: 'settings', label: 'Settings', path: '/settings', icon: FaCog },
        ];
    } else {
        tabs = [
            { id: 'employee', label: 'My Portal', path: '/employee', icon: FaUserCircle },
        ];
    }

    return (
        <>
            <nav className="app-nav">
                <div className="nav-inner">
                    <div className="logo flex-center" style={{
                        gap: '0.75rem',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)'
                    }}>
                        <FaClipboardCheck style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
                        <span>Presenz</span>
                    </div>

                    {/* Desktop nav links */}
                    <div className="nav-links nav-desktop">
                        {tabs.map(tab => (
                            <Link
                                key={tab.id}
                                to={tab.path}
                                className={`nav-link ${isActive(tab.path) ? 'nav-link-active' : ''}`}
                            >
                                <tab.icon />
                                <span>{tab.label}</span>
                            </Link>
                        ))}
                        <button
                            onClick={() => logout()}
                            className="btn-secondary nav-logout"
                        >
                            <FaSignOutAlt /> Logout
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="nav-hamburger"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu overlay */}
            {menuOpen && (
                <div className="nav-mobile-overlay" onClick={() => setMenuOpen(false)}>
                    <div className="nav-mobile-menu" onClick={(e) => e.stopPropagation()}>
                        {tabs.map(tab => (
                            <Link
                                key={tab.id}
                                to={tab.path}
                                className={`nav-mobile-link ${isActive(tab.path) ? 'nav-link-active' : ''}`}
                            >
                                <tab.icon />
                                <span>{tab.label}</span>
                            </Link>
                        ))}
                        <button
                            onClick={() => { logout(); setMenuOpen(false); }}
                            className="nav-mobile-link nav-mobile-logout"
                        >
                            <FaSignOutAlt /> Logout
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar (mobile only) */}
            <nav className="bottom-nav">
                {userRole === 'Admin' ? (
                    <>
                        <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
                            <FaClipboardCheck />
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/staff" className={`bottom-nav-item ${isActive('/staff') ? 'active' : ''}`}>
                            <FaUsers />
                            <span>Staff</span>
                        </Link>
                        <Link to="/payroll" className={`bottom-nav-item ${isActive('/payroll') ? 'active' : ''}`}>
                            <FaMoneyBillWave />
                            <span>Payroll</span>
                        </Link>
                        <Link to="/reports" className={`bottom-nav-item ${isActive('/reports') ? 'active' : ''}`}>
                            <FaFileAlt />
                            <span>Reports</span>
                        </Link>
                        <Link to="/settings" className={`bottom-nav-item ${isActive('/settings') ? 'active' : ''}`}>
                            <FaCog />
                            <span>Settings</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link
                            to="/employee?tab=attendance"
                            className={`bottom-nav-item bottom-nav-attendance ${location.pathname === '/employee' && (!location.search || location.search.includes('attendance')) ? 'active' : ''}`}
                        >
                            <FaCamera />
                            <span>Attendance</span>
                        </Link>
                        <Link
                            to="/employee?tab=misspunch"
                            className={`bottom-nav-item ${location.search.includes('misspunch') ? 'active' : ''}`}
                        >
                            <FaExclamationTriangle />
                            <span>Miss Punch</span>
                        </Link>
                        <Link
                            to="/employee?tab=leave"
                            className={`bottom-nav-item ${location.search.includes('leave') ? 'active' : ''}`}
                        >
                            <FaCalendarAlt />
                            <span>Leave</span>
                        </Link>
                        <Link
                            to="/employee?tab=history"
                            className={`bottom-nav-item ${location.search.includes('history') ? 'active' : ''}`}
                        >
                            <FaHistory />
                            <span>History</span>
                        </Link>
                        <Link
                            to="/employee?tab=profile"
                            className={`bottom-nav-item ${location.search.includes('profile') ? 'active' : ''}`}
                        >
                            <FaUserCircle />
                            <span>Profile</span>
                        </Link>
                    </>
                )}
            </nav>
        </>
    );
};

export default Navbar;
