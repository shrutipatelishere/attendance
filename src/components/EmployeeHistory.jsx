import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isSameDay, parse, getDay } from 'date-fns';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle, FaRupeeSign, FaWallet } from 'react-icons/fa';

const EmployeeHistory = () => {
    const { currentUser } = useAuth();
    const { getDayStatus, calculateDetailedStatus, getMemberByUid, settings } = useAttendance();
    const [currentMonthStr, setCurrentMonthStr] = useState(format(new Date(), 'yyyy-MM'));

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
    const today = new Date();
    const daysInMonth = days.length; // Approximate, but accurate for the selected month

    let presentCount = 0;
    let absentCount = 0;

    const historyList = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayRecords = getDayStatus(dateStr);
        let raw = dayRecords[currentUser.uid];

        // Check if this is a global holiday
        const isHoliday = settings?.holidays?.includes(dateStr);

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
        const isPastOrToday = isBefore(day, today) || isSameDay(day, today);

        // Handle weekly offs and holidays - only count if past or today
        if (isHoliday && isPastOrToday) {
            computed = { status: 'holiday', label: 'Holiday (Paid)', color: 'var(--success)' };
            presentCount += 1;
        } else if (isWeeklyOff && isPastOrToday) {
            computed = { status: 'weeklyoff', label: 'Weekly Off (Paid)', color: 'var(--success)' };
            presentCount += 1;
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

    // Estimate Payout (Simple)
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
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Est. Earnings</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-present)' }}>
                            ₹{estimatedEarnings.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ padding: '1rem', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-present)' }}>{presentCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Days Credited</div>
                </div>
                <div className="glass-panel" style={{ padding: '1rem', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-absent)' }}>{absentCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Absent / Short</div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
                {historyList.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>No records for this period.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>In</th>
                                <th style={{ padding: '1rem' }}>Out</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyList.map((item) => (
                                <tr key={item.date.toString()} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{format(item.date, 'MMM dd')}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{format(item.date, 'EEE')}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{item.punchIn}</td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{item.punchOut}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: item.computed.color,
                                            fontWeight: 500,
                                            textTransform: 'capitalize'
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
