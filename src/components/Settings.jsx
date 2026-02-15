import React, { useState, useEffect, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { FaCog, FaCalendarAlt, FaClock, FaPlus, FaTrash, FaMapMarkerAlt, FaRedo, FaDatabase, FaDownload, FaUpload, FaCheck } from 'react-icons/fa';
import { fsExportAllData, fsImportAllData, fsDownloadDataAsJson, fsGetDataStats } from '../firestoreService';

const Settings = () => {
    const { settings: contextSettings, updateSettings } = useAttendance();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        holidays: [],
        ruleSets: [],
        locations: []
    });
    const [newHoliday, setNewHoliday] = useState('');
    const [msg, setMsg] = useState('');
    const [activeTab, setActiveTab] = useState('rules');
    const [dataStats, setDataStats] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Load settings from context
        setSettings({
            holidays: contextSettings.holidays || [],
            ruleSets: (contextSettings.ruleSets || [{
                id: 'default',
                name: 'General Shift',
                startTime: '09:00',
                endTime: '18:00',
                minHalfDay: 4,
                minFullDay: 8,
                weeklyOffs: []
            }]).map(rule => ({
                ...rule,
                weeklyOffs: rule.weeklyOffs || []
            })),
            locations: contextSettings.locations || []
        });
        setLoading(false);

        // Load data stats
        fsGetDataStats().then(stats => setDataStats(stats)).catch(console.error);
    }, [contextSettings]);

    const saveSettings = async () => {
        setMsg('');
        try {
            await updateSettings(settings);
            setMsg('Settings saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            setMsg('Failed to save.');
        }
    };

    const handleResetDemo = () => {
        alert('Reset to demo is not available in Firebase mode. Use the Import feature to restore data from a backup.');
    };

    const handleExport = async () => {
        try {
            await fsDownloadDataAsJson();
            setMsg('Data exported successfully! Check your downloads folder.');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            console.error('Export error:', error);
            setMsg('Failed to export data.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (window.confirm(`Import data from "${file.name}"?\n\nThis will replace ALL current data. This action cannot be undone.`)) {
                    await fsImportAllData(data);
                    setMsg('Data imported successfully! Refreshing...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } catch (error) {
                console.error('Import error:', error);
                setMsg('Failed to import: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const addHoliday = () => {
        if (!newHoliday) return;
        if (settings.holidays.includes(newHoliday)) return;
        setSettings({ ...settings, holidays: [...settings.holidays, newHoliday].sort() });
        setNewHoliday('');
    };

    const removeHoliday = (dateStr) => {
        setSettings({ ...settings, holidays: settings.holidays.filter(h => h !== dateStr) });
    };

    const addRuleSet = () => {
        const newRule = {
            id: Date.now().toString(),
            name: 'New Shift',
            startTime: '09:00',
            endTime: '18:00',
            minHalfDay: 4,
            minFullDay: 8,
            weeklyOffs: []
        };
        setSettings({ ...settings, ruleSets: [...settings.ruleSets, newRule] });
    };

    const toggleWeeklyOff = (ruleId, day) => {
        const updated = settings.ruleSets.map(r => {
            if (r.id === ruleId) {
                const weeklyOffs = r.weeklyOffs || [];
                if (weeklyOffs.includes(day)) {
                    return { ...r, weeklyOffs: weeklyOffs.filter(d => d !== day) };
                } else {
                    return { ...r, weeklyOffs: [...weeklyOffs, day] };
                }
            }
            return r;
        });
        setSettings({ ...settings, ruleSets: updated });
    };

    const updateRuleSet = (id, field, value) => {
        const updated = settings.ruleSets.map(r => r.id === id ? { ...r, [field]: value } : r);
        setSettings({ ...settings, ruleSets: updated });
    };

    const deleteRuleSet = (id) => {
        if (settings.ruleSets.length <= 1) {
            alert("You must have at least one rule set.");
            return;
        }
        setSettings({ ...settings, ruleSets: settings.ruleSets.filter(r => r.id !== id) });
    };

    const addLocation = () => {
        const newLocation = {
            id: Date.now().toString(),
            name: 'New Location',
            latitude: '',
            longitude: '',
            radiusMeters: 100
        };
        setSettings({ ...settings, locations: [...settings.locations, newLocation] });
    };

    const updateLocation = (id, field, value) => {
        const updated = settings.locations.map(loc => loc.id === id ? { ...loc, [field]: value } : loc);
        setSettings({ ...settings, locations: updated });
    };

    const removeLocation = (id) => {
        setSettings({ ...settings, locations: settings.locations.filter(loc => loc.id !== id) });
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading settings...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Hidden file input for import */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                style={{ display: 'none' }}
            />

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: 'clamp(1.25rem, 5vw, 1.875rem)',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <FaCog style={{ color: 'var(--primary)' }} /> Settings
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Configure shift rules, holidays, locations, and manage data
                    </p>
                </div>
            </div>

            {msg && (
                <div style={{
                    padding: '0.875rem 1rem',
                    background: msg.includes('Failed') ? 'var(--danger-light)' : 'var(--success-light)',
                    color: msg.includes('Failed') ? 'var(--danger)' : 'var(--success)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    border: `1px solid ${msg.includes('Failed') ? 'var(--danger)' : 'var(--success)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <FaCheck /> {msg}
                </div>
            )}

            <div className="tabs-header" style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <button
                    className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rules')}
                    style={{ flex: 1 }}
                >
                    <FaClock /> Shift Rules
                </button>
                <button
                    className={`tab-button ${activeTab === 'holidays' ? 'active' : ''}`}
                    onClick={() => setActiveTab('holidays')}
                    style={{ flex: 1 }}
                >
                    <FaCalendarAlt /> Holidays
                </button>
                <button
                    className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('locations')}
                    style={{ flex: 1 }}
                >
                    <FaMapMarkerAlt /> Locations
                </button>
                <button
                    className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('data'); fsGetDataStats().then(stats => setDataStats(stats)).catch(console.error); }}
                    style={{ flex: 1 }}
                >
                    <FaDatabase /> Data
                </button>
            </div>

            {activeTab === 'rules' && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: '600' }}>
                            <FaClock style={{ color: 'var(--primary)' }} /> Shifts / Profiles
                        </h3>
                        <button onClick={addRuleSet} className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaPlus /> Add Shift
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {settings.ruleSets.map((rule) => (
                            <div key={rule.id} style={{
                                background: 'var(--bg-hover)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <input
                                        type="text"
                                        value={rule.name}
                                        onChange={(e) => updateRuleSet(rule.id, 'name', e.target.value)}
                                        style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--primary)', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.125rem', width: '100%', maxWidth: '200px', outline: 'none' }}
                                    />
                                    {settings.ruleSets.length > 1 && (
                                        <button onClick={() => deleteRuleSet(rule.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', fontSize: '1rem' }}>
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>Start Time</label>
                                        <input type="time" value={rule.startTime} onChange={(e) => updateRuleSet(rule.id, 'startTime', e.target.value)} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>End Time</label>
                                        <input type="time" value={rule.endTime} onChange={(e) => updateRuleSet(rule.id, 'endTime', e.target.value)} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>Min Hours (Half Day)</label>
                                        <input type="number" value={rule.minHalfDay} onChange={(e) => updateRuleSet(rule.id, 'minHalfDay', parseFloat(e.target.value))} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>Min Hours (Full Day)</label>
                                        <input type="number" value={rule.minFullDay} onChange={(e) => updateRuleSet(rule.id, 'minFullDay', parseFloat(e.target.value))} style={{ width: '100%' }} />
                                    </div>
                                </div>

                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '1rem'
                                }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.75rem'
                                    }}>
                                        Weekly Offs (Paid Leaves)
                                    </label>
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        margin: '0 0 1rem 0'
                                    }}>
                                        Select days that are weekly off days. Employees don't need to mark attendance on these days.
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem'
                                    }}>
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                            const isSelected = (rule.weeklyOffs || []).includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleWeeklyOff(rule.id, day)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                                                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                                                        color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                                        fontWeight: isSelected ? '600' : '500',
                                                        fontSize: '0.8125rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        transform: 'none',
                                                        boxShadow: 'none'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) {
                                                            e.target.style.borderColor = 'var(--border-dark)';
                                                            e.target.style.backgroundColor = 'var(--bg-hover)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) {
                                                            e.target.style.borderColor = 'var(--border-color)';
                                                            e.target.style.backgroundColor = 'var(--bg-card)';
                                                        }
                                                    }}
                                                >
                                                    {day.substring(0, 3)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {(rule.weeklyOffs || []).length > 0 && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            padding: '0.75rem',
                                            backgroundColor: 'var(--success-light)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.8125rem',
                                            color: 'var(--success)',
                                            fontWeight: '500'
                                        }}>
                                            Weekly offs: {(rule.weeklyOffs || []).join(', ')} (Paid)
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'holidays' && (
                <div className="card">
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: '600' }}>
                        <FaCalendarAlt style={{ color: 'var(--primary)' }} /> Global Paid Holidays
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>These dates apply to ALL employees regardless of shift.</p>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <input
                            type="date"
                            value={newHoliday}
                            onChange={(e) => setNewHoliday(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button onClick={addHoliday} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                            <FaPlus /> Add Holiday
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {settings.holidays.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No holidays configured.</span>}

                        {settings.holidays.map(date => (
                            <div key={date} style={{
                                background: 'var(--primary-light)',
                                padding: '0.625rem 1rem',
                                borderRadius: 'var(--radius-full)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                border: '1px solid var(--primary)'
                            }}>
                                <span style={{ color: 'var(--primary)', fontWeight: '500', fontSize: '0.875rem' }}>{date}</span>
                                <button
                                    onClick={() => removeHoliday(date)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: 0, cursor: 'pointer', fontSize: '1.125rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                                    title="Remove holiday"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'locations' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: '600' }}>
                            <FaMapMarkerAlt style={{ color: 'var(--primary)' }} /> Attendance Locations
                        </h3>
                        <button onClick={addLocation} className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaPlus /> Add Location
                        </button>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Create named locations for staff attendance. Staff must be within the radius to punch in or out.
                    </p>

                    {settings.locations.length === 0 && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No locations configured yet.</div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {settings.locations.map((location) => (
                            <div key={location.id} style={{
                                background: 'var(--bg-hover)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <input
                                        type="text"
                                        value={location.name}
                                        onChange={(e) => updateLocation(location.id, 'name', e.target.value)}
                                        style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--primary)', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.125rem', width: '100%', maxWidth: '240px', outline: 'none' }}
                                    />
                                    <button onClick={() => removeLocation(location.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', fontSize: '1rem' }} title="Delete location">
                                        <FaTrash />
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={location.latitude ?? ''}
                                            onChange={(e) => updateLocation(location.id, 'latitude', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={location.longitude ?? ''}
                                            onChange={(e) => updateLocation(location.id, 'longitude', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>Radius (meters)</label>
                                        <input
                                            type="number"
                                            min="10"
                                            step="1"
                                            value={location.radiusMeters ?? 100}
                                            onChange={(e) => updateLocation(location.id, 'radiusMeters', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'data' && (
                <div className="card">
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: '600' }}>
                        <FaDatabase style={{ color: 'var(--primary)' }} /> Data Management
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Export your data to share with others or import data from a backup file.
                    </p>

                    {/* Data Stats */}
                    {dataStats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{dataStats.totalStaff}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Staff Members</div>
                            </div>
                            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-present)' }}>{dataStats.totalAttendanceDays}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Attendance Days</div>
                            </div>
                            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{dataStats.totalMissPunchRequests}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Miss Punch Requests</div>
                            </div>
                            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#a78bfa' }}>Firebase</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Storage Mode</div>
                            </div>
                        </div>
                    )}

                    {/* Export Section */}
                    <div style={{ background: 'var(--bg-hover)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaDownload style={{ color: 'var(--color-present)' }} /> Export Data
                        </h4>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                            Download all data (staff, attendance, settings, requests) as a JSON file. Share this file with your client or use it as a backup.
                        </p>
                        <button onClick={handleExport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaDownload /> Download JSON File
                        </button>
                    </div>

                    {/* Import Section */}
                    <div style={{ background: 'var(--bg-hover)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaUpload style={{ color: 'var(--primary)' }} /> Import Data
                        </h4>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                            Load data from a previously exported JSON file. This will <strong>replace all current data</strong>.
                        </p>
                        <button onClick={handleImportClick} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaUpload /> Select JSON File to Import
                        </button>
                    </div>

                    {/* Reset Section */}
                    <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-absent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaRedo /> Reset to Demo Data
                        </h4>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                            Reset all data back to the original demo state. This will delete all changes and cannot be undone.
                        </p>
                        <button onClick={handleResetDemo} style={{
                            background: 'var(--color-absent)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '500'
                        }}>
                            <FaRedo /> Reset All Data
                        </button>
                    </div>
                </div>
            )}

            {activeTab !== 'data' && (
                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                    <button onClick={saveSettings} className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: '600' }}>
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};

export default Settings;
