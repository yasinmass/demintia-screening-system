import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { timeAgo } from '../../utils/time';

export default function PatientNotifications() {
    const [messages, setMessages] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    async function fetchMessages() {
        try {
            const response = await fetch('/api/notifications/', { credentials: 'include' });
            const data = await response.json();
            if (data.success) {
                const mapped = data.notifications.map(n => ({
                    id: n.id,
                    from: n.doctor_name,
                    subject: n.message,
                    body: `Your doctor ${n.doctor_name} has assigned you a new ${n.plan_type}. \n\nSpecial Instructions: ${n.special_instructions || 'None provided.'}`,
                    time: timeAgo(n.created_at),
                    date: new Date(n.created_at).toLocaleDateString(),
                    read: n.is_read
                }));
                setMessages(mapped);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function openMessage(msg) {
        setSelected(msg);
        if (!msg.read) {
            try {
                // Mark as read in backend
                await fetch('/api/notifications/mark-read/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notification_id: msg.id }),
                    credentials: 'include'
                });
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
            } catch (e) { console.error(e); }
        }
    }

    async function markAllRead() {
        try {
            await fetch('/api/notifications/mark-all-read/', {
                method: 'POST',
                credentials: 'include'
            });
            setMessages(prev => prev.map(m => ({ ...m, read: true })));
        } catch (e) {
            console.error(e);
        }
    }

    const unread = messages.filter(m => !m.read).length;

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return 'D';
        const clean = name.replace('Dr. ', '');
        return clean[0].toUpperCase();
    };

    return (
        <DashboardLayout role="patient" title="Messages">
            <div className="page-header">
                <h2>Messages from Doctor</h2>
                <p>Direct communications from your healthcare provider</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

                {/* Message List */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h3 style={{ margin: 0 }}>Inbox</h3>
                            {unread > 0 && (
                                <span style={{
                                    background: 'var(--primary)', color: '#fff',
                                    borderRadius: 20, padding: '2px 10px',
                                    fontSize: 12, fontWeight: 700
                                }}>{unread} new</span>
                            )}
                        </div>
                        {unread > 0 && (
                            <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                                <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No messages yet</p>
                            </div>
                        ) : messages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => openMessage(msg)}
                                style={{
                                    padding: '14px 18px',
                                    borderBottom: '1px solid var(--gray-100)',
                                    cursor: 'pointer',
                                    background: selected?.id === msg.id ? 'var(--primary-light)' : msg.read ? 'transparent' : 'var(--gray-50)',
                                    borderLeft: selected?.id === msg.id ? '3px solid var(--primary)' : '3px solid transparent',
                                    transition: 'all .15s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {!msg.read && (
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                                        )}
                                        <span style={{
                                            fontSize: 13, fontWeight: msg.read ? 600 : 900,
                                            color: selected?.id === msg.id ? 'var(--primary)' : msg.read ? 'var(--gray-600)' : 'var(--gray-900)'
                                        }}>
                                            {msg.from}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>{msg.time}</span>
                                </div>
                                <p style={{
                                    fontSize: 13, fontWeight: msg.read ? 500 : 800,
                                    color: msg.read ? 'var(--gray-500)' : 'var(--gray-900)', marginBottom: 4,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                    {msg.subject}
                                </p>
                                <p style={{
                                    fontSize: 12, color: msg.read ? 'var(--gray-400)' : 'var(--gray-600)', lineHeight: 1.4,
                                    display: '-webkit-box', WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                }}>
                                    {msg.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Detail */}
                {selected ? (
                    <div className="card fade-in" key={selected.id}>
                        <div className="card-header">
                            <div>
                                <h3 style={{ marginBottom: 4 }}>{selected.subject}</h3>
                                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>From {selected.from} · {selected.date}</span>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
                        </div>
                        <div className="card-body">
                            {/* Doctor avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0,
                                }}>
                                    {getInitials(selected.from)}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--gray-900)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selected.from}</p>
                                    <p style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', tracking: '0.1em' }}>Your Healthcare Provider · {selected.date}</p>
                                </div>
                            </div>

                            <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, color: 'var(--gray-700)', lineHeight: 1.8, background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--gray-100)' }}>
                                {selected.body}
                            </div>

                            <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--primary-light)', borderRadius: 12, fontSize: 12, color: 'var(--primary)', fontWeight: 700, border: '1px solid var(--primary-pale)' }}>
                                📌 This message was automatically generated following a clinical update. For questions, please consult {selected.from} during your next visit.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: 100, background: 'linear-gradient(to bottom, #fff, var(--gray-50))' }}>
                        <div style={{ fontSize: 64, marginBottom: 24, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.05))' }}>💬</div>
                        <h3 style={{ fontWeight: 900, color: 'var(--gray-900)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Communication Hub</h3>
                        <p style={{ color: 'var(--gray-400)', fontSize: 13, fontWeight: 600, maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>Select a clinical update from your inbox to view full details and instructions.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
