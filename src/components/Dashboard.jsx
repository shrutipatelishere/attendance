import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { format, parse, differenceInMinutes, getDay } from 'date-fns';
import { FaCheckCircle, FaTimesCircle, FaClock, FaUserMinus, FaUndo, FaUsers, FaPlus, FaExclamationCircle, FaEdit, FaSave, FaTimes, FaCamera, FaImage } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { members, markAttendance, resetAttendance, getDayStatus, getStats, markAll, calculateDetailedStatus, settings } = useAttendance();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Edit Modal State
    const [editingMember, setEditingMember] = useState(null);
    const [editPunchIn, setEditPunchIn] = useState('');
    const [editPunchOut, setEditPunchOut] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);

    // Selfie Preview Modal
    const [previewSelfie, setPreviewSelfie] = useState(null);

    const dayStatus = getDayStatus(selectedDate);
    const stats = getStats(selectedDate);

    // Check if selected date is a global holiday
    const isGlobalHoliday = settings?.holidays?.includes(selectedDate);

    const getDetailedStatus = (member, raw) => {
        // Check if it's a global holiday
        if (isGlobalHoliday) {
            return { status: 'holiday', label: 'Holiday (Paid)', color: 'var(--success)' };
        }

        // Check if it's a weekly off for this member
        let memberRule = null;
        if (settings?.ruleSets && member.ruleSetId) {
            memberRule = settings.ruleSets.find(r => r.id === member.ruleSetId);
        }
        if (!memberRule && settings?.ruleSets?.length > 0) {
            memberRule = settings.ruleSets[0];
        }

        if (memberRule?.weeklyOffs && memberRule.weeklyOffs.length > 0) {
            const dayOfWeek = getDay(new Date(selectedDate));
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[dayOfWeek];

            if (memberRule.weeklyOffs.includes(dayName)) {
                return { status: 'weeklyoff', label: 'Weekly Off (Paid)', color: 'var(--success)' };
            }
        }

        return calculateDetailedStatus(raw, member.ruleSetId);
    };

    const forceMark = (id, status) => {
        markAttendance(selectedDate, id, status);
    };

    const openEdit = (member, raw) => {
        setEditingMember(member);
        if (raw && typeof raw === 'object') {
            setEditPunchIn(raw.punchIn || '');
            setEditPunchOut(raw.punchOut || '');
            setEditingRecord(raw);
        } else {
            setEditPunchIn('');
            setEditPunchOut('');
            setEditingRecord(null);
        }
    };

    const closeEdit = () => {
        setEditingMember(null);
        setEditPunchIn('');
        setEditPunchOut('');
        setEditingRecord(null);
    };

    const saveEdit = async () => {
        if (!editingMember) return;

        let status = 'present';
        if (!editPunchIn) status = 'absent';

        const base = editingRecord && typeof editingRecord === 'object' ? editingRecord : {};
        const data = {
            ...base,
            status: status,
            punchIn: editPunchIn || null,
            punchOut: editPunchOut || null
        };

        if (!editPunchIn && !editPunchOut) {
            if (window.confirm("Clear all data for this user?")) {
                resetAttendance(selectedDate, editingMember.uid || editingMember.id);
                closeEdit();
                return;
            }
        }

        await markAttendance(selectedDate, editingMember.uid || editingMember.id, data);
        closeEdit();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ minWidth: 0 }}>
                    <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>Overview for {format(new Date(selectedDate), 'MMMM dd, yyyy')}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ width: 'auto' }}
                    />
                    <Link to="/staff" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                            <FaPlus /> Add Staff
                        </button>
                    </Link>
                </div>
            </div>

            {/* Selfie Preview Modal */}
            {previewSelfie && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', zIndex: 1001,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: '1rem', cursor: 'pointer'
                    }}
                    onClick={() => setPreviewSelfie(null)}
                >
                    <div style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
                        <img
                            src={previewSelfie.dataUrl}
                            alt="Selfie Preview"
                            style={{ width: '100%', borderRadius: '12px', boxShadow: 'var(--shadow-xl)' }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '-40px',
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            color: 'white',
                            fontSize: '0.875rem'
                        }}>
                            {previewSelfie.type === 'in' ? 'Punch In Selfie' : 'Punch Out Selfie'}
                            {previewSelfie.time && ` - ${previewSelfie.time}`}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setPreviewSelfie(null); }}
                            style={{
                                position: 'absolute',
                                top: '-15px',
                                right: '-15px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'var(--danger)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem'
                            }}
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal / Overlay */}
            {editingMember && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>Edit Times: {editingMember.name}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            {editingRecord && (editingRecord.selfieIn?.dataUrl || editingRecord.selfieOut?.dataUrl) ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Selfie In</div>
                                        {editingRecord.selfieIn?.dataUrl ? (
                                            <img
                                                src={editingRecord.selfieIn.dataUrl}
                                                alt="Selfie In"
                                                style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }}
                                                onClick={() => setPreviewSelfie({ dataUrl: editingRecord.selfieIn.dataUrl, type: 'in', time: editingRecord.punchIn })}
                                            />
                                        ) : (
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>No selfie</div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Selfie Out</div>
                                        {editingRecord.selfieOut?.dataUrl ? (
                                            <img
                                                src={editingRecord.selfieOut.dataUrl}
                                                alt="Selfie Out"
                                                style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }}
                                                onClick={() => setPreviewSelfie({ dataUrl: editingRecord.selfieOut.dataUrl, type: 'out', time: editingRecord.punchOut })}
                                            />
                                        ) : (
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>No selfie</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                                    <FaCamera style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                                    No selfies captured for this record.
                                </div>
                            )}
                            <div>
                                <label htmlFor="punchIn">Punch In (HH:mm:ss)</label>
                                <input
                                    id="punchIn"
                                    type="text"
                                    placeholder="09:00:00"
                                    value={editPunchIn}
                                    onChange={(e) => setEditPunchIn(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="punchOut">Punch Out (HH:mm:ss)</label>
                                <input
                                    id="punchOut"
                                    type="text"
                                    placeholder="18:00:00"
                                    value={editPunchOut}
                                    onChange={(e) => setEditPunchOut(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button onClick={saveEdit} style={{ flex: 1 }}>
                                    <FaSave /> Save
                                </button>
                                <button onClick={closeEdit} className="btn-secondary" style={{ flex: 1 }}>
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '0.75rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: 'var(--primary-light)',
                        padding: '0.875rem',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FaUsers size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>Total Staff</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: 'var(--success-light)',
                        padding: '0.875rem',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FaCheckCircle size={24} color="var(--success)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--success)' }}>{stats.present}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>Checked In</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: 'var(--danger-light)',
                        padding: '0.875rem',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FaTimesCircle size={24} color="var(--danger)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--danger)' }}>{stats.absent}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>Marked Absent</div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>Daily Attendance</h3>
                    <button
                        onClick={() => markAll(selectedDate, 'present')}
                        className="btn-success"
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem', whiteSpace: 'nowrap' }}
                    >
                        <FaCheckCircle /> Mark All Present
                    </button>
                </div>

                {members.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FaUsers size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p style={{ margin: 0 }}>No staff found. Go to Staff tab to add employees.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Selfies</th>
                                    <th>Time Log</th>
                                    <th style={{ textAlign: 'right' }}>Controls</th>
                                </tr>
                            </thead>
                            <tbody>
                            {members.map(member => {
                                const lookupId = member.uid || member.id;
                                const raw = dayStatus[lookupId];
                                const computed = getDetailedStatus(member, raw);

                                let times = '-';
                                let durationStr = '';

                                const hasSelfieIn = raw && typeof raw === 'object' && raw.selfieIn?.dataUrl;
                                const hasSelfieOut = raw && typeof raw === 'object' && raw.selfieOut?.dataUrl;

                                if (raw && typeof raw === 'object' && raw.punchIn) {
                                    times = `${raw.punchIn} - ${raw.punchOut || '...'}`;
                                    if (raw.punchOut) {
                                        try {
                                            const today = new Date();
                                            const pIn = parse(raw.punchIn, 'HH:mm:ss', today);
                                            const pOut = parse(raw.punchOut, 'HH:mm:ss', today);
                                            const diff = differenceInMinutes(pOut, pIn);
                                            const hrs = Math.floor(diff / 60);
                                            const mins = diff % 60;
                                            durationStr = `${hrs}h ${mins}m`;
                                        } catch (e) { }
                                    }
                                }

                                return (
                                    <tr key={member.id}>
                                        <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                            {member.name}
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                                                {member.role || 'Employee'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                computed.status === 'present' || computed.status === 'working' || computed.status === 'holiday' || computed.status === 'weeklyoff' ? 'badge-success' :
                                                computed.status === 'absent' || computed.status === 'short' ? 'badge-danger' :
                                                computed.status === 'late' || computed.status === 'halfday' ? 'badge-warning' :
                                                'badge-primary'
                                            }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                                                {computed.status === 'present' && <FaCheckCircle />}
                                                {computed.status === 'working' && <FaClock />}
                                                {computed.status === 'halfday' && <FaExclamationCircle />}
                                                {computed.status === 'short' && <FaTimesCircle />}
                                                {computed.status === 'absent' && <FaTimesCircle />}
                                                {computed.status === 'late' && <FaClock />}
                                                {(computed.status === 'holiday' || computed.status === 'weeklyoff') && <FaCheckCircle />}
                                                {!computed.status && <FaUserMinus />}
                                                {computed.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {/* Selfie In Thumbnail */}
                                                <div
                                                    onClick={() => hasSelfieIn && setPreviewSelfie({ dataUrl: raw.selfieIn.dataUrl, type: 'in', time: raw.punchIn })}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        background: hasSelfieIn ? 'transparent' : 'var(--bg-secondary)',
                                                        border: hasSelfieIn ? '2px solid var(--success)' : '2px dashed var(--border-color)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: hasSelfieIn ? 'pointer' : 'default',
                                                        position: 'relative'
                                                    }}
                                                    title={hasSelfieIn ? 'View Punch In Selfie' : 'No Punch In Selfie'}
                                                >
                                                    {hasSelfieIn ? (
                                                        <>
                                                            <img
                                                                src={raw.selfieIn.dataUrl}
                                                                alt="In"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                            <div style={{
                                                                position: 'absolute',
                                                                bottom: '-2px',
                                                                right: '-2px',
                                                                background: 'var(--success)',
                                                                color: 'white',
                                                                fontSize: '0.5rem',
                                                                padding: '1px 3px',
                                                                borderRadius: '3px',
                                                                fontWeight: 'bold'
                                                            }}>IN</div>
                                                        </>
                                                    ) : (
                                                        <FaImage style={{ color: 'var(--text-muted)', fontSize: '0.875rem', opacity: 0.4 }} />
                                                    )}
                                                </div>

                                                {/* Selfie Out Thumbnail */}
                                                <div
                                                    onClick={() => hasSelfieOut && setPreviewSelfie({ dataUrl: raw.selfieOut.dataUrl, type: 'out', time: raw.punchOut })}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        background: hasSelfieOut ? 'transparent' : 'var(--bg-secondary)',
                                                        border: hasSelfieOut ? '2px solid var(--danger)' : '2px dashed var(--border-color)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: hasSelfieOut ? 'pointer' : 'default',
                                                        position: 'relative'
                                                    }}
                                                    title={hasSelfieOut ? 'View Punch Out Selfie' : 'No Punch Out Selfie'}
                                                >
                                                    {hasSelfieOut ? (
                                                        <>
                                                            <img
                                                                src={raw.selfieOut.dataUrl}
                                                                alt="Out"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                            <div style={{
                                                                position: 'absolute',
                                                                bottom: '-2px',
                                                                right: '-2px',
                                                                background: 'var(--danger)',
                                                                color: 'white',
                                                                fontSize: '0.5rem',
                                                                padding: '1px 3px',
                                                                borderRadius: '3px',
                                                                fontWeight: 'bold'
                                                            }}>OUT</div>
                                                        </>
                                                    ) : (
                                                        <FaImage style={{ color: 'var(--text-muted)', fontSize: '0.875rem', opacity: 0.4 }} />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>{times}</span>
                                                <button
                                                    onClick={() => openEdit(member, raw)}
                                                    title="Edit Times"
                                                    className="btn-secondary"
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.75rem',
                                                        minWidth: 'unset'
                                                    }}
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                            {durationStr && (
                                                <div style={{ fontWeight: '600', color: 'var(--primary)', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                                                    {durationStr}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => undoMark(lookupId)}
                                                    title="Reset"
                                                    className="btn-secondary"
                                                    style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                                                >
                                                    <FaUndo />
                                                </button>
                                                <button
                                                    onClick={() => forceMark(lookupId, 'present')}
                                                    className="btn-success"
                                                    style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    onClick={() => forceMark(lookupId, 'absent')}
                                                    className="btn-danger"
                                                    style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                                                >
                                                    A
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>
    );

    function undoMark(id) {
        if (window.confirm('Reset attendance for this user? This will clear punch times.')) {
            resetAttendance(selectedDate, id);
        }
    }
};

export default Dashboard;
