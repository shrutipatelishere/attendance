import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaClipboardCheck, FaEnvelope, FaLock, FaInfoCircle } from 'react-icons/fa';

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login, currentUser, userRole } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const navigate = useNavigate();

    // Navigate once auth state is fully resolved
    useEffect(() => {
        if (currentUser && userRole) {
            navigate(userRole === 'Admin' ? '/' : '/employee', { replace: true });
        }
    }, [currentUser, userRole, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(emailRef.current.value, passwordRef.current.value);
            // Navigation handled by useEffect above after auth state settles
        } catch (err) {
            console.error(err);
            setError('Failed to log in. Check your credentials.');
            setLoading(false);
        }
    }

    const fillCredentials = (email, password) => {
        emailRef.current.value = email;
        passwordRef.current.value = password;
    };

    return (
        <div className="flex-center" style={{
            minHeight: '100vh',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-app)',
            padding: '2rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                animation: 'fadeIn 0.5s ease-out'
            }}>
                {/* Logo & Title */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: 'var(--radius-xl)',
                        marginBottom: '1rem',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <FaClipboardCheck style={{ color: 'white', fontSize: '2rem' }} />
                    </div>
                    <h1 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)'
                    }}>
                        Welcome to Presenz
                    </h1>
                    <p style={{
                        margin: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem'
                    }}>
                        Sign in to manage attendance and payroll
                    </p>
                    <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary-light)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                    }}>
                        Cloud-powered attendance management
                    </div>
                </div>

                {/* Login Card */}
                <div className="card" style={{
                    padding: '2rem',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    {error && (
                        <div style={{
                            backgroundColor: 'var(--danger-light)',
                            border: '1px solid var(--danger)',
                            color: 'var(--danger)',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem'
                    }}>
                        <div>
                            <label htmlFor="email">Email Address</label>
                            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                                <FaEnvelope style={{
                                    position: 'absolute',
                                    left: '0.875rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.875rem'
                                }} />
                                <input
                                    id="email"
                                    type="email"
                                    ref={emailRef}
                                    required
                                    placeholder="admin@presenz.com"
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password">Password</label>
                            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                                <FaLock style={{
                                    position: 'absolute',
                                    left: '0.875rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.875rem'
                                }} />
                                <input
                                    id="password"
                                    type="password"
                                    ref={passwordRef}
                                    required
                                    placeholder="Enter your password"
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem',
                                fontSize: '0.9375rem',
                                fontWeight: '600'
                            }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div style={{
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        <button
                            type="button"
                            onClick={() => setShowCredentials(!showCredentials)}
                            style={{
                                width: '100%',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                        >
                            <FaInfoCircle /> {showCredentials ? 'Hide' : 'Show'} Demo Credentials
                        </button>

                        {showCredentials && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.8125rem'
                            }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Admin Account:</strong>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '0.5rem'
                                    }}>
                                        <code style={{ color: 'var(--primary)' }}>admin@presenz.com / admin123</code>
                                        <button
                                            type="button"
                                            onClick={() => fillCredentials('admin@presenz.com', 'admin123')}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.7rem',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Use
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Employee Account:</strong>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '0.5rem'
                                    }}>
                                        <code style={{ color: 'var(--primary)' }}>rahul@presenz.com / password123</code>
                                        <button
                                            type="button"
                                            onClick={() => fillCredentials('rahul@presenz.com', 'password123')}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.7rem',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Use
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--warning-light)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--warning)',
                                    fontSize: '0.75rem'
                                }}>
                                    All employees use <strong>password123</strong> as default password
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
