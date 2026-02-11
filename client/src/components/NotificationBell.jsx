import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function NotificationBell() {
    const { user, apiCall } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await apiCall('/api/notifications');
            if (res && res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.length);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    // Poll for notifications every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await apiCall(`/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'ASSIGNED': return '👤';
            case 'UPDATE': return '📝';
            case 'DEADLINE': return '⏰';
            default: return '📢';
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', position: 'relative', fontSize: '1.2rem', padding: '0.5rem' }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: 'red',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    width: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    padding: '0.5rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <span style={{ fontWeight: 'bold' }}>Notifications</span>
                        <span
                            style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--accent-primary)' }}
                            onClick={() => {
                                notifications.forEach(n => markAsRead(n.id));
                                setIsOpen(false);
                            }}
                        >
                            Mark all read
                        </span>
                    </div>

                    {notifications.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>
                            No new notifications
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                gap: '0.75rem',
                                alignItems: 'start'
                            }}>
                                <div style={{ fontSize: '1.2rem' }}>{getTypeIcon(n.type)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{n.message}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(n.createdAt).toLocaleString()}</div>
                                </div>
                                <button
                                    onClick={() => markAsRead(n.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
