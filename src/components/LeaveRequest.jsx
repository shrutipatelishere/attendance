import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { FaCalendarAlt, FaCheckCircle, FaClock, FaPaperPlane } from 'react-icons/fa';
import { fsAddLeaveRequest, fsGetLeaveRequestsByUser } from '../firestoreService';

const LEAVE_TYPES = [
    { value: 'casual', label: 'Casual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'earned', label: 'Earned Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'other', label: 'Other' },
];

const LeaveRequest = () => {
    const { currentUser } = useAuth();
    const [leaveType, setLeaveType] = useState('casual');
    const [dateType, setDateType] = useState('single');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [myRequests, setMyRequests] = useState([]);
    const [showRequests, setShowRequests] = useState(false);

    const loadMyRequests = async () => {
        try {
            const requests = await fsGetLeaveRequestsByUser(currentUser.uid);
            setMyRequests(requests);
            setShowRequests(true);
        } catch (err) {
            console.error('Error loading leave requests:', err);
            setError('Failed to load requests. Please try again.');
        }
    };

    const getDayCount = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!startDate) {
            setError('Please select a date');
            return;
        }

        if (dateType === 'range' && !endDate) {
            setError('Please select an end date');
            return;
        }

        if (dateType === 'range' && endDate < startDate) {
            setError('End date must be after start date');
            return;
        }

        if (!reason.trim()) {
            setError('Please provide a reason for your leave request');
            return;
        }

        setLoading(true);

        try {
            await fsAddLeaveRequest({
                userId: currentUser.uid,
                userEmail: currentUser.email,
                userName: currentUser.displayName || currentUser.email,
                leaveType,
                dateType,
                startDate,
                endDate: dateType === 'range' ? endDate : startDate,
                reason: reason.trim()
            });

            setSuccess('Leave request submitted successfully! Waiting for admin approval.');
            setReason('');
            setLeaveType('casual');
            setDateType('single');
            setStartDate(format(new Date(), 'yyyy-MM-dd'));
            setEndDate('');

            setTimeout(() => {
                loadMyRequests();
            }, 500);
        } catch (err) {
            console.error('Error submitting leave request:', err);
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

    const getLeaveTypeLabel = (val) => {
        return LEAVE_TYPES.find(t => t.value === val)?.label || val;
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
                    <FaCalendarAlt style={{ color: 'var(--primary)' }} />
                    Leave Request
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Submit a leave request for one day or a date range
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem' }}>
                        <div>
                            <label htmlFor="leaveType">Leave Type</label>
                            <select
                                id="leaveType"
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value)}
                                required
                            >
                                {LEAVE_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="dateType">Duration</label>
                            <select
                                id="dateType"
                                value={dateType}
                                onChange={(e) => {
                                    setDateType(e.target.value);
                                    if (e.target.value === 'single') setEndDate('');
                                }}
                                required
                            >
                                <option value="single">Single Day</option>
                                <option value="range">Date Range</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: dateType === 'range' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                        <div>
                            <label htmlFor="startDate">{dateType === 'single' ? 'Date' : 'Start Date'}</label>
                            <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    if (dateType === 'range' && endDate && e.target.value > endDate) {
                                        setEndDate(e.target.value);
                                    }
                                }}
                                required
                            />
                        </div>
                        {dateType === 'range' && (
                            <div>
                                <label htmlFor="endDate">End Date</label>
                                <input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {dateType === 'range' && startDate && endDate && endDate >= startDate && (
                        <div style={{
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            padding: '0.5rem 0.875rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8125rem',
                            fontWeight: '500',
                            width: 'fit-content'
                        }}>
                            {getDayCount(startDate, endDate)} day{getDayCount(startDate, endDate) > 1 ? 's' : ''}
                        </div>
                    )}

                    <div>
                        <label htmlFor="leaveReason">Reason for Leave</label>
                        <textarea
                            id="leaveReason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain the reason for your leave request..."
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

            {/* My Leave Requests List */}
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
                            My Leave Requests
                        </h3>
                    </div>

                    {myRequests.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <FaClock size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                            <p style={{ margin: 0 }}>No leave requests found</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myRequests.map((request) => (
                                        <tr key={request.id}>
                                            <td style={{ fontWeight: '500', color: 'var(--primary)' }}>
                                                {getLeaveTypeLabel(request.leaveType)}
                                            </td>
                                            <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                {format(new Date(request.startDate), 'MMM dd, yyyy')}
                                            </td>
                                            <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                {request.startDate === request.endDate
                                                    ? '—'
                                                    : format(new Date(request.endDate), 'MMM dd, yyyy')
                                                }
                                            </td>
                                            <td>
                                                {getDayCount(request.startDate, request.endDate)}
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

export default LeaveRequest;
