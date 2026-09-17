import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiConfig";

export default function AuthPage() {
    const navigate = useNavigate();
    const [userType, setUserType] = useState("customer"); // customer or restaurant
    const [activeTab, setActiveTab] = useState("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    
    // Restaurant specific fields
    const [restaurantData, setRestaurantData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        ownerName: "",
        phone: "",
        restaurantName: "",
        address: "",
        cuisine: "",
        description: ""
    });

    const cuisineOptions = [
        'Indian', 'Italian', 'Chinese', 'Thai', 'Mexican', 'Japanese', 
        'Korean', 'Mediterranean', 'American', 'Continental', 'Fast Food'
    ];

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData(prev => ({ ...prev, [name]: value }));
        setError("");
    };
    
    const handleRestaurantChange = (e) => {
        const { name, value } = e.target;
        setRestaurantData(prev => ({ ...prev, [name]: value }));
        setError("");
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!loginData.email || !loginData.password) {
            setError("Please fill in all fields");
            return;
        }

        if (!validateEmail(loginData.email)) {
            setError("Please enter a valid email");
            return;
        }

        setLoading(true);
        try {
            const endpoint = userType === "customer" 
                ? `${API_BASE_URL}/auth/login`
                : `${API_BASE_URL}/restaurant/login`;
                
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginData.email,
                    password: loginData.password
                })
            });

            const data = await res.json();

            if (res.ok && data.token) {
                if (userType === "customer") {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify({ email: data.email }));
                    setSuccess("Login successful! Redirecting...");
                    setTimeout(() => navigate("/"), 1500);
                } else {
                    localStorage.setItem("restaurantToken", data.token);
                    localStorage.setItem("restaurantData", JSON.stringify(data.restaurant));
                    setSuccess("Restaurant login successful! Redirecting...");
                    setTimeout(() => navigate("/restaurant-dashboard"), 1500);
                }
            } else {
                setError(data?.message || "Login failed");
            }
        } catch (err) {
            console.error(err);
            setError("Cannot connect to server. Check if backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (userType === "customer") {
            if (!registerData.email || !registerData.password || !registerData.name || !registerData.confirmPassword) {
                setError("Please fill in all fields");
                return;
            }

            if (!validateEmail(registerData.email)) {
                setError("Please enter a valid email");
                return;
            }

            if (registerData.password.length < 6) {
                setError("Password must be at least 6 characters");
                return;
            }

            if (registerData.password !== registerData.confirmPassword) {
                setError("Passwords do not match");
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: registerData.email,
                        password: registerData.password,
                        name: registerData.name
                    })
                });

                const data = await res.json();

                if (res.ok && data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify({ email: data.email, name: data.name }));
                    setSuccess("Registration successful! Redirecting...");
                    setTimeout(() => navigate("/"), 1500);
                } else {
                    setError(data?.message || "Registration failed");
                }
            } catch (err) {
                console.error(err);
                setError("Cannot connect to server. Check if backend is running.");
            } finally {
                setLoading(false);
            }
        } else {
            // Restaurant registration
            if (!restaurantData.email || !restaurantData.password || !restaurantData.ownerName || 
                !restaurantData.phone || !restaurantData.restaurantName || !restaurantData.address || 
                !restaurantData.cuisine || !restaurantData.description || !restaurantData.confirmPassword) {
                setError("Please fill in all fields");
                return;
            }

            if (!validateEmail(restaurantData.email)) {
                setError("Please enter a valid email");
                return;
            }

            if (restaurantData.password.length < 6) {
                setError("Password must be at least 6 characters");
                return;
            }

            if (restaurantData.password !== restaurantData.confirmPassword) {
                setError("Passwords do not match");
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/restaurant/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(restaurantData)
                });

                const data = await res.json();

                if (res.ok && data.token) {
                    localStorage.setItem("restaurantToken", data.token);
                    localStorage.setItem("restaurantData", JSON.stringify(data.restaurant));
                    setSuccess("Restaurant registered successfully! Redirecting...");
                    setTimeout(() => navigate("/restaurant-dashboard"), 1500);
                } else {
                    setError(data?.message || "Registration failed");
                }
            } catch (err) {
                console.error(err);
                setError("Cannot connect to server. Check if backend is running.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🍔 BiteRush</h1>
                <p style={styles.subtitle}>Welcome to the future of food delivery</p>

                {/* User Type Selector */}
                <div style={styles.userTypeSelector}>
                    <button
                        style={{
                            ...styles.userTypeBtn,
                            ...(userType === "customer" ? styles.userTypeBtnActive : {})
                        }}
                        onClick={() => {
                            setUserType("customer");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        👤 Customer
                    </button>
                    <button
                        style={{
                            ...styles.userTypeBtn,
                            ...(userType === "restaurant" ? styles.userTypeBtnActive : {})
                        }}
                        onClick={() => {
                            setUserType("restaurant");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        🏪 Restaurant Partner
                    </button>
                </div>

                <div style={styles.tabs}>
                    <button
                        style={{
                            ...styles.tab,
                            ...(activeTab === "login" ? styles.tabActive : styles.tabInactive)
                        }}
                        onClick={() => setActiveTab("login")}
                    >
                        Login
                    </button>
                    <button
                        style={{
                            ...styles.tab,
                            ...(activeTab === "register" ? styles.tabActive : styles.tabInactive)
                        }}
                        onClick={() => setActiveTab("register")}
                    >
                        Register
                    </button>
                </div>

                {error && <div style={styles.errorMessage}>{error}</div>}
                {success && <div style={styles.successMessage}>{success}</div>}

                {activeTab === "login" && (
                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>📧 Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                placeholder="you@example.com"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🔒 Password</label>
                            <div style={styles.passwordContainer}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                    placeholder="••••••••"
                                    style={{...styles.input, paddingRight: "50px"}}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.showPasswordBtn}
                                >
                                    {showPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.submitBtn,
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? "⏳ Logging in..." : `🚀 Login as ${userType === "customer" ? "Customer" : "Restaurant"}`}
                        </button>
                    </form>
                )}

                {activeTab === "register" && userType === "customer" && (
                    <form onSubmit={handleRegister} style={styles.form}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>👤 Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={registerData.name}
                                onChange={handleRegisterChange}
                                placeholder="John Doe"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>📧 Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={registerData.email}
                                onChange={handleRegisterChange}
                                placeholder="you@example.com"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🔒 Password</label>
                            <div style={styles.passwordContainer}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={registerData.password}
                                    onChange={handleRegisterChange}
                                    placeholder="••••••••"
                                    style={{...styles.input, paddingRight: "50px"}}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.showPasswordBtn}
                                >
                                    {showPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🔒 Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={registerData.confirmPassword}
                                onChange={handleRegisterChange}
                                placeholder="••••••••"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.submitBtn,
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? "⏳ Registering..." : "🎉 Register as Customer"}
                        </button>
                    </form>
                )}

                {activeTab === "register" && userType === "restaurant" && (
                    <form onSubmit={handleRegister} style={{...styles.form, maxHeight: "500px", overflowY: "auto", paddingRight: "10px"}}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>🏪 Restaurant Name</label>
                            <input
                                type="text"
                                name="restaurantName"
                                value={restaurantData.restaurantName}
                                onChange={handleRestaurantChange}
                                placeholder="Enter restaurant name"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>👤 Owner Name</label>
                            <input
                                type="text"
                                name="ownerName"
                                value={restaurantData.ownerName}
                                onChange={handleRestaurantChange}
                                placeholder="Enter owner name"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>📱 Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={restaurantData.phone}
                                onChange={handleRestaurantChange}
                                placeholder="Enter phone number"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🍽️ Cuisine Type</label>
                            <select
                                name="cuisine"
                                value={restaurantData.cuisine}
                                onChange={handleRestaurantChange}
                                style={styles.input}
                                disabled={loading}
                            >
                                <option value="">Select cuisine type</option>
                                {cuisineOptions.map(cuisine => (
                                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>📍 Restaurant Address</label>
                            <textarea
                                name="address"
                                value={restaurantData.address}
                                onChange={handleRestaurantChange}
                                placeholder="Enter complete address"
                                style={{...styles.input, minHeight: "80px", resize: "vertical"}}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>📝 Description</label>
                            <textarea
                                name="description"
                                value={restaurantData.description}
                                onChange={handleRestaurantChange}
                                placeholder="Describe your restaurant"
                                style={{...styles.input, minHeight: "80px", resize: "vertical"}}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>📧 Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={restaurantData.email}
                                onChange={handleRestaurantChange}
                                placeholder="restaurant@example.com"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🔒 Password</label>
                            <div style={styles.passwordContainer}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={restaurantData.password}
                                    onChange={handleRestaurantChange}
                                    placeholder="••••••••"
                                    style={{...styles.input, paddingRight: "50px"}}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.showPasswordBtn}
                                >
                                    {showPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🔒 Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={restaurantData.confirmPassword}
                                onChange={handleRestaurantChange}
                                placeholder="••••••••"
                                style={styles.input}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.submitBtn,
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? "⏳ Registering..." : "🎉 Register Restaurant"}
                        </button>
                    </form>
                )}

                {userType === "customer" && (
                    <>
                        <div style={styles.divider}>
                            <div style={styles.dividerLine}></div>
                            <span>OR</span>
                            <div style={styles.dividerLine}></div>
                        </div>

                        <div style={styles.googleContainer}>
                            <button
                                onClick={() => alert("Google Sign-In not configured yet")}
                                style={styles.googleBtn}
                                disabled={loading}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continue with Google
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%)",
        padding: "20px",
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "relative"
    },
    card: {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        boxShadow: "0 32px 64px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        padding: "48px",
        maxWidth: "480px",
        width: "100%",
        border: "1px solid rgba(255, 255, 255, 0.2)"
    },
    title: {
        margin: "0 0 12px 0",
        fontSize: "36px",
        fontWeight: "800",
        background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textAlign: "center",
        letterSpacing: "-0.5px"
    },
    subtitle: {
        margin: "0 0 32px 0",
        fontSize: "16px",
        color: "#64748b",
        textAlign: "center",
        fontWeight: "500"
    },
    userTypeSelector: {
        display: "flex",
        gap: "12px",
        marginBottom: "24px",
        background: "#f8fafc",
        borderRadius: "16px",
        padding: "8px"
    },
    userTypeBtn: {
        flex: 1,
        padding: "16px 20px",
        border: "none",
        background: "transparent",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        borderRadius: "12px",
        color: "#64748b"
    },
    userTypeBtnActive: {
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
    },
    tabs: {
        display: "flex",
        gap: "8px",
        marginBottom: "32px",
        background: "#f1f5f9",
        borderRadius: "16px",
        padding: "6px"
    },
    tab: {
        flex: 1,
        padding: "14px 20px",
        border: "none",
        background: "transparent",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        borderRadius: "12px",
        color: "#64748b"
    },
    tabActive: {
        background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
        color: "white",
        boxShadow: "0 4px 12px rgba(255, 107, 107, 0.4)"
    },
    tabInactive: {
        color: "#64748b"
    },
    form: {
        marginBottom: "24px"
    },
    formGroup: {
        marginBottom: "24px"
    },
    label: {
        display: "block",
        marginBottom: "8px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#1e293b"
    },
    input: {
        width: "100%",
        padding: "16px 20px",
        fontSize: "15px",
        border: "2px solid #e2e8f0",
        borderRadius: "12px",
        boxSizing: "border-box",
        transition: "all 0.3s ease",
        fontFamily: "inherit",
        background: "#ffffff",
        outline: "none"
    },
    inputFocus: {
        border: "2px solid #ff6b6b",
        boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.1)"
    },
    passwordContainer: {
        position: "relative",
        display: "flex",
        alignItems: "center"
    },
    showPasswordBtn: {
        position: "absolute",
        right: "16px",
        background: "transparent",
        border: "none",
        color: "#ff6b6b",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        padding: "4px 8px",
        borderRadius: "6px",
        transition: "all 0.2s ease"
    },
    submitBtn: {
        width: "100%",
        padding: "16px 24px",
        fontSize: "16px",
        fontWeight: "700",
        color: "white",
        background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginTop: "16px",
        boxShadow: "0 8px 24px rgba(255, 107, 107, 0.3)"
    },
    submitBtnHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 12px 32px rgba(255, 107, 107, 0.4)"
    },
    errorMessage: {
        padding: "16px 20px",
        marginBottom: "24px",
        background: "linear-gradient(135deg, #fee2e2, #fecaca)",
        border: "1px solid #fca5a5",
        borderRadius: "12px",
        color: "#dc2626",
        fontSize: "14px",
        fontWeight: "500"
    },
    successMessage: {
        padding: "16px 20px",
        marginBottom: "24px",
        background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
        border: "1px solid #86efac",
        borderRadius: "12px",
        color: "#16a34a",
        fontSize: "14px",
        fontWeight: "500"
    },
    divider: {
        display: "flex",
        alignItems: "center",
        margin: "32px 0 24px 0",
        color: "#94a3b8",
        fontSize: "14px",
        fontWeight: "500"
    },
    dividerLine: {
        flex: 1,
        height: "1px",
        background: "#e2e8f0",
        margin: "0 16px"
    },
    googleContainer: {
        display: "flex",
        justifyContent: "center"
    },
    googleBtn: {
        width: "100%",
        padding: "16px 24px",
        fontSize: "15px",
        fontWeight: "600",
        color: "#374151",
        background: "white",
        border: "2px solid #e5e7eb",
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px"
    },
    googleBtnHover: {
        border: "2px solid #d1d5db",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
    }
};
