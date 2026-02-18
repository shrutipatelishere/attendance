import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isSameDay, startOfDay, parse, getDay } from 'date-fns';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle, FaRupeeSign, FaWallet } from 'react-icons/fa';

const STATUS_FILTERS = [
    { value: 'all', label: 'All', color: 'var(--primary)', bg: 'var(--primary-light)' },
    { value: 'present', label: 'Present', color: 'var(--success)', bg: '#d1fae5' },
    { value: 'halfday', label: 'Half Day', color: '#d97706', bg: '#fef3c7' },
    { value: 'absent', label: 'Absent', color: 'var(--danger)', bg: '#fee2e2' },
    { value: 'holiday', label: 'Holiday', color: 'var(--success)', bg: '#d1fae5' },
    { value: 'weeklyoff', label: 'Weekly Off', color: 'var(--success)', bg: '#d1fae5' },
    { value: 'late', label: 'Late', color: '#d97706', bg: '#fef3c7' },
];

const EmployeeHistory = () => {
    const { currentUser } = useAuth();
    const { getDayStatus, calculateDetailedStatus, getMemberByUid, settings } = useAttendance();
    const [currentMonthStr, setCurrentMonthStr] = useState(format(new Date(), 'yyyy-MM'));
    const [statusFilter, setStatusFilter] = useState('all');

    // Get My RuleSet & Profile
    const myProfile = getMemberByUid(currentUser.uid);
    const ruleSetId = myProfile?.ruleSetId;
    const salary = myProfile?.salary ? parseFloat(myProfile.salary) : 0;

    // Get my assigned rule set for weekly offs
    let myRule = null;
    if (settings && settings.ruleSets && ruleSetId) {
        myRule = settings.ruleSets.find(r => r.id === ruleSetId);
    }
    // Fallback to first rule if not assigned
    if (!myRule && settings?.ruleSets?.length > 0) {
        myRule = settings.ruleSets[0];
    }

    const selectedDate = parse(currentMonthStr, 'yyyy-MM', new Date());
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    const today = startOfDay(new Date());
    const daysInMonth = days.length; // Approximate, but accurate for the selected month

    let presentCount = 0;
    let absentCount = 0;

    const historyList = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayRecords = getDayStatus(dateStr);
        let raw = dayRecords[currentUser.uid];

        // Check if this is a global holiday (paid or unpaid) or per-employee unpaid holiday
        const isHoliday = settings?.holidays?.includes(dateStr);
        const isUnpaidHoliday = settings?.unpaidHolidays?.includes(dateStr) || (myProfile?.unpaidHolidays || []).includes(dateStr);

        // Check if this is a weekly off
        let isWeeklyOff = false;
        if (myRule?.weeklyOffs && myRule.weeklyOffs.length > 0) {
            const dayOfWeek = getDay(day);
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[dayOfWeek];
            isWeeklyOff = myRule.weeklyOffs.includes(dayName);
        }

        // STRICT CALCULATION
        let computed = calculateDetailedStatus(raw, ruleSetId);
        let punchIn = '-';
        let punchOut = '-';

        if (raw && typeof raw === 'object') {
            punchIn = raw.punchIn || '-';
            punchOut = raw.punchOut || '-';
        }

        // Check if day is in the past or today (not future)
        // today is normalized to startOfDay, so isBefore handles past days
        // and isSameDay handles today itself
        const isPastOrToday = isBefore(day, today) || isSameDay(day, today);

        // Check pay settings: employee override > rule set > default (paid)
        const isPaidHoliday = myProfile?.paidHolidays !== null && myProfile?.paidHolidays !== undefined
            ? myProfile.paidHolidays
            : myRule?.paidHolidays !== false;
        const isPaidWeeklyOff = myProfile?.paidWeeklyOffs !== null && myProfile?.paidWeeklyOffs !== undefined
            ? myProfile.paidWeeklyOffs
            : myRule?.paidWeeklyOffs !== false;

        // Handle unpaid holidays, weekly offs and holidays - only count if past or today
        if (isUnpaidHoliday && isPastOrToday) {
            computed = { status: 'holiday', label: 'Holiday (Unpaid)', color: 'var(--text-secondary)' };
        } else if (isUnpaidHoliday && !isPastOrToday) {
            computed = { status: 'upcoming', label: 'Holiday (Unpaid)', color: 'var(--text-secondary)' };
        } else if (isHoliday && isPastOrToday) {
            computed = { status: 'holiday', label: isPaidHoliday ? 'Holiday (Paid)' : 'Holiday (Unpaid)', color: isPaidHoliday ? 'var(--success)' : 'var(--text-secondary)' };
            if (isPaidHoliday) presentCount += 1;
        } else if (isWeeklyOff && isPastOrToday) {
            computed = { status: 'weeklyoff', label: isPaidWeeklyOff ? 'Weekly Off (Paid)' : 'Weekly Off (Unpaid)', color: isPaidWeeklyOff ? 'var(--success)' : 'var(--text-secondary)' };
            if (isPaidWeeklyOff) presentCount += 1;
        } else if (isHoliday && !isPastOrToday) {
            computed = { status: 'upcoming', label: 'Holiday', color: 'var(--text-secondary)' };
        } else if (isWeeklyOff && !isPastOrToday) {
            computed = { status: 'upcoming', label: 'Weekly Off', color: 'var(--text-secondary)' };
        } else if (!raw) {
            // Handle Future/Upcoming vs Absent logic
            if (isBefore(day, today) && !isSameDay(day, today)) {
                // Past, unmarked = Absent
                computed = { status: 'absent', label: 'Absent', color: 'var(--color-absent)' };
                absentCount++;
            } else {
                // Future
                computed = { status: 'upcoming', label: '', color: 'transparent' };
            }
        } else {
            // Count Stats (Strict) for regular attendance
            if (computed.status === 'present') presentCount += 1;
            if (computed.status === 'halfday') presentCount += 0.5;
            if (computed.status === 'absent' || computed.status === 'short') absentCount++;
        }

        return { date: day, computed, punchIn, punchOut, isHoliday, isWeeklyOff };
    }).filter(item => item.computed.status !== 'upcoming');

    historyList.reverse();

    // Status counts for filter badges
    const statusCounts = {
        all: historyList.length,
        present: historyList.filter(i => i.computed.status === 'present').length,
        halfday: historyList.filter(i => i.computed.status === 'halfday').length,
        absent: historyList.filter(i => i.computed.status === 'absent' || i.computed.status === 'short').length,
        holiday: historyList.filter(i => i.computed.status === 'holiday').length,
        weeklyoff: historyList.filter(i => i.computed.status === 'weeklyoff').length,
        late: historyList.filter(i => i.computed.status === 'late').length,
    };

    // Apply filter
    const filteredList = statusFilter === 'all'
        ? historyList
        : historyList.filter(item => {
            if (statusFilter === 'absent') return item.computed.status === 'absent' || item.computed.status === 'short';
            return item.computed.status === statusFilter;
        });

    // Estimate Payout — only counts days that have already passed
    const dailyRate = salary > 0 ? Math.round(salary / daysInMonth) : 0;
    const estimatedEarnings = Math.round(dailyRate * presentCount);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', items: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="text-gradient" style={{ margin: 0 }}>My Attendance</h2>
                <input
                    type="month"
                    value={currentMonthStr}
                    onChange={(e) => setCurrentMonthStr(e.target.value)}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        outline: 'none'
                    }}
                />
            </div>

            {/* Salary Card (New) */}
            {salary > 0 && (
                <div className="glass-panel" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--primary-light)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ padding: '0.8rem', background: 'var(--primary)', borderRadius: '50%' }}>
                            <FaWallet size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Base Salary</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{salary.toLocaleString()}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Earned So Far</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-present)' }}>
                            ₹{estimatedEarnings.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Filter Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem'
            }}>
                {STATUS_FILTERS.map(f => (
                    <button
                            key={f.value}
                            onClick={() => setStatusFilter(f.value)}
                            className="glass-panel"
                            style={{
                                padding: '1rem 0.75rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                border: statusFilter === f.value ? `2px solid ${f.color}` : '1px solid var(--border-color)',
                                background: statusFilter === f.value ? f.bg : 'var(--bg-card)',
                                borderRadius: '12px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: f.color,
                                lineHeight: 1
                            }}>
                                {statusCounts[f.value]}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: statusFilter === f.value ? f.color : 'var(--text-secondary)',
                                marginTop: '0.375rem',
                                fontWeight: statusFilter === f.value ? '600' : '500'
                            }}>
                                {f.label}
                            </div>
                        </button>
                ))}
            </div>

            <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
                {filteredList.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {historyList.length === 0
                            ? 'No records for this period.'
                            : `No ${STATUS_FILTERS.find(f => f.value === statusFilter)?.label || ''} records found.`
                        }
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                                <th style={{ padding: '0.75rem 0.5rem' }}>In</th>
                                <th style={{ padding: '0.75rem 0.5rem' }}>Out</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredList.map((item) => (
                                <tr key={item.date.toString()} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{format(item.date, 'MMM dd')}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{format(item.date, 'EEE')}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.punchIn}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.punchOut}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            color: item.computed.color,
                                            fontWeight: 600,
                                            fontSize: '0.8rem'
                                        }}>
                                            {item.computed.status === 'present' && <FaCheckCircle />}
                                            {item.computed.status === 'halfday' && <FaExclamationCircle />}
                                            {(item.computed.status === 'absent' || item.computed.status === 'short') && <FaTimesCircle />}
                                            {item.computed.status === 'late' && <FaClock />}
                                            {(item.computed.status === 'holiday' || item.computed.status === 'weeklyoff') && <FaCheckCircle />}
                                            {item.computed.label}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default EmployeeHistory;
