import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import aiEngine from "../services/aiEngine";
import TasteProfileSetup from "../components/TasteProfileSetup";
import PremiumRestaurantCard from "../components/PremiumRestaurantCard";
import SmartSearchBar from "../components/SmartSearchBar";
import CraveSwipe from "../components/CraveSwipe";
import LiveLocationDetector from "../components/LiveLocationDetector";
import GreenImpactDashboard from "../components/GreenImpactDashboard";
import { API_BASE_URL } from "../config/apiConfig";

export default function PremiumHome() {
    const [restaurants, setRestaurants] = useState([]);
    const [allMenuItems, setAllMenuItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMood] = useState(null);
    const [showTasteProfile, setShowTasteProfile] = useState(false);
    const [showCraveSwipe, setShowCraveSwipe] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [sortBy, setSortBy] = useState("tasteMatch");
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showLocationDetector, setShowLocationDetector] = useState(false);
    
    // AI Hub Modals
    const [showMealPlanner, setShowMealPlanner] = useState(false);
    const [showBudgetPlanner, setShowBudgetPlanner] = useState(false);
    const [showComboBuilder, setShowComboBuilder] = useState(false);
    const [showChatAssistant, setShowChatAssistant] = useState(false);

    // Weather & Time state
    const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [temp] = useState(29); // Hyderabad avg
    
    // AI Interactive state
    const [calorieTarget, setCalorieTarget] = useState(2000);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [budgetLimit, setBudgetLimit] = useState(250);
    const [chatQuery, setChatQuery] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { sender: 'bot', text: 'Hello! I am your BiteRush AI assistant. Ask me something like "healthy dinner under ₹300" or "suggest high protein lunches"!' }
    ]);
    const [generatedCombo, setGeneratedCombo] = useState(null);

    const token = localStorage.getItem("token");

    // Live clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    // Load saved location on mount
    useEffect(() => {
        const savedLoc = localStorage.getItem('userLocation');
        if (savedLoc) setUserLocation(JSON.parse(savedLoc));
    }, []);

    const handleLocationDetected = (loc) => {
        setUserLocation(loc);
        localStorage.setItem('userLocation', JSON.stringify(loc));
        setShowLocationDetector(false);
    };

    const fetchAllMenus = async (loadedRestaurants) => {
        try {
            const menuPromises = loadedRestaurants.map(r => 
                fetch(`${API_BASE_URL}/menus/restaurant/${r.id}`, {
                    headers: { 
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }).then(res => res.ok ? res.json() : [])
            );
            const menus = await Promise.all(menuPromises);
            const flattened = menus.flatMap((m, index) => 
                m.map(item => ({
                    ...item,
                    restaurantName: loadedRestaurants[index].name,
                    restaurantId: loadedRestaurants[index].id
                }))
            );
            setAllMenuItems(flattened);
        } catch (err) {
            console.error("Error prefetching menus:", err);
        }
    };

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
                let data = await response.json();
                data = Array.isArray(data) ? data : [];
                
                // Enhance with AI scores and distance
                data = data.map(r => ({
                    ...r,
                    tasteMatch: aiEngine.calculateTasteMatch(r),
                    deliveryAccuracy: aiEngine.calculateDeliveryAccuracy(r),
                    nudges: aiEngine.getPersonalizedNudges(r),
                    distance: userLocation ? aiEngine.calculateDistance(
                        userLocation.latitude, userLocation.longitude,
                        r.latitude, r.longitude
                    ) : null
                }));

                setRestaurants(data);
                fetchAllMenus(data);
            } else {
                setError("Failed to load restaurants");
            }
        } catch (err) {
            console.error("Error loading restaurants:", err);
            setError("Cannot connect to server");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, userLocation]);

    useEffect(() => {
        if (token) {
            loadRestaurants();
        }
    }, [token, loadRestaurants, userLocation]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: "Good Morning", emoji: "🌅", time: "breakfast" };
        if (hour < 17) return { text: "Good Afternoon", emoji: "☀️", time: "lunch" };
        if (hour < 21) return { text: "Good Evening", emoji: "🌆", time: "dinner" };
        return { text: "Late Night Cravings", emoji: "🌙", time: "latenight" };
    };

    const greeting = getGreeting();

    const getFilteredRestaurants = () => {
        let filtered = restaurants;

        if (selectedMood) {
            filtered = aiEngine.getMoodRecommendations(selectedMood, filtered);
        }

        if (searchTerm) {
            filtered = filtered.filter(r => 
                r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.cuisineType?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        switch(sortBy) {
            case "tasteMatch":
                return filtered.sort((a, b) => b.tasteMatch - a.tasteMatch);
            case "rating":
                return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case "deliveryTime":
                return filtered.sort((a, b) => (a.deliveryTime || 30) - (b.deliveryTime || 30));
            case "distance":
                return filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
            case "deliveryAccuracy":
                return filtered.sort((a, b) => b.deliveryAccuracy - a.deliveryAccuracy);
            default:
                return filtered;
        }
    };

    const filteredRestaurants = getFilteredRestaurants();

    // AI Hub actions
    const handleGenerateMealPlan = () => {
        if (allMenuItems.length === 0) {
            alert("Dishes are still loading, please wait!");
            return;
        }
        // Group items
        const breakfasts = allMenuItems.filter(i => i.price < 150 || i.category.toLowerCase().includes('dessert') || i.category.toLowerCase().includes('breakfast'));
        const mains = allMenuItems.filter(i => i.category.toLowerCase().includes('main') || i.category.toLowerCase().includes('pizza') || i.category.toLowerCase().includes('sushi') || i.category.toLowerCase().includes('burger'));
        
        const b = breakfasts[Math.floor(Math.random() * breakfasts.length)] || allMenuItems[0];
        const l = mains[Math.floor(Math.random() * mains.length)] || allMenuItems[1];
        const d = mains[(Math.floor(Math.random() * mains.length) + 1) % mains.length] || allMenuItems[2];

        setGeneratedPlan({
            breakfast: b,
            lunch: l,
            dinner: d,
            calories: Math.round(350 + Math.random() * 200 + 500 + Math.random() * 200 + 450 + Math.random() * 200),
            protein: Math.round(25 + Math.random() * 20 + 35 + Math.random() * 15)
        });
    };

    const addPlanToCart = () => {
        if (!generatedPlan) return;
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        [generatedPlan.breakfast, generatedPlan.lunch, generatedPlan.dinner].forEach(item => {
            const existing = savedCart.find(i => i.id === item.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                savedCart.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    restaurantId: item.restaurantId,
                    quantity: 1
                });
            }
        });
        localStorage.setItem('cart', JSON.stringify(savedCart));
        window.dispatchEvent(new Event('cartUpdated'));
        alert("All meal plan items added to cart!");
        setShowMealPlanner(false);
    };

    const handleGenerateCombo = () => {
        if (allMenuItems.length < 2) return;
        const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
        if (!randomRestaurant) return;
        const items = allMenuItems.filter(i => i.restaurantId === randomRestaurant.id);
        if (items.length < 2) return;

        const main = items[0];
        const side = items[1];
        const originalPrice = main.price + side.price;
        const discountedPrice = Math.round(originalPrice * 0.85); // 15% discount

        setGeneratedCombo({
            restaurantName: randomRestaurant.name,
            main,
            side,
            originalPrice,
            discountedPrice,
            code: "AI-COMBO-" + Math.round(100 + Math.random() * 900)
        });
    };

    const addComboToCart = () => {
        if (!generatedCombo) return;
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        [generatedCombo.main, generatedCombo.side].forEach(item => {
            const existing = savedCart.find(i => i.id === item.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                savedCart.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    restaurantId: item.restaurantId,
                    quantity: 1
                });
            }
        });
        localStorage.setItem('cart', JSON.stringify(savedCart));
        window.dispatchEvent(new Event('cartUpdated'));
        alert(`Combo added to cart! Use coupon code: ${generatedCombo.code} for discount.`);
        setShowComboBuilder(false);
    };

    const handleSendChat = () => {
        if (!chatQuery.trim()) return;
        const userMsg = chatQuery.trim();
        setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
        setChatQuery("");

        setTimeout(() => {
            const q = userMsg.toLowerCase();
            let replyText = "I couldn't find any specific dishes matching that prompt. Try asking for 'healthy options' or 'spicy chicken'!";
            let recommendations = [];

            if (q.includes('healthy') || q.includes('calorie') || q.includes('diet')) {
                recommendations = allMenuItems.filter(i => i.price < 350 && i.calories < 400).slice(0, 3);
                replyText = "Here are some delicious, low-calorie healthy meals I calculated for you:";
            } else if (q.includes('spicy') || q.includes('hot')) {
                recommendations = allMenuItems.filter(i => i.isSpicy || i.name.toLowerCase().includes('spicy')).slice(0, 3);
                replyText = "Craving some heat? Check out these spicy favorites:";
            } else if (q.includes('protein') || q.includes('chicken')) {
                recommendations = allMenuItems.filter(i => i.name.toLowerCase().includes('chicken') || i.name.toLowerCase().includes('biryani')).slice(0, 3);
                replyText = "Here are high-protein choices to fuel your day:";
            } else if (q.includes('cheap') || q.includes('budget') || q.includes('low price')) {
                recommendations = allMenuItems.filter(i => i.price < 200).slice(0, 3);
                replyText = "Budget friendly meals under ₹200:";
            }

            setChatHistory(prev => [...prev, { sender: 'bot', text: replyText, recommendations }]);
        }, 1000);
    };

    const addToCartDirectly = (item) => {
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = savedCart.find(i => i.id === item.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            savedCart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                restaurantId: item.restaurantId,
                quantity: 1
            });
        }
        localStorage.setItem('cart', JSON.stringify(savedCart));
        window.dispatchEvent(new Event('cartUpdated'));
        alert(`Added ${item.name} to cart!`);
    };

    if (!token) {
        return (
            <div style={styles.welcomeContainer}>
                <div style={styles.welcomeGlass}>
                    <div style={styles.welcomeContent}>
                        <h1 style={styles.welcomeTitle}>
                            <span style={styles.logoGradient}>BiteRush</span>
                            <span style={styles.aiTag}>AI-Powered</span>
                        </h1>
                        <p style={styles.welcomeSubtitle}>
                            Next-generation food delivery with hyper-personalization
                        </p>
                        
                        <div style={styles.featuresShowcase}>
                            <div style={styles.featureCard}>
                                <div style={styles.featureIconLarge}>🎯</div>
                                <h3>Taste Match AI</h3>
                                <p>Get personalized recommendations based on your unique taste profile</p>
                            </div>
                            <div style={styles.featureCard}>
                                <div style={styles.featureIconLarge}>🧠</div>
                                <h3>Mood-Based Ordering</h3>
                                <p>Order based on how you feel - comfort, party, healthy, or lazy</p>
                            </div>
                            <div style={styles.featureCard}>
                                <div style={styles.featureIconLarge}>🔍</div>
                                <h3>Full Transparency</h3>
                                <p>See real delivery accuracy, hygiene ratings, and carbon footprint</p>
                            </div>
                        </div>

                        <div style={styles.welcomeActions}>
                            <Link to="/register" style={styles.primaryBtn}>
                                Get Started →
                            </Link>
                            <Link to="/login" style={styles.secondaryBtn}>
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showTasteProfile) {
        return (
            <div style={styles.profileSetupContainer}>
                <TasteProfileSetup onComplete={() => {
                    setShowTasteProfile(false);
                    loadRestaurants();
                }} />
            </div>
        );
    }

    if (loading) return (
        <div style={styles.loadingContainer}>
            <div style={styles.loader}></div>
            <p style={styles.loadingText}>Analyzing perfect flavor matches...</p>
        </div>
    );

    if (error) return (
        <div style={styles.errorContainer}>
            <p>{error}</p>
            <button onClick={loadRestaurants} style={styles.retryBtn}>Retry</button>
        </div>
    );

    return (
        <div style={{...styles.container, ...(isDarkMode ? styles.darkMode : {})}}>
            
            {/* Interactive Immersive Hero Dashboard */}
            <div style={styles.heroSection}>
                {/* Background decorative elements */}
                <div style={styles.blobContainer}>
                    <div style={styles.blob1}></div>
                    <div style={styles.blob2}></div>
                </div>

                <div style={styles.heroGlass}>
                    <div style={styles.heroContent}>
                        
                        {/* Widgets Row */}
                        <div style={styles.widgetsRow}>
                            <div style={styles.widgetCard}>
                                <span style={styles.widgetIcon}>🕒</span>
                                <div>
                                    <div style={styles.widgetVal}>{timeStr}</div>
                                    <div style={styles.widgetLbl}>Local Time</div>
                                </div>
                            </div>
                            <div style={styles.widgetCard}>
                                <span style={styles.widgetIcon}>🌡️</span>
                                <div>
                                    <div style={styles.widgetVal}>{temp}°C</div>
                                    <div style={styles.widgetLbl}>Hyderabad • Cloudy</div>
                                </div>
                            </div>
                        </div>

                        <div style={styles.greetingSection}>
                            <span style={styles.greetingEmoji}>{greeting.emoji}</span>
                            <h1 style={styles.greetingText}>{greeting.text}, Test User</h1>
                        </div>
                        
                        <p style={styles.heroSubtitle}>
                            BiteRush AI has mapped 5 local kitchens matching your profile.
                        </p>

                        {/* Location Bar */}
                        <div style={styles.locationBar} onClick={() => setShowLocationDetector(true)}>
                            <span style={styles.locationIcon}>📍</span>
                            <span style={styles.locationText}>
                                {userLocation ? (userLocation.address || 'Location detected') : 'Banjara Hills, Hyderabad'}
                            </span>
                            <span style={styles.locationArrow}>⌄</span>
                        </div>

                        {showLocationDetector && (
                            <div style={styles.locationModalOverlay} onClick={() => setShowLocationDetector(false)}>
                                <div style={styles.locationModal} onClick={e => e.stopPropagation()}>
                                    <LiveLocationDetector 
                                        onLocationDetected={handleLocationDetected}
                                        onLocationError={(err) => console.error(err)}
                                    />
                                    <button 
                                        style={styles.closeLocationBtn}
                                        onClick={() => setShowLocationDetector(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* AI Smart Search Bar */}
                        <SmartSearchBar 
                            value={searchTerm}
                            onChange={setSearchTerm}
                            suggestions={aiEngine.getSmartSuggestions()}
                            allMenuItems={allMenuItems}
                        />

                        {/* Quick AI Hub Shortcuts */}
                        <div style={styles.aiHubRow}>
                            <button onClick={() => { handleGenerateMealPlan(); setShowMealPlanner(true); }} style={styles.aiHubBtn}>
                                🥗 AI Meal Planner
                            </button>
                            <button onClick={() => setShowBudgetPlanner(true)} style={styles.aiHubBtn}>
                                💰 AI Budget Finder
                            </button>
                            <button onClick={() => { handleGenerateCombo(); setShowComboBuilder(true); }} style={styles.aiHubBtn}>
                                🍱 AI Combo Builder
                            </button>
                            <button onClick={() => setShowChatAssistant(true)} style={styles.aiHubBtn}>
                                💬 AI Chatbot
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Food Illustration Icons */}
                <div style={styles.floatingIconsContainer}>
                    <div style={{...styles.floatingEmoji, top: '20%', left: '10%'}}>🍕</div>
                    <div style={{...styles.floatingEmoji, top: '15%', right: '12%'}}>🍣</div>
                    <div style={{...styles.floatingEmoji, bottom: '25%', left: '15%'}}>🍔</div>
                    <div style={{...styles.floatingEmoji, bottom: '20%', right: '10%'}}>🥗</div>
                </div>
            </div>

            {/* CraveSwipe Action Banner */}
            <div style={styles.swipeBannerContainer}>
                <div style={styles.swipeBanner}>
                    <div>
                        <h4 style={styles.swipeTitle}>😋 Indecisive? Try CraveSwipe!</h4>
                        <p style={styles.swipeDesc}>Tinder-style swipe mode to quickly lock in what you want to eat.</p>
                    </div>
                    <button onClick={() => setShowCraveSwipe(true)} style={styles.swipeActionBtn}>
                        🔥 Start Swiping
                    </button>
                </div>
            </div>

            {/* AI Personalized Dashboard Panel */}
            <div style={styles.dashboardSection}>
                <h3 style={styles.dashboardTitle}>📊 Your AI Personal Metrics</h3>
                <div style={styles.dashboardGrid}>
                    <div style={styles.dashCard}>
                        <span style={styles.dashIcon}>🔥</span>
                        <div>
                            <div style={styles.dashVal}>680 / 2000 kcal</div>
                            <div style={styles.dashLabel}>Today's Calories</div>
                        </div>
                    </div>
                    <div style={styles.dashCard}>
                        <span style={styles.dashIcon}>💰</span>
                        <div>
                            <div style={styles.dashVal}>₹520</div>
                            <div style={styles.dashLabel}>Budget Limit</div>
                        </div>
                    </div>
                    <div style={styles.dashCard}>
                        <span style={styles.dashIcon}>🛡️</span>
                        <div>
                            <div style={styles.dashVal}>₹149 saved</div>
                            <div style={styles.dashLabel}>Delivery Saves</div>
                        </div>
                    </div>
                    <div style={styles.dashCard}>
                        <span style={styles.dashIcon}>🍃</span>
                        <div>
                            <div style={styles.dashVal}>92 / 100</div>
                            <div style={styles.dashLabel}>Eco Score</div>
                        </div>
                    </div>
                    <div style={styles.dashCard}>
                        <span style={styles.dashIcon}>⭐</span>
                        <div>
                            <div style={styles.dashVal}>580 pts</div>
                            <div style={styles.dashLabel}>Reward Points</div>
                        </div>
                    </div>
                    <div style={styles.dashCard}>
                        <span style={styles.dashIcon}>📅</span>
                        <div>
                            <div style={styles.dashVal}>5 Day Streak 🔥</div>
                            <div style={styles.dashLabel}>Activity Log</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Curated AI Horizontal Scroll Sections */}
            {allMenuItems.length > 0 && (
                <div style={styles.curatedScrollSection}>
                    <h3 style={styles.scrollSectionTitle}>🥗 Today's Low-Calorie Picks</h3>
                    <div style={styles.scrollWrapper}>
                        {allMenuItems.filter(i => i.calories && i.calories <= 320).slice(0, 6).map(item => (
                            <div key={item.id} style={styles.dishCard}>
                                <div style={styles.dishBadge}>🥗 Healthy Choice</div>
                                <h4 style={styles.dishName}>{item.name}</h4>
                                <p style={styles.dishRest}>{item.restaurantName} • {item.calories} kcal</p>
                                <div style={styles.dishPriceRow}>
                                    <span style={styles.dishPrice}>₹{item.price}</span>
                                    <button onClick={() => addToCartDirectly(item)} style={styles.dishAddBtn}>+ Add</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {allMenuItems.length > 0 && (
                <div style={styles.curatedScrollSection}>
                    <h3 style={styles.scrollSectionTitle}>💰 Budget Feasts Under ₹200</h3>
                    <div style={styles.scrollWrapper}>
                        {allMenuItems.filter(i => i.price <= 200).slice(0, 6).map(item => (
                            <div key={item.id} style={styles.dishCard}>
                                <div style={styles.dishBadgeYellow}>💸 Save Big</div>
                                <h4 style={styles.dishName}>{item.name}</h4>
                                <p style={styles.dishRest}>{item.restaurantName}</p>
                                <div style={styles.dishPriceRow}>
                                    <span style={styles.dishPrice}>₹{item.price}</span>
                                    <button onClick={() => addToCartDirectly(item)} style={styles.dishAddBtn}>+ Add</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Smart Filters */}
            <div style={styles.filtersSection}>
                <div style={styles.filtersContainer}>
                    <div style={styles.sortHeader}>
                        <h3>🏪 Explore Restaurants</h3>
                        <p>Calculated using active distance, matching cuisine, and delivery stats</p>
                    </div>
                    <div style={styles.sortButtons}>
                        {[
                            { value: 'tasteMatch', label: '🎯 Taste Match', icon: '🎯' },
                            { value: 'rating', label: '⭐ Rating', icon: '⭐' },
                            { value: 'distance', label: '📍 Distance', icon: '📍' },
                            { value: 'deliveryTime', label: '⚡ Delivery Time', icon: '⚡' },
                            { value: 'deliveryAccuracy', label: '📊 Confidence', icon: '📊' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSortBy(option.value)}
                                style={{
                                    ...styles.sortBtn,
                                    ...(sortBy === option.value ? styles.sortBtnActive : {})
                                }}
                            >
                                <span style={styles.sortIcon}>{option.icon}</span>
                                {option.label}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => setShowTasteProfile(true)}
                        style={styles.editProfileBtn}
                    >
                        ⚙️ Edit Taste Profile
                    </button>
                </div>
            </div>

            {/* Restaurants Grid */}
            <div style={styles.restaurantsSection}>
                <div style={styles.restaurantGrid}>
                    {filteredRestaurants.map(restaurant => (
                        <PremiumRestaurantCard 
                            key={restaurant.id}
                            restaurant={restaurant}
                            isDarkMode={isDarkMode}
                        />
                    ))}
                </div>

                {filteredRestaurants.length === 0 && (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>🔍</div>
                        <h3>No restaurants matched</h3>
                        <p>Try resetting filters or changing your search terms.</p>
                    </div>
                )}
            </div>

            {/* Sustainability Dashboard */}
            <div style={styles.restaurantsSection}>
                <GreenImpactDashboard orderHistory={aiEngine.loadOrderHistory()} />
            </div>

            {/* Dark Mode Toggle */}
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={styles.darkModeToggle}
                title="Toggle Dark/Light Mode"
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* CraveSwipe Overlay */}
            {showCraveSwipe && (
                <CraveSwipe 
                    onClose={() => setShowCraveSwipe(false)}
                    onMatch={(item) => {
                        console.log("Matched item:", item);
                    }}
                />
            )}

            {/* ==================== AI MODAL POPUPS ==================== */}

            {/* AI Meal Planner Modal */}
            <AnimatePresence>
                {showMealPlanner && (
                    <div style={styles.modalOverlay} onClick={() => setShowMealPlanner(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={styles.aiModal} 
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={styles.modalTitle}>🥗 Daily Diet AI Planner</h3>
                            <p style={styles.modalDesc}>Select your daily caloric goal, and BiteRush AI will extract a balanced combination of dishes from our kitchens.</p>
                            
                            <div style={styles.inputGroup}>
                                <label>Caloric Target: <strong>{calorieTarget} kcal</strong></label>
                                <input 
                                    type="range" 
                                    min="1200" 
                                    max="3500" 
                                    step="100" 
                                    value={calorieTarget} 
                                    onChange={(e) => setCalorieTarget(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                            </div>

                            <button onClick={handleGenerateMealPlan} style={styles.planGenerateBtn}>
                                Calculate Optimal Plan
                            </button>

                            {generatedPlan && (
                                <div style={styles.planCardBox}>
                                    <div style={styles.planHeader}>
                                        <span>Target Met!</span>
                                        <span>🔥 {generatedPlan.calories} kcal • {generatedPlan.protein}g Protein</span>
                                    </div>
                                    <div style={styles.planItems}>
                                        <div style={styles.planItem}>
                                            <span style={styles.planSlot}>Breakfast</span>
                                            <strong>{generatedPlan.breakfast.name}</strong>
                                            <span style={styles.planRest}>{generatedPlan.breakfast.restaurantName}</span>
                                        </div>
                                        <div style={styles.planItem}>
                                            <span style={styles.planSlot}>Lunch</span>
                                            <strong>{generatedPlan.lunch.name}</strong>
                                            <span style={styles.planRest}>{generatedPlan.lunch.restaurantName}</span>
                                        </div>
                                        <div style={styles.planItem}>
                                            <span style={styles.planSlot}>Dinner</span>
                                            <strong>{generatedPlan.dinner.name}</strong>
                                            <span style={styles.planRest}>{generatedPlan.dinner.restaurantName}</span>
                                        </div>
                                    </div>

                                    <button onClick={addPlanToCart} style={styles.planCartBtn}>
                                        🛒 Add Plan to Cart (₹{(generatedPlan.breakfast.price + generatedPlan.lunch.price + generatedPlan.dinner.price)} total)
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Budget Planner Modal */}
            <AnimatePresence>
                {showBudgetPlanner && (
                    <div style={styles.modalOverlay} onClick={() => setShowBudgetPlanner(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={styles.aiModal} 
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={styles.modalTitle}>💰 AI Budget Meal Finder</h3>
                            <p style={styles.modalDesc}>Find gourmet dishes across all local kitchens fitting your wallet limits.</p>
                            
                            <div style={styles.inputGroup}>
                                <label>Target Budget Limit: <strong>₹{budgetLimit}</strong></label>
                                <input 
                                    type="range" 
                                    min="80" 
                                    max="600" 
                                    step="10" 
                                    value={budgetLimit} 
                                    onChange={(e) => setBudgetLimit(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                            </div>

                            <div style={styles.budgetDishesList}>
                                {allMenuItems.filter(i => i.price <= budgetLimit).slice(0, 5).map(item => (
                                    <div key={item.id} style={styles.budgetDishRow}>
                                        <div>
                                            <strong>{item.name}</strong>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.restaurantName}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={styles.dishPrice}>₹{item.price}</span>
                                            <button onClick={() => addToCartDirectly(item)} style={styles.dishAddBtn}>+ Add</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Combo Builder Modal */}
            <AnimatePresence>
                {showComboBuilder && (
                    <div style={styles.modalOverlay} onClick={() => setShowComboBuilder(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={styles.aiModal} 
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={styles.modalTitle}>🍱 AI Combo Generator</h3>
                            <p style={styles.modalDesc}>Let AI build a custom combo pack of dishes from a single restaurant with a 15% discount code.</p>
                            
                            <button onClick={handleGenerateCombo} style={styles.planGenerateBtn}>
                                Generate Combo
                            </button>

                            {generatedCombo && (
                                <div style={styles.planCardBox}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>{generatedCombo.restaurantName} Custom Combo</h4>
                                    <div style={styles.planItems}>
                                        <div style={styles.planItem}>
                                            <strong>{generatedCombo.main.name}</strong>
                                            <span>Main Course</span>
                                        </div>
                                        <div style={styles.planItem}>
                                            <strong>{generatedCombo.side.name}</strong>
                                            <span>Side / Snack</span>
                                        </div>
                                    </div>
                                    <div style={styles.comboPriceRow}>
                                        <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>₹{generatedCombo.originalPrice}</span>
                                        <span style={{ fontWeight: '800', color: '#10b981', fontSize: '18px' }}>₹{generatedCombo.discountedPrice}</span>
                                    </div>
                                    <div style={styles.couponTag}>Use code: <strong>{generatedCombo.code}</strong></div>
                                    
                                    <button onClick={addComboToCart} style={styles.planCartBtn}>
                                        🛒 Add Combo to Cart
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Chatbot Assistant Modal */}
            <AnimatePresence>
                {showChatAssistant && (
                    <div style={styles.modalOverlay} onClick={() => setShowChatAssistant(false)}>
                        <motion.div 
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            style={styles.chatModal} 
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={styles.chatHeader}>
                                <h3>🤖 BiteRush AI Concierge</h3>
                                <button onClick={() => setShowChatAssistant(false)} style={styles.closeChatBtn}>✕</button>
                            </div>
                            
                            <div style={styles.chatHistory}>
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} style={msg.sender === 'bot' ? styles.botMsg : styles.userMsg}>
                                        <p style={{ margin: 0 }}>{msg.text}</p>
                                        
                                        {msg.recommendations && msg.recommendations.map(item => (
                                            <div key={item.id} style={styles.chatRecItem}>
                                                <div>
                                                    <strong style={{ fontSize: '13px' }}>{item.name}</strong>
                                                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{item.restaurantName} • ₹{item.price}</p>
                                                </div>
                                                <button onClick={() => addToCartDirectly(item)} style={styles.chatAddBtn}>+ Add</button>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div style={styles.chatInputRow}>
                                <input 
                                    type="text" 
                                    placeholder="Type your question..." 
                                    value={chatQuery}
                                    onChange={(e) => setChatQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                    style={styles.chatInputField}
                                />
                                <button onClick={handleSendChat} style={styles.chatSendBtn}>Send</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#f8fafc',
        transition: 'all 0.3s ease',
        paddingBottom: '80px'
    },
    darkMode: {
        background: '#0f172a',
        color: '#f8fafc'
    },
    welcomeContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
    },
    welcomeGlass: {
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        borderRadius: '30px',
        padding: '60px 40px',
        maxWidth: '1100px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    },
    welcomeContent: {
        textAlign: 'center'
    },
    welcomeTitle: {
        fontSize: '4rem',
        fontWeight: '900',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
    },
    logoGradient: {
        background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    aiTag: {
        fontSize: '1rem',
        background: 'rgba(255, 255, 255, 0.3)',
        padding: '8px 20px',
        borderRadius: '20px',
        color: 'white',
        fontWeight: '600'
    },
    welcomeSubtitle: {
        fontSize: '1.5rem',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '50px'
    },
    featuresShowcase: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '30px',
        marginBottom: '50px'
    },
    featureCard: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease'
    },
    featureIconLarge: {
        fontSize: '3rem',
        marginBottom: '15px'
    },
    welcomeActions: {
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    primaryBtn: {
        padding: '16px 40px',
        background: 'white',
        color: '#667eea',
        borderRadius: '50px',
        textDecoration: 'none',
        fontSize: '1.1rem',
        fontWeight: '700',
        transition: 'all 0.3s ease',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
    },
    secondaryBtn: {
        padding: '16px 40px',
        background: 'transparent',
        color: 'white',
        border: '2px solid white',
        borderRadius: '50px',
        textDecoration: 'none',
        fontSize: '1.1rem',
        fontWeight: '700',
        transition: 'all 0.3s ease'
    },
    heroSection: {
        position: 'relative',
        padding: '60px 20px',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    blobContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0
    },
    blob1: {
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'rgba(167, 139, 250, 0.3)',
        borderRadius: '50%',
        filter: 'blur(80px)'
    },
    blob2: {
        position: 'absolute',
        bottom: '-10%',
        right: '25%',
        width: '350px',
        height: '350px',
        background: 'rgba(244, 114, 182, 0.25)',
        borderRadius: '50%',
        filter: 'blur(80px)'
    },
    heroGlass: {
        position: 'relative',
        zIndex: 2,
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '32px',
        padding: '40px',
        width: '100%',
        maxWidth: '900px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)'
    },
    heroContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    widgetsRow: {
        display: 'flex',
        gap: '16px',
        marginBottom: '24px'
    },
    widgetCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'white',
        padding: '10px 18px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        border: '1px solid #f1f5f9'
    },
    widgetIcon: {
        fontSize: '1.4rem'
    },
    widgetVal: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#1e293b'
    },
    widgetLbl: {
        fontSize: '10px',
        color: '#94a3b8',
        fontWeight: '600'
    },
    greetingSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '10px'
    },
    greetingEmoji: {
        fontSize: '2rem'
    },
    greetingText: {
        fontSize: '2.5rem',
        fontWeight: '850',
        color: '#1e293b',
        margin: 0
    },
    heroSubtitle: {
        fontSize: '1.1rem',
        color: '#64748b',
        marginBottom: '20px',
        fontWeight: '550'
    },
    locationBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(102, 126, 234, 0.1)',
        padding: '8px 16px',
        borderRadius: '20px',
        color: '#4f46e5',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer',
        marginBottom: '30px'
    },
    locationIcon: {
        fontSize: '1rem'
    },
    locationText: {
        fontSize: '13px'
    },
    locationArrow: {
        fontSize: '10px'
    },
    aiHubRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'center',
        marginTop: '10px'
    },
    aiHubBtn: {
        padding: '10px 18px',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '30px',
        fontSize: '13px',
        fontWeight: '700',
        color: '#475569',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    floatingIconsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1
    },
    floatingEmoji: {
        position: 'absolute',
        fontSize: '2.5rem',
        opacity: 0.6,
        animation: 'float 4s ease-in-out infinite'
    },
    swipeBannerContainer: {
        padding: '30px 20px 0',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    swipeBanner: {
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        borderRadius: '20px',
        padding: '24px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        color: 'white',
        boxShadow: '0 10px 25px rgba(139, 92, 246, 0.25)'
    },
    swipeTitle: {
        margin: '0 0 6px 0',
        fontSize: '18px',
        fontWeight: '800'
    },
    swipeDesc: {
        margin: 0,
        fontSize: '14px',
        opacity: 0.9,
        fontWeight: '500'
    },
    swipeActionBtn: {
        padding: '12px 28px',
        background: 'white',
        color: '#8b5cf6',
        border: 'none',
        borderRadius: '30px',
        fontSize: '14px',
        fontWeight: '850',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    },
    curatedScrollSection: {
        padding: '30px 20px 0',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    scrollSectionTitle: {
        fontSize: '1.4rem',
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: '15px'
    },
    scrollWrapper: {
        display: 'flex',
        gap: '20px',
        overflowX: 'auto',
        paddingBottom: '12px',
        scrollSnapType: 'x mandatory'
    },
    dishCard: {
        flex: '0 0 260px',
        background: 'white',
        borderRadius: '20px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
    },
    dishBadge: {
        fontSize: '10px',
        background: '#e0e7ff',
        color: '#4338ca',
        padding: '2px 8px',
        borderRadius: '8px',
        alignSelf: 'flex-start',
        fontWeight: '700'
    },
    dishBadgeYellow: {
        fontSize: '10px',
        background: '#fff9db',
        color: '#f59e0b',
        padding: '2px 8px',
        borderRadius: '8px',
        alignSelf: 'flex-start',
        fontWeight: '700'
    },
    dishName: {
        margin: 0,
        fontSize: '15px',
        fontWeight: '800',
        color: '#1e293b'
    },
    dishRest: {
        margin: 0,
        fontSize: '12px',
        color: '#64748b',
        fontWeight: '550'
    },
    dishPriceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '6px'
    },
    dishPrice: {
        fontSize: '16px',
        fontWeight: '800',
        color: '#1e293b'
    },
    dishAddBtn: {
        padding: '6px 12px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '750',
        cursor: 'pointer'
    },
    filtersSection: {
        padding: '40px 20px 0',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    filtersContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '20px'
    },
    sortHeader: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    sortButtons: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
    },
    sortBtn: {
        padding: '10px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '30px',
        background: 'white',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '700',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    sortBtnActive: {
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        border: '1px solid transparent'
    },
    editProfileBtn: {
        padding: '8px 16px',
        border: '1px solid #667eea',
        borderRadius: '30px',
        background: 'white',
        color: '#667eea',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '700'
    },
    restaurantsSection: {
        padding: '40px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    restaurantGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '30px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px 20px'
    },
    emptyIcon: {
        fontSize: '3rem'
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
        width: '50px',
        height: '50px',
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        fontSize: '14px',
        color: '#64748b',
        fontWeight: '600'
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        color: '#ef4444',
        gap: '10px'
    },
    retryBtn: {
        padding: '10px 24px',
        background: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: '600'
    },
    darkModeToggle: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '55px',
        height: '55px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        border: 'none',
        fontSize: '1.4rem',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    profileSetupContainer: {
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '40px 20px'
    },
    locationModalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    locationModal: {
        background: 'white',
        borderRadius: '24px',
        padding: '30px',
        width: '90%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    closeLocationBtn: {
        padding: '10px 20px',
        background: '#f1f5f9',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '700',
        cursor: 'pointer'
    },

    // AI Modal Popups
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(5px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    aiModal: {
        background: 'white',
        borderRadius: '24px',
        padding: '30px',
        width: '90%',
        maxWidth: '500px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    },
    modalTitle: {
        margin: '0 0 8px 0',
        fontSize: '20px',
        fontWeight: '800',
        color: '#1e293b'
    },
    modalDesc: {
        margin: '0 0 20px 0',
        fontSize: '13px',
        color: '#64748b',
        lineHeight: '1.5'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '20px'
    },
    planGenerateBtn: {
        width: '100%',
        padding: '12px',
        background: '#8b5cf6',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        fontSize: '14px',
        boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)'
    },
    planCardBox: {
        background: '#f8fafc',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    planHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        fontWeight: '700',
        color: '#475569',
        borderBottom: '1px dashed #e2e8f0',
        paddingBottom: '8px'
    },
    planItems: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    planItem: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '13px'
    },
    planSlot: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase'
    },
    planRest: {
        fontSize: '11px',
        color: '#64748b'
    },
    planCartBtn: {
        width: '100%',
        padding: '12px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontWeight: '750',
        cursor: 'pointer',
        fontSize: '13px',
        marginTop: '10px'
    },
    budgetDishesList: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxHeight: '280px',
        overflowY: 'auto'
    },
    budgetDishRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    },
    comboPriceRow: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '15px'
    },
    couponTag: {
        fontSize: '12px',
        background: '#fef3c7',
        color: '#d97706',
        padding: '6px',
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: '600'
    },

    // AI Chat Assistant Sidebar Modal
    chatModal: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '380px',
        background: 'white',
        borderLeft: '1px solid #cbd5e1',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 2000,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.05)'
    },
    chatHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    closeChatBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer'
    },
    chatHistory: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingRight: '4px'
    },
    botMsg: {
        background: '#f1f5f9',
        padding: '12px 14px',
        borderRadius: '16px 16px 16px 4px',
        fontSize: '13px',
        color: '#334155',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    userMsg: {
        background: '#e0e7ff',
        padding: '12px 14px',
        borderRadius: '16px 16px 4px 16px',
        fontSize: '13px',
        color: '#312e81',
        alignSelf: 'flex-end'
    },
    chatRecItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px',
        background: 'white',
        borderRadius: '10px',
        border: '1px solid #cbd5e1'
    },
    chatAddBtn: {
        padding: '4px 8px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '10px',
        fontWeight: '700',
        cursor: 'pointer'
    },
    chatInputRow: {
        display: 'flex',
        gap: '8px'
    },
    chatInputField: {
        flex: 1,
        padding: '12px',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        fontSize: '13px'
    },
    chatSendBtn: {
        padding: '12px 20px',
        background: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '700',
        cursor: 'pointer'
    },
    dashboardSection: {
        padding: '30px 20px 0',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    dashboardTitle: {
        fontSize: '1.4rem',
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: '15px'
    },
    dashboardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px'
    },
    dashCard: {
        background: 'white',
        borderRadius: '20px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
    },
    dashIcon: {
        fontSize: '1.8rem',
        background: '#f8fafc',
        padding: '10px',
        borderRadius: '12px'
    },
    dashVal: {
        fontSize: '14px',
        fontWeight: '850',
        color: '#1e293b'
    },
    dashLabel: {
        fontSize: '11px',
        color: '#64748b',
        fontWeight: '600'
    }
};
