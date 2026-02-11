import React from 'react';

const Modal = ({ isOpen, onClose, title, message, type = 'info', children, onConfirm, confirmText = 'Understood', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'danger': return '⚠️';
            default: return '🔔';
        }
    };

    const getAccentColor = () => {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'danger': return '#ef4444';
            default: return '#4f6bf5';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div
                className="glass-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: '2.5rem',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    border: `1px solid ${getAccentColor()}44`,
                    boxShadow: `0 20px 50px -12px ${getAccentColor()}22`
                }}
            >
                <div style={{
                    fontSize: '3.5rem',
                    marginBottom: '1rem',
                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))'
                }}>
                    {getIcon()}
                </div>

                <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    marginBottom: '0.75rem',
                    color: '#ffffff'
                }}>
                    {title}
                </h2>

                <p style={{
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    color: '#aebbf2',
                    marginBottom: '2rem'
                }}>
                    {message}
                </p>

                {children && (
                    <div style={{ width: '100%', marginBottom: '2rem' }}>
                        {children}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    {onConfirm && (
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm || onClose}
                        className="btn-add"
                        style={{
                            flex: onConfirm ? 1.5 : 1,
                            padding: '1rem',
                            background: `linear-gradient(135deg, ${getAccentColor()} 0%, #a855f7 100%)`,
                            boxShadow: `0 10px 15px -3px ${getAccentColor()}44`
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
