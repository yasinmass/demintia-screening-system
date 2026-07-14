import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { logout } from '../utils/api';
import { timeAgo } from '../utils/time';

export default function DashboardLayout({ role, title, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/');
    }

    // --- Notification Logic ---
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);

    useEffect(() => {
        if (role === 'patient') {
            fetchUnreadCount();
            // Poll every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [role]);

    async function fetchUnreadCount() {
        try {
            const response = await fetch('/api/notifications/unread-count/', { credentials: 'include' });
            const data = await response.json();
            if (data.success) setUnreadCount(data.count);
        } catch (e) { console.error(e); }
    }

    async function fetchNotifications() {
        try {
            const response = await fetch('/api/notifications/', { credentials: 'include' });
            const data = await response.json();
            if (data.success) setNotifications(data.notifications.slice(0, 5));
        } catch (e) { console.error(e); }
    }

    async function handleNotifClick() {
        if (!notifOpen) {
            await fetchNotifications();
        }
        setNotifOpen(!notifOpen);
    }

    async function markRead(id) {
        try {
            await fetch('/api/notifications/mark-read/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: id }),
                credentials: 'include'
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            fetchUnreadCount();
            navigate('/patient/notifications');
            setNotifOpen(false);
        } catch (e) { console.error(e); }
    }

    const name = (role === 'doctor' ? sessionStorage.getItem('doctor_name') : sessionStorage.getItem('patient_name')) || 'User';

    return (
        <div className="dashboard-layout bg-gray-50">
            {/* Sidebar with overlay on mobile */}
            <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="main-content min-h-screen bg-gray-50">
                {/* Fixed Top Bar */}
                <header className="topbar bg-white/80 backdrop-blur-md sticky top-0 z-[500] border-b border-gray-100 shadow-sm px-10">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <button className="hamburger md:hidden block p-3 bg-gray-100 rounded-xl" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                            <span className="w-5 h-0.5 bg-gray-900 mb-1" />
                            <span className="w-5 h-0.5 bg-gray-900 mb-1" />
                            <span className="w-3 h-0.5 bg-gray-900" />
                        </button>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 pr-5 hidden md:block">Clinical Portal</span>
                            <span className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</span>
                        </div>
                    </div>

                    <div className="topbar-actions flex items-center gap-6">
                        <div className="relative">
                            <button 
                                className={`topbar-icon-btn transition-all rounded-2xl border-gray-100 ${notifOpen ? 'bg-teal-50 text-teal-600 ring-2 ring-teal-100' : 'hover:bg-teal-50 hover:text-teal-600'}`}
                                title="Notifications"
                                onClick={handleNotifClick}
                            >
                                {unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ring-4 ring-white animate-bounce-subtle">
                                        {unreadCount}
                                    </div>
                                )}
                                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            {notifOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden fade-in-up z-[1000]">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Notifications</h3>
                                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No new notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-4 ${!n.is_read ? 'bg-teal-50/20' : ''}`}
                                                    onClick={() => markRead(n.id)}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.253 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-xs leading-relaxed mb-1 ${!n.is_read ? 'font-bold text-teal-900' : 'text-gray-600'}`}>
                                                            {n.message}
                                                        </p>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{timeAgo(n.created_at)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button 
                                        className="w-full p-3 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-teal-600 hover:bg-teal-50 transition-colors border-t border-gray-100"
                                        onClick={() => { navigate('/patient/notifications'); setNotifOpen(false); }}
                                    >
                                        View All Messages
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 bg-gray-100 p-1.5 pr-5 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-200 transition-all group overflow-hidden" onClick={handleLogout}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-teal-50 group-hover:scale-105 transition-transform">
                                {name[0]}
                            </div>
                            <div className="hidden lg:block truncate">
                                <span className="block text-[11px] font-black uppercase tracking-tight text-gray-900 leading-tight truncate">{name}</span>
                                <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-tight">Exit Portal</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content py-12 px-10 fade-in max-w-[1440px] mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
