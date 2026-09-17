import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { API_BASE_URL } from '../config/apiConfig';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LiveOrderTracking = ({ orderId }) => {
    const [order, setOrder] = useState(null);
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const intervalRef = useRef(null);
    
    // Live countdown timer state
    const [etaSeconds, setEtaSeconds] = useState(1440); // 24 mins default
    
    const token = localStorage.getItem('token');

    useEffect(() => {
        const timer = setInterval(() => {
            setEtaSeconds(prev => (prev > 10 ? prev - 1 : prev));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchOrderDetails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setOrder(data);
                
                if (data.status === 'OUT_FOR_DELIVERY' || data.status === 'NEARBY') {
                    simulateDeliveryLocation(data);
                }
                
                setLoading(false);
            } else {
                setError('Failed to load order details');
                setLoading(false);
            }
        } catch (err) {
            setError('Cannot connect to server');
            setLoading(false);
        }
    };

    const simulateDeliveryLocation = (orderData) => {
        const restaurantLat = orderData.restaurant?.latitude || 17.4239;
        const restaurantLng = orderData.restaurant?.longitude || 78.4738;
        const deliveryLat = orderData.deliveryLatitude || 17.4326;
        const deliveryLng = orderData.deliveryLongitude || 78.4071;

        const currentLat = (restaurantLat + deliveryLat) / 2;
        const currentLng = (restaurantLng + deliveryLng) / 2;

        setDeliveryLocation({
            lat: currentLat,
            lng: currentLng
        });
    };

    useEffect(() => {
        fetchOrderDetails();
        intervalRef.current = setInterval(fetchOrderDetails, 10000);
        return () => clearInterval(intervalRef.current);
    }, [orderId]);

    const getStatusProgress = (status) => {
        const statuses = {
            'PENDING': 10,
            'CONFIRMED': 30,
            'PREPARING': 50,
            'READY': 70,
            'OUT_FOR_DELIVERY': 85,
            'NEARBY': 95,
            'DELIVERED': 100
        };
        return statuses[status] || 10;
    };

    const getStatusColor = (status) => {
        const colors = {
            'PENDING': '#fbbf24',
            'CONFIRMED': '#3b82f6',
            'PREPARING': '#8b5cf6',
            'READY': '#ec4899',
            'OUT_FOR_DELIVERY': '#10b981',
            'NEARBY': '#06b6d4',
            'DELIVERED': '#10b981',
            'CANCELLED': '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}></div>
                <p>Establishing secure AI path tracking...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={styles.errorContainer}>
                <p>❌ {error || 'Order tracking not found'}</p>
            </div>
        );
    }

    const restaurantLocation = {
        lat: order.restaurant?.latitude || 17.4239,
        lng: order.restaurant?.longitude || 78.4738
    };

    const customerLocation = {
        lat: order.deliveryLatitude || 17.4326,
        lng: order.deliveryLongitude || 78.4071
    };

    const showMap = order.status === 'OUT_FOR_DELIVERY' || order.status === 'NEARBY';
    const etaMinutes = Math.floor(etaSeconds / 60);
    const etaSecRemaining = etaSeconds % 60;

    return (
        <div style={styles.container}>
            
            {/* Header / ID card */}
            <div style={styles.header}>
                <span style={styles.liveBadge}>● LIVE FEED</span>
                <h2 style={styles.title}>Track Order Progress</h2>
                <p style={styles.orderId}>ID: #{order.id} • Secure Connection</p>
            </div>

            {/* Primary Status Card */}
            <div style={styles.statusCard}>
                <div style={styles.statusHeader}>
                    <div>
                        <span style={styles.statusLabel}>Current Status</span>
                        <h3 style={{...styles.statusVal, color: getStatusColor(order.status)}}>
                            {order.status.replace(/_/g, ' ')}
                        </h3>
                    </div>
                    
                    {/* Real-time countdown clock */}
                    <div style={styles.etaBox}>
                        <div style={styles.etaVal}>{etaMinutes}:{etaSecRemaining < 10 ? '0' + etaSecRemaining : etaSecRemaining}</div>
                        <div style={styles.etaLbl}>Est. Arrival time</div>
                    </div>
                </div>

                {/* Progress bar line */}
                <div style={styles.progressBar}>
                    <div style={{
                        ...styles.progressFill,
                        width: `${getStatusProgress(order.status)}%`,
                        background: `linear-gradient(90deg, #667eea, ${getStatusColor(order.status)})`
                    }}></div>
                </div>

                {/* Timeline Row */}
                <div style={styles.timeline}>
                    {['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'].map((status) => {
                        const isCompleted = getStatusProgress(order.status) >= getStatusProgress(status);
                        return (
                            <div key={status} style={styles.timelineItem}>
                                <div style={{
                                    ...styles.timelineDot,
                                    background: isCompleted ? getStatusColor(status) : '#cbd5e1'
                                }}></div>
                                <span style={styles.timelineLabel}>{status.replace(/_/g, ' ')}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chef / Kitchen Status widget */}
            <div style={styles.chefCard}>
                <h4 style={styles.sectionTitle}>👨‍🍳 Kitchen Update</h4>
                <div style={styles.chefLayout}>
                    <span style={styles.chefIcon}>🍳</span>
                    <div>
                        <strong>Executive Chef Kabir</strong>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            {order.status === 'PENDING' || order.status === 'CONFIRMED' ? 'Waiting for kitchen to fire ingredients' :
                             order.status === 'PREPARING' ? 'Plating the dish & preparing secondary packaging' :
                             'Order ready, waiting for pickup'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Live Map wrapper */}
            {showMap && deliveryLocation ? (
                <div style={styles.mapSection}>
                    <h3 style={styles.mapTitle}>🗺️ Real-time Delivery Route</h3>
                    <div style={styles.mapContainer}>
                        <MapContainer
                            center={[deliveryLocation.lat, deliveryLocation.lng]}
                            zoom={14}
                            style={{ height: '100%', width: '100%', borderRadius: '16px' }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[restaurantLocation.lat, restaurantLocation.lng]}>
                                <Popup><strong>{order.restaurant?.name}</strong></Popup>
                            </Marker>
                            <Marker position={[deliveryLocation.lat, deliveryLocation.lng]}>
                                <Popup><strong>🏍️ Partner: {order.deliveryPartnerName || 'Driver'}</strong></Popup>
                            </Marker>
                            <Marker position={[customerLocation.lat, customerLocation.lng]}>
                                <Popup><strong>📍 Your Location</strong></Popup>
                            </Marker>
                            <Polyline
                                positions={[[restaurantLocation.lat, restaurantLocation.lng], [deliveryLocation.lat, deliveryLocation.lng], [customerLocation.lat, customerLocation.lng]]}
                                color="#4f46e5"
                                weight={3}
                                opacity={0.6}
                                dashArray="8, 8"
                            />
                        </MapContainer>
                    </div>
                </div>
            ) : (
                <div style={styles.mapPlaceholder}>
                    <span style={styles.placeholderIcon}>🗺️</span>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Live map updates will stream once the driver picks up your food package.</p>
                </div>
            )}

            {/* Delivery Driver Info */}
            {(order.status === 'OUT_FOR_DELIVERY' || order.status === 'NEARBY' || order.status === 'READY') && (
                <div style={styles.partnerCard}>
                    <div style={styles.partnerAvatar}>
                        🏍️
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{order.deliveryPartnerName || 'Amit Kumar'}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>🌱 Green Electric Bike Partner • ⭐ 4.8</p>
                    </div>
                    <a href={`tel:9876543210`} style={styles.callButton}>📞 Call driver</a>
                </div>
            )}

            {/* Traffic prediction metrics */}
            <div style={styles.trafficCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>🚦 Traffic Status: <strong>Moderate</strong></span>
                    <span>📊 Path accuracy: <strong>99% Confidence</strong></span>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '700px',
        margin: '0 auto',
        padding: '30px 20px 80px'
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '15px'
    },
    loader: {
        width: '45px',
        height: '45px',
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #4f46e5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    errorContainer: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#ef4444'
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
    },
    liveBadge: {
        fontSize: '10px',
        background: '#fee2e2',
        color: '#ef4444',
        padding: '4px 12px',
        borderRadius: '20px',
        fontWeight: '800',
        letterSpacing: '0.5px'
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: '850',
        color: '#1e293b',
        margin: 0
    },
    orderId: {
        fontSize: '13px',
        color: '#64748b',
        margin: 0
    },
    statusCard: {
        background: 'white',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
        marginBottom: '20px'
    },
    statusHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    statusLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase'
    },
    statusVal: {
        fontSize: '22px',
        fontWeight: '800',
        margin: '4px 0 0 0',
        textTransform: 'capitalize'
    },
    etaBox: {
        textAlign: 'right'
    },
    etaVal: {
        fontSize: '24px',
        fontWeight: '900',
        color: '#4f46e5'
    },
    etaLbl: {
        fontSize: '10px',
        color: '#64748b',
        fontWeight: '600'
    },
    progressBar: {
        height: '6px',
        background: '#f1f5f9',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '20px'
    },
    progressFill: {
        height: '100%',
        borderRadius: '10px',
        transition: 'width 0.5s ease'
    },
    timeline: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    timelineItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        flex: 1
    },
    timelineDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%'
    },
    timelineLabel: {
        fontSize: '11px',
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'capitalize'
    },
    chefCard: {
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
    },
    sectionTitle: {
        margin: '0 0 12px 0',
        fontSize: '15px',
        fontWeight: '800',
        color: '#1e293b'
    },
    chefLayout: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
    },
    chefIcon: {
        fontSize: '2rem',
        background: '#f1f5f9',
        padding: '8px',
        borderRadius: '12px'
    },
    mapSection: {
        background: 'white',
        borderRadius: '24px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
    },
    mapTitle: {
        fontSize: '16px',
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: '12px'
    },
    mapContainer: {
        height: '350px',
        overflow: 'hidden'
    },
    mapPlaceholder: {
        background: 'white',
        border: '1px dashed #cbd5e1',
        borderRadius: '24px',
        padding: '40px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
    },
    placeholderIcon: {
        fontSize: '2.5rem'
    },
    partnerCard: {
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px'
    },
    partnerAvatar: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        background: '#e0e7ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem'
    },
    callButton: {
        padding: '10px 18px',
        background: '#10b981',
        color: 'white',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: '700',
        textDecoration: 'none'
    },
    trafficCard: {
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '12px 18px',
        border: '1px solid #e2e8f0'
    }
};

export default LiveOrderTracking;
