import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiConfig';

const PrivateRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // Validate token with backend
                const response = await fetch(`${API_BASE_URL}/auth/validate`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    // Token is invalid, remove it (don't log 401 as error)
                    if (response.status !== 401) {
                        console.warn('Token validation failed:', response.status);
                    }
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth validation failed:', error);
                // If backend is down, allow access if token exists (fallback)
                const token = localStorage.getItem('token');
                setIsAuthenticated(!!token);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Verifying authentication...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

const styles = {
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: '20px'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #ff6b6b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        color: '#666',
        fontSize: '16px',
        margin: 0
    }
};

export default PrivateRoute;