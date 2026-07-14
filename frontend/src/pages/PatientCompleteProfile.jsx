import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatientCompleteProfile() {
    const navigate = useNavigate();
    const [name, setName] = useState(sessionStorage.getItem('patient_name') || '');
    const [age, setAge] = useState('');
    const [dob, setDob] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Age Calculation Logic
    const calculateAge = (dobString) => {
        if (!dobString) return '';
        const today = new Date();
        const birthDate = new Date(dobString);
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }
        return calculatedAge;
    };

    // Update age when DOB changes
    useEffect(() => {
        if (dob) {
            setAge(calculateAge(dob));
        }
    }, [dob]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/patient/complete-profile/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, age, dob, phone }),
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                // Update session storage if name was changed
                sessionStorage.setItem('patient_name', name);
                navigate('/patient');
            } else {
                setError(data.error || 'Failed to update profile.');
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
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                        <svg width={32} height={32} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white">Complete <span className="text-primary-pale">Profile</span></h1>
                        <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest mt-1">Patient Information</p>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="mb-8 text-center text-gray-900">
                        <h2 className="text-2xl font-bold mb-2">Almost There</h2>
                        <p className="text-sm text-gray-400">Please provide a few more details to set up your health record</p>
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
                                className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none text-gray-900"
                                placeholder="Your full name"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Date of Birth</label>
                            <input
                                type="date"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none text-gray-900"
                                required
                                value={dob}
                                onChange={e => setDob(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Age (Auto-calculated)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-100 border border-gray-100 px-5 py-4 rounded-xl text-sm font-medium outline-none text-gray-400 cursor-not-allowed"
                                placeholder="Auto-calculated"
                                readOnly
                                value={age}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Phone Number</label>
                            <input
                                type="tel"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none text-gray-900"
                                placeholder="+1 (555) 000-0000"
                                required
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Updating Profile..." : "Complete Setup"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
