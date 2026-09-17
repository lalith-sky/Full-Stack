import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

export default function AddressManager({ userEmail, onSelectAddress }) {
    const [addresses, setAddresses] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
    }, [userEmail]);

    const fetchAddresses = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/addresses?email=${userEmail}`);
            const data = await res.json();
            setAddresses(data);
        } catch (err) {
            console.error('Failed to fetch addresses:', err);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/addresses?email=${userEmail}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress)
            });
            if (res.ok) {
                fetchAddresses();
                setShowAddForm(false);
                setNewAddress({
                    label: 'Home',
                    addressLine1: '',
                    addressLine2: '',
                    city: '',
                    state: '',
                    pincode: '',
                    landmark: '',
                    isDefault: false
                });
            }
        } catch (err) {
            console.error('Failed to add address:', err);
        }
    };

    const setDefaultAddress = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/addresses/${id}/default?email=${userEmail}`, {
                method: 'PUT'
            });
            fetchAddresses();
        } catch (err) {
            console.error('Failed to set default:', err);
        }
    };

    const deleteAddress = async (id) => {
        if (window.confirm('Delete this address?')) {
            try {
                await fetch(`${API_BASE_URL}/addresses/${id}`, {
                    method: 'DELETE'
                });
                fetchAddresses();
            } catch (err) {
                console.error('Failed to delete:', err);
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>📍 Delivery Addresses</h2>
                <button onClick={() => setShowAddForm(!showAddForm)} style={styles.addBtn}>
                    {showAddForm ? '✕ Cancel' : '+ Add New Address'}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddAddress} style={styles.form}>
                    <select
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                        style={styles.input}
                    >
                        <option value="Home">🏠 Home</option>
                        <option value="Work">💼 Work</option>
                        <option value="Other">📍 Other</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Address Line 1 *"
                        value={newAddress.addressLine1}
                        onChange={(e) => setNewAddress({...newAddress, addressLine1: e.target.value})}
                        style={styles.input}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Address Line 2"
                        value={newAddress.addressLine2}
                        onChange={(e) => setNewAddress({...newAddress, addressLine2: e.target.value})}
                        style={styles.input}
                    />

                    <div style={styles.row}>
                        <input
                            type="text"
                            placeholder="City *"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            style={{...styles.input, flex: 1}}
                            required
                        />
                        <input
                            type="text"
                            placeholder="State *"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                            style={{...styles.input, flex: 1}}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Pincode *"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                            style={{...styles.input, flex: 1}}
                            required
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Landmark (optional)"
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                        style={styles.input}
                    />

                    <label style={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                        />
                        <span style={{marginLeft: '8px'}}>Set as default address</span>
                    </label>

                    <button type="submit" style={styles.submitBtn}>Save Address</button>
                </form>
            )}

            <div style={styles.addressList}>
                {addresses.map(addr => (
                    <div key={addr.id} style={{
                        ...styles.addressCard,
                        border: addr.isDefault ? '2px solid #667eea' : '1px solid #e2e8f0'
                    }}>
                        <div style={styles.addressHeader}>
                            <span style={styles.label}>
                                {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'} {addr.label}
                            </span>
                            {addr.isDefault && <span style={styles.defaultBadge}>Default</span>}
                        </div>
                        <p style={styles.addressText}>
                            {addr.addressLine1}<br/>
                            {addr.addressLine2 && <>{addr.addressLine2}<br/></>}
                            {addr.city}, {addr.state} - {addr.pincode}
                            {addr.landmark && <><br/>Near: {addr.landmark}</>}
                        </p>
                        <div style={styles.actions}>
                            {!addr.isDefault && (
                                <button onClick={() => setDefaultAddress(addr.id)} style={styles.actionBtn}>
                                    Set Default
                                </button>
                            )}
                            {onSelectAddress && (
                                <button onClick={() => onSelectAddress(addr)} style={styles.selectBtn}>
                                    Deliver Here
                                </button>
                            )}
                            <button onClick={() => deleteAddress(addr.id)} style={styles.deleteBtn}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0
    },
    addBtn: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    form: {
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '24px'
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '12px',
        boxSizing: 'border-box'
    },
    row: {
        display: 'flex',
        gap: '12px'
    },
    checkbox: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        marginBottom: '16px'
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    addressList: {
        display: 'grid',
        gap: '16px'
    },
    addressCard: {
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },
    addressHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    label: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1e293b'
    },
    defaultBadge: {
        padding: '4px 12px',
        background: '#667eea',
        color: 'white',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
    },
    addressText: {
        fontSize: '14px',
        color: '#64748b',
        lineHeight: '1.6',
        marginBottom: '16px'
    },
    actions: {
        display: 'flex',
        gap: '8px'
    },
    actionBtn: {
        padding: '8px 16px',
        background: '#f1f5f9',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        color: '#475569'
    },
    selectBtn: {
        padding: '8px 16px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    deleteBtn: {
        padding: '8px 16px',
        background: '#fee2e2',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        color: '#dc2626'
    }
};
