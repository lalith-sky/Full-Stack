import { useState } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

export default function PromoCodeInput({ orderAmount, onPromoApplied }) {
    const [promoCode, setPromoCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);

    const validatePromo = async () => {
        if (!promoCode.trim()) {
            setMessage('Please enter a promo code');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`${API_BASE_URL}/promo/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode.toUpperCase(), orderAmount })
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setAppliedPromo(data);
                setMessage(`✅ ${data.description} - You save ₹${data.discount.toFixed(2)}!`);
                onPromoApplied(data.discount, promoCode.toUpperCase());
            } else {
                setMessage(`❌ ${data.message}`);
                setAppliedPromo(null);
            }
        } catch (err) {
            setMessage('❌ Failed to validate promo code');
            setAppliedPromo(null);
        } finally {
            setLoading(false);
        }
    };

    const removePromo = () => {
        setPromoCode('');
        setAppliedPromo(null);
        setMessage('');
        onPromoApplied(0, null);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.icon}>🎟️</span>
                <span style={styles.title}>Have a Promo Code?</span>
            </div>

            {!appliedPromo ? (
                <div style={styles.inputContainer}>
                    <input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        style={styles.input}
                        disabled={loading}
                    />
                    <button
                        onClick={validatePromo}
                        disabled={loading || !promoCode.trim()}
                        style={{
                            ...styles.applyBtn,
                            opacity: loading || !promoCode.trim() ? 0.5 : 1
                        }}
                    >
                        {loading ? '⏳' : 'Apply'}
                    </button>
                </div>
            ) : (
                <div style={styles.appliedContainer}>
                    <div style={styles.appliedInfo}>
                        <span style={styles.appliedCode}>{promoCode}</span>
                        <span style={styles.savings}>-₹{appliedPromo.discount.toFixed(2)}</span>
                    </div>
                    <button onClick={removePromo} style={styles.removeBtn}>✕</button>
                </div>
            )}

            {message && (
                <div style={{
                    ...styles.message,
                    color: message.includes('✅') ? '#10b981' : '#ef4444'
                }}>
                    {message}
                </div>
            )}

            <div style={styles.suggestions}>
                <p style={styles.suggestionsTitle}>Available Offers:</p>
                <div style={styles.offerTags}>
                    <span onClick={() => setPromoCode('FIRST50')} style={styles.offerTag}>FIRST50</span>
                    <span onClick={() => setPromoCode('SAVE20')} style={styles.offerTag}>SAVE20</span>
                    <span onClick={() => setPromoCode('WELCOME')} style={styles.offerTag}>WELCOME</span>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        padding: '20px',
        borderRadius: '16px',
        marginBottom: '20px'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
    },
    icon: {
        fontSize: '20px'
    },
    title: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#92400e'
    },
    inputContainer: {
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
    },
    input: {
        flex: 1,
        padding: '12px 16px',
        border: '2px solid #fbbf24',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        textTransform: 'uppercase',
        background: 'white'
    },
    applyBtn: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    appliedContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #10b981'
    },
    appliedInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    appliedCode: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#10b981'
    },
    savings: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#10b981'
    },
    removeBtn: {
        background: '#fee2e2',
        color: '#dc2626',
        border: 'none',
        borderRadius: '8px',
        width: '28px',
        height: '28px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '700'
    },
    message: {
        fontSize: '13px',
        fontWeight: '600',
        marginTop: '8px'
    },
    suggestions: {
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px dashed #fbbf24'
    },
    suggestionsTitle: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#92400e',
        marginBottom: '8px'
    },
    offerTags: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
    },
    offerTag: {
        padding: '6px 12px',
        background: 'white',
        border: '1px dashed #fbbf24',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '700',
        color: '#d97706',
        cursor: 'pointer'
    }
};
