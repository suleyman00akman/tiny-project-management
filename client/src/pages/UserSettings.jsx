import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const UserSettings = () => {
    const { t, i18n } = useTranslation();
    const { user, changeLanguage, changeTheme } = useAuth();
    const [currentLanguage, setCurrentLanguage] = useState(user?.preferredLanguage || 'tr');
    const [currentTheme, setCurrentTheme] = useState(user?.preferredTheme || 'dark');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setCurrentLanguage(user.preferredLanguage || 'tr');
            setCurrentTheme(user.preferredTheme || 'dark');
        }
    }, [user]);

    const handleThemeChange = async (theme) => {
        const success = await changeTheme(theme);
        if (success) {
            setCurrentTheme(theme);
            document.documentElement.setAttribute('data-theme', theme);
            setMessage(t('common.success'));
            setTimeout(() => setMessage(''), 2000);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                {t('common.settings')} - {user?.username}
            </h1>

            {message && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    color: '#22c55e',
                    marginBottom: '1.5rem'
                }}>
                    {message}
                </div>
            )}

            {/* Theme Settings */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                    Theme
                </h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => handleThemeChange('dark')}
                        className={currentTheme === 'dark' ? 'btn-add' : 'btn-secondary'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            opacity: currentTheme === 'dark' ? 1 : 0.6
                        }}
                    >
                        🌙 Dark Mode
                    </button>
                    <button
                        onClick={() => handleThemeChange('light')}
                        className={currentTheme === 'light' ? 'btn-add' : 'btn-secondary'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            opacity: currentTheme === 'light' ? 1 : 0.6
                        }}
                    >
                        ☀️ Light Mode
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserSettings;
