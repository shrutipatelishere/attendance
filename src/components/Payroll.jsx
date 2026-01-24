import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth, parse, differenceInMinutes, getDay, isBefore, isSameDay } from 'date-fns';
import { FaMoneyBillWave, FaCog, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Payroll = () => {
    const { members, getDayStatus, settings } = useAttendance();
    const [currentMonthStr, setCurrentMonthStr] = useState(format(new Date(), 'yyyy-MM'));

    // Calc logic
    const selectedDate = parse(currentMonthStr, 'yyyy-MM', new Date());
    const daysInMonth = getDaysInMonth(selectedDate);
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });

    // Build Payroll Data
    const payrollData = members.map(member => {
        let presentDays = 0;
        let absentDays = 0;
        let halfDays = 0;
        let lateDays = 0;
        let holidays = 0;
        let weeklyOffs = 0;

        // 1. Determine Rule Set
        let userRule = null;
        if (settings && settings.ruleSets) {
            if (member.ruleSetId) {
                userRule = settings.ruleSets.find(r => r.id === member.ruleSetId);
            }
            if (!userRule && settings.ruleSets.length > 0) {
                userRule = settings.ruleSets[0];
            }
        }

        const minFullDay = userRule?.minFullDay || 8;
        const minHalfDay = userRule?.minHalfDay || 4;

        const today = new Date();

        days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const lookupId = member.uid || member.id;
            const record = getDayStatus(dateStr)[lookupId];

            const isPastOrToday = isBefore(day, today) || isSameDay(day, today);

            // Skip future days
            if (!isPastOrToday) return;

            // 1. Check if Global Holiday (Paid)
            if (settings?.holidays?.includes(dateStr)) {
                presentDays++;
                holidays++;
                return;
            }

            // 2. Check if Weekly Off (Paid Leave)
            if (userRule?.weeklyOffs && userRule.weeklyOffs.length > 0) {
                const dayOfWeek = getDay(day);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = dayNames[dayOfWeek];

                if (userRule.weeklyOffs.includes(dayName)) {
                    presentDays++;
                    weeklyOffs++;
                    return;
                }
            }

            // 3. Check Attendance
            if (record) {
                if (typeof record === 'string') {
                    if (record === 'present') {
                        presentDays++;
                    } else if (record === 'late') {
                        presentDays++;
                        lateDays++;
                    } else if (record === 'absent') {
                        absentDays++;
                    }
                } else {
                    if (record.status === 'present' || record.status === 'late') {
                        if (record.punchIn && record.punchOut) {
                            try {
                                const pIn = parse(record.punchIn, 'HH:mm:ss', new Date());
                                const pOut = parse(record.punchOut, 'HH:mm:ss', new Date());
                                const diffHours = differenceInMinutes(pOut, pIn) / 60;

                                if (diffHours >= minFullDay) {
                                    presentDays += 1;
                                    if (record.status === 'late') lateDays++;
                                } else if (diffHours >= minHalfDay) {
                                    presentDays += 0.5;
                                    halfDays++;
                                } else {
                                    absentDays++;
                                }
                            } catch (err) {
                                console.error("Time parse error", err);
                                absentDays++;
                            }
                        } else if (record.punchIn && !record.punchOut) {
                            // Still working, count as present for now
                            presentDays += 1;
                        } else {
                            absentDays++;
                        }
                    } else if (record.status === 'absent') {
                        absentDays++;
                    }
                }
            } else {
                // No record = absent (only count if it's a past working day)
                absentDays++;
            }
        });

        const salaryStr = (member.salary || '0').toString().replace(/[₹$,]/g, '').trim();
        const salary = parseFloat(salaryStr) || 0;
        const dailyRate = salary / daysInMonth;
        const payout = Math.round(dailyRate * presentDays);

        return {
            ...member,
            presentDays,
            absentDays,
            halfDays,
            lateDays,
            holidays,
            weeklyOffs,
            daysInMonth,
            salary,
            payout,
            ruleName: userRule?.name || 'Default'
        };
    });

    const totalPayout = payrollData.reduce((acc, curr) => acc + curr.payout, 0);
    const totalSalary = payrollData.reduce((acc, curr) => acc + curr.salary, 0);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 className="text-gradient" style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaMoneyBillWave /> Payroll
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Monthly salary calculation based on attendance
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/settings" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <FaCog /> Rules
                    </Link>
                    <input
                        type="month"
                        value={currentMonthStr}
                        onChange={(e) => setCurrentMonthStr(e.target.value)}
                        style={{ background: 'var(--bg-card)', border: 'var(--glass-border)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px' }}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Staff</span>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {members.length}
                    </div>
                </div>
                <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Monthly Salary</span>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        ₹{totalSalary.toLocaleString('en-IN')}
                    </div>
                </div>
                <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estimated Payout</span>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-accent)' }}>
                        ₹{totalPayout.toLocaleString('en-IN')}
                    </div>
                </div>
                <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Month</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {format(selectedDate, 'MMMM yyyy')}
                    </div>
                </div>
            </div>

            {/* Payroll Table */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)' }}>
                                <th style={{ padding: '1rem' }}>Employee</th>
                                <th style={{ padding: '1rem' }}>Designation</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Monthly Salary</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Present</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Absent</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Half Days</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Holidays/Offs</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>This Month Salary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollData.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                background: 'rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {item.profileImage ? (
                                                    <img src={item.profileImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <FaUser style={{ color: 'var(--text-secondary)', fontSize: '1rem' }} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: item.role === 'Manager' ? 'rgba(139, 92, 246, 0.2)' :
                                                       item.role === 'Intern' ? 'rgba(251, 191, 36, 0.2)' :
                                                       'rgba(56, 189, 248, 0.2)',
                                            color: item.role === 'Manager' ? '#a78bfa' :
                                                   item.role === 'Intern' ? '#fbbf24' :
                                                   'var(--text-accent)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: '500'
                                        }}>
                                            {item.role || 'Employee'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '500' }}>
                                        ₹{item.salary.toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{
                                            background: 'rgba(74, 222, 128, 0.2)',
                                            color: 'var(--color-present)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {item.presentDays - item.holidays - item.weeklyOffs}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{
                                            background: item.absentDays > 0 ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: item.absentDays > 0 ? 'var(--color-absent)' : 'var(--text-secondary)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {item.absentDays}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{
                                            background: item.halfDays > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: item.halfDays > 0 ? '#fbbf24' : 'var(--text-secondary)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {item.halfDays}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{
                                            background: 'rgba(139, 92, 246, 0.2)',
                                            color: '#a78bfa',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {item.holidays + item.weeklyOffs}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--color-present)' }}>
                                            ₹{item.payout.toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {item.presentDays} / {item.daysInMonth} days
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: 'rgba(0,0,0,0.3)', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                                <td colSpan="2" style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    TOTAL ({members.length} employees)
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    ₹{totalSalary.toLocaleString('en-IN')}
                                </td>
                                <td colSpan="4" style={{ padding: '1rem' }}></td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--text-accent)' }}>
                                    ₹{totalPayout.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div><span style={{ color: 'var(--color-present)' }}>Present</span> = Full working days</div>
                <div><span style={{ color: 'var(--color-absent)' }}>Absent</span> = No attendance / Short hours</div>
                <div><span style={{ color: '#fbbf24' }}>Half Days</span> = {'>'}4 hrs but {'<'}8 hrs (counted as 0.5)</div>
                <div><span style={{ color: '#a78bfa' }}>Holidays/Offs</span> = Paid holidays + Weekly offs</div>
            </div>
        </div>
    );
};

export default Payroll;
