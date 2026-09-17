import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import LiveLocationDetector from "../components/LiveLocationDetector";
import RewardsSystem from "../components/RewardsSystem";
import RestaurantCard from "../components/RestaurantCard";
import FloatingChatButton from "../components/FloatingChatButton";
import { API_BASE_URL } from "../config/apiConfig";

export default function Home() {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCuisine, setSelectedCuisine] = useState("All");
    const [sortBy, setSortBy] = useState("rating");
    const [selectedLocation, setSelectedLocation] = useState("Hyderabad, Banjara Hills");
    const [showLocationDetector, setShowLocationDetector] = useState(false);
    const [showRewards, setShowRewards] = useState(false);
    const token = localStorage.getItem("token");

    const availableLocations = [
        "Hyderabad, Banjara Hills", "Hyderabad, Jubilee Hills", "Hyderabad, Gachibowli",
        "Hyderabad, Madhapur", "Hyderabad, HITEC City", "Hyderabad, Kukatpally",
        "Mumbai, Bandra", "Mumbai, Andheri", "Mumbai, Juhu", "Mumbai, Powai",
        "Bangalore, Koramangala", "Bangalore, Indiranagar", "Bangalore, Whitefield",
        "Delhi, Connaught Place", "Delhi, Khan Market", "Delhi, Karol Bagh"
    ];

    const cuisineTypes = [
        "All", "Indian", "Italian", "Chinese", "Thai", "Mexican", 
        "Japanese", "Korean", "American", "South Indian", "Fast Food"
    ];

    const loadRestaurants = useCallback(async () => {
        setLoading(true);
        setError("");
        
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRestaurants(Array.isArray(data) ? data : []);
            } else {
                setError("Failed to load restaurants. Please try again.");
            }
        } catch (err) {
            console.error("Error loading restaurants:", err);
            setError("Cannot connect to server. Please check if backend is running.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            loadRestaurants();
        }
    }, [token, loadRestaurants]);

    const handleLocationDetected = (locationData) => {
        if (locationData.address) {
            setSelectedLocation(locationData.address);
        }
        setShowLocationDetector(false);
    };

    const handleLocationError = (errorMessage) => {
        setError(errorMessage);
        setShowLocationDetector(false);
    };

    // Filter and sort restaurants
    const filteredRestaurants = restaurants.filter(restaurant => {
        const matchesSearch = !searchTerm || 
                            restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            restaurant.cuisineType?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCuisine = selectedCuisine === "All" || restaurant.cuisineType === selectedCuisine;
        return matchesSearch && matchesCuisine;
    });

    const sortedRestaurants = filteredRestaurants.sort((a, b) => {
        switch(sortBy) {
            case "rating":
                return (b.rating || 0) - (a.rating || 0);
            case "delivery-time":
                return (a.deliveryTime || 0) - (b.deliveryTime || 0);
            case "delivery-fee":
                return (a.deliveryFee || 0) - (b.deliveryFee || 0);
            case "name":
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });

    // Show login page if not authenticated
    if (!token) {
        return (
            <div style={styles.notLoggedIn}>
                <div style={styles.welcomeCard}>
                    <div style={styles.logoSection}>
                        <h1 style={styles.logoTitle}>🍔 BiteRush</h1>
                        <p style={styles.logoTagline}>Order food online from India's best restaurants</p>
                    </div>
                    
                    <div style={styles.featuresGrid}>
                        <div style={styles.featureItem}>
                            <div style={styles.featureIcon}>⚡</div>
                            <h3>Lightning Fast Delivery</h3>
                            <p>Get your food delivered in 30 minutes or less</p>
                        </div>
                        <div style={styles.featureItem}>
                            <div style={styles.featureIcon}>🎯</div>
                            <h3>Live Order Tracking</h3>
                            <p>Track your order in real-time from kitchen to doorstep</p>
                        </div>
                        <div style={styles.featureItem}>
                            <div style={styles.featureIcon}>🏆</div>
                            <h3>Rewards & Offers</h3>
                            <p>Earn points on every order and unlock exclusive deals</p>
                        </div>
                        <div style={styles.featureItem}>
                            <div style={styles.featureIcon}>🤖</div>
                            <h3>AI Recommendations</h3>
                            <p>Smart suggestions based on your taste and preferences</p>
                        </div>
                    </div>
                    
                    <div style={styles.authButtons}>
                        <Link to="/login" style={styles.loginBtn}>Login</Link>
                        <Link to="/register" style={styles.registerBtn}>Sign Up</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return <div style={styles.loadingContainer}><div style={styles.loader}></div><p>Loading delicious restaurants...</p></div>;
    if (error) return <div style={styles.errorContainer}><p>{error}</p><button onClick={loadRestaurants} style={styles.retryBtn}>Retry</button></div>;

    return (
        <div style={styles.container}>
            {/* Hero Section - Swiggy Style */}
            <div style={styles.heroSection}>
                <div style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>Order food online in {selectedLocation.split(',')[0]}</h1>
                    <p style={styles.heroSubtitle}>From restaurants to your doorstep</p>
                    
                    {/* Location and Search Bar */}
                    <div style={styles.searchContainer}>
                        <div style={styles.locationSection}>
                            <div style={styles.locationIcon}>📍</div>
                            <select 
                                value={selectedLocation} 
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                style={styles.locationSelect}
                            >
                                {availableLocations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => setShowLocationDetector(true)}
                                style={styles.detectBtn}
                                title="Detect my location"
                            >
                                🎯
                            </button>
                        </div>
                        
                        <div style={styles.searchSection}>
                            <input 
                                type="text"
                                placeholder="Search for restaurants, cuisines, or dishes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                            <button style={styles.searchBtn}>🔍</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.quickActions}>
                <div style={styles.quickActionItem} className="quick-action-item" onClick={() => setShowRewards(true)}>
                    <div style={styles.quickIcon}>🏆</div>
                    <span>Rewards</span>
                </div>
                <div style={styles.quickActionItem} className="quick-action-item">
                    <div style={styles.quickIcon}>🎤</div>
                    <span>Voice Order</span>
                </div>
                <div style={styles.quickActionItem} className="quick-action-item">
                    <div style={styles.quickIcon}>📱</div>
                    <span>AR Menu</span>
                </div>
                <div style={styles.quickActionItem} className="quick-action-item">
                    <div style={styles.quickIcon}>🗺️</div>
                    <span>Live Map</span>
                </div>
            </div>

            {/* Filters Section */}
            <div style={styles.filtersSection}>
                <div style={styles.filtersContainer}>
                    <div style={styles.cuisineFilters}>
                        {cuisineTypes.map(cuisine => (
                            <button
                                key={cuisine}
                                onClick={() => setSelectedCuisine(cuisine)}
                                className="cuisine-filter"
                                style={{
                                    ...styles.cuisineFilter,
                                    ...(selectedCuisine === cuisine ? styles.cuisineFilterActive : {})
                                }}
                            >
                                {cuisine}
                            </button>
                        ))}
                    </div>
                    
                    <div style={styles.sortSection}>
                        <label style={styles.sortLabel}>Sort by:</label>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            style={styles.sortSelect}
                        >
                            <option value="rating">Rating</option>
                            <option value="delivery-time">Delivery Time</option>
                            <option value="delivery-fee">Delivery Fee</option>
                            <option value="name">Name</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Restaurants Grid */}
            <div style={styles.restaurantsSection}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>
                        {selectedLocation ? `Restaurants in ${selectedLocation}` : "Popular Restaurants"}
                    </h2>
                    <span style={styles.restaurantCount}>{sortedRestaurants.length} restaurants</span>
                </div>
                
                <div style={styles.restaurantGrid}>
                    {sortedRestaurants.map(restaurant => (
                        <RestaurantCard 
                            key={restaurant.id} 
                            restaurant={restaurant} 
                            showTrustIndicators={true}
                        />
                    ))}
                </div>
            </div>

            {/* Modals */}
            {showLocationDetector && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>📍 Detect Your Location</h3>
                            <button 
                                onClick={() => setShowLocationDetector(false)}
                                style={styles.closeButton}
                            >
                                ✕
                            </button>
                        </div>
                        <LiveLocationDetector 
                            onLocationDetected={handleLocationDetected}
                            onLocationError={handleLocationError}
                        />
                    </div>
                </div>
            )}

            {showRewards && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>🏆 Rewards & Offers</h3>
                            <button 
                                onClick={() => setShowRewards(false)}
                                style={styles.closeButton}
                            >
                                ✕
                            </button>
                        </div>
                        <RewardsSystem />
                    </div>
                </div>
            )}

            {/* Floating Chat Button */}
            {token && <FloatingChatButton restaurantName="BiteRush Support" />}
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#f8f9fa"
    },
    
    // Welcome Page Styles
    notLoggedIn: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px"
    },
    welcomeCard: {
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "60px 40px",
        maxWidth: "900px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)"
    },
    logoSection: {
        marginBottom: "50px"
    },
    logoTitle: {
        fontSize: "3.5rem",
        color: "#2d3436",
        marginBottom: "10px",
        fontWeight: "800"
    },
    logoTagline: {
        fontSize: "1.3rem",
        color: "#636e72",
        marginBottom: "0"
    },
    featuresGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "30px",
        marginBottom: "50px"
    },
    featureItem: {
        padding: "30px 20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "15px",
        textAlign: "center"
    },
    featureIcon: {
        fontSize: "3rem",
        marginBottom: "15px"
    },
    authButtons: {
        display: "flex",
        gap: "20px",
        justifyContent: "center"
    },
    loginBtn: {
        display: "inline-block",
        backgroundColor: "#00b894",
        color: "white",
        padding: "15px 40px",
        borderRadius: "50px",
        textDecoration: "none",
        fontSize: "1.1rem",
        fontWeight: "600",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(0,184,148,0.3)"
    },
    registerBtn: {
        display: "inline-block",
        backgroundColor: "transparent",
        color: "#00b894",
        padding: "15px 40px",
        borderRadius: "50px",
        textDecoration: "none",
        fontSize: "1.1rem",
        fontWeight: "600",
        border: "2px solid #00b894",
        transition: "all 0.3s ease"
    },

    // Hero Section
    heroSection: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "80px 20px",
        color: "white",
        textAlign: "center"
    },
    heroContent: {
        maxWidth: "1000px",
        margin: "0 auto"
    },
    heroTitle: {
        fontSize: "2.8rem",
        marginBottom: "15px",
        fontWeight: "700"
    },
    heroSubtitle: {
        fontSize: "1.3rem",
        marginBottom: "50px",
        opacity: "0.9"
    },
    searchContainer: {
        display: "flex",
        gap: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        flexWrap: "wrap",
        justifyContent: "center"
    },
    locationSection: {
        display: "flex",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: "50px",
        padding: "5px",
        minWidth: "250px"
    },
    locationIcon: {
        fontSize: "1.2rem",
        padding: "15px",
        color: "#667eea"
    },
    locationSelect: {
        border: "none",
        outline: "none",
        fontSize: "1rem",
        color: "#2d3436",
        backgroundColor: "transparent",
        flex: 1,
        padding: "10px"
    },
    detectBtn: {
        backgroundColor: "#00b894",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "45px",
        height: "45px",
        cursor: "pointer",
        fontSize: "1.2rem",
        margin: "5px"
    },
    searchSection: {
        display: "flex",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: "50px",
        padding: "5px",
        minWidth: "350px",
        flex: 1
    },
    searchInput: {
        border: "none",
        outline: "none",
        fontSize: "1rem",
        color: "#2d3436",
        backgroundColor: "transparent",
        flex: 1,
        padding: "15px 20px"
    },
    searchBtn: {
        backgroundColor: "#667eea",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "45px",
        height: "45px",
        cursor: "pointer",
        fontSize: "1.2rem",
        margin: "5px"
    },

    // Quick Actions
    quickActions: {
        display: "flex",
        justifyContent: "center",
        gap: "30px",
        padding: "30px 20px",
        backgroundColor: "white",
        borderBottom: "1px solid #e9ecef",
        flexWrap: "wrap"
    },
    quickActionItem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        borderRadius: "15px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        minWidth: "100px"
    },
    quickIcon: {
        fontSize: "2rem",
        marginBottom: "10px"
    },

    // Filters Section
    filtersSection: {
        backgroundColor: "white",
        padding: "20px",
        borderBottom: "1px solid #e9ecef"
    },
    filtersContainer: {
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px"
    },
    cuisineFilters: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap"
    },
    cuisineFilter: {
        padding: "8px 20px",
        border: "1px solid #ddd",
        borderRadius: "25px",
        backgroundColor: "white",
        cursor: "pointer",
        fontSize: "0.9rem",
        transition: "all 0.3s ease"
    },
    cuisineFilterActive: {
        backgroundColor: "#667eea",
        color: "white",
        border: "1px solid #667eea"
    },
    sortSection: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    sortLabel: {
        fontSize: "0.9rem",
        color: "#636e72",
        fontWeight: "500"
    },
    sortSelect: {
        padding: "8px 15px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        fontSize: "0.9rem",
        outline: "none"
    },

    // Restaurants Section
    restaurantsSection: {
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto"
    },
    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px"
    },
    sectionTitle: {
        fontSize: "1.8rem",
        color: "#2d3436",
        fontWeight: "600",
        margin: "0"
    },
    restaurantCount: {
        color: "#636e72",
        fontSize: "1rem"
    },
    restaurantGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "25px"
    },
    restaurantCard: {
        backgroundColor: "white",
        borderRadius: "15px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        border: "1px solid #f1f2f6"
    },
    restaurantImageContainer: {
        position: "relative",
        height: "200px",
        overflow: "hidden"
    },
    restaurantImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transition: "transform 0.3s ease"
    },
    restaurantBadges: {
        position: "absolute",
        top: "15px",
        left: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    discountBadge: {
        backgroundColor: "#00b894",
        color: "white",
        padding: "5px 12px",
        borderRadius: "15px",
        fontSize: "0.8rem",
        fontWeight: "600"
    },
    topRatedBadge: {
        backgroundColor: "#fdcb6e",
        color: "#2d3436",
        padding: "5px 12px",
        borderRadius: "15px",
        fontSize: "0.8rem",
        fontWeight: "600"
    },
    deliveryTimeOverlay: {
        position: "absolute",
        bottom: "15px",
        right: "15px",
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "20px",
        fontSize: "0.9rem",
        fontWeight: "500"
    },
    restaurantInfo: {
        padding: "20px"
    },
    restaurantHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "10px"
    },
    restaurantName: {
        fontSize: "1.3rem",
        color: "#2d3436",
        margin: "0",
        fontWeight: "600",
        flex: 1
    },
    rating: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        backgroundColor: "#00b894",
        color: "white",
        padding: "5px 10px",
        borderRadius: "8px",
        fontSize: "0.9rem",
        fontWeight: "600"
    },
    ratingIcon: {
        fontSize: "0.8rem"
    },
    ratingValue: {
        fontSize: "0.9rem"
    },
    restaurantCuisine: {
        color: "#636e72",
        fontSize: "0.95rem",
        margin: "5px 0",
        fontWeight: "500"
    },
    restaurantLocation: {
        color: "#74b9ff",
        fontSize: "0.85rem",
        margin: "5px 0"
    },
    restaurantFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "15px",
        paddingTop: "15px",
        borderTop: "1px solid #f1f2f6"
    },
    deliveryInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    deliveryFee: {
        fontSize: "0.85rem",
        color: "#636e72"
    },
    viewMenuBtn: {
        backgroundColor: "#667eea",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "25px",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease"
    },

    // Loading and Error States
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "#636e72"
    },
    loader: {
        width: "50px",
        height: "50px",
        border: "4px solid #f1f2f6",
        borderTop: "4px solid #667eea",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "20px"
    },
    errorContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        color: "#e17055",
        fontSize: "1.1rem",
        textAlign: "center"
    },
    retryBtn: {
        backgroundColor: "#667eea",
        color: "white",
        border: "none",
        padding: "12px 25px",
        borderRadius: "25px",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "20px"
    },

    // Modal Styles
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: "20px",
        maxWidth: "600px",
        width: "100%",
        maxHeight: "80vh",
        overflow: "auto"
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 30px",
        borderBottom: "1px solid #e9ecef"
    },
    modalTitle: {
        fontSize: "1.3rem",
        color: "#2d3436",
        margin: "0",
        fontWeight: "600"
    },
    closeButton: {
        background: "none",
        border: "none",
        fontSize: "1.5rem",
        cursor: "pointer",
        color: "#636e72",
        padding: "5px"
    }
};