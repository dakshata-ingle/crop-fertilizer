import React, { useEffect, useState, useContext } from 'react';
import { getSupportedLanguageOptions } from '../utils/translationService';
import { TranslationContext } from '../context/TranslationContext';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../utils/api';

const Header = () => {
    const [showLanguage, setShowLanguage] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, logout, isAuthenticated, token, clientBranding } = useContext(AuthContext);
    const { t, setLanguage, language } = useContext(TranslationContext);
    const navigate = useNavigate();

    const brandName = clientBranding?.name || user?.name || 'NutriMate';
    const brandLogo = clientBranding?.logo || '/images/Agriculture.png';
    const brandPrimary = clientBranding?.primaryColor || '#39b54a';
    const brandSecondary = clientBranding?.secondaryColor || '#2f9a3d';
    const brandSurface = clientBranding?.primaryColor ? `${clientBranding.primaryColor}14` : '#0f4a31';
    const headerTitle = user?.name || brandName;
    const roleLabel = user?.role === 'super_admin'
        ? 'Super Admin'
        : user?.role === 'client_admin'
            ? 'Client Admin'
            : null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const translateElement = document.querySelector('.goog-te-gadget');
        if (translateElement) {
            translateElement.style.display = showLanguage ? 'block' : 'none';
        }
    }, [showLanguage]);

    useEffect(() => {
        const loadNotifications = async () => {
            if (!isAuthenticated || !token) return;
            try {
                const data = await fetchNotifications(token);
                setNotifications(data?.notifications || []);
            } catch (error) {
                console.error('Failed to load notifications', error);
            }
        };

        loadNotifications();
    }, [isAuthenticated, token]);

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await markNotificationAsRead(token, notification._id);
                setNotifications((prev) => prev.map((item) => item._id === notification._id ? { ...item, isRead: true } : item));
            } catch (error) {
                console.error('Failed to mark notification as read', error);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!token) return;
        try {
            await markAllNotificationsAsRead(token);
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    return (
        <header
            className="sticky top-0 z-50 border-b border-white/20 shadow-[0_12px_35px_rgba(15,23,42,0.12)]"
            style={{ background: `linear-gradient(135deg, #052e16 0%, ${brandPrimary} 48%, ${brandSecondary} 100%)` }}
        >
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center rounded-2xl border border-white/25 bg-white/15 p-1.5 shadow-sm backdrop-blur-sm">
                        <img
                            src={brandLogo}
                            alt={`${brandName} logo`}
                            className="h-10 w-10 rounded-xl object-contain bg-white/90 p-1 md:h-12 md:w-12"
                            onError={(event) => {
                                event.currentTarget.src = '/images/Agriculture.png';
                            }}
                        />
                    </Link>
                    <div className="hidden lg:block">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-50/80">
                            {isAuthenticated ? 'Welcome back' : (t ? t('app_name') : 'Client Brand')}
                        </p>
                        <h1 className="text-lg font-bold leading-tight text-white">{headerTitle}</h1>
                    </div>
                </div>

                <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-1.5 shadow-sm backdrop-blur-sm">
                        <Link
                            to="/about"
                            className="rounded-full px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            {t ? t('about') : 'About'}
                        </Link>
                        <Link
                            to="/contact"
                            className="rounded-full px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            {t ? t('contact') : 'Contact'}
                        </Link>
                    </div>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2 rounded-full bg-white/15 px-2 py-1.5 ring-1 ring-white/20">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowNotifications((prev) => !prev)}
                                    className="relative rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
                                    aria-label={t ? t('notifications') : 'Notifications'}
                                >
                                    🔔
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                                        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                                            <span className="text-sm font-semibold text-gray-700">{t ? t('notifications') : 'Notifications'}</span>
                                            {unreadCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                    {t ? t('mark_all_read') : 'Mark all read'}
                                                </button>
                                            )}
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div className="px-3 py-4 text-sm text-gray-500">{t ? t('no_notifications') : 'No notifications yet.'}</div>
                                        ) : (
                                            <ul>
                                                {notifications.map((notification) => (
                                                    <li
                                                        key={notification._id}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={`cursor-pointer border-b border-gray-100 px-3 py-3 hover:bg-gray-50 ${notification.isRead ? 'opacity-70' : 'bg-blue-50/40'}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-800">{notification.title}</p>
                                                                <p className="text-sm text-gray-600">{notification.message}</p>
                                                            </div>
                                                            {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="hidden text-sm font-semibold text-white/90 sm:block">
                                {user?.name || (t ? t('user') : 'User')}
                            </span>
                            {roleLabel && (
                                <Link
                                    to={user?.role === 'client_admin' ? '/client-admin' : '/admin'}
                                    className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
                                >
                                    {roleLabel}
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="rounded-full bg-slate-950/70 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                            >
                                {t ? t('logout') : 'Logout'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-2 py-1.5 shadow-sm backdrop-blur-sm">
                            <Link
                                to="/login"
                                className="rounded-full px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                {t ? t('login') : 'Login'}
                            </Link>
                            <Link
                                to="/signup"
                                className="rounded-full border border-emerald-100/30 bg-emerald-50/90 px-3 py-1.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100"
                            >
                                {t ? t('signup') : 'Sign Up'}
                            </Link>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowLanguage(!showLanguage)}
                        className="rounded-full border border-white/20 bg-white/15 p-2 text-white transition hover:bg-white/20"
                        aria-label={t ? t('select_language') : 'Select language'}
                    >
                        🌐
                    </button>
                    {showLanguage && (
                        <div className="absolute right-4 top-16 z-[60] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                            <div className="flex flex-col gap-1">
                                <select
                                    onChange={(e) => {
                                        const lang = e.target.value;
                                        if (setLanguage) setLanguage(lang);
                                        setShowLanguage(false);
                                    }}
                                    value={language || 'en'}
                                    aria-label={t ? t('select_language') : 'Select language'}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                                >
                                    {getSupportedLanguageOptions().map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;