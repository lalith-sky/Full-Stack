import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BillBreakdown from "../components/BillBreakdown";
import { API_BASE_URL } from "../config/apiConfig";

export default function Cart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addressDetails, setAddressDetails] = useState({
        houseNo: "",
        street: "",
        landmark: ""
    });
    
    // Premium Checkout features
    const [ecoDelivery, setEcoDelivery] = useState(false);
    const [driverTip, setDriverTip] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);

    const token = localStorage.getItem("token");

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCart(savedCart);
    }, []);

    const updateQuantity = (id, qty) => {
        if (qty <= 0) {
            removeItem(id);
            return;
        }
        const updated = cart.map(item =>
            item.id === id ? { ...item, quantity: qty } : item
        );
        setCart(updated);
        localStorage.setItem("cart", JSON.stringify(updated));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const removeItem = (id) => {
        const updated = cart.filter(item => item.id !== id);
        setCart(updated);
        localStorage.setItem("cart", JSON.stringify(updated));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    // Calculate nutrition totals for items
    const calculateNutrition = () => {
        let calories = 0;
        let protein = 0;
        
        cart.forEach(item => {
            const name = item.name.toLowerCase();
            let calCoeff = 350;
            let protCoeff = 12;

            if (name.includes("biryani") || name.includes("rice")) {
                calCoeff = 650;
                protCoeff = 24;
            } else if (name.includes("pizza")) {
                calCoeff = 850;
                protCoeff = 32;
            } else if (name.includes("burger")) {
                calCoeff = 550;
                protCoeff = 20;
            } else if (name.includes("salad") || name.includes("soup")) {
                calCoeff = 220;
                protCoeff = 14;
            } else if (name.includes("noodle") || name.includes("wok")) {
                calCoeff = 480;
                protCoeff = 15;
            }

            calories += calCoeff * item.quantity;
            protein += protCoeff * item.quantity;
        });

        return { calories, protein };
    };

    const nutrition = calculateNutrition();

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert("Cart is empty!");
            return;
        }

        if (!addressDetails.houseNo.trim() || !addressDetails.street.trim()) {
            alert("Please enter House/Flat No. and Street/Locality!");
            return;
        }

        const formattedAddress = `${addressDetails.houseNo}, ${addressDetails.street}${addressDetails.landmark ? ', ' + addressDetails.landmark : ''}`;

        setLoading(true);
        try {
            const restaurantId = cart[0]?.restaurantId || 1;
            
            const orderData = {
                restaurantId: restaurantId,
                items: cart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity
                })),
                deliveryAddress: formattedAddress,
                deliveryLatitude: 17.4326,
                deliveryLongitude: 78.4071
            };

            const res = await fetch(`${API_BASE_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                const orderResponse = await res.json();
                
                // Track eco delivery state in local history (so GreenImpact updates)
                if (ecoDelivery) {
                    const ecoHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
                    ecoHistory.push({
                        id: orderResponse.id,
                        restaurantId: restaurantId,
                        distance: 3.2,
                        ecoFriendly: true,
                        items: cart
                    });
                    localStorage.setItem('orderHistory', JSON.stringify(ecoHistory));
                }

                alert("Order placed successfully!");
                localStorage.removeItem("cart");
                setCart([]);
                window.dispatchEvent(new Event('cartUpdated'));
                
                // Direct redirect to tracking
                setTimeout(() => navigate(`/tracking/${orderResponse.id || 1}`), 1000);
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(errorData.error || errorData.message || "Failed to place order");
            }
        } catch (err) {
            console.error("Network error:", err);
            alert("Cannot connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.checkoutTag}>Secure Checkout</span>
                <h1 style={styles.title}>🛒 Your Premium Cart</h1>
                <p style={styles.subtitle}>Review your items, eco-delivery metrics, and complete order</p>
            </div>

            {cart.length === 0 ? (
                <div style={styles.emptyCart}>
                    <p style={{ fontSize: '18px', color: '#64748b' }}>Your shopping cart is currently empty</p>
                    <Link to="/" style={styles.shopBtn}>Explore Curated Menus</Link>
                </div>
            ) : (
                <div style={styles.content}>
                    
                    {/* Left Column: Cart Items & Nutrition */}
                    <div style={styles.leftCol}>
                        <div style={styles.itemsList}>
                            <div style={styles.listHeader}>🍽️ Selected Items</div>
                            {cart.map(item => (
                                <div key={item.id} style={styles.cartItem}>
                                    <div style={styles.itemInfo}>
                                        <h3 style={styles.itemName}>{item.name}</h3>
                                        <p style={styles.itemPrice}>₹{item.price?.toFixed(2)}</p>
                                    </div>
                                    <div style={styles.quantity}>
                                        <button 
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            style={styles.qtyBtn}
                                        >
                                            −
                                        </button>
                                        <span style={styles.qtyValue}>{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            style={styles.qtyBtn}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div style={styles.itemTotal}>
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        style={styles.removeBtn}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Nutrition Summary Card */}
                        <div style={styles.nutritionCard}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#1e293b' }}>🧠 AI Nutrition Summary</h4>
                            <div style={styles.nutritionGrid}>
                                <div>
                                    <div style={styles.nutritionVal}>{nutrition.calories} kcal</div>
                                    <div style={styles.nutritionLbl}>Estimated Energy</div>
                                </div>
                                <div>
                                    <div style={styles.nutritionVal}>{nutrition.protein}g</div>
                                    <div style={styles.nutritionLbl}>Target Protein</div>
                                </div>
                            </div>
                        </div>

                        {/* Eco Friendly Delivery Option */}
                        <div style={styles.ecoOptionBox}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input 
                                    type="checkbox" 
                                    id="ecoDelivery" 
                                    checked={ecoDelivery}
                                    onChange={(e) => setEcoDelivery(e.target.checked)}
                                    style={styles.checkbox}
                                />
                                <label htmlFor="ecoDelivery" style={{ cursor: 'pointer' }}>
                                    <strong style={{ display: 'block', fontSize: '14px', color: '#10b981' }}>🌱 Opt for Eco-Friendly Delivery</strong>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Delivered via electric bike or cycle paths. Saves 120g of carbon emission.</span>
                                </label>
                            </div>
                        </div>

                        {/* Tipping Section */}
                        <div style={styles.tipBox}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>🛵 Tip Your Delivery Partner</h4>
                            <div style={styles.tipOptions}>
                                {[0, 20, 30, 50].map(val => (
                                    <button 
                                        key={val} 
                                        onClick={() => setDriverTip(val)}
                                        style={{
                                            ...styles.tipBtn,
                                            ...(driverTip === val ? styles.tipBtnActive : {})
                                        }}
                                    >
                                        {val === 0 ? 'Skip' : `₹${val}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Checkout Form & Total */}
                    <div style={styles.rightCol}>
                        
                        {/* Address Form */}
                        <div style={styles.addressSection}>
                            <h4 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#1a1a1a" }}>📍 Delivery Address</h4>
                            <div style={{ marginBottom: "12px" }}>
                                <label style={styles.addressLabel}>House/Flat No. *</label>
                                <input
                                    type="text"
                                    value={addressDetails.houseNo}
                                    onChange={(e) => setAddressDetails({...addressDetails, houseNo: e.target.value})}
                                    placeholder="E.g. Flat 401, Tower B"
                                    style={styles.addressInput}
                                />
                            </div>
                            <div style={{ marginBottom: "12px" }}>
                                <label style={styles.addressLabel}>Street/Locality *</label>
                                <input
                                    type="text"
                                    value={addressDetails.street}
                                    onChange={(e) => setAddressDetails({...addressDetails, street: e.target.value})}
                                    placeholder="E.g. Banjara Hills"
                                    style={styles.addressInput}
                                />
                            </div>
                            <div>
                                <label style={styles.addressLabel}>Landmark (Optional)</label>
                                <input
                                    type="text"
                                    value={addressDetails.landmark}
                                    onChange={(e) => setAddressDetails({...addressDetails, landmark: e.target.value})}
                                    placeholder="E.g. Near City Center Mall"
                                    style={styles.addressInput}
                                />
                            </div>
                        </div>

                        {/* Bill Breakdown */}
                        <BillBreakdown 
                            cartItems={cart}
                            deliveryAddress={`${addressDetails.houseNo ? addressDetails.houseNo + ', ' : ''}${addressDetails.street}`}
                            onTotalChange={setFinalTotal}
                        />

                        {/* Order Confidence prediction */}
                        <div style={styles.confidenceBanner}>
                            <span>⚡ Delivery confidence rating: <strong>99% Accuracy</strong></span>
                        </div>

                        {/* Place Order CTA */}
                        <button
                            onClick={handleCheckout}
                            disabled={loading || !addressDetails.houseNo.trim() || !addressDetails.street.trim()}
                            style={{
                                ...styles.checkoutBtn,
                                opacity: (loading || !addressDetails.houseNo.trim() || !addressDetails.street.trim()) ? 0.6 : 1
                            }}
                        >
                            {loading ? "Confirming Order..." : `Place Order • ₹${(finalTotal + driverTip).toFixed(0)}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        background: '#f8fafc',
        minHeight: '85vh'
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
    },
    checkoutTag: {
        fontSize: '11px',
        background: '#e0e7ff',
        color: '#4f46e5',
        padding: '4px 12px',
        borderRadius: '20px',
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    title: {
        fontSize: "2.2rem",
        fontWeight: "850",
        margin: 0,
        color: "#1e293b"
    },
    subtitle: {
        fontSize: '15px',
        color: '#64748b',
        margin: 0
    },
    emptyCart: {
        textAlign: "center",
        padding: "60px 20px",
        background: "white",
        borderRadius: "24px",
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    },
    shopBtn: {
        display: "inline-block",
        marginTop: "20px",
        padding: "12px 28px",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        textDecoration: "none",
        borderRadius: "30px",
        fontWeight: "700",
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
    },
    content: {
        display: "grid",
        gridTemplateColumns: "1fr 400px",
        gap: "30px"
    },
    leftCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    rightCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    itemsList: {
        background: "white",
        borderRadius: "20px",
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
    },
    listHeader: {
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '700',
        color: '#475569',
        borderBottom: '1px solid #f1f5f9',
        background: '#f8fafc'
    },
    cartItem: {
        display: "grid",
        gridTemplateColumns: "1fr 100px 100px 40px",
        gap: "15px",
        alignItems: "center",
        padding: "20px",
        borderBottom: "1px solid #f1f5f9"
    },
    itemInfo: {
        display: "flex",
        flexDirection: "column"
    },
    itemName: {
        margin: "0",
        fontSize: "15px",
        fontWeight: "750",
        color: "#1e293b"
    },
    itemPrice: {
        margin: "4px 0 0 0",
        fontSize: "13px",
        color: "#64748b",
        fontWeight: '600'
    },
    quantity: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#f1f5f9",
        borderRadius: "8px",
        padding: "4px 8px"
    },
    qtyBtn: {
        background: "transparent",
        border: "none",
        fontSize: "16px",
        cursor: "pointer",
        width: "25px",
        height: "25px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: '700'
    },
    qtyValue: {
        flex: 1,
        textAlign: "center",
        fontWeight: "700",
        fontSize: '13px'
    },
    itemTotal: {
        fontSize: "14px",
        fontWeight: "700",
        color: "#4f46e5",
        textAlign: "right"
    },
    removeBtn: {
        background: "none",
        color: "#ef4444",
        border: "none",
        fontSize: "14px",
        cursor: "pointer",
        fontWeight: "700",
        textAlign: 'center'
    },
    nutritionCard: {
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid #e2e8f0'
    },
    nutritionGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
    },
    nutritionVal: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#8b5cf6'
    },
    nutritionLbl: {
        fontSize: '11px',
        color: '#64748b',
        fontWeight: '600'
    },
    ecoOptionBox: {
        background: '#ecfdf5',
        border: '1px solid #a7f3d0',
        borderRadius: '20px',
        padding: '20px'
    },
    checkbox: {
        width: '18px',
        height: '18px',
        accentColor: '#10b981',
        cursor: 'pointer'
    },
    tipBox: {
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid #e2e8f0'
    },
    tipOptions: {
        display: 'flex',
        gap: '8px'
    },
    tipBtn: {
        flex: 1,
        padding: '10px',
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '700',
        color: '#475569',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    tipBtnActive: {
        background: '#e0e7ff',
        borderColor: '#4f46e5',
        color: '#4f46e5'
    },
    addressSection: {
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid #e2e8f0'
    },
    addressLabel: {
        display: "block",
        marginBottom: "6px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#475569"
    },
    addressInput: {
        width: "100%",
        padding: "12px",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        fontSize: "13px",
        fontFamily: "inherit",
        boxSizing: "border-box"
    },
    confidenceBanner: {
        fontSize: '12px',
        color: '#059669',
        background: '#ecfdf5',
        padding: '10px',
        borderRadius: '10px',
        textAlign: 'center',
        fontWeight: '600'
    },
    checkoutBtn: {
        width: "100%",
        padding: "16px 20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        border: "none",
        borderRadius: "20px",
        fontSize: "16px",
        fontWeight: "800",
        cursor: "pointer",
        boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)"
    }
};
