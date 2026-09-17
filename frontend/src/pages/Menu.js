import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiConfig";

export default function Menu() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const restaurantId = searchParams.get("restaurant");
    const [restaurant, setRestaurant] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cartCount, setCartCount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterVeg, setFilterVeg] = useState(false);
    const [filterSpicy, setFilterSpicy] = useState(false);
    const [filterBestseller, setFilterBestseller] = useState(false);
    const [selectedHygiene, setSelectedHygiene] = useState("All");
    const [filterGlutenFree, setFilterGlutenFree] = useState(false);
    const [filterJain, setFilterJain] = useState(false);
    const [filterKeto, setFilterKeto] = useState(false);
    const [selectedSpiceLevel, setSelectedSpiceLevel] = useState("All");
    const [maxCalories, setMaxCalories] = useState(1000);
    const [sortBy, setSortBy] = useState("name");
    const [showFilters, setShowFilters] = useState(false);
    const token = localStorage.getItem("token");

    const loadCart = () => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    };

    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        if (!restaurantId || !token) return;

        const fetchRestaurant = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRestaurant(data);
                }
            } catch (e) {
                console.error(e);
            }
        };

        const fetchMenu = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/menus/restaurant/${restaurantId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setItems(Array.isArray(data) ? data : []);
                } else {
                    setError("Failed to load menu");
                }
            } catch (e) {
                console.error(e);
                setError("Cannot connect to server");
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurant();
        fetchMenu();
    }, [restaurantId, token]);

    const addToCart = (item) => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        // Dispatch custom event to update navbar
        window.dispatchEvent(new Event('cartUpdated'));
        loadCart();
    };

    const categories = ["All", ...new Set(items.map(item => item.category))];
    const hygieneOptions = ["All", "Excellent", "Good", "Average"];
    const spiceLevels = ["All", "Mild", "Medium", "Hot", "Extra Hot"];
    
    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVeg = !filterVeg || item.isVeg;
        const matchesSpicy = !filterSpicy || item.isSpicy;
        const matchesBestseller = !filterBestseller || item.isBestseller;
        const matchesHygiene = selectedHygiene === "All" || item.hygieneRating === selectedHygiene;
        const matchesGlutenFree = !filterGlutenFree || item.isGlutenFree;
        const matchesJain = !filterJain || item.isJain;
        const matchesKeto = !filterKeto || item.isKeto;
        const matchesSpiceLevel = selectedSpiceLevel === "All" || item.spiceLevel === selectedSpiceLevel;
        const matchesCalories = !item.calories || item.calories <= maxCalories;
        
        return matchesCategory && matchesSearch && matchesVeg && matchesSpicy && matchesBestseller && 
               matchesHygiene && matchesGlutenFree && matchesJain && matchesKeto && matchesSpiceLevel && matchesCalories;
    });

    // Sort filtered items
    const sortedItems = [...filteredItems].sort((a, b) => {
        switch(sortBy) {
            case "price-low":
                return a.price - b.price;
            case "price-high":
                return b.price - a.price;
            case "prep-time":
                return a.preparationTime - b.preparationTime;
            case "rating":
                return b.isBestseller - a.isBestseller;
            default:
                return a.name.localeCompare(b.name);
        }
    });

    const clearAllFilters = () => {
        setSelectedCategory("All");
        setSearchTerm("");
        setFilterVeg(false);
        setFilterSpicy(false);
        setFilterBestseller(false);
        setSelectedHygiene("All");
        setFilterGlutenFree(false);
        setFilterJain(false);
        setFilterKeto(false);
        setSelectedSpiceLevel("All");
        setMaxCalories(1000);
        setSortBy("name");
    };

    const activeFiltersCount = [
        selectedCategory !== "All",
        searchTerm !== "",
        filterVeg,
        filterSpicy,
        filterBestseller,
        selectedHygiene !== "All",
        filterGlutenFree,
        filterJain,
        filterKeto,
        selectedSpiceLevel !== "All",
        maxCalories < 1000,
        sortBy !== "name"
    ].filter(Boolean).length;

    const getHygieneColor = (rating) => {
        switch(rating) {
            case "Excellent": return "#10b981";
            case "Good": return "#f59e0b";
            case "Average": return "#ef4444";
            default: return "#64748b";
        }
    };

    if (loading) return <div style={styles.loadingContainer}><div style={styles.loader}></div><p>Loading delicious menu...</p></div>;
    if (error) return <div style={styles.errorContainer}><p>{error}</p></div>;

    return (
        <div style={styles.container}>
            {/* Restaurant Header */}
            {restaurant && (
                <div style={styles.restaurantHeader}>
                    <div style={styles.restaurantImageContainer}>
                        <img 
                            src={restaurant.imageUrl} 
                            alt={restaurant.name}
                            style={styles.restaurantImage}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div style={styles.restaurantOverlay}>
                            <button onClick={() => navigate("/")} style={styles.backBtn}>
                                ← 🏠 Back
                            </button>
                            <button onClick={() => navigate("/cart")} style={styles.cartBtn}>
                                🛒 Cart ({cartCount})
                            </button>
                        </div>
                    </div>
                    <div style={styles.restaurantInfo}>
                        <h1 style={styles.restaurantName}>{restaurant.name}</h1>
                        <p style={styles.restaurantDesc}>{restaurant.description}</p>
                        <div style={styles.restaurantMeta}>
                            <span style={styles.rating}>⭐ {restaurant.rating}</span>
                            <span style={styles.deliveryTime}>🕒 {restaurant.deliveryTime} min</span>
                            <span style={styles.deliveryFee}>🚚 ₹{restaurant.deliveryFee}</span>
                            <span style={styles.location}>📍 {restaurant.location}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Search and Filters */}
            <div style={styles.filtersContainer}>
                <div style={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search for dishes or ingredients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                
                <div style={styles.quickFilters}>
                    <button 
                        key="filter-veg"
                        onClick={() => setFilterVeg(!filterVeg)}
                        style={{...styles.quickFilterBtn, ...(filterVeg ? styles.quickFilterActive : {})}}
                    >
                        🥬 Veg Only
                    </button>
                    <button 
                        key="filter-bestseller"
                        onClick={() => setFilterBestseller(!filterBestseller)}
                        style={{...styles.quickFilterBtn, ...(filterBestseller ? styles.quickFilterActive : {})}}
                    >
                        ⭐ Bestseller
                    </button>
                    <button 
                        key="filter-spicy"
                        onClick={() => setFilterSpicy(!filterSpicy)}
                        style={{...styles.quickFilterBtn, ...(filterSpicy ? styles.quickFilterActive : {})}}
                    >
                        🌶️ Spicy
                    </button>
                    <button 
                        key="filter-gluten-free"
                        onClick={() => setFilterGlutenFree(!filterGlutenFree)}
                        style={{...styles.quickFilterBtn, ...(filterGlutenFree ? styles.quickFilterActive : {})}}
                    >
                        🌾 Gluten-Free
                    </button>
                    <button 
                        onClick={() => setFilterJain(!filterJain)}
                        style={{...styles.quickFilterBtn, ...(filterJain ? styles.quickFilterActive : {})}}
                    >
                        🙏 Jain
                    </button>
                    <button 
                        onClick={() => setFilterKeto(!filterKeto)}
                        style={{...styles.quickFilterBtn, ...(filterKeto ? styles.quickFilterActive : {})}}
                    >
                        🥑 Keto
                    </button>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        style={{...styles.moreFiltersBtn, ...(activeFiltersCount > 0 ? styles.hasActiveFilters : {})}}
                    >
                        🔧 More Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div style={styles.advancedFilters}>
                    <div style={styles.filterSection}>
                        <h4 style={styles.filterTitle}>Hygiene Rating</h4>
                        <div style={styles.filterOptions}>
                            {hygieneOptions.map(option => (
                                <button
                                    key={option}
                                    onClick={() => setSelectedHygiene(option)}
                                    style={{
                                        ...styles.filterOption,
                                        ...(selectedHygiene === option ? styles.filterOptionActive : {}),
                                        ...(option !== "All" ? {color: getHygieneColor(option)} : {})
                                    }}
                                >
                                    {option !== "All" && "🛡️"} {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={styles.filterSection}>
                        <h4 style={styles.filterTitle}>Sort By</h4>
                        <div style={styles.filterOptions}>
                            <button
                                key="sort-name"
                                onClick={() => setSortBy("name")}
                                style={{...styles.filterOption, ...(sortBy === "name" ? styles.filterOptionActive : {})}}
                            >
                                📝 Name (A-Z)
                            </button>
                            <button
                                key="sort-price-low"
                                onClick={() => setSortBy("price-low")}
                                style={{...styles.filterOption, ...(sortBy === "price-low" ? styles.filterOptionActive : {})}}
                            >
                                💰 Price (Low to High)
                            </button>
                            <button
                                key="sort-price-high"
                                onClick={() => setSortBy("price-high")}
                                style={{...styles.filterOption, ...(sortBy === "price-high" ? styles.filterOptionActive : {})}}
                            >
                                💎 Price (High to Low)
                            </button>
                            <button
                                key="sort-prep-time"
                                onClick={() => setSortBy("prep-time")}
                                style={{...styles.filterOption, ...(sortBy === "prep-time" ? styles.filterOptionActive : {})}}
                            >
                                ⚡ Fastest First
                            </button>
                            <button
                                key="sort-rating"
                                onClick={() => setSortBy("rating")}
                                style={{...styles.filterOption, ...(sortBy === "rating" ? styles.filterOptionActive : {})}}
                            >
                                🏆 Popular First
                            </button>
                        </div>
                    </div>

                    <div style={styles.filterSection}>
                        <h4 style={styles.filterTitle}>Spice Level</h4>
                        <div style={styles.filterOptions}>
                            {spiceLevels.map(level => (
                                <button
                                    key={level}
                                    onClick={() => setSelectedSpiceLevel(level)}
                                    style={{
                                        ...styles.filterOption,
                                        ...(selectedSpiceLevel === level ? styles.filterOptionActive : {})
                                    }}
                                >
                                    {level !== "All" && "🌶️"} {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={styles.filterSection}>
                        <h4 style={styles.filterTitle}>Calories (Max: {maxCalories})</h4>
                        <div style={styles.sliderContainer}>
                            <input
                                type="range"
                                min="100"
                                max="1000"
                                step="50"
                                value={maxCalories}
                                onChange={(e) => setMaxCalories(parseInt(e.target.value))}
                                style={styles.calorieSlider}
                            />
                            <div style={styles.sliderLabels}>
                                <span>100 cal</span>
                                <span>1000+ cal</span>
                            </div>
                        </div>
                    </div>

                    <div style={styles.filterActions}>
                        <button onClick={clearAllFilters} style={styles.clearFiltersBtn}>
                            ❌ Clear All Filters
                        </button>
                        <button onClick={() => setShowFilters(false)} style={styles.applyFiltersBtn}>
                            ✅ Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Category Tabs */}
            <div style={styles.categoryTabs}>
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        style={{
                            ...styles.categoryTab,
                            ...(selectedCategory === category ? styles.categoryTabActive : {})
                        }}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Menu Items */}
            <div style={styles.menuContainer}>
                {sortedItems.length > 0 && (
                    <div style={styles.resultsHeader}>
                        <span style={styles.resultsCount}>
                            {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} found
                        </span>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearAllFilters} style={styles.clearFiltersLink}>
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
                
                {sortedItems.map(item => (
                    <div key={item.id} style={styles.menuItem}>
                        <div style={styles.itemContent}>
                            <div style={styles.itemHeader}>
                                <div style={styles.itemBadges}>
                                    {item.isVeg ? (
                                        <span style={styles.vegBadge}>🟢</span>
                                    ) : (
                                        <span style={styles.nonVegBadge}>🔴</span>
                                    )}
                                    {item.isBestseller && (
                                        <span style={styles.bestsellerBadge}>⭐ Bestseller</span>
                                    )}
                                    {item.isSpicy && (
                                        <span style={styles.spicyBadge}>🌶️ Spicy</span>
                                    )}
                                </div>
                                <div style={styles.hygieneRating}>
                                    <span style={{...styles.hygieneText, color: getHygieneColor(item.hygieneRating)}}>
                                        🛡️ {item.hygieneRating}
                                    </span>
                                </div>
                            </div>
                            
                            <h3 style={styles.itemName}>{item.name}</h3>
                            <p style={styles.itemDesc}>{item.description}</p>
                            
                            <div style={styles.itemMeta}>
                                <span style={styles.prepTime}>⏱️ {item.preparationTime} min</span>
                                {item.calories > 0 && (
                                    <span style={styles.calories}>🔥 {item.calories} cal</span>
                                )}
                            </div>
                            
                            <div style={styles.itemFooter}>
                                <span style={styles.price}>₹{item.price?.toFixed(0)}</span>
                                <button
                                    onClick={() => addToCart(item)}
                                    style={styles.addBtn}
                                >
                                    ➕ ADD
                                </button>
                            </div>
                        </div>
                        
                        <div style={styles.itemImageContainer}>
                            {item.imageUrl && (
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    style={styles.itemImage}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            )}
                            <div style={styles.imagePlaceholder}>
                                {item.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {sortedItems.length === 0 && (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🔍</div>
                    <h3 style={styles.emptyTitle}>No items found</h3>
                    <p style={styles.emptyText}>
                        {activeFiltersCount > 0 
                            ? "Try adjusting your filters to see more results"
                            : "No menu items available at the moment"
                        }
                    </p>
                    {activeFiltersCount > 0 && (
                        <button onClick={clearAllFilters} style={styles.clearFiltersBtn}>
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "#f8fafc"
    },
    restaurantHeader: {
        position: "relative",
        marginBottom: "20px"
    },
    restaurantImageContainer: {
        position: "relative",
        height: "250px",
        overflow: "hidden"
    },
    restaurantImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },
    restaurantOverlay: {
        position: "absolute",
        top: "20px",
        left: "20px",
        right: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    backBtn: {
        padding: "12px 20px",
        background: "rgba(255, 255, 255, 0.9)",
        color: "#1e293b",
        border: "none",
        borderRadius: "25px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
    },
    cartBtn: {
        padding: "12px 20px",
        background: "rgba(255, 107, 107, 0.9)",
        color: "white",
        border: "none",
        borderRadius: "25px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "14px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 12px rgba(255, 107, 107, 0.3)"
    },
    restaurantInfo: {
        padding: "24px",
        background: "white",
        marginTop: "-20px",
        borderRadius: "20px 20px 0 0",
        position: "relative",
        zIndex: 1,
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)"
    },
    restaurantName: {
        margin: "0 0 8px 0",
        fontSize: "28px",
        fontWeight: "800",
        color: "#1e293b",
        letterSpacing: "-0.5px"
    },
    restaurantDesc: {
        margin: "0 0 16px 0",
        color: "#64748b",
        fontSize: "16px",
        lineHeight: "1.5"
    },
    restaurantMeta: {
        display: "flex",
        gap: "20px",
        flexWrap: "wrap"
    },
    rating: {
        color: "#f59e0b",
        fontWeight: "700",
        fontSize: "14px"
    },
    deliveryTime: {
        color: "#10b981",
        fontWeight: "600",
        fontSize: "14px"
    },
    deliveryFee: {
        color: "#6366f1",
        fontWeight: "600",
        fontSize: "14px"
    },
    location: {
        color: "#ef4444",
        fontWeight: "600",
        fontSize: "14px"
    },
    filtersContainer: {
        padding: "0 20px 20px 20px",
        background: "white",
        borderBottom: "1px solid #e2e8f0"
    },
    searchContainer: {
        marginBottom: "16px"
    },
    searchInput: {
        width: "100%",
        padding: "14px 20px",
        border: "2px solid #e2e8f0",
        borderRadius: "25px",
        fontSize: "16px",
        outline: "none",
        transition: "all 0.3s ease",
        background: "#f8fafc"
    },
    quickFilters: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap"
    },
    quickFilterBtn: {
        padding: "10px 16px",
        border: "2px solid #e2e8f0",
        borderRadius: "20px",
        background: "white",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        color: "#64748b",
        transition: "all 0.3s ease"
    },
    quickFilterActive: {
        background: "#10b981",
        color: "white",
        border: "2px solid #10b981"
    },
    moreFiltersBtn: {
        padding: "10px 16px",
        border: "2px solid #6366f1",
        borderRadius: "20px",
        background: "white",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        color: "#6366f1",
        transition: "all 0.3s ease"
    },
    hasActiveFilters: {
        background: "#6366f1",
        color: "white"
    },
    advancedFilters: {
        background: "white",
        padding: "24px",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "inset 0 4px 8px rgba(0, 0, 0, 0.05)"
    },
    filterSection: {
        marginBottom: "24px"
    },
    filterTitle: {
        margin: "0 0 12px 0",
        fontSize: "16px",
        fontWeight: "700",
        color: "#1e293b"
    },
    filterOptions: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap"
    },
    filterOption: {
        padding: "8px 16px",
        border: "2px solid #e2e8f0",
        borderRadius: "16px",
        background: "white",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "13px",
        color: "#64748b",
        transition: "all 0.3s ease"
    },
    filterOptionActive: {
        background: "#ff6b6b",
        color: "white",
        border: "2px solid #ff6b6b"
    },
    filterActions: {
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        paddingTop: "16px",
        borderTop: "1px solid #e2e8f0"
    },
    clearFiltersBtn: {
        padding: "12px 24px",
        border: "2px solid #ef4444",
        borderRadius: "20px",
        background: "white",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        color: "#ef4444",
        transition: "all 0.3s ease"
    },
    applyFiltersBtn: {
        padding: "12px 24px",
        border: "2px solid #10b981",
        borderRadius: "20px",
        background: "#10b981",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        color: "white",
        transition: "all 0.3s ease"
    },
    resultsHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        padding: "16px 0",
        borderBottom: "1px solid #f1f5f9"
    },
    resultsCount: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#64748b"
    },
    clearFiltersLink: {
        background: "none",
        border: "none",
        color: "#ff6b6b",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        textDecoration: "underline"
    },
    sliderContainer: {
        padding: "8px 0"
    },
    calorieSlider: {
        width: "100%",
        height: "6px",
        borderRadius: "3px",
        background: "#e2e8f0",
        outline: "none",
        cursor: "pointer"
    },
    sliderLabels: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "8px",
        fontSize: "12px",
        color: "#64748b"
    },
    categoryTabs: {
        display: "flex",
        gap: "8px",
        padding: "20px",
        background: "white",
        overflowX: "auto",
        borderBottom: "1px solid #e2e8f0"
    },
    categoryTab: {
        padding: "12px 20px",
        border: "none",
        borderRadius: "25px",
        background: "#f1f5f9",
        color: "#64748b",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        whiteSpace: "nowrap",
        transition: "all 0.3s ease"
    },
    categoryTabActive: {
        background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
        color: "white",
        boxShadow: "0 4px 12px rgba(255, 107, 107, 0.3)"
    },
    menuContainer: {
        padding: "20px"
    },
    menuItem: {
        display: "flex",
        background: "white",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        border: "1px solid #f1f5f9",
        transition: "all 0.3s ease",
        gap: "16px"
    },
    itemContent: {
        flex: 1
    },
    itemHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px"
    },
    itemBadges: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap"
    },
    vegBadge: {
        fontSize: "12px"
    },
    nonVegBadge: {
        fontSize: "12px"
    },
    bestsellerBadge: {
        background: "#fef3c7",
        color: "#d97706",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "700"
    },
    spicyBadge: {
        background: "#fee2e2",
        color: "#dc2626",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "700"
    },
    dietaryBadge: {
        background: "#ecfdf5",
        color: "#059669",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "700"
    },
    hygieneRating: {
        display: "flex",
        alignItems: "center"
    },
    hygieneText: {
        fontSize: "12px",
        fontWeight: "700",
        padding: "4px 8px",
        borderRadius: "12px",
        background: "rgba(16, 185, 129, 0.1)"
    },
    itemName: {
        margin: "0 0 8px 0",
        fontSize: "18px",
        fontWeight: "700",
        color: "#1e293b",
        lineHeight: "1.3"
    },
    itemDesc: {
        margin: "0 0 12px 0",
        color: "#64748b",
        fontSize: "14px",
        lineHeight: "1.5"
    },
    itemMeta: {
        marginBottom: "16px",
        display: "flex",
        gap: "16px",
        alignItems: "center"
    },
    prepTime: {
        color: "#64748b",
        fontSize: "13px",
        fontWeight: "600"
    },
    calories: {
        color: "#f59e0b",
        fontSize: "13px",
        fontWeight: "600"
    },
    itemFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    price: {
        fontSize: "20px",
        fontWeight: "800",
        color: "#1e293b"
    },
    addBtn: {
        padding: "10px 20px",
        background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
        color: "white",
        border: "2px solid #ff6b6b",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "14px",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 12px rgba(255, 107, 107, 0.3)"
    },
    itemImageContainer: {
        position: "relative",
        width: "120px",
        height: "120px",
        flexShrink: 0
    },
    itemImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "12px"
    },
    imagePlaceholder: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
        borderRadius: "12px",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "24px",
        fontWeight: "700"
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "#64748b"
    },
    loader: {
        width: "40px",
        height: "40px",
        border: "4px solid #f1f5f9",
        borderTop: "4px solid #ff6b6b",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "16px"
    },
    errorContainer: {
        textAlign: "center",
        padding: "60px 20px",
        color: "#dc2626",
        background: "white",
        margin: "20px",
        borderRadius: "16px"
    },
    emptyState: {
        textAlign: "center",
        padding: "60px 20px",
        color: "#64748b",
        background: "white",
        margin: "20px",
        borderRadius: "16px"
    },
    emptyIcon: {
        fontSize: "48px",
        marginBottom: "16px"
    },
    emptyTitle: {
        margin: "0 0 8px 0",
        fontSize: "20px",
        fontWeight: "700",
        color: "#1e293b"
    },
    emptyText: {
        margin: "0 0 20px 0",
        fontSize: "16px",
        color: "#64748b",
        lineHeight: "1.5"
    }
};
