import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiConfig";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Email and password are required");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const body = await res.text();

            if (!res.ok) {
                setError(body || `Login failed (${res.status})`);
                return;
            }

            let token = body;
            try {
                const json = JSON.parse(body);
                if (json.token) token = json.token;
            } catch (_) {}

            localStorage.setItem("token", token);
            window.location.href = "/";
        } catch (err) {
            console.error(err);
            setError("Cannot connect to server");
        } finally {
            setLoading(false);
        }
    };

    const isMobile = windowWidth < 768;

    return (
        <div style={styles.container}>
            {/* Left Side: Cinematic Background (Hidden on mobile) */}
            {!isMobile && (
                <div style={styles.videoSection}>
                    <div style={styles.videoOverlay}></div>
                    <img 
                        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" 
                        alt="Cinematic Food" 
                        style={styles.backgroundImage}
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        style={styles.videoContent}
                    >
                        <h1 style={styles.brandTitle}>BiteRush</h1>
                        <p style={styles.brandSubtitle}>Taste the extraordinary, delivered fast.</p>
                        
                        <div style={styles.socialProof}>
                            <motion.div 
                                animate={{ y: [0, -10, 0] }} 
                                transition={{ repeat: Infinity, duration: 3 }}
                                style={styles.activityBadge}
                            >
                                <span style={{ marginRight: '8px' }}>🎉</span>
                                Rahul just ordered Spicy Ramen!
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Right Side: Glassmorphic Login Panel */}
            <div style={{...styles.formSection, padding: isMobile ? '20px' : '40px'}}>
                {isMobile && (
                    <div style={styles.mobileHeader}>
                        <h1 style={styles.brandTitleMobile}>BiteRush</h1>
                    </div>
                )}
                
                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    style={{...styles.glassPanel, maxWidth: isMobile ? '100%' : '450px'}}
                >
                    <h2 style={styles.loginTitle}>Welcome Back</h2>
                    <p style={styles.loginSubtitle}>Please enter your details to sign in.</p>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={styles.errorBox}
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <motion.input
                                whileFocus={{ scale: 1.02, borderColor: "#f093fb", boxShadow: "0 0 15px rgba(240, 147, 251, 0.3)" }}
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <motion.input
                                whileFocus={{ scale: 1.02, borderColor: "#f093fb", boxShadow: "0 0 15px rgba(240, 147, 251, 0.3)" }}
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.forgotPassword}>
                            <a href="#" style={styles.link}>Forgot password?</a>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px rgba(245, 87, 108, 0.4)" }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            disabled={loading}
                            style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </motion.button>
                    </form>

                    <p style={styles.signupText}>
                        Don't have an account? <Link to="/register" style={styles.signupLink}>Sign up</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    videoSection: {
        flex: 1.2,
        position: 'relative',
        overflow: 'hidden'
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0
    },
    videoOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to right, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 100%)',
        zIndex: 1
    },
    videoContent: {
        position: 'relative',
        zIndex: 2,
        padding: '100px 80px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        color: 'white'
    },
    brandTitle: {
        fontSize: '5rem',
        fontWeight: '900',
        margin: '0 0 15px 0',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-1.5px'
    },
    brandTitleMobile: {
        fontSize: '3rem',
        fontWeight: '900',
        margin: '0',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center'
    },
    mobileHeader: {
        position: 'absolute',
        top: '40px',
        width: '100%',
        textAlign: 'center',
        left: 0
    },
    brandSubtitle: {
        fontSize: '1.5rem',
        fontWeight: '400',
        opacity: 0.9,
        maxWidth: '400px',
        lineHeight: 1.4,
        margin: 0
    },
    socialProof: {
        marginTop: 'auto',
        marginBottom: '40px'
    },
    activityBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '12px 24px',
        borderRadius: '50px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontSize: '1rem',
        fontWeight: '500',
        color: '#f8fafc',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    },
    formSection: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
        background: '#0f172a',
        boxShadow: '-20px 0 50px rgba(0,0,0,0.5)'
    },
    glassPanel: {
        width: '100%',
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(20px)',
        padding: '50px 40px',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
    },
    loginTitle: {
        color: 'white',
        fontSize: '2.2rem',
        fontWeight: '800',
        margin: '0 0 10px 0',
        letterSpacing: '-0.5px'
    },
    loginSubtitle: {
        color: '#94a3b8',
        fontSize: '1rem',
        margin: '0 0 35px 0'
    },
    errorBox: {
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: '#f87171',
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '20px',
        fontSize: '0.9rem',
        fontWeight: '500'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        color: '#e2e8f0',
        fontSize: '0.9rem',
        fontWeight: '600'
    },
    input: {
        width: '100%',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box'
    },
    forgotPassword: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '-10px'
    },
    link: {
        color: '#f093fb',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: '600',
        transition: 'opacity 0.2s'
    },
    submitBtn: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        border: 'none',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
        marginTop: '10px',
        boxShadow: '0 4px 15px rgba(245, 87, 108, 0.2)'
    },
    signupText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: '30px',
        fontSize: '0.95rem'
    },
    signupLink: {
        color: '#f093fb',
        textDecoration: 'none',
        fontWeight: '700',
        marginLeft: '5px'
    }
};
