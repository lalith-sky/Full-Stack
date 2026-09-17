import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

export default function UserProfile({ onClose }) {
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || ''
                });
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                setEditing(false);
                setSuccess('Profile updated successfully!');
                
                // Update localStorage
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({
                    ...currentUser,
                    ...updatedUser
                }));
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>👤 User Profile</h2>
                    <button onClick={onClose} style={styles.closeButton}>✕</button>
                </div>

                {error && <div style={styles.errorMessage}>{error}</div>}
                {success && <div style={styles.successMessage}>{success}</div>}

                <div style={styles.content}>
                    {!editing ? (
                        <div style={styles.profileView}>
                            <div style={styles.profileItem}>
                                <label style={styles.label}>Name</label>
                                <p style={styles.value}>{user?.name || 'Not provided'}</p>
                            </div>
                            <div style={styles.profileItem}>
                                <label style={styles.label}>Email</label>
                                <p style={styles.value}>{user?.email || 'Not provided'}</p>
                            </div>
                            <div style={styles.profileItem}>
                                <label style={styles.label}>Phone</label>
                                <p style={styles.value}>{user?.phone || 'Not provided'}</p>
                            </div>
                            <div style={styles.profileItem}>
                                <label style={styles.label}>Member Since</label>
                                <p style={styles.value}>
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    disabled
                                />
                                <small style={styles.helpText}>Email cannot be changed</small>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </form>
                    )}
                </div>

                <div style={styles.actions}>
                    {!editing ? (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                style={styles.editButton}
                            >
                                ✏️ Edit Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                style={styles.logoutButton}
                            >
                                🚪 Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setEditing(false)}
                                style={styles.cancelButton}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                style={styles.saveButton}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e9ecef'
    },
    title: {
        margin: 0,
        fontSize: '24px',
        fontWeight: '700',
        color: '#2d3436'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#636e72',
        padding: '4px'
    },
    content: {
        marginBottom: '24px'
    },
    profileView: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    profileItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#636e72'
    },
    value: {
        fontSize: '16px',
        color: '#2d3436',
        margin: 0,
        padding: '8px 0'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    input: {
        padding: '12px 16px',
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.3s ease'
    },
    helpText: {
        fontSize: '12px',
        color: '#636e72',
        fontStyle: 'italic'
    },
    actions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
    },
    editButton: {
        padding: '12px 24px',
        backgroundColor: '#0984e3',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    logoutButton: {
        padding: '12px 24px',
        backgroundColor: '#d63031',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    cancelButton: {
        padding: '12px 24px',
        backgroundColor: '#636e72',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    saveButton: {
        padding: '12px 24px',
        backgroundColor: '#00b894',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    errorMessage: {
        padding: '12px 16px',
        backgroundColor: '#ffe6e6',
        border: '1px solid #ff6b6b',
        borderRadius: '8px',
        color: '#d63031',
        fontSize: '14px',
        marginBottom: '16px'
    },
    successMessage: {
        padding: '12px 16px',
        backgroundColor: '#e6ffe6',
        border: '1px solid #00b894',
        borderRadius: '8px',
        color: '#00a085',
        fontSize: '14px',
        marginBottom: '16px'
    }
};