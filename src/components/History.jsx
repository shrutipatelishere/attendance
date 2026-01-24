import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { format, parseISO } from 'date-fns';

const History = () => {
    const { records, getStats } = useAttendance();

    // Get all dates that have records, sorted newest first
    const dates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '2rem' }}>Attendance History</h2>

            <div className="glass-panel" style={{ padding: 0 }}>
                {dates.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No records found yet.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Total</th>
                                <th style={{ padding: '1rem', color: 'var(--color-present)' }}>Present</th>
                                <th style={{ padding: '1rem', color: 'var(--color-absent)' }}>Absent</th>
                                <th style={{ padding: '1rem', color: 'var(--color-late)' }}>Late</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dates.map(dateStr => {
                                const stats = getStats(dateStr);
                                return (
                                    <tr key={dateStr} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                                            {format(new Date(dateStr), 'MMM dd, yyyy')}
                                            <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>{format(new Date(dateStr), 'EEEE')}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{stats.total}</td>
                                        <td style={{ padding: '1rem' }}>{stats.present}</td>
                                        <td style={{ padding: '1rem' }}>{stats.absent}</td>
                                        <td style={{ padding: '1rem' }}>{stats.late}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default History;
