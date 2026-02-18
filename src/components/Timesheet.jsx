import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { format } from 'date-fns';
import { FaClock, FaPlus, FaTrash, FaPaperPlane, FaList } from 'react-icons/fa';
import { fsGetTimesheetsByUser, fsAddTimesheet, fsDeleteTimesheet } from '../firestoreService';

const Timesheet = () => {
    const { currentUser } = useAuth();
    const { getMemberByUid, settings } = useAttendance();

    // Get employee's working hours from their rule set
    const profile = getMemberByUid(currentUser?.uid);
    const ruleSet = settings?.ruleSets?.find(r => r.id === profile?.ruleSetId) || settings?.ruleSets?.find(r => r.id === 'default') || { minFullDay: 8 };
    const workingHours = ruleSet.minFullDay || 8;

    // Generate hourly rows from shift times
    const buildHourlyRows = () => {
        const start = parseInt((ruleSet.startTime || '09:00').split(':')[0], 10);
        const end = parseInt((ruleSet.endTime || '17:00').split(':')[0], 10);
        const rows = [];
        for (let h = start; h < end; h++) {
            const from = `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
            const to = `${(h + 1) % 12 || 12}:00 ${(h + 1) < 12 ? 'AM' : 'PM'}`;
            rows.push({ time: `${from} – ${to}`, project: '', task: '', hours: '1' });
        }
        return rows.length > 0 ? rows : [{ time: '', project: '', task: '', hours: '1' }];
    };

    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [entries, setEntries] = useState(buildHourlyRows());
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [myTimesheets, setMyTimesheets] = useState([]);
    const [showTimesheets, setShowTimesheets] = useState(false);
    const [loadingSheets, setLoadingSheets] = useState(false);

    const addEntry = () => {
        setEntries([...entries, { time: '', project: '', task: '', hours: '1' }]);
    };

    const removeEntry = (index) => {
        if (entries.length === 1) return;
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index, field, value) => {
        const updated = [...entries];
        updated[index][field] = value;
        setEntries(updated);
    };

    const totalHours = entries.length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validEntries = entries.filter(e => e.project.trim() || e.task.trim() || e.time);
        if (validEntries.length === 0) {
            setError('Please fill in at least one entry.');
            return;
        }

        setLoading(true);
        try {
            await fsAddTimesheet({
                userId: currentUser.uid,
                userEmail: currentUser.email,
                userName: currentUser.displayName || currentUser.email,
                date,
                entries: validEntries,
                totalHours,
            });
            setSuccess('Timesheet submitted successfully!');
            setEntries(buildHourlyRows());
            if (showTimesheets) loadMyTimesheets();
        } catch (err) {
            console.error('Error submitting timesheet:', err);
            setError('Failed to submit. Please try again.');
        }
        setLoading(false);
    };

    const loadMyTimesheets = async () => {
        setLoadingSheets(true);
        try {
            const sheets = await fsGetTimesheetsByUser(currentUser.uid);
            setMyTimesheets(sheets);
            setShowTimesheets(true);
        } catch (err) {
            console.error('Error loading timesheets:', err);
            setError('Failed to load timesheets.');
        }
        setLoadingSheets(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this timesheet entry?')) return;
        try {
            await fsDeleteTimesheet(id);
            setMyTimesheets(myTimesheets.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting timesheet:', err);
        }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontWeight: 600 }}>
                <FaClock style={{ marginRight: '0.5rem', color: 'var(--primary)' }} />
                Daily Timesheet
            </h3>

            {error && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', background: 'rgba(248,113,113,0.2)', color: 'var(--danger)', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', background: 'rgba(74,222,128,0.2)', color: 'var(--success)', fontSize: '0.875rem' }}>
                    {success}
                </div>
            )}

            {/* Shift Info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 0.875rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
            }}>
                <FaClock style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>
                    <strong>{ruleSet.name || 'Shift'}</strong>
                    {ruleSet.startTime && ruleSet.endTime && ` · ${ruleSet.startTime} – ${ruleSet.endTime}`}
                    {` · ${workingHours}h/day`}
                </span>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Date Picker */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                {/* Entries */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Work Entries</label>
                    {entries.map((entry, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            {entry.time && (
                                <span style={{
                                    flex: '0 0 auto',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--primary)',
                                    background: 'var(--primary-light)',
                                    padding: '0.375rem 0.5rem',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                    minWidth: '120px',
                                    textAlign: 'center'
                                }}>
                                    {entry.time}
                                </span>
                            )}
                            <input
                                type="text"
                                placeholder="Project"
                                value={entry.project}
                                onChange={(e) => updateEntry(i, 'project', e.target.value)}
                                style={{ flex: '1 1 100px', minWidth: 0 }}
                            />
                            <input
                                type="text"
                                placeholder="Task / Description"
                                value={entry.task}
                                onChange={(e) => updateEntry(i, 'task', e.target.value)}
                                style={{ flex: '2 1 130px', minWidth: 0 }}
                            />
                            {entries.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeEntry(i)}
                                    className="btn-danger"
                                    style={{ padding: '0.5rem', minWidth: 'unset', flex: '0 0 auto' }}
                                >
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addEntry}
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', marginTop: '0.25rem' }}
                    >
                        <FaPlus style={{ marginRight: '0.25rem' }} /> Add Row
                    </button>
                </div>

                {/* Total */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'var(--primary-light)',
                    borderRadius: '8px',
                    marginBottom: '1.25rem'
                }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Hours</span>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary)' }}>{totalHours}h</span>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <FaPaperPlane /> {loading ? 'Submitting...' : 'Submit Timesheet'}
                </button>
            </form>

            {/* View My Timesheets */}
            <div style={{ marginTop: '1.5rem' }}>
                <button
                    onClick={loadMyTimesheets}
                    className="btn-secondary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <FaList /> {loadingSheets ? 'Loading...' : 'View My Timesheets'}
                </button>

                {showTimesheets && (
                    <div style={{ marginTop: '1rem' }}>
                        {myTimesheets.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                                No timesheets found.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {myTimesheets.map(sheet => (
                                    <div key={sheet.id} className="card" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {format(new Date(sheet.date), 'MMM dd, yyyy (EEE)')}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    Total: {sheet.totalHours}h
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(sheet.id)}
                                                className="btn-danger"
                                                style={{ padding: '0.375rem 0.5rem', minWidth: 'unset', fontSize: '0.75rem' }}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                            {sheet.entries?.map((e, i) => (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        {e.time && <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--primary)', marginRight: '0.5rem' }}>{e.time}</span>}
                                                        <span style={{ fontWeight: 500 }}>{e.project}</span>
                                                        {e.project && e.task && <span style={{ color: 'var(--text-secondary)' }}> — </span>}
                                                        <span style={{ color: 'var(--text-secondary)' }}>{e.task}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timesheet;
