import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col text-slate-800">
            {/* Simple Top Navigation */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20">
                            🧠
                        </div>
                        <div>
                            <span className="text-xl font-extrabold text-slate-900 tracking-tight block">Dementia Screening System</span>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Cognitive Health &amp; Care</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link 
                            to="/login/patient" 
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
                        >
                            Patient Login
                        </Link>
                        <Link 
                            to="/login/doctor" 
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl border border-slate-300 transition-all hidden sm:inline-block"
                        >
                            Doctor Portal
                        </Link>
                    </div>
                </div>
            </header>

            {/* Simple Friendly Intro Hero */}
            <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 w-full flex flex-col items-center text-center">
                <div className="inline-block bg-blue-100 text-blue-800 text-xs md:text-sm font-bold px-4 py-1.5 rounded-full mb-6 border border-blue-200">
                    🏥 Hospital-Grade Cognitive Screening Prototype
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight max-w-3xl mb-6">
                    Early Cognitive Health <br className="hidden md:block" />
                    <span className="text-blue-600">Screening &amp; Care Portal</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl leading-relaxed mb-12">
                    A simple, friendly digital screening tool for memory, voice, and reaction tasks — helping patients, caregivers, and doctors stay proactive.
                </p>

                {/* 2 Primary Access Cards for Elderly / Clinicians */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left mb-16">
                    {/* Patient Card */}
                    <div className="bg-white p-8 md:p-10 rounded-3xl border-2 border-blue-200 shadow-xl shadow-blue-500/5 flex flex-col justify-between hover:border-blue-400 transition-all">
                        <div>
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-blue-100">
                                👤
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">For Patients &amp; Families</h2>
                            <p className="text-slate-600 text-base leading-relaxed mb-6 font-normal">
                                Take short, interactive cognitive exercises (voice speaking, memory recall, and simple puzzles) and view personalized care plans.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/signup/patient')}
                                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-base shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span>Start Patient Screening</span>
                                <span>→</span>
                            </button>
                            <button
                                onClick={() => navigate('/login/patient')}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
                            >
                                Already have an account? Sign In
                            </button>
                        </div>
                    </div>

                    {/* Doctor Card */}
                    <div className="bg-white p-8 md:p-10 rounded-3xl border-2 border-slate-200 shadow-xl shadow-slate-500/5 flex flex-col justify-between hover:border-slate-400 transition-all">
                        <div>
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-slate-200">
                                🩺
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">For Doctors &amp; Clinicians</h2>
                            <p className="text-slate-600 text-base leading-relaxed mb-6 font-normal">
                                Review patient assessment records, monitor risk levels, issue medical prescriptions, and assign brain exercise routines.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/login/doctor')}
                                style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl text-base shadow-lg shadow-slate-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span>Doctor &amp; Clinician Login</span>
                                <span>→</span>
                            </button>
                            <button
                                onClick={() => navigate('/signup/doctor')}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
                            >
                                Register New Practice
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3 Simple Steps */}
                <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-8 md:p-10 text-left shadow-sm">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-6 text-center">How the Assessment Works</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-2xl mb-2">🎙️ 1. Voice Test</div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Speak naturally for 10 to 60 seconds. Our AI evaluates speech pace and pauses.</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-2xl mb-2">🧠 2. Memory &amp; Tasks</div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Answer simple orientation, word recall, and attention questions at your own speed.</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-2xl mb-2">📄 3. Instant Report</div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Get a clear summary report to download and share with your doctor.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500 font-medium">
                <p className="mb-2 font-bold text-slate-700">Dementia Screening And Care System</p>
                <p className="text-slate-400">Hospital-deployed cognitive screening prototype combining voice biomarkers, memory tasks, and clinical care plans.</p>
            </footer>
        </div>
    );
}
