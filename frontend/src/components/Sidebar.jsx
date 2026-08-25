import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../utils/api';

export default function Sidebar({ role, isOpen, onClose }) {
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/');
        onClose();
    }

    const name = (role === 'doctor' ? sessionStorage.getItem('doctor_name') : sessionStorage.getItem('patient_name')) || 'User';

    const patientLinks = [
        { to: '/patient', label: 'Home', icon: '🏠' },
        { to: '/patient/test', label: 'AI Screening', icon: '🧠' },
        { to: '/patient/results', label: 'My Reports', icon: '📜' },
        { to: '/patient/schedule', label: 'Care Plan & Tasks', icon: '📅' },
        { to: '/patient/notifications', label: 'Messages', icon: '💬' },
    ];

    const doctorLinks = [
        { to: '/doctor', label: 'Overview', icon: '🏛️' },
        { to: '/doctor/patients', label: 'Patients Registry', icon: '👥' },
        { to: '/doctor/schedule', label: 'Schedule Targets', icon: '📅' },
    ];

    const links = role === 'doctor' ? doctorLinks : patientLinks;

    return (
        <>
            {/* Mobile Overlay */}
            <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-mark">
                        <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <h1 className="uppercase tracking-[0.1em] font-black text-xs text-white">NeuroScan <span className="text-teal-400">AI</span></h1>
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-1 block px-0.5">Clinical Edition v2.0</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {role === 'doctor' ? 'Doctor Portal' : 'Patient Menu'}
                    </div>
                    {links.map(link => (
                        <NavLink 
                            key={link.to} 
                            to={link.to} 
                            end 
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} flex items-center gap-3 px-4 py-3 rounded-xl transition-all`} 
                            onClick={onClose}
                        >
                            <span className="text-xl">{link.icon}</span>
                            <span className="font-bold text-sm tracking-normal text-slate-200">{link.label}</span>
                            {link.badge && <span className="nav-badge ml-auto">{link.badge}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer pt-4 border-t border-slate-700/50">
                    <div className="sidebar-user mb-3 flex items-center gap-3">
                        <div className="sidebar-avatar font-bold text-base bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center">
                            {name[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="sidebar-user-info max-w-[140px] truncate">
                            <p className="font-bold text-xs text-white truncate">{name}</p>
                            <span className="text-[11px] font-medium text-slate-400 capitalize truncate block">
                                {role === 'doctor' ? 'Clinician' : 'Patient'}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/15 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 rounded-xl transition-all text-xs font-bold cursor-pointer shadow-sm" 
                        onClick={handleLogout}
                    >
                        <span>🚪</span>
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
