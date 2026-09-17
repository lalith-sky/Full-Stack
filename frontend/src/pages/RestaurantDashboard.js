import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiConfig';

export default function RestaurantDashboard() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');
    const [menuItems, setMenuItems] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [menuLoading, setMenuLoading] = useState(false);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        price: '',
        category: '',
        description: '',
        isVeg: true,
        isSpicy: false,
        imageUrl: ''
    });
    const [stats, setStats] = useState({
        todayOrders: 0,
        todayRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0
    });

    const token = localStorage.getItem("restaurantToken");

    useEffect(() => {
        if (!token) {
            navigate('/restaurant-login');
            return;
        }
        fetchRestaurantData();
        fetchOrders();
        fetchMenu(); // Initial fetch
        fetchAnalytics();
        // Poll for new orders every 10 seconds
        const interval = setInterval(() => {
            fetchOrders();
        }, 10000);
        return () => clearInterval(interval);
    }, [token, navigate]);

    const fetchMenu = async () => {
        setMenuLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/partner/menu`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMenuItems(data);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setMenuLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/partner/analytics`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleAddMenuItem = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/partner/menu`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewItem({
                    name: '', price: '', category: '', description: '',
                    isVeg: true, isSpicy: false, imageUrl: ''
                });
                fetchMenu();
            }
        } catch (error) {
            console.error('Error adding menu item:', error);
        }
    };

    const handleToggleAvailability = async (itemId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/partner/menu/${itemId}/toggle-availability`, {
                method: 'PATCH',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchMenu();
            }
        } catch (error) {
            console.error('Error toggling availability:', error);
        }
    };

    const handleDeleteMenuItem = async (itemId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/partner/menu/${itemId}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchMenu();
            }
        } catch (error) {
            console.error('Error deleting menu item:', error);
        }
    };

    const fetchRestaurantData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/restaurant/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRestaurant(data);
            }
        } catch (error) {
            console.error('Error fetching restaurant data:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/restaurant/orders`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (orderData) => {
        const today = new Date().toDateString();
        const todayOrders = orderData.filter(order => 
            new Date(order.createdAt).toDateString() === today
        );
        
        setStats({
            todayOrders: todayOrders.length,
            todayRevenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            pendingOrders: orderData.filter(order => order.status === 'PENDING').length,
            completedOrders: orderData.filter(order => order.status === 'DELIVERED').length
        });
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`${API_BASE_URL}/restaurant/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (res.ok) {
                fetchOrders(); // Refresh orders
                // Show success notification
                alert(`Order ${newStatus.toLowerCase()} successfully!`);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#ff9800';
            case 'ACCEPTED': return '#2196f3';
            case 'PREPARING': return '#9c27b0';
            case 'READY': return '#4caf50';
            case 'OUT_FOR_DELIVERY': return '#ff5722';
            case 'DELIVERED': return '#8bc34a';
            case 'CANCELLED': return '#f44336';
            default: return '#757575';
        }
    };

    const getNextStatus = (currentStatus) => {
        const statusFlow = {
            'PENDING': 'ACCEPTED',
            'ACCEPTED': 'PREPARING',
            'PREPARING': 'READY',
            'READY': 'OUT_FOR_DELIVERY',
            'OUT_FOR_DELIVERY': 'DELIVERED'
        };
        return statusFlow[currentStatus];
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const logout = () => {
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantData');
        navigate('/restaurant-login');
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}></div>
                <p>Loading restaurant dashboard...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.title}>🍽️ {restaurant?.name || 'Restaurant'} Dashboard</h1>
                    <p style={styles.subtitle}>Manage your orders and restaurant operations</p>
                </div>
                <div style={styles.headerRight}>
                    <button onClick={logout} style={styles.logoutBtn}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <div style={styles.statContent}>
                        <h3 style={styles.statNumber}>{stats.todayOrders}</h3>
                        <p style={styles.statLabel}>Today's Orders</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💰</div>
                    <div style={styles.statContent}>
                        <h3 style={styles.statNumber}>₹{stats.todayRevenue}</h3>
                        <p style={styles.statLabel}>Today's Revenue</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>⏳</div>
                    <div style={styles.statContent}>
                        <h3 style={styles.statNumber}>{stats.pendingOrders}</h3>
                        <p style={styles.statLabel}>Pending Orders</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>✅</div>
                    <div style={styles.statContent}>
                        <h3 style={styles.statNumber}>{stats.completedOrders}</h3>
                        <p style={styles.statLabel}>Completed Orders</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={styles.tabContainer}>
                <button 
                    onClick={() => setActiveTab('orders')}
                    style={{...styles.tab, ...(activeTab === 'orders' ? styles.activeTab : {})}}
                >
                    📋 Orders
                </button>
                <button 
                    onClick={() => setActiveTab('menu')}
                    style={{...styles.tab, ...(activeTab === 'menu' ? styles.activeTab : {})}}
                >
                    🍽️ Menu Management
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    style={{...styles.tab, ...(activeTab === 'analytics' ? styles.activeTab : {})}}
                >
                    📈 Analytics
                </button>
            </div>

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div style={styles.ordersContainer}>
                    <h2 style={styles.sectionTitle}>📋 Live Orders</h2>
                    {orders.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📭</div>
                            <h3>No orders yet</h3>
                            <p>New orders will appear here automatically</p>
                        </div>
                    ) : (
                        <div style={styles.ordersGrid}>
                            {orders.map(order => (
                                <div key={order.id} style={styles.orderCard}>
                                    <div style={styles.orderHeader}>
                                        <div style={styles.orderInfo}>
                                            <h3 style={styles.orderId}>Order #{order.id}</h3>
                                            <p style={styles.orderTime}>{formatTime(order.createdAt)}</p>
                                        </div>
                                        <div 
                                            style={{
                                                ...styles.statusBadge,
                                                backgroundColor: getStatusColor(order.status)
                                            }}
                                        >
                                            {order.status}
                                        </div>
                                    </div>

                                    <div style={styles.customerInfo}>
                                        <p><strong>👤 Customer:</strong> {order.customerName}</p>
                                        <p><strong>📱 Phone:</strong> {order.customerPhone}</p>
                                        <p><strong>📍 Address:</strong> {order.deliveryAddress}</p>
                                    </div>

                                    <div style={styles.orderItems}>
                                        <h4>🍽️ Items:</h4>
                                        {order.items?.map((item, index) => (
                                            <div key={index} style={styles.orderItem}>
                                                <span>{item.quantity}x {item.name}</span>
                                                <span>₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={styles.orderFooter}>
                                        <div style={styles.totalAmount}>
                                            <strong>💰 Total: ₹{order.totalAmount}</strong>
                                        </div>
                                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                            <div style={styles.actionButtons}>
                                                {order.status === 'PENDING' && (
                                                    <>
                                                        <button 
                                                            onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                                                            style={{...styles.actionBtn, ...styles.acceptBtn}}
                                                        >
                                                            ✅ Accept
                                                        </button>
                                                        <button 
                                                            onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                                                            style={{...styles.actionBtn, ...styles.rejectBtn}}
                                                        >
                                                            ❌ Reject
                                                        </button>
                                                    </>
                                                )}
                                                {getNextStatus(order.status) && (
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                                                        style={{...styles.actionBtn, ...styles.nextBtn}}
                                                    >
                                                        ➡️ {getNextStatus(order.status)}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Menu Management Tab */}
            {activeTab === 'menu' && (
                <div style={styles.menuContainer}>
                    <div style={styles.menuHeader}>
                        <h2 style={styles.sectionTitle}>🍽️ Menu Management</h2>
                        <button 
                            style={styles.addItemBtn}
                            onClick={() => setShowAddModal(true)}
                        >
                            ➕ Add New Item
                        </button>
                    </div>

                    {menuLoading ? (
                        <div style={styles.loadingContainer}>
                            <div style={styles.loader}></div>
                            <p>Loading menu items...</p>
                        </div>
                    ) : menuItems.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>🍽️</div>
                            <h3>Your menu is empty</h3>
                            <p>Start adding delicious dishes to your restaurant!</p>
                        </div>
                    ) : (
                        <div style={styles.menuGrid}>
                            {menuItems.map(item => (
                                <div key={item.id} style={{
                                    ...styles.menuItemCard,
                                    opacity: item.available ? 1 : 0.7
                                }}>
                                    <div style={styles.menuItemImageContainer}>
                                        <img 
                                            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'} 
                                            alt={item.name} 
                                            style={styles.menuItemImage}
                                        />
                                        {!item.available && (
                                            <div style={styles.soldOutOverlay}>SOLD OUT</div>
                                        )}
                                    </div>
                                    <div style={styles.menuItemContent}>
                                        <div style={styles.menuItemHeader}>
                                            <h3 style={styles.menuItemName}>{item.name}</h3>
                                            <span style={styles.menuItemPrice}>₹{item.price}</span>
                                        </div>
                                        <p style={styles.menuItemDesc}>{item.description}</p>
                                        <div style={styles.menuItemFooter}>
                                            <span style={{
                                                ...styles.categoryTag,
                                                background: item.isVeg ? '#e6fffa' : '#fff5f5',
                                                color: item.isVeg ? '#2c7a7b' : '#c53030'
                                            }}>
                                                {item.isVeg ? '🥗 Veg' : '🍗 Non-Veg'}
                                            </span>
                                            <div style={styles.menuItemActions}>
                                                <button 
                                                    onClick={() => handleToggleAvailability(item.id)}
                                                    style={{
                                                        ...styles.toggleBtn,
                                                        background: item.available ? '#48bb78' : '#cbd5e0'
                                                    }}
                                                    title={item.available ? "Mark as Sold Out" : "Mark as Available"}
                                                >
                                                    {item.available ? '✅ In Stock' : '❌ Sold Out'}
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteMenuItem(item.id)}
                                                    style={styles.deleteBtn}
                                                    title="Delete Item"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Item Modal */}
                    {showAddModal && (
                        <div style={styles.modalOverlay}>
                            <div style={styles.modal}>
                                <div style={styles.modalHeader}>
                                    <h3>➕ Add New Menu Item</h3>
                                    <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>✕</button>
                                </div>
                                <form onSubmit={handleAddMenuItem} style={styles.modalForm}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Dish Name</label>
                                        <input 
                                            type="text" 
                                            style={styles.input} 
                                            placeholder="e.g. Special Chicken Biryani"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div style={styles.formRow}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Price (₹)</label>
                                            <input 
                                                type="number" 
                                                style={styles.input} 
                                                placeholder="299"
                                                value={newItem.price}
                                                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Category</label>
                                            <input 
                                                type="text" 
                                                style={styles.input} 
                                                placeholder="e.g. Main Course"
                                                value={newItem.category}
                                                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Description</label>
                                        <textarea 
                                            style={{...styles.input, height: '80px'}} 
                                            placeholder="Tell your customers what's special about this dish..."
                                            value={newItem.description}
                                            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                        />
                                    </div>
                                    <div style={styles.formRow}>
                                        <div style={styles.checkboxGroup}>
                                            <input 
                                                type="checkbox" 
                                                id="isVeg"
                                                checked={newItem.isVeg}
                                                onChange={(e) => setNewItem({...newItem, isVeg: e.target.checked})}
                                            />
                                            <label htmlFor="isVeg">Vegetarian</label>
                                        </div>
                                        <div style={styles.checkboxGroup}>
                                            <input 
                                                type="checkbox" 
                                                id="isSpicy"
                                                checked={newItem.isSpicy}
                                                onChange={(e) => setNewItem({...newItem, isSpicy: e.target.checked})}
                                            />
                                            <label htmlFor="isSpicy">Spicy</label>
                                        </div>
                                    </div>
                                    <button type="submit" style={styles.submitBtn}>🚀 Add to Menu</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div style={styles.analyticsContainer}>
                    <h2 style={styles.sectionTitle}>📈 Performance Analytics</h2>
                    
                    {analyticsLoading ? (
                        <div style={styles.loadingContainer}>
                            <div style={styles.loader}></div>
                            <p>Calculating your performance...</p>
                        </div>
                    ) : analytics ? (
                        <div style={styles.analyticsGrid}>
                            <div style={styles.analyticsCard}>
                                <div style={styles.analyticsIcon}>💰</div>
                                <div style={styles.analyticsInfo}>
                                    <h3>Total Revenue</h3>
                                    <p style={styles.analyticsValue}>₹{analytics.totalRevenue}</p>
                                </div>
                            </div>
                            <div style={styles.analyticsCard}>
                                <div style={styles.analyticsIcon}>📦</div>
                                <div style={styles.analyticsInfo}>
                                    <h3>Total Orders</h3>
                                    <p style={styles.analyticsValue}>{analytics.totalOrders}</p>
                                </div>
                            </div>
                            <div style={styles.analyticsCard}>
                                <div style={styles.analyticsIcon}>⭐</div>
                                <div style={styles.analyticsInfo}>
                                    <h3>Avg. Rating</h3>
                                    <p style={styles.analyticsValue}>{analytics.customerRating}</p>
                                </div>
                            </div>
                            
                            <div style={styles.fullWidthCard}>
                                <h3>📊 Best Sellers</h3>
                                <div style={styles.topItemsList}>
                                    {analytics.topItems.map(item => (
                                        <div key={item.id} style={styles.topItemRow}>
                                            <span>{item.name}</span>
                                            <span style={styles.itemCount}>{Math.floor(Math.random() * 100)} orders</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>Unable to load analytics at this moment.</p>
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#f8f9fa',
        padding: '20px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px'
    },
    headerLeft: {
        flex: 1
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#212529',
        margin: '0 0 8px 0'
    },
    subtitle: {
        fontSize: '16px',
        color: '#6c757d',
        margin: 0
    },
    headerRight: {
        display: 'flex',
        gap: '12px'
    },
    logoutBtn: {
        padding: '12px 24px',
        background: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
    },
    statCard: {
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    statIcon: {
        fontSize: '32px',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '12px'
    },
    statContent: {
        flex: 1
    },
    statNumber: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#212529',
        margin: '0 0 4px 0'
    },
    statLabel: {
        fontSize: '14px',
        color: '#6c757d',
        margin: 0
    },
    tabContainer: {
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: 'white',
        padding: '8px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    tab: {
        padding: '12px 24px',
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        color: '#6c757d',
        transition: 'all 0.3s ease'
    },
    activeTab: {
        background: '#ff6b6b',
        color: 'white'
    },
    ordersContainer: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#212529',
        marginBottom: '24px'
    },
    ordersGrid: {
        display: 'grid',
        gap: '20px'
    },
    orderCard: {
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '20px',
        background: '#fff'
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    orderInfo: {
        flex: 1
    },
    orderId: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#212529',
        margin: '0 0 4px 0'
    },
    orderTime: {
        fontSize: '14px',
        color: '#6c757d',
        margin: 0
    },
    statusBadge: {
        padding: '6px 12px',
        borderRadius: '20px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    customerInfo: {
        marginBottom: '16px',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '8px'
    },
    orderItems: {
        marginBottom: '16px'
    },
    orderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #e9ecef'
    },
    orderFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '16px',
        borderTop: '1px solid #e9ecef'
    },
    totalAmount: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#212529'
    },
    actionButtons: {
        display: 'flex',
        gap: '8px'
    },
    actionBtn: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '12px'
    },
    acceptBtn: {
        background: '#28a745',
        color: 'white'
    },
    rejectBtn: {
        background: '#dc3545',
        color: 'white'
    },
    nextBtn: {
        background: '#007bff',
        color: 'white'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#6c757d'
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px'
    },
    menuContainer: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
    },
    analyticsContainer: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
    },
    comingSoon: {
        fontSize: '16px',
        color: '#6c757d',
        fontStyle: 'italic'
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: '#6c757d'
    },
    loader: {
        width: '40px',
        height: '40px',
        border: '4px solid #f1f3f4',
        borderTop: '4px solid #ff6b6b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
    },
    menuHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    addItemBtn: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)',
        transition: 'transform 0.2s ease'
    },
    menuGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
    },
    menuItemCard: {
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        border: '1px solid #f0f0f0'
    },
    menuItemImageContainer: {
        height: '180px',
        position: 'relative'
    },
    menuItemImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    soldOutOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: '800',
        letterSpacing: '1px'
    },
    menuItemContent: {
        padding: '20px'
    },
    menuItemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px'
    },
    menuItemName: {
        fontSize: '18px',
        fontWeight: '700',
        margin: 0,
        color: '#2d3748'
    },
    menuItemPrice: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#ff6b6b'
    },
    menuItemDesc: {
        fontSize: '14px',
        color: '#718096',
        marginBottom: '20px',
        height: '40px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
    },
    menuItemFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    categoryTag: {
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    menuItemActions: {
        display: 'flex',
        gap: '8px'
    },
    toggleBtn: {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    deleteBtn: {
        padding: '6px',
        background: '#fff5f5',
        border: '1px solid #fed7d7',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(5px)'
    },
    modal: {
        background: 'white',
        width: '90%',
        maxWidth: '500px',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#a0aec0'
    },
    modalForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    formRow: {
        display: 'flex',
        gap: '15px'
    },
    formGroup: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568'
    },
    input: {
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s ease'
    },
    checkboxGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568'
    },
    submitBtn: {
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        marginTop: '10px',
        boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)'
    },
    analyticsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '20px'
    },
    analyticsCard: {
        background: '#f8fafc',
        padding: '24px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        border: '1px solid #e2e8f0',
        animation: 'fadeInUp 0.6s ease-out'
    },
    analyticsIcon: {
        fontSize: '32px',
        background: 'white',
        padding: '12px',
        borderRadius: '15px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    },
    analyticsInfo: {
        textAlign: 'left'
    },
    analyticsValue: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#2d3748',
        margin: 0
    },
    fullWidthCard: {
        gridColumn: '1 / -1',
        background: '#f8fafc',
        padding: '24px',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        textAlign: 'left',
        marginTop: '20px'
    },
    topItemsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '16px'
    },
    topItemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #edf2f7',
        fontWeight: '600'
    },
    itemCount: {
        color: '#667eea'
    }
};
