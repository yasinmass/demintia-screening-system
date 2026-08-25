import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login } from '../utils/api';

export default function PatientLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            if (data.success) {
                sessionStorage.setItem('patient_id', data.patient.id);
                sessionStorage.setItem('patient_name', data.patient.name);
                sessionStorage.setItem('patient_email', data.patient.email);
                sessionStorage.setItem('role', 'patient');
                navigate('/patient');
            } else {
                setError(data.error || 'Invalid credentials.');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSuccess(credentialResponse) {
        setError('');
        setLoading(true);
        try {
            const response = await fetch('/api/auth/google/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                sessionStorage.setItem('patient_id', data.patient_id);
                sessionStorage.setItem('patient_name', data.name);
                sessionStorage.setItem('patient_email', data.email);
                sessionStorage.setItem('role', 'patient');
                
                if (data.profile_complete === false) {
                    navigate('/patient/complete-profile');
                } else {
                    navigate('/patient');
                }
            } else {
                setError(data.error || 'Google Authentication failed.');
            }
        } catch {
            setError('Connection error with Google services.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page px-6">
            <div className="fade-in w-full max-w-[480px]">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                        <svg width={32} height={32} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white">NeuroScan <span className="text-primary-pale">AI</span></h1>
                        <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest mt-1">Patient Portal</p>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-sm text-gray-400">Login to access your screening results</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in shake">
                            <span className="text-red-500">⚠️</span>
                            <p className="text-xs font-bold text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-white border-2 border-gray-200 focus:border-blue-600 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 transition-all outline-none"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-xs font-bold text-gray-700">Password</label>
                                <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot?</a>
                            </div>
                            <input
                                type="password"
                                className="w-full bg-white border-2 border-gray-200 focus:border-blue-600 px-4 py-3.5 rounded-xl text-base font-semibold text-gray-900 transition-all outline-none"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-extrabold text-base shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-90 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-white font-bold">Logging in...</span>
                                </>
                            ) : (
                                <span className="text-white font-bold tracking-wide">Login to Portal</span>
                            )}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-gray-200"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">or continue with</span>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                            useOneTap
                            theme="outline"
                            shape="pill"
                        />
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-3">
                        <p className="text-sm font-medium text-gray-500">
                            No account yet? <Link to="/signup/patient" className="text-blue-600 font-bold hover:underline ml-1">Create Profile</Link>
                        </p>
                        <Link to="/login/doctor" className="block text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors">
                            Professional Access Portal →
                        </Link>
                    </div>
                </div>

                <p className="mt-6 text-center text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Secure Clinical Gateway</p>
            </div>
        </div>
    );
}