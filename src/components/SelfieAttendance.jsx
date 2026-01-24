import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { format } from 'date-fns';
import { FaCheckCircle, FaSignOutAlt, FaSignInAlt, FaClock, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
};

const resizeSelfieFile = (file, maxWidth = 480) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
});

const parseNumber = (value) => {
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return Number.isFinite(parsed) ? parsed : null;
};

const SelfieAttendance = () => {
    const { currentUser } = useAuth();
    const { markAttendance, getDayStatus, getMemberByUid, calculateDetailedStatus, settings } = useAttendance();
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [actionError, setActionError] = useState('');
    const [selfieDataUrl, setSelfieDataUrl] = useState('');
    const [selfieError, setSelfieError] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [distanceMeters, setDistanceMeters] = useState(null);

    // Determine current state
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const dayRecords = getDayStatus(todayStr);
    const myRecord = dayRecords[currentUser.uid];

    // Find my Member Profile to get RuleSet
    const myProfile = getMemberByUid(currentUser.uid);
    const ruleSetId = myProfile?.ruleSetId;
    const locations = settings?.locations || [];
    const locationFromSettings = locations.find((location) => location.id === myProfile?.attendanceLocationId) || null;
    const attendanceLocation = locationFromSettings || myProfile?.attendanceLocation || null;
    const attendanceLocationName = locationFromSettings?.name || attendanceLocation?.name || '';
    const requiredLat = parseNumber(attendanceLocation?.latitude);
    const requiredLng = parseNumber(attendanceLocation?.longitude);
    const requiredRadius = parseNumber(attendanceLocation?.radiusMeters) ?? 100;
    const hasRequiredLocation = requiredLat !== null && requiredLng !== null;

    // Strict Status Logic
    const computed = calculateDetailedStatus(myRecord, ruleSetId);

    const hasPunchedIn = myRecord && (typeof myRecord === 'string' ? myRecord === 'present' : myRecord.status === 'present');
    const hasPunchedOut = myRecord && typeof myRecord === 'object' && myRecord.punchOut;

    const mode = hasPunchedOut ? 'done' : (hasPunchedIn ? 'out' : 'in');

    useEffect(() => {
        if (!currentLocation || !hasRequiredLocation) {
            setDistanceMeters(null);
            return;
        }

        const distance = calculateDistanceMeters(
            currentLocation.latitude,
            currentLocation.longitude,
            requiredLat,
            requiredLng
        );
        setDistanceMeters(distance);
    }, [currentLocation, hasRequiredLocation, requiredLat, requiredLng]);

    const isWithinLocation = hasRequiredLocation
        && currentLocation
        && Number.isFinite(distanceMeters)
        && distanceMeters <= requiredRadius;
    const canSubmit = !loading && !!selfieDataUrl && isWithinLocation;

    const handleSelfieChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelfieError('');
        try {
            const dataUrl = await resizeSelfieFile(file);
            setSelfieDataUrl(dataUrl);
        } catch (error) {
            console.error("Error processing selfie:", error);
            setSelfieError('Unable to process selfie. Try again.');
        } finally {
            event.target.value = '';
        }
    };

    const requestLocation = () => {
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported on this device.');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
                setLocationLoading(false);
            },
            (error) => {
                setLocationError(error.message || 'Unable to fetch location.');
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };

    const resetCapture = () => {
        setSelfieDataUrl('');
        setSelfieError('');
        setActionError('');
    };

    const submitAttendance = async () => {
        if (!currentUser) return;
        setActionError('');

        if (!selfieDataUrl) {
            setActionError('Selfie is required to mark attendance.');
            return;
        }

        if (!hasRequiredLocation) {
            setActionError('Attendance location is not set. Contact admin.');
            return;
        }

        if (!currentLocation) {
            setActionError('Please capture your location first.');
            return;
        }

        if (!isWithinLocation) {
            setActionError('You are outside the allowed attendance location.');
            return;
        }

        setLoading(true);

        try {
            const timeStr = format(new Date(), 'HH:mm:ss');
            const capturedAt = new Date().toISOString();
            const selfiePayload = {
                dataUrl: selfieDataUrl,
                capturedAt
            };
            const locationPayload = {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                accuracy: currentLocation.accuracy,
                capturedAt
            };
            let data = {};
            if (mode === 'in') {
                data = {
                    status: 'present',
                    punchIn: timeStr,
                    punchOut: null,
                    selfieIn: selfiePayload,
                    locationIn: locationPayload
                };
            } else if (mode === 'out') {
                const existing = typeof myRecord === 'object' ? myRecord : { status: 'present', punchIn: '???' };
                data = {
                    ...existing,
                    punchOut: timeStr,
                    selfieOut: selfiePayload,
                    locationOut: locationPayload
                };
            }

            await markAttendance(todayStr, currentUser.uid, data);
            setStatusMsg(`Successfully Punched ${mode === 'in' ? 'In' : 'Out'} at ${timeStr}`);
            resetCapture();
        } catch (error) {
            console.error("Error marking attendance:", error);
            alert("Failed. " + error.message);
        }
        setLoading(false);
    };

    if (mode === 'done' && !statusMsg) {
        // Updated View to show Strict Status
        return (
            <div className="flex-center" style={{ minHeight: '50vh', flexDirection: 'column', textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ maxWidth: '500px', width: '100%' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: computed.status === 'present' ? 'var(--success-light)' :
                            computed.status === 'halfday' ? 'var(--warning-light)' :
                                computed.status === 'short' ? 'var(--danger-light)' : 'var(--bg-secondary)',
                        marginBottom: '1.5rem'
                    }}>
                        {computed.status === 'present' && <FaCheckCircle size={40} color="var(--success)" />}
                        {computed.status === 'halfday' && <FaExclamationCircle size={40} color="var(--warning)" />}
                        {computed.status === 'short' && <FaTimesCircle size={40} color="var(--danger)" />}
                        {!computed.status && <FaCheckCircle size={40} color="var(--text-muted)" />}
                    </div>

                    <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {computed.status === 'present' ? 'Day Completed!' :
                            computed.status === 'halfday' ? 'Half Day Credit' :
                                computed.status === 'short' ? 'Short Duration' : 'Attendance Logged'}
                    </h2>

                    <p style={{
                        color: computed.status === 'present' ? 'var(--success)' :
                            computed.status === 'halfday' ? 'var(--warning)' :
                                computed.status === 'short' ? 'var(--danger)' : 'var(--text-secondary)',
                        fontWeight: '600',
                        fontSize: '1rem',
                        margin: '0 0 2rem 0'
                    }}>
                        {computed.label}
                    </p>

                    <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Punch In:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                {myRecord?.punchIn}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Punch Out:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                {myRecord?.punchOut}
                            </span>
                        </div>
                        {computed.duration && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '0.875rem'
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Hours:</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)', fontSize: '0.875rem' }}>
                                    {Math.floor(computed.duration)}h {Math.round((computed.duration % 1) * 60)}m
                                </span>
                            </div>
                        )}
                    </div>

                    {computed.status === 'short' && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '0.875rem 1rem',
                            backgroundColor: 'var(--danger-light)',
                            border: '1px solid var(--danger)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8125rem',
                            color: 'var(--danger)',
                            textAlign: 'left'
                        }}>
                            <strong>Note:</strong> Your work duration is less than the minimum required for a Half Day credit.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (statusMsg) {
        return (
            <div className="flex-center" style={{ minHeight: '50vh', flexDirection: 'column', textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ maxWidth: '400px', width: '100%', padding: '2rem 1.5rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--success-light)',
                        marginBottom: '1.5rem'
                    }}>
                        <FaCheckCircle size={40} color="var(--success)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>Success!</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0' }}>{statusMsg}</p>
                    <button onClick={() => {
                        setStatusMsg('');
                        resetCapture();
                    }} style={{ width: '100%' }}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        {format(new Date(), 'EEEE, MMM dd')}
                    </h2>
                    <div style={{
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <FaClock /> {format(new Date(), 'yyyy')}
                    </div>
                </div>

                <div style={{ width: '100%', display: 'grid', gap: '1rem' }}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem',
                        display: 'grid',
                        gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Selfie Check</strong>
                            <span style={{
                                fontSize: '0.8rem',
                                color: selfieDataUrl ? 'var(--success)' : 'var(--text-secondary)',
                                fontWeight: 600
                            }}>
                                {selfieDataUrl ? 'Captured' : 'Not captured'}
                            </span>
                        </div>
                        {selfieDataUrl ? (
                            <img
                                src={selfieDataUrl}
                                alt="Selfie preview"
                                style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{
                                border: '1px dashed var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem'
                            }}>
                                Capture a clear selfie before punching {mode === 'in' ? 'in' : 'out'}.
                            </div>
                        )}
                        <input
                            id="selfie-capture"
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handleSelfieChange}
                            style={{ display: 'none' }}
                        />
                        <label
                            htmlFor="selfie-capture"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.65rem 1rem',
                                borderRadius: '999px',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {selfieDataUrl ? 'Retake Selfie' : 'Take Selfie'}
                        </label>
                        {selfieError && (
                            <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{selfieError}</div>
                        )}
                    </div>

                    <div style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem',
                        display: 'grid',
                        gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Location Check</strong>
                            <span style={{
                                fontSize: '0.8rem',
                                color: isWithinLocation ? 'var(--success)' : 'var(--text-secondary)',
                                fontWeight: 600
                            }}>
                                {isWithinLocation ? 'Within range' : 'Not verified'}
                            </span>
                        </div>
                        {hasRequiredLocation ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Required: {attendanceLocationName ? `${attendanceLocationName} - ` : ''}{requiredLat.toFixed(6)}, {requiredLng.toFixed(6)} (radius {Math.round(requiredRadius)}m)
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
                                Location not set for your profile. Contact admin.
                            </div>
                        )}
                        {currentLocation && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Current: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                {Number.isFinite(currentLocation.accuracy) && ` (+/-${Math.round(currentLocation.accuracy)}m)`}
                            </div>
                        )}
                        {Number.isFinite(distanceMeters) && (
                            <div style={{ fontSize: '0.85rem', color: isWithinLocation ? 'var(--success)' : 'var(--danger)' }}>
                                Distance: {Math.round(distanceMeters)}m {isWithinLocation ? 'inside' : 'outside'} allowed area
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={requestLocation}
                            disabled={locationLoading}
                            style={{
                                borderRadius: '999px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                padding: '0.6rem 1rem',
                                fontWeight: 600
                            }}
                        >
                            {locationLoading ? 'Locating...' : (currentLocation ? 'Refresh Location' : 'Get Location')}
                        </button>
                        {locationError && (
                            <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{locationError}</div>
                        )}
                    </div>
                </div>

                <button
                    onClick={submitAttendance}
                    disabled={!canSubmit}
                    style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: mode === 'in' ? 'var(--success)' : 'var(--danger)',
                        color: 'white',
                        border: '6px solid ' + (mode === 'in' ? 'var(--success-light)' : 'var(--danger-light)'),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        boxShadow: 'var(--shadow-xl)',
                        transition: 'all 0.2s ease',
                        cursor: canSubmit ? 'pointer' : 'not-allowed'
                    }}
                    onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.95)')}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {loading ? (
                        <span style={{ fontSize: '1rem' }}>Processing...</span>
                    ) : (
                        mode === 'in' ? (
                            <>
                                <FaSignInAlt size={48} />
                                <div style={{ fontSize: '1.25rem' }}>Punch In</div>
                            </>
                        ) : (
                            <>
                                <FaSignOutAlt size={48} />
                                <div style={{ fontSize: '1.25rem' }}>Punch Out</div>
                            </>
                        )
                    )}
                </button>

                {actionError && (
                    <div style={{
                        textAlign: 'center',
                        backgroundColor: 'var(--danger-light)',
                        color: 'var(--danger)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                    }}>
                        {actionError}
                    </div>
                )}

                {hasPunchedIn && mode === 'out' && (
                    <div style={{
                        textAlign: 'center',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                    }}>
                        Punched In at: <strong>{typeof myRecord === 'object' ? myRecord.punchIn : 'Unknown'}</strong>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelfieAttendance;
