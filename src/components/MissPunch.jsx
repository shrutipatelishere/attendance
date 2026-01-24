import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaPaperPlane } from 'react-icons/fa';
import { getMissPunchRequestsByUser, addMissPunchRequest } from '../localStore';

const MissPunch = () => {
    const { currentUser } = useAuth();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [punchType, setPunchType] = useState('in');
    const [punchTime, setPunchTime] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [myRequests, setMyRequests] = useState([]);
    const [showRequests, setShowRequests] = useState(false);

    const loadMyRequests = () => {
        try {
            const requests = getMissPunchRequestsByUser(currentUser.uid);
            setMyRequests(requests);
            setShowRequests(true);
        } catch (err) {
            console.error('Error loading requests:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!punchTime) {
            setError('Please enter the punch time');
            return;
        }

        if (!reason.trim()) {
            setError('Please provide a reason for the miss punch');
            return;
        }

        setLoading(true);

        try {
            addMissPunchRequest({
                userId: currentUser.uid,
                userEmail: currentUser.email,
                date: selectedDate,
                punchType: punchType,
                punchTime: punchTime,
                reason: reason.trim()
            });

            setSuccess('Miss punch request submitted successfully! Waiting for admin approval.');
            setPunchTime('');
            setReason('');

            // Reload requests to show the new one
            setTimeout(() => {
                loadMyRequests();
            }, 500);
        } catch (err) {
            console.error('Error submitting request:', err);
            setError('Failed to submit request. Please try again.');
        }

        setLoading(false);
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

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <FaExclamationTriangle style={{ color: 'var(--warning)' }} />
                    Miss Punch Request
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Submit a request if you forgot to punch in/out or punched at wrong time
                </p>
            </div>

            {/* Request Form */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {success && (
                        <div style={{
                            backgroundColor: 'var(--success-light)',
                            border: '1px solid var(--success)',
                            color: 'var(--success)',
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <FaCheckCircle /> {success}
                        </div>
                    )}

                    {error && (
                        <div style={{
                            backgroundColor: 'var(--danger-light)',
                            border: '1px solid var(--danger)',
                            color: 'var(--danger)',
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label htmlFor="date">Date</label>
                            <input
                                id="date"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={format(new Date(), 'yyyy-MM-dd')}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="punchType">Punch Type</label>
                            <select
                                id="punchType"
                                value={punchType}
                                onChange={(e) => setPunchType(e.target.value)}
                                required
                            >
                                <option value="in">Punch In</option>
                                <option value="out">Punch Out</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="punchTime">Time (HH:MM:SS)</label>
                            <input
                                id="punchTime"
                                type="time"
                                step="1"
                                value={punchTime}
                                onChange={(e) => setPunchTime(e.target.value + ':00')}
                                placeholder="09:00:00"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="reason">Reason for Miss Punch</label>
                        <textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you missed punching in/out..."
                            rows="3"
                            required
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button type="submit" disabled={loading} style={{ flex: '1', minWidth: '150px' }}>
                            <FaPaperPlane /> {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={loadMyRequests}
                            style={{ flex: '1', minWidth: '150px' }}
                        >
                            <FaClock /> View My Requests
                        </button>
                    </div>
                </form>
            </div>

            {/* My Requests List */}
            {showRequests && (
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                        }}>
                            My Requests
                        </h3>
                    </div>

                    {myRequests.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <FaClock size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                            <p style={{ margin: 0 }}>No miss punch requests found</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Time</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myRequests.map((request) => (
                                        <tr key={request.id}>
                                            <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
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
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {request.reason}
                                            </td>
                                            <td>
                                                {getStatusBadge(request.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MissPunch;
