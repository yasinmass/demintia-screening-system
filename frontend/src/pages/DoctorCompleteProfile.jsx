import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DoctorCompleteProfile() {
    const navigate = useNavigate();
    const [name, setName] = useState(sessionStorage.getItem('doctor_name') || '');
    const [specialization, setSpecialization] = useState('Neurology');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [hospital, setHospital] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/doctor/complete-profile/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name,
                    specialization, 
                    license_number: licenseNumber, 
                    hospital,
                    phone 
                }),
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                // Update session storage if name was changed
                sessionStorage.setItem('doctor_name', name);
                navigate('/doctor');
            } else {
                setError(data.error || 'Failed to update clinical profile.');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page px-6">
            <div className="fade-in w-full max-w-[480px]">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-900/50">
                        <svg width={32} height={32} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white">Clinical <span className="text-teal-400">Credentials</span></h1>
                        <p className="text-xs font-semibold text-teal-500/60 uppercase tracking-widest mt-1">Practitioner Setup</p>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="mb-8 text-center text-gray-900">
                        <h2 className="text-2xl font-bold mb-2">Almost Done, Doctor</h2>
                        <p className="text-sm text-gray-400">Please provide your professional credentials to access the specialist suite</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in shake">
                            <span className="text-red-500">⚠️</span>
                            <p className="text-xs font-bold text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none text-gray-900"
                                placeholder="Dr. Your Name"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Specialization</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none text-gray-900"
                                placeholder="e.g. Neurology, Geriatrics"
                                required
                                value={specialization}
                                onChange={e => setSpecialization(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Medical License Number</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none text-gray-900"
                                placeholder="REG-123456789"
                                required
                                value={licenseNumber}
                                onChange={e => setLicenseNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Primary Hospital/Clinic</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none text-gray-900"
                                placeholder="Central Medical Center"
                                required
                                value={hospital}
                                onChange={e => setHospital(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Contact Phone</label>
                            <input
                                type="tel"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none text-gray-900"
                                placeholder="+1 (555) 000-0000"
                                required
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm shadow-xl shadow-black/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Activating Suite..." : "Verify & Access Suite"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
