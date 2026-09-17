import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerSupport from "../components/CustomerSupport";
import RefundWorkflow from "../components/RefundWorkflow";
import ReviewSystem from "../components/ReviewSystem";
import FloatingChatButton from "../components/FloatingChatButton";
import { API_BASE_URL } from "../config/apiConfig";

export default function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showSupport, setShowSupport] = useState(false);
    const [showRefund, setShowRefund] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const token = localStorage.getItem("token");

    const handleRefundRequest = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        setSelectedOrder(order || {
            id: orderId,
            totalAmount: 499.00,
            restaurant: 'Spicy Hub', // Mock restaurant name
            items: [{ name: 'Spicy Ramen', quantity: 2, price: 249.50 }]
        });
        setShowRefund(true);
    };

    const handleReviewOrder = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        setSelectedOrder(order || {
            id: orderId,
            restaurant: 'Spicy Hub',
            items: [{ name: 'Spicy Ramen', quantity: 2, price: 249.50 }]
        });
        setShowReview(true);
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'CANCELLED' })
            });

            if (response.ok) {
                alert('Order cancelled successfully');
                // Refresh orders
                const res = await fetch(`${API_BASE_URL}/orders/my`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrders(Array.isArray(data) ? data : []);
                }
            } else {
                alert('Failed to cancel order');
            }
        } catch (err) {
            alert('Cannot connect to server');
        }
    };

    useEffect(() => {
        if (!token) return;

        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/orders/my`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setOrders(Array.isArray(data) ? data : []);
                } else {
                    setError("Failed to load orders");
                }
            } catch (e) {
                console.error(e);
                setError("Cannot connect to server");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [token]);

    if (loading) return <div style={styles.loadingContainer}><p>Loading orders...</p></div>;
    if (error) return <div style={styles.errorContainer}><p>{error}</p></div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>My Orders</h1>

            {orders.length === 0 ? (
                <div style={styles.emptyOrders}>
                    <p>No orders yet</p>
                    <button onClick={() => navigate("/")} style={styles.shopBtn}>
                        Start Ordering
                    </button>
                </div>
            ) : (
                <div style={styles.grid}>
                    {orders.map(order => (
                        <div key={order.id} style={styles.orderCard}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.orderNumber}>Order #{order.id}</h3>
                                <span style={styles.status(order.status)}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>
                            
                            <div style={styles.cardBody}>
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Status:</span>
                                    <span>{order.status || "Pending"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Total:</span>
                                    <span style={styles.total}>₹{order.total?.toFixed(2) || "0.00"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Date:</span>
                                    <span>{formatDate(order.createdAt)}</span>
                                </div>

                                {order.items && order.items.length > 0 && (
                                    <div style={styles.itemsSection}>
                                        <strong style={styles.itemsTitle}>Items:</strong>
                                        <ul style={styles.itemsList}>
                                            {order.items.map((item, idx) => (
                                                <li key={item.id || item.itemId || `${order.id}-item-${idx}`} style={styles.itemLi}>
                                                    {item.name || item.itemId} <span style={styles.qty}>x{item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div style={styles.actionButtons}>
                                    <button
                                        onClick={() => navigate(`/tracking/${order.id}`)}
                                        style={styles.trackButton}
                                    >
                                        📍 Track Order
                                    </button>
                                    
                                    {order.status === "DELIVERED" && (
                                        <button
                                            onClick={() => handleReviewOrder(order.id)}
                                            style={styles.reviewButton}
                                        >
                                            ⭐ Review
                                        </button>
                                    )}
                                    
                                    {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                                        <button
                                            onClick={() => handleCancelOrder(order.id)}
                                            style={styles.cancelButton}
                                        >
                                            ❌ Cancel
                                        </button>
                                    )}
                                    
                                    {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
                                        <button
                                            onClick={() => handleRefundRequest(order.id)}
                                            style={styles.refundButton}
                                        >
                                            💰 Refund
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Help & Support Button */}
            <div style={styles.supportSection}>
                <button
                    onClick={() => setShowSupport(true)}
                    style={styles.supportButton}
                >
                    🎧 Need Help? Contact Support
                </button>
            </div>

            {/* Modals */}
            {showSupport && (
                <CustomerSupport onClose={() => setShowSupport(false)} />
            )}

            {showRefund && selectedOrder && (
                <RefundWorkflow
                    orderId={selectedOrder.id}
                    orderDetails={selectedOrder}
                    onClose={() => {
                        setShowRefund(false);
                        setSelectedOrder(null);
                    }}
                    onRefundRequest={(refundData) => {
                        console.log('Refund requested:', refundData);
                        // In real app, update order status
                    }}
                />
            )}

            {showReview && selectedOrder && (
                <ReviewSystem
                    orderId={selectedOrder.id}
                    restaurantId={selectedOrder.restaurantId || 1}
                    onClose={() => {
                        setShowReview(false);
                        setSelectedOrder(null);
                    }}
                    onSubmit={(reviewData) => {
                        console.log('Review submitted:', reviewData);
                        // In real app, save review
                    }}
                />
            )}

            {/* Floating Chat Button */}
            <FloatingChatButton 
                orderId={selectedOrder?.id} 
                restaurantName="BiteRush Support" 
            />
        </div>
    );
}

const getStatusLabel = (status) => {
    const labels = {
        "PENDING": "Pending",
        "CONFIRMED": "Confirmed",
        "PREPARING": "Preparing",
        "OUT_FOR_DELIVERY": "Out for Delivery",
        "DELIVERED": "Delivered",
        "CANCELLED": "Cancelled"
    };
    return labels[status] || status;
};

const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString();
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const styles = {
    container: {
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto"
    },
    title: {
        fontSize: "28px",
        fontWeight: "700",
        marginBottom: "30px",
        color: "#1a1a1a",
        textAlign: "center"
    },
    emptyOrders: {
        textAlign: "center",
        padding: "60px 20px",
        background: "#f5f5f5",
        borderRadius: "12px"
    },
    shopBtn: {
        display: "inline-block",
        marginTop: "20px",
        padding: "12px 24px",
        background: "#667eea",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        cursor: "pointer"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "24px"
    },
    orderCard: {
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        overflow: "hidden"
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white"
    },
    orderNumber: {
        margin: "0",
        fontSize: "18px",
        fontWeight: "700"
    },
    status: (status) => ({
        padding: "6px 12px",
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "600"
    }),
    cardBody: {
        padding: "20px"
    },
    infoRow: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "12px",
        fontSize: "14px"
    },
    label: {
        fontWeight: "600",
        color: "#666"
    },
    total: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#667eea"
    },
    itemsSection: {
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid #e0e0e0"
    },
    itemsTitle: {
        display: "block",
        marginBottom: "8px",
        fontSize: "14px"
    },
    itemsList: {
        margin: "0",
        paddingLeft: "20px",
        listStyle: "none"
    },
    itemLi: {
        padding: "4px 0",
        fontSize: "13px",
        color: "#666"
    },
    qty: {
        marginLeft: "8px",
        color: "#999"
    },
    actionButtons: {
        display: "flex",
        gap: "8px",
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid #e0e0e0",
        flexWrap: "wrap"
    },
    trackButton: {
        flex: 1,
        minWidth: "120px",
        padding: "10px 16px",
        background: "#667eea",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "12px"
    },
    reviewButton: {
        flex: 1,
        minWidth: "120px",
        padding: "10px 16px",
        background: "#f59e0b",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "12px"
    },
    refundButton: {
        flex: 1,
        minWidth: "120px",
        padding: "10px 16px",
        background: "#10b981",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "12px"
    },
    cancelButton: {
        flex: 1,
        minWidth: "120px",
        padding: "10px 16px",
        background: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "12px"
    },
    supportSection: {
        textAlign: "center",
        marginTop: "40px",
        padding: "30px",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        borderRadius: "16px",
        color: "white"
    },
    supportButton: {
        padding: "16px 32px",
        background: "rgba(255, 255, 255, 0.2)",
        color: "white",
        border: "2px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)"
    },
    loadingContainer: {
        textAlign: "center",
        padding: "60px 20px",
        color: "#666"
    },
    errorContainer: {
        textAlign: "center",
        padding: "60px 20px",
        color: "#c33"
    }
};
