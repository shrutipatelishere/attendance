import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaCamera, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import SelfieAttendance from './SelfieAttendance';
import EmployeeHistory from './EmployeeHistory';
import MissPunch from './MissPunch';

const EmployeeDashboard = () => {
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || 'attendance');

    useEffect(() => {
        if (tabParam && ['attendance', 'misspunch', 'history'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: 'clamp(1.25rem, 5vw, 1.875rem)',
                    fontWeight: '700',
                    color: 'var(--text-primary)'
                }}>
                    Employee Portal
                </h1>
                <p style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem'
                }}>
                    Mark your attendance, submit corrections, and view your work history
                </p>
            </div>

            {/* Tabs Container */}
            <div className="tabs-container">
                {/* Tab Headers */}
                <div className="tabs-header">
                    <button
                        className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        <FaCamera />
                        <span className="tab-label">Attendance</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'misspunch' ? 'active' : ''}`}
                        onClick={() => setActiveTab('misspunch')}
                    >
                        <FaExclamationTriangle />
                        <span className="tab-label">Miss Punch</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <FaHistory />
                        <span className="tab-label">History</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'attendance' && <SelfieAttendance />}
                    {activeTab === 'misspunch' && <MissPunch />}
                    {activeTab === 'history' && (
                        <div style={{ padding: '1.5rem' }}>
                            <EmployeeHistory />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
