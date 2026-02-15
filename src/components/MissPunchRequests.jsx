import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheck, FaTimes, FaEye, FaFilter } from 'react-icons/fa';
import { format } from 'date-fns';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { fsGetMissPunchRequestsByStatus, fsUpdateMissPunchRequest } from '../firestoreService';

const MissPunchRequests = () => {
    const { markAttendance, members } = useAttendance();
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const allRequests = await fsGetMissPunchRequestsByStatus(filter);
            setRequests(allRequests);
        } catch (err) {
            console.error('Error loading requests:', err);
        }
        setLoading(false);
    };

    const handleApprove = async (request) => {
        if (!window.confirm(`Approve miss punch request for ${request.userEmail} on ${format(new Date(request.date), 'MMM dd, yyyy')}?`)) {
            return;
        }

        try {
            // Update the request status
            await fsUpdateMissPunchRequest(request.id, {
                status: 'approved',
                approvedBy: currentUser.email,
                approvedAt: new Date().toISOString()
            });

            // Apply the punch to attendance
            const attendanceData = {
                status: 'present',
                [request.punchType === 'in' ? 'punchIn' : 'punchOut']: request.punchTime
            };

            // Get the member's UID
            const member = members.find(m => m.email === request.userEmail);
            if (member) {
                await markAttendance(request.date, member.uid || member.id, attendanceData);
            }

            // Reload requests
            loadRequests();
            setSelectedRequest(null);
            alert('Miss punch request approved and attendance updated!');
        } catch (err) {
            console.error('Error approving request:', err);
            alert('Failed to approve request. Please try again.');
        }
    };

    const handleReject = async (request) => {
        const reason = prompt('Enter rejection reason (optional):');
        if (reason === null) return; // User cancelled

        try {
            await fsUpdateMissPunchRequest(request.id, {
                status: 'rejected',
                approvedBy: currentUser.email,
                approvedAt: new Date().toISOString(),
                rejectionReason: reason || 'No reason provided'
            });

            loadRequests();
            setSelectedRequest(null);
            alert('Miss punch request rejected.');
        } catch (err) {
            console.error('Error rejecting request:', err);
            alert('Failed to reject request. Please try again.');
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'approved') {
            return <span className="badge badge-success">Approved</span>;
        } else if (status === 'rejected') {
            return <span className="badge badge-danger">Rejected</span>;
        } else {
            return <span className="badge badge-warning">Pending</span>;
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.25rem, 5vw, 1.875rem)', fontWeight: '700', color: 'var(--text-primary)' }}>
                        Miss Punch Requests
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                        Review and approve/reject employee attendance correction requests
                    </p>
                </div>

                {pendingCount > 0 && (
                    <div style={{
                        backgroundColor: 'var(--warning-light)',
                        color: 'var(--warning)',
                        padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <FaExclamationTriangle /> {pendingCount} Pending Request{pendingCount !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '0.5rem',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
            }}>
                {['pending', 'approved', 'rejected', 'all'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={filter === f ? '' : 'btn-secondary'}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            textTransform: 'capitalize',
                            backgroundColor: filter === f ? 'var(--primary)' : undefined,
                            color: filter === f ? 'white' : undefined,
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        <FaFilter /> {f}
                    </button>
                ))}
            </div>

            {/* Requests Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading requests...
                    </div>
                ) : requests.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FaExclamationTriangle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p style={{ margin: 0 }}>No {filter !== 'all' ? filter : ''} requests found</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Time</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request.id}>
                                        <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                            {request.userEmail}
                                        </td>
                                        <td style={{ fontWeight: '500' }}>
                                            {format(new Date(request.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td>
                                            <span style={{
                                                textTransform: 'capitalize',
                                                color: request.punchType === 'in' ? 'var(--success)' : 'var(--danger)',
                                                fontWeight: '500'
                                            }}>
                                                Punch {request.punchType}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                            {request.punchTime}
                                        </td>
                                        <td style={{
                                            maxWidth: '200px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {request.reason}
                                        </td>
                                        <td>
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                {request.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(request)}
                                                            className="btn-success"
                                                            style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                                                            title="Approve"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request)}
                                                            className="btn-danger"
                                                            style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                                                            title="Reject"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedRequest(request)}
                                                        className="btn-secondary"
                                                        style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedRequest && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-xl)' }}>
                        <h3 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            Request Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <div>
                                <label style={{ marginBottom: '0.25rem' }}>Employee</label>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedRequest.userEmail}</div>
                            </div>
                            <div>
                                <label style={{ marginBottom: '0.25rem' }}>Date</label>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                                    {format(new Date(selectedRequest.date), 'MMMM dd, yyyy')}
                                </div>
                            </div>
                            <div>
                                <label style={{ marginBottom: '0.25rem' }}>Punch Type</label>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '500', textTransform: 'capitalize' }}>
                                    Punch {selectedRequest.punchType}
                                </div>
                            </div>
                            <div>
                                <label style={{ marginBottom: '0.25rem' }}>Time</label>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '500', fontFamily: 'monospace' }}>
                                    {selectedRequest.punchTime}
                                </div>
                            </div>
                            <div>
                                <label style={{ marginBottom: '0.25rem' }}>Reason</label>
                                <div style={{ color: 'var(--text-primary)' }}>{selectedRequest.reason}</div>
                            </div>
                            <div>
                                <label style={{ marginBottom: '0.25rem' }}>Status</label>
                                <div>{getStatusBadge(selectedRequest.status)}</div>
                            </div>
                            {selectedRequest.approvedBy && (
                                <div>
                                    <label style={{ marginBottom: '0.25rem' }}>
                                        {selectedRequest.status === 'approved' ? 'Approved By' : 'Rejected By'}
                                    </label>
                                    <div style={{ color: 'var(--text-primary)' }}>{selectedRequest.approvedBy}</div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setSelectedRequest(null)} className="btn-secondary" style={{ flex: 1 }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MissPunchRequests;
