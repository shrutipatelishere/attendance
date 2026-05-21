import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAttendance } from '../context/AttendanceContext';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfDay, isBefore, isSameDay } from 'date-fns';
import {
    FaArrowLeft, FaSave, FaUser, FaCheckCircle, FaTimesCircle,
    FaUndo, FaCalendarAlt
} from 'react-icons/fa';

/**
 * Open a single employee → edit all profile details AND their
 * whole-month attendance, day by day.
 * Route: /staff/:id
 */
const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        members, updateMember, settings,
        records, markAttendance, clearAttendance
    } = useAttendance();

    const member = useMemo(() => members.find(m => m.id === id), [members, id]);
    const ruleSets = settings?.ruleSets || [];
    const locations = settings?.locations || [];

    // ─── Profile edit state ──────────────────────────────
    const [form, setForm] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');

    useEffect(() => {
        if (member && !form) {
            setForm({
                name: member.name || '',
                email: member.email || '',
                role: member.role || 'Employee',
                phone: member.phone || '',
                salary: member.salary || '',
                address: member.address || '',
                ruleSetId: member.ruleSetId || (ruleSets[0]?.id || ''),
                attendanceLocationId: member.attendanceLocationId || '',
                bankHolder: member.bankDetails?.holderName || '',
                bankAccount: member.bankDetails?.accountNo || '',
                ifsc: member.bankDetails?.ifsc || '',
            });
        }
    }, [member, form, ruleSets]);

    const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

    const saveProfile = async () => {
        if (!form) return;
        setSavingProfile(true);
        setProfileMsg('');
        try {
            await updateMember(id, {
                name: form.name,
                email: form.email,
                role: form.role,
                phone: form.phone,
                salary: form.salary,
                address: form.address,
                ruleSetId: form.ruleSetId,
                attendanceLocationId: form.attendanceLocationId || null,
                bankDetails: {
                    holderName: form.bankHolder,
                    accountNo: form.bankAccount,
                    ifsc: form.ifsc,
                },
            });
            setProfileMsg('Profile saved.');
        } catch (e) {
            setProfileMsg('Error: ' + e.message);
        }
        setSavingProfile(false);
    };

    // ─── Month attendance state ──────────────────────────
    const [monthStr, setMonthStr] = useState(format(new Date(), 'yyyy-MM'));
    const lookupId = member ? (member.uid || member.id) : null;

    const days = useMemo(() => {
        const d = parse(monthStr, 'yyyy-MM', new Date());
        return eachDayOfInterval({ start: startOfMonth(d), end: endOfMonth(d) });
    }, [monthStr]);

    const getRaw = (dateStr) => (records[dateStr] || {})[lookupId];

    const statusOf = (raw) => {
        if (raw === undefined || raw === null || raw === '') return '';
        return typeof raw === 'object' ? raw.status : raw;
    };

    const setDayStatus = (dateStr, status) => {
        const raw = getRaw(dateStr);
        if (raw && typeof raw === 'object') {
            markAttendance(dateStr, lookupId, { ...raw, status });
        } else {
            markAttendance(dateStr, lookupId, status);
        }
    };

    // Time pickers may return HH:mm — normalize to HH:mm:ss for storage
    const normTime = (t) => (t && t.length === 5 ? `${t}:00` : t) || null;

    const setPunch = (dateStr, field, value) => {
        const raw = getRaw(dateStr);
        const base = raw && typeof raw === 'object' ? raw : {};
        const next = {
            ...base,
            status: base.status || 'present',
            [field]: normTime(value),
        };
        if (!next.punchIn) next.status = 'absent';
        markAttendance(dateStr, lookupId, next);
    };

    // Effective day status: explicit mark wins; otherwise compute from
    // weekly-off / holiday settings, then auto-Absent for today-or-past.
    const effectiveFor = (day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const status = statusOf(getRaw(dateStr));
        if (status === 'present' || status === 'late') return { kind: 'present', label: 'Present' };
        if (status === 'absent') return { kind: 'absent', label: 'Absent' };
        if (status) return { kind: 'present', label: 'Present' };

        // No explicit mark
        const rule = ruleSets.find(r => r.id === member?.ruleSetId) || ruleSets[0];
        const dn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][getDay(day)];
        const unpaidHoliday = (settings?.unpaidHolidays || []).includes(dateStr) || (member?.unpaidHolidays || []).includes(dateStr);
        if ((settings?.holidays || []).includes(dateStr) || unpaidHoliday) return { kind: 'off', label: 'Holiday' };
        if (rule?.weeklyOffs?.includes(dn)) return { kind: 'off', label: 'Week Off' };

        const todayStart = startOfDay(new Date());
        if (isBefore(day, todayStart) || isSameDay(day, todayStart)) return { kind: 'absent', label: 'Absent' };
        return { kind: 'unmarked', label: 'Unmarked' };
    };

    const monthSummary = useMemo(() => {
        let present = 0, absent = 0, off = 0, unmarked = 0;
        days.forEach(day => {
            const k = effectiveFor(day).kind;
            if (k === 'present') present++;
            else if (k === 'absent') absent++;
            else if (k === 'off') off++;
            else unmarked++;
        });
        return { present, absent, off, unmarked };
    }, [days, records, lookupId, member, settings]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!member) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>Employee not found or still loading…</p>
                <Link to="/staff"><button className="btn-secondary">Back to Staff</button></Link>
            </div>
        );
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const memberRule = ruleSets.find(r => r.id === form?.ruleSetId) || ruleSets[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => navigate('/staff')} style={{ padding: '0.45rem 0.7rem' }}>
                    <FaArrowLeft />
                </button>
                <div style={{
                    width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden',
                    background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                }}>
                    {member.profileImage
                        ? <img src={member.profileImage} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <FaUser style={{ color: 'var(--text-secondary)' }} />}
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{member.name}</h1>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{member.role || 'Employee'} · {member.email}</p>
                </div>
            </div>

            {/* ─── Profile details ─── */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>Profile Details</h3>
                {profileMsg && (
                    <div style={{
                        padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.85rem',
                        background: profileMsg.startsWith('Error') ? 'var(--danger-light)' : 'var(--success-light)',
                        color: profileMsg.startsWith('Error') ? 'var(--danger)' : 'var(--success)'
                    }}>{profileMsg}</div>
                )}
                {form && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '0.875rem' }}>
                        <Field label="Full Name"><input type="text" value={form.name} onChange={e => setField('name', e.target.value)} /></Field>
                        <Field label="Email (Login ID)"><input type="email" value={form.email} onChange={e => setField('email', e.target.value)} /></Field>
                        <Field label="Role">
                            <select value={form.role} onChange={e => setField('role', e.target.value)}>
                                <option value="Employee">Employee</option>
                                <option value="Manager">Manager</option>
                                <option value="Intern">Intern</option>
                            </select>
                        </Field>
                        <Field label="Mobile Number"><input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} /></Field>
                        <Field label="Monthly Salary (Rs.)"><input type="number" value={form.salary} onChange={e => setField('salary', e.target.value)} /></Field>
                        <Field label="Shift / Rule Set">
                            <select value={form.ruleSetId} onChange={e => setField('ruleSetId', e.target.value)}>
                                {ruleSets.length === 0 && <option value="">Default</option>}
                                {ruleSets.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Attendance Location">
                            <select value={form.attendanceLocationId} onChange={e => setField('attendanceLocationId', e.target.value)}>
                                <option value="">None</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Address"><input type="text" value={form.address} onChange={e => setField('address', e.target.value)} /></Field>
                        <Field label="Bank Account Holder"><input type="text" value={form.bankHolder} onChange={e => setField('bankHolder', e.target.value)} /></Field>
                        <Field label="Bank Account Number"><input type="text" value={form.bankAccount} onChange={e => setField('bankAccount', e.target.value)} /></Field>
                        <Field label="IFSC Code"><input type="text" value={form.ifsc} onChange={e => setField('ifsc', e.target.value)} /></Field>
                    </div>
                )}
                <button onClick={saveProfile} disabled={savingProfile} className="btn-success" style={{ marginTop: '1rem' }}>
                    <FaSave /> {savingProfile ? 'Saving…' : 'Save Profile'}
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.6rem 0 0' }}>
                    To change the login password, use the Staff page edit form.
                </p>
            </div>

            {/* ─── Month attendance ─── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                    padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FaCalendarAlt style={{ color: 'var(--primary)' }} /> Month Attendance
                    </h3>
                    <input type="month" value={monthStr} onChange={e => setMonthStr(e.target.value)} style={{ width: 'auto' }} />
                </div>

                {/* Summary */}
                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                    <span><strong style={{ color: 'var(--success)' }}>{monthSummary.present}</strong> Present</span>
                    <span><strong style={{ color: 'var(--danger)' }}>{monthSummary.absent}</strong> Absent</span>
                    <span><strong style={{ color: 'var(--primary)' }}>{monthSummary.off}</strong> Off/Holiday</span>
                    <span><strong style={{ color: 'var(--text-secondary)' }}>{monthSummary.unmarked}</strong> Unmarked</span>
                </div>

                {/* Day rows */}
                <div>
                    {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const raw = getRaw(dateStr);
                        const status = statusOf(raw);
                        const punchIn = raw && typeof raw === 'object' ? (raw.punchIn || '') : '';
                        const punchOut = raw && typeof raw === 'object' ? (raw.punchOut || '') : '';
                        const isWeeklyOff = memberRule?.weeklyOffs?.includes(dayNames[getDay(day)]);
                        const isHoliday = settings?.holidays?.includes(dateStr);
                        const eff = effectiveFor(day);

                        return (
                            <div key={dateStr} style={{
                                padding: '0.7rem 1rem', borderBottom: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap'
                            }}>
                                {/* Date */}
                                <div style={{ width: '88px', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{format(day, 'MMM dd')}</div>
                                    <div style={{ fontSize: '0.68rem', color: isWeeklyOff || isHoliday ? 'var(--primary)' : 'var(--text-muted)' }}>
                                        {format(day, 'EEE')}{isHoliday ? ' · Holiday' : isWeeklyOff ? ' · Off' : ''}
                                    </div>
                                </div>

                                {/* Punch times — time pickers, no manual typing */}
                                <input
                                    type="time" step="1" title="Punch In"
                                    value={punchIn} key={'in' + dateStr + punchIn}
                                    onChange={e => { if (e.target.value !== punchIn) setPunch(dateStr, 'punchIn', e.target.value); }}
                                    style={{ width: '116px', fontSize: '0.75rem', padding: '0.3rem 0.4rem' }}
                                />
                                <input
                                    type="time" step="1" title="Punch Out"
                                    value={punchOut} key={'out' + dateStr + punchOut}
                                    onChange={e => { if (e.target.value !== punchOut) setPunch(dateStr, 'punchOut', e.target.value); }}
                                    style={{ width: '116px', fontSize: '0.75rem', padding: '0.3rem 0.4rem' }}
                                />

                                {/* Status badge — effective status (auto-Absent for past unmarked) */}
                                <span className={`badge ${
                                    eff.kind === 'present' || eff.kind === 'off' ? 'badge-success' :
                                    eff.kind === 'absent' ? 'badge-danger' : 'badge-primary'
                                }`} style={{ fontSize: '0.68rem', minWidth: '62px', textAlign: 'center' }}>
                                    {eff.label}
                                </span>

                                {/* Controls */}
                                <div style={{ display: 'flex', gap: '0.3rem', marginLeft: 'auto' }}>
                                    <button
                                        onClick={() => setDayStatus(dateStr, 'present')}
                                        className={status === 'present' || status === 'late' ? 'btn-success' : 'btn-secondary'}
                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                                        title="Present"
                                    ><FaCheckCircle /></button>
                                    <button
                                        onClick={() => setDayStatus(dateStr, 'absent')}
                                        className={status === 'absent' ? 'btn-danger' : 'btn-secondary'}
                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                                        title="Absent"
                                    ><FaTimesCircle /></button>
                                    <button
                                        onClick={() => clearAttendance(dateStr, lookupId)}
                                        className="btn-secondary"
                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                                        title="Clear"
                                    ><FaUndo /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div>
        <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>{label}</label>
        {children}
    </div>
);

export default EmployeeDetail;
