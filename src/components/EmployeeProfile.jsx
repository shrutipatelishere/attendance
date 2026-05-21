import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCamera, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const EmployeeProfile = () => {
    const { currentUser } = useAuth();
    const { getMemberByUid, updateMemberImage, updateMember } = useAttendance();
    const imageInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // Inline edit state for personal info
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const profile = getMemberByUid(currentUser.uid);

    if (!profile) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <FaUser size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ margin: 0 }}>Profile not found. Please contact your admin.</p>
            </div>
        );
    }

    const resizeImage = (file, maxWidth = 200) => new Promise((resolve, reject) => {
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

    const startEdit = () => {
        setForm({
            name: profile.name || '',
            phone: profile.phone || '',
            address: profile.address || '',
        });
        setMsg('');
        setEditing(true);
    };

    const saveProfile = async () => {
        setSaving(true);
        setMsg('');
        try {
            await updateMember(profile.id, {
                name: form.name,
                phone: form.phone,
                address: form.address,
            });
            setEditing(false);
        } catch (err) {
            console.error('Error saving profile:', err);
            setMsg('Could not save. Please try again.');
        }
        setSaving(false);
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const dataUrl = await resizeImage(file, 200);
            await updateMemberImage(profile.id, dataUrl);
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Failed to upload photo.');
        }
        setUploading(false);
        e.target.value = '';
    };

    const InfoRow = ({ icon: Icon, label, value }) => {
        if (!value) return null;
        return (
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem 0',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Icon style={{ color: 'var(--primary)', fontSize: '0.9rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '2rem' }}>
            <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
            />

            {/* Profile Header */}
            <div className="glass-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2rem 1.5rem',
                marginBottom: '1rem'
            }}>
                <div
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid var(--primary)',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                >
                    {profile.profileImage ? (
                        <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <FaUser style={{ color: 'var(--text-secondary)', fontSize: '2rem' }} />
                    )}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.5)',
                        padding: '0.2rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FaCamera style={{ color: 'white', fontSize: '0.65rem' }} />
                    </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {uploading ? 'Uploading...' : 'Tap to change photo'}
                </div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    {profile.name}
                </h2>
                <span style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}>
                    {profile.role || 'Employee'}
                </span>
            </div>

            {/* Personal Info */}
            <div className="glass-panel" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Personal Information
                    </h3>
                    {!editing && (
                        <button
                            onClick={startEdit}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                            <FaEdit /> Edit
                        </button>
                    )}
                </div>

                {msg && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-absent)', marginBottom: '0.75rem' }}>{msg}</div>
                )}

                {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', paddingTop: '0.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Full Name</label>
                            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Phone</label>
                            <input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 99999..." />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Address</label>
                            <input type="text" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Flat, Street, City..." />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Email is your login ID and can only be changed by an admin.
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={saveProfile} disabled={saving} className="btn-success" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                <FaSave /> {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setEditing(false)} disabled={saving} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                <FaTimes /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <InfoRow icon={FaEnvelope} label="Email" value={profile.email} />
                        <InfoRow icon={FaPhone} label="Phone" value={profile.phone} />
                        <InfoRow icon={FaMapMarkerAlt} label="Address" value={profile.address} />
                        {!profile.phone && !profile.address && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.75rem 0' }}>
                                No phone or address added yet. Tap Edit to add.
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

export default EmployeeProfile;
