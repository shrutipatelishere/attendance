import React, { useState, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { FaUserPlus, FaTrash, FaEdit, FaCheck, FaCamera, FaUser, FaKey } from 'react-icons/fa';
import { fsCreateAuthUser, fsChangeUserPassword, fsSendPasswordReset } from '../firestoreService';

const MemberManager = () => {
    const { members, addMember, updateMember, updateMemberImage, removeMember, settings } = useAttendance();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [role, setRole] = useState('Employee');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Extended Details
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [salary, setSalary] = useState('');
    const [bankHolder, setBankHolder] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [ifsc, setIfsc] = useState('');

    // Rule Sets from context
    const ruleSets = settings?.ruleSets || [];
    const locations = settings?.locations || [];
    const [selectedRuleId, setSelectedRuleId] = useState(ruleSets[0]?.id || '');
    const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || '');

    // Image upload ref
    const imageInputRef = useRef(null);
    const [uploadingImageFor, setUploadingImageFor] = useState(null);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setCurrentPassword('');
        setNewPassword('');
        setPhone('');
        setAddress('');
        setSalary('');
        setBankHolder('');
        setBankAccount('');
        setIfsc('');
        setEditMode(false);
        setEditingId(null);
        if (ruleSets.length > 0) setSelectedRuleId(ruleSets[0].id);
        if (locations.length > 0) setSelectedLocationId(locations[0].id);
        if (locations.length === 0) setSelectedLocationId('');
    };

    const handleEdit = (member) => {
        setEditMode(true);
        setEditingId(member.id);

        setName(member.name || '');
        setEmail(member.email || '');
        setPassword('');
        setRole(member.role || 'Employee');
        setPhone(member.phone || '');
        setAddress(member.address || '');
        setSalary(member.salary || '');
        setBankHolder(member.bankDetails?.holderName || '');
        setBankAccount(member.bankDetails?.accountNo || '');
        setIfsc(member.bankDetails?.ifsc || '');
        setSelectedLocationId(member.attendanceLocationId || '');

        if (member.ruleSetId) {
            setSelectedRuleId(member.ruleSetId);
        } else if (ruleSets.length > 0) {
            setSelectedRuleId(ruleSets[0].id);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim() || !email.trim()) return;
        if (!editMode && !password.trim()) return;

        setLoading(true);
        setMsg('');

        try {
            const additionalData = {
                phone,
                address,
                salary,
                bankDetails: {
                    holderName: bankHolder,
                    accountNo: bankAccount,
                    ifsc: ifsc
                },
                ruleSetId: selectedRuleId,
                attendanceLocationId: selectedLocationId || null,
                password: password || 'password123'
            };

            if (editMode) {
                const { password: _pw, ...updateData } = additionalData;
                await updateMember(editingId, {
                    name,
                    email,
                    role,
                    ...updateData
                });

                // Change password if both fields are filled
                if (currentPassword && newPassword) {
                    await fsChangeUserPassword(email, currentPassword, newPassword);
                    setMsg('Staff details & password updated!');
                } else {
                    setMsg('Staff details updated successfully!');
                }
                resetForm();
            } else {
                // Create Firebase Auth account first
                const authUid = await fsCreateAuthUser(email, password);
                await addMember(name, email, role, authUid, additionalData);
                setMsg(`Staff created! Login: ${email} | Password: ${password}`);
                resetForm();
            }

        } catch (error) {
            console.error("Error saving staff:", error);
            setMsg('Error: ' + error.message);
        }

        setLoading(false);
    };

    // Handle image upload
    const handleImageClick = (memberId) => {
        setUploadingImageFor(memberId);
        imageInputRef.current?.click();
    };

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !uploadingImageFor) return;

        try {
            // Resize and convert to base64
            const dataUrl = await resizeImage(file, 200);
            await updateMemberImage(uploadingImageFor, dataUrl);
            setMsg('Profile image updated!');
        } catch (error) {
            console.error("Error uploading image:", error);
            setMsg('Error: Failed to upload image');
        }

        setUploadingImageFor(null);
        event.target.value = '';
    };

    // Resize image helper
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

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            {/* Hidden file input for image upload */}
            <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
            />

            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="text-gradient" style={{ margin: 0 }}>
                        {editMode ? 'Edit Staff Details' : 'Add New Staff & Create Login'}
                    </h3>
                    {editMode && (
                        <button onClick={resetForm} style={{ fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>
                            Cancel Edit
                        </button>
                    )}
                </div>

                {msg && <div style={{
                    padding: '0.8rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    background: msg.includes('Error') ? 'rgba(248, 113, 113, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                    color: msg.includes('Error') ? 'var(--color-absent)' : 'var(--color-present)',
                    userSelect: 'text',
                    fontFamily: 'monospace'
                }}>{msg}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem', alignItems: 'end' }}>
                    {/* Basic Info */}
                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-accent)' }}>Basic Credentials</div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Full Name *</label>
                        <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Email (Login ID) *</label>
                        <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    {editMode ? (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Current Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>New Password</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Password *</label>
                            <input
                                type="password"
                                placeholder="Min 6 chars"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: 'var(--glass-border)' }}>
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                            <option value="Intern">Intern</option>
                        </select>
                    </div>

                    {/* Personal & Salary */}
                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem', color: 'var(--text-accent)' }}>Personal & Salary</div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Mobile Number</label>
                        <input type="tel" placeholder="+91 99999..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Monthly Salary (Rs.)</label>
                        <input type="number" placeholder="25000" value={salary} onChange={(e) => setSalary(e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Address</label>
                        <input type="text" placeholder="Flat No, Street, City..." value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>

                    {/* Rule Sets Selector */}
                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem', color: 'var(--text-accent)' }}>Attendance Profile</div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Shift / Rule Set</label>
                        <select value={selectedRuleId} onChange={(e) => setSelectedRuleId(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: 'var(--glass-border)' }}>
                            {ruleSets.length === 0 && <option value="">Default (No Rules Found)</option>}
                            {ruleSets.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.startTime} - {r.endTime})</option>
                            ))}
                        </select>
                    </div>

                    {/* Attendance Location */}
                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem', color: 'var(--text-accent)' }}>Attendance Location</div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Location</label>
                        <select
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            required={locations.length > 0}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: 'var(--glass-border)' }}
                        >
                            <option value="">Select location</option>
                            {locations.map(location => (
                                <option key={location.id} value={location.id}>{location.name}</option>
                            ))}
                        </select>
                        {locations.length === 0 && (
                            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                No locations found. Add one in Settings.
                            </div>
                        )}
                    </div>

                    {/* Bank Details */}
                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem', color: 'var(--text-accent)' }}>Bank Details</div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Account Holder</label>
                        <input type="text" placeholder="Name as in Bank" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Account Number</label>
                        <input type="text" placeholder="0000000000" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>IFSC Code</label>
                        <input type="text" placeholder="HDFC000..." value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <button disabled={loading} type="submit" style={{ width: '100%', background: editMode ? 'var(--color-present)' : 'var(--text-accent)', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '46px', border: 'none', fontSize: '1rem', fontWeight: 'bold' }}>
                            {editMode ? <FaCheck /> : <FaUserPlus />}
                            {loading ? 'Processing...' : (editMode ? 'Update Staff Details' : 'Create Staff Profile')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {members.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No staff added yet.</div>
                ) : (
                    <div className="table-scroll">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '1rem' }}>Photo</th>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Shift</th>
                                <th style={{ padding: '1rem' }}>Location</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: editingId === member.id ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div
                                            onClick={() => handleImageClick(member.id)}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                background: 'rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                border: '2px solid rgba(255,255,255,0.2)'
                                            }}
                                            title="Click to upload photo"
                                        >
                                            {member.profileImage ? (
                                                <img
                                                    src={member.profileImage}
                                                    alt={member.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <FaUser style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }} />
                                            )}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-2px',
                                                right: '-2px',
                                                background: 'var(--text-accent)',
                                                borderRadius: '50%',
                                                width: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <FaCamera style={{ color: '#0f172a', fontSize: '0.6rem' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{member.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem'
                                        }}>
                                            {member.role || 'Employee'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {ruleSets.find(r => r.id === member.ruleSetId)?.name || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {locations.find(l => l.id === member.attendanceLocationId)?.name || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleEdit(member)}
                                            style={{ color: 'var(--text-accent)', border: 'none', padding: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px', cursor: 'pointer' }}
                                            title="Edit Staff"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => removeMember(member.id)}
                                            style={{ color: 'var(--color-absent)', border: 'none', padding: '0.5rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '6px', cursor: 'pointer' }}
                                            title="Remove Staff"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberManager;
