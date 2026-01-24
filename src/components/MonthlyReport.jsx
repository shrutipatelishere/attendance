import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parse, getDaysInMonth, getDay, differenceInMinutes, isSameDay, isBefore, isAfter } from 'date-fns';
import { FaFileDownload, FaFilter, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MonthlyReport = () => {
    const { members, getDayStatus } = useAttendance();
    const [currentMonthStr, setCurrentMonthStr] = useState(format(new Date(), 'yyyy-MM'));
    const [selectedMember, setSelectedMember] = useState('all');
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'settings', 'attendance'));
                if (docSnap.exists()) {
                    setSettings(docSnap.data());
                } else {
                    setSettings({ holidays: [], ruleSets: [] });
                }
            } catch (e) {
                console.error("Settings load failed", e);
                // Set default settings even on error
                setSettings({ holidays: [], ruleSets: [] });
            }
        };
        fetchSettings();
    }, []);

    const selectedDate = parse(currentMonthStr, 'yyyy-MM', new Date());
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    const daysInMonth = getDaysInMonth(selectedDate);

    // Filter members
    const filteredMembers = selectedMember === 'all'
        ? members
        : members.filter(m => (m.uid || m.id) === selectedMember);

    // Calculate attendance data
    const generateReport = () => {
        return filteredMembers.map(member => {
            let presentDays = 0;
            let absentDays = 0;
            let halfDays = 0;
            let lateDays = 0;
            let weeklyOffDays = 0;
            let holidayDays = 0;
            let totalHours = 0;

            // Get member's rule set
            let memberRule = null;
            if (settings?.ruleSets && member.ruleSetId) {
                memberRule = settings.ruleSets.find(r => r.id === member.ruleSetId);
            }
            if (!memberRule && settings?.ruleSets?.length > 0) {
                memberRule = settings.ruleSets[0];
            }

            const minFullDay = memberRule?.minFullDay || 8;
            const minHalfDay = memberRule?.minHalfDay || 4;

            const dailyData = days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const lookupId = member.uid || member.id;
                const record = getDayStatus(dateStr)[lookupId];
                const today = new Date();

                // Check if holiday
                const isHoliday = settings?.holidays?.includes(dateStr);

                // Check if weekly off
                let isWeeklyOff = false;
                if (memberRule?.weeklyOffs && memberRule.weeklyOffs.length > 0) {
                    const dayOfWeek = getDay(day);
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayName = dayNames[dayOfWeek];
                    isWeeklyOff = memberRule.weeklyOffs.includes(dayName);
                }

                // Check if day is in the past or today (not future)
                const isPastOrToday = isBefore(day, today) || isSameDay(day, today);

                let status = 'Unmarked';
                let hours = 0;
                let punchIn = '-';
                let punchOut = '-';

                // Only count holidays and weekly offs if they're in the past or today
                if (isHoliday && isPastOrToday) {
                    status = 'Holiday';
                    holidayDays++;
                    presentDays++;
                } else if (isWeeklyOff && isPastOrToday) {
                    status = 'Weekly Off';
                    weeklyOffDays++;
                    presentDays++;
                } else if (isHoliday && !isPastOrToday) {
                    status = 'Holiday (Future)';
                } else if (isWeeklyOff && !isPastOrToday) {
                    status = 'Weekly Off (Future)';
                } else if (record && typeof record === 'object') {
                    punchIn = record.punchIn || '-';
                    punchOut = record.punchOut || '-';

                    if (record.punchIn && record.punchOut) {
                        try {
                            const pIn = parse(record.punchIn, 'HH:mm:ss', new Date());
                            const pOut = parse(record.punchOut, 'HH:mm:ss', new Date());
                            const diffMinutes = differenceInMinutes(pOut, pIn);
                            hours = diffMinutes / 60;
                            totalHours += hours;

                            if (hours >= minFullDay) {
                                status = 'Present';
                                presentDays++;
                            } else if (hours >= minHalfDay) {
                                status = 'Half Day';
                                halfDays++;
                                presentDays += 0.5;
                            } else {
                                status = 'Short';
                                absentDays++;
                            }
                        } catch (e) {
                            status = 'Error';
                        }
                    } else if (record.punchIn) {
                        status = 'Working';
                    }
                } else if (record === 'present' || record === 'late') {
                    status = record === 'late' ? 'Late' : 'Present';
                    if (record === 'late') lateDays++;
                    presentDays++;
                } else if (record === 'absent') {
                    status = 'Absent';
                    absentDays++;
                } else {
                    // Past date with no record
                    const today = new Date();
                    if (day < today && !isSameDay(day, today)) {
                        status = 'Absent';
                        absentDays++;
                    }
                }

                return {
                    date: format(day, 'dd'),
                    day: format(day, 'EEE'),
                    status,
                    punchIn,
                    punchOut,
                    hours: hours > 0 ? hours.toFixed(1) : '-'
                };
            });

            return {
                member,
                presentDays,
                absentDays,
                halfDays,
                lateDays,
                weeklyOffDays,
                holidayDays,
                totalHours: totalHours.toFixed(1),
                dailyData,
                ruleName: memberRule?.name || 'Default'
            };
        });
    };

    const reportData = settings ? generateReport() : [];

    // Download CSV
    const downloadCSV = () => {
        if (reportData.length === 0) return;

        let csv = '';

        if (selectedMember === 'all') {
            // Summary report for all employees
            csv = 'Employee Name,Email,Shift,Present Days,Half Days,Absent Days,Late Days,Weekly Offs,Holidays,Total Hours\n';
            reportData.forEach(data => {
                csv += `${data.member.name},${data.member.email},${data.ruleName},${data.presentDays},${data.halfDays},${data.absentDays},${data.lateDays},${data.weeklyOffDays},${data.holidayDays},${data.totalHours}\n`;
            });
        } else {
            // Detailed report for single employee
            const data = reportData[0];
            csv = `Monthly Attendance Report - ${data.member.name}\n`;
            csv += `Month: ${format(selectedDate, 'MMMM yyyy')}\n`;
            csv += `Email: ${data.member.email}\n`;
            csv += `Shift: ${data.ruleName}\n\n`;
            csv += 'Date,Day,Status,Punch In,Punch Out,Hours\n';
            data.dailyData.forEach(day => {
                csv += `${day.date},${day.day},${day.status},${day.punchIn},${day.punchOut},${day.hours}\n`;
            });
            csv += `\nSummary\n`;
            csv += `Present Days,${data.presentDays}\n`;
            csv += `Half Days,${data.halfDays}\n`;
            csv += `Absent Days,${data.absentDays}\n`;
            csv += `Late Days,${data.lateDays}\n`;
            csv += `Weekly Offs,${data.weeklyOffDays}\n`;
            csv += `Holidays,${data.holidayDays}\n`;
            csv += `Total Hours,${data.totalHours}\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Attendance_Report_${currentMonthStr}${selectedMember !== 'all' ? `_${reportData[0]?.member.name}` : ''}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (!settings) {
        return (
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading report data...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <FaCalendarAlt style={{ color: 'var(--primary)' }} /> Monthly Attendance Report
                </h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    View and download comprehensive attendance reports
                </p>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label><FaCalendarAlt /> Select Month</label>
                        <input
                            type="month"
                            value={currentMonthStr}
                            onChange={(e) => setCurrentMonthStr(e.target.value)}
                            style={{ marginTop: '0.5rem' }}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label><FaFilter /> Filter Employee</label>
                        <select
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                            style={{ marginTop: '0.5rem' }}
                        >
                            <option value="all">All Employees</option>
                            {members.map(m => (
                                <option key={m.id} value={m.uid || m.id}>
                                    {m.name} ({m.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={downloadCSV}
                        className="btn-primary"
                        disabled={reportData.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FaFileDownload /> Download CSV
                    </button>
                </div>
            </div>

            {/* Report Display */}
            {selectedMember === 'all' ? (
                // Summary Table for All Employees
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Shift</th>
                                        <th style={{ textAlign: 'center' }}>Present</th>
                                        <th style={{ textAlign: 'center' }}>Half Day</th>
                                        <th style={{ textAlign: 'center' }}>Absent</th>
                                        <th style={{ textAlign: 'center' }}>Late</th>
                                        <th style={{ textAlign: 'center' }}>Weekly Offs</th>
                                        <th style={{ textAlign: 'center' }}>Holidays</th>
                                        <th style={{ textAlign: 'center' }}>Total Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((data, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                {data.member.name}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                                                    {data.member.email}
                                                </div>
                                            </td>
                                            <td>{data.ruleName}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-success">{data.presentDays}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {data.halfDays > 0 ? (
                                                    <span className="badge badge-warning">{data.halfDays}</span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {data.absentDays > 0 ? (
                                                    <span className="badge badge-danger">{data.absentDays}</span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {data.lateDays > 0 ? data.lateDays : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{data.weeklyOffDays}</td>
                                            <td style={{ textAlign: 'center' }}>{data.holidayDays}</td>
                                            <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{data.totalHours}h</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : reportData.length > 0 ? (
                // Detailed View for Single Employee
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                                {reportData[0].presentDays}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Days Credited
                            </div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--danger)' }}>
                                {reportData[0].absentDays}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Absent Days
                            </div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                                {reportData[0].totalHours}h
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Total Hours
                            </div>
                        </div>
                    </div>

                    {/* Daily Attendance Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                Daily Attendance - {reportData[0].member.name}
                            </h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Day</th>
                                        <th>Status</th>
                                        <th>Punch In</th>
                                        <th>Punch Out</th>
                                        <th style={{ textAlign: 'right' }}>Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData[0].dailyData.map((day, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '500' }}>{day.date}</td>
                                            <td>{day.day}</td>
                                            <td>
                                                <span className={`badge ${
                                                    day.status === 'Present' || day.status === 'Holiday' || day.status === 'Weekly Off' ? 'badge-success' :
                                                    day.status === 'Absent' || day.status === 'Short' ? 'badge-danger' :
                                                    day.status === 'Half Day' || day.status === 'Late' ? 'badge-warning' :
                                                    'badge-primary'
                                                }`}>
                                                    {day.status === 'Present' && <FaCheckCircle />}
                                                    {day.status === 'Absent' && <FaTimesCircle />}
                                                    {day.status === 'Half Day' && <FaExclamationCircle />}
                                                    {day.status}
                                                </span>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{day.punchIn}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{day.punchOut}</td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                                {day.hours !== '-' ? `${day.hours}h` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No data available for selected filters</p>
                </div>
            )}
        </div>
    );
};

export default MonthlyReport;

