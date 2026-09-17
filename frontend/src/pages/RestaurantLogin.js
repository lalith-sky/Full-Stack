import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config/apiConfig';

export default function RestaurantLogin() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        restaurantName: '',
        ownerName: '',
        phone: '',
        address: '',
        cuisine: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/api/restaurant/login' : '/api/restaurant/register';
            const res = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('restaurantToken', data.token);
                localStorage.setItem('restaurantData', JSON.stringify(data.restaurant));
                navigate('/restaurant-dashboard');
            } else {
                setError(data.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const cuisineOptions = [
        'Indian', 'Italian', 'Chinese', 'Thai', 'Mexican', 'Japanese', 
        'Korean', 'Mediterranean', 'American', 'Continental', 'Fast Food'
    ];

    return (
        <div style={styles.container}>
            <div style={styles.leftPanel}>
                <div style={styles.brandSection}>
                    <h1 style={styles.brandTitle}>🍽️ BiteRush</h1>
                    <h2 style={styles.brandSubtitle}>Restaurant Partner</h2>
                    <p style={styles.brandDescription}>
                        Join thousands of restaurants delivering happiness to customers
                    </p>
                </div>
                
                <div style={styles.featuresSection}>
                    <div style={styles.feature}>
                        <div style={styles.featureIcon}>📊</div>
                        <div>
                            <h3 style={styles.featureTitle}>Real-time Dashboard</h3>
                            <p style={styles.featureDesc}>Monitor orders and analytics live</p>
                        </div>
                    </div>
                    <div style={styles.feature}>
                        <div style={styles.featureIcon}>🚀</div>
                        <div>
                            <h3 style={styles.featureTitle}>Instant Notifications</h3>
                            <p style={styles.featureDesc}>Get notified of new orders immediately</p>
                        </div>
                    </div>
                    <div style={styles.feature}>
                        <div style={styles.featureIcon}>💰</div>
                        <div>
                            <h3 style={styles.featureTitle}>Revenue Analytics</h3>
                            <p style={styles.featureDesc}>Track your earnings and growth</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.rightPanel}>
                <div style={styles.formContainer}>
                    <div style={styles.formHeader}>
                        <h2 style={styles.formTitle}>
                            {isLogin ? '🔐 Restaurant Login' : '🏪 Register Restaurant'}
                        </h2>
                        <p style={styles.formSubtitle}>
                            {isLogin 
                                ? 'Access your restaurant dashboard' 
                                : 'Start your journey with BiteRush'
                            }
                        </p>
                    </div>

                    {error && (
                        <div style={styles.errorAlert}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={styles.form}>
                        {!isLogin && (
                            <>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>🏪 Restaurant Name</label>
                                    <input
                                        type="text"
                                        name="restaurantName"
                                        value={formData.restaurantName}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                        placeholder="Enter restaurant name"
                                        required
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>👤 Owner Name</label>
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                        placeholder="Enter owner name"
                                        required
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>📱 Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>🍽️ Cuisine Type</label>
                                    <select
                                        name="cuisine"
                                        value={formData.cuisine}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">Select cuisine type</option>
                                        {cuisineOptions.map(cuisine => (
                                            <option key={cuisine} value={cuisine}>{cuisine}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>📍 Restaurant Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        style={{...styles.input, minHeight: '80px'}}
                                        placeholder="Enter complete address"
                                        required
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>📝 Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        style={{...styles.input, minHeight: '80px'}}
                                        placeholder="Describe your restaurant"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>📧 Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                style={styles.input}
                                placeholder="Enter email address"
                                required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>🔒 Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                style={styles.input}
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            style={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <span>⏳ Processing...</span>
                            ) : (
                                <span>
                                    {isLogin ? '🚀 Login to Dashboard' : '🎉 Register Restaurant'}
                                </span>
                            )}
                        </button>
                    </form>

                    <div style={styles.switchMode}>
                        <p style={styles.switchText}>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </p>
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            style={styles.switchButton}
                        >
                            {isLogin ? '📝 Register Here' : '🔐 Login Here'}
                        </button>
                    </div>

                    <div style={styles.backToApp}>
                        <Link to="/" style={styles.backLink}>
                            ← Back to Customer App
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
    },
    leftPanel: {
        flex: 1,
        padding: '60px 40px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    brandSection: {
        marginBottom: '60px'
    },
    brandTitle: {
        fontSize: '48px',
        fontWeight: '800',
        marginBottom: '12px',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    brandSubtitle: {
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '16px',
        opacity: 0.9
    },
    brandDescription: {
        fontSize: '18px',
        opacity: 0.8,
        lineHeight: '1.6'
    },
    featuresSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    feature: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
    },
    featureIcon: {
        fontSize: '32px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '12px'
    },
    featureTitle: {
        fontSize: '18px',
        fontWeight: '700',
        marginBottom: '4px'
    },
    featureDesc: {
        fontSize: '14px',
        opacity: 0.8
    },
    rightPanel: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
    },
    formContainer: {
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    },
    formHeader: {
        textAlign: 'center',
        marginBottom: '32px'
    },
    formTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#212529',
        marginBottom: '8px'
    },
    formSubtitle: {
        fontSize: '16px',
        color: '#6c757d'
    },
    errorAlert: {
        background: '#f8d7da',
        color: '#721c24',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #f5c6cb'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#495057'
    },
    input: {
        padding: '12px 16px',
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        fontSize: '16px',
        transition: 'border-color 0.3s ease',
        outline: 'none'
    },
    submitButton: {
        padding: '16px',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
        marginTop: '12px'
    },
    switchMode: {
        textAlign: 'center',
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #e9ecef'
    },
    switchText: {
        fontSize: '14px',
        color: '#6c757d',
        marginBottom: '8px'
    },
    switchButton: {
        background: 'transparent',
        color: '#ff6b6b',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'underline'
    },
    backToApp: {
        textAlign: 'center',
        marginTop: '20px'
    },
    backLink: {
        color: '#6c757d',
        textDecoration: 'none',
        fontSize: '14px'
    }
};