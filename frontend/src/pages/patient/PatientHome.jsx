import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getLatestAssessment, getAssessmentHistory, getDoctors, setDoctor, apiFetch, getClinicalPlans } from '../../utils/api';

export default function PatientHome() {
    const navigate = useNavigate();
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [prescription, setPrescription] = useState(null);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const lData = await getLatestAssessment();
                const hData = await getAssessmentHistory();
                const pRes = await apiFetch('/me/');

                if (lData.success) setLatest(lData.assessment);
                if (hData.success) setHistory(hData.assessments);
                if (pRes.ok) {
                    const pj = await pRes.json();
                    setProfile(pj.patient);
                }

                try {
                    const planData = await getClinicalPlans();
                    if (planData.success && planData.plans?.prescription) {
                        setPrescription(planData.plans.prescription);
                    }
                } catch (_) { }
            } catch (err) {
                console.error("Failed to load patient data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const name = profile?.name || sessionStorage.getItem('patient_name') || 'Patient';

    if (loading) return (
        <DashboardLayout role="patient" title="Health Portal">
            <div className="flex items-center justify-center p-20">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="patient" title="Health Portal">
            {/* Simple Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-blue-900/10 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="inline-block bg-blue-500/30 text-blue-200 text-xs font-bold px-3.5 py-1 rounded-full mb-3 border border-blue-400/30">
                        {TODAY} · Patient Health Portal
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
                        Welcome, {name}
                    </h2>
                    <p className="text-blue-100 text-base max-w-xl font-normal leading-relaxed">
                        Take your periodic cognitive screening, review your doctor's care plans, and monitor your brain health easily.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/patient/test')}
                    style={{ backgroundColor: '#ffffff', color: '#1d4ed8' }}
                    className="px-8 py-4 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-base rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center gap-3 shrink-0 cursor-pointer"
                >
                    <span>▶ Start AI Screening</span>
                    <span>→</span>
                </button>
            </div>

            {/* 3 Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 1. Screening Tests Card */}
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                    <div>
                        <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-6">
                            🧠
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">AI Screening Tests</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                            Take interactive voice, memory, and cognitive tasks to evaluate your cognitive score out of 100.
                        </p>
                    </div>

                    <div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-4 text-xs font-semibold text-slate-600">
                            {history.length > 0 ? (
                                <span>Completed: <strong>{history.length} assessment{history.length > 1 ? 's' : ''}</strong></span>
                            ) : (
                                <span className="text-blue-600 font-bold">● Ready for first screening</span>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/patient/test')}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Open Screening Tests</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>

                {/* 2. My Reports Card */}
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
                    <div>
                        <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-6">
                            📜
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">My Reports</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                            View detailed results from previous assessments, voice biomarker breakdowns, and download medical reports.
                        </p>
                    </div>

                    <div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-4 text-xs font-semibold text-slate-600 flex justify-between items-center">
                            <span>Latest Result:</span>
                            {latest ? (
                                <span className={`font-bold px-2.5 py-0.5 rounded-md ${
                                    (latest.final_risk_level || latest.risk_level) === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                                    (latest.final_risk_level || latest.risk_level) === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {latest.total_score}/30 ({latest.final_risk_level || latest.risk_level} Risk)
                                </span>
                            ) : (
                                <span className="text-slate-400">No test yet</span>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/patient/results')}
                            style={{ backgroundColor: '#059669', color: '#ffffff' }}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>View Medical Report</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>

                {/* 3. Care Plan & Tasks Card */}
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all">
                    <div>
                        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-3xl mb-6">
                            📅
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Care Plan &amp; Tasks</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                            Daily wellness schedule, recommended brain exercises, nutrition plans, and doctor prescribed routines.
                        </p>
                    </div>

                    <div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-4 text-xs font-semibold text-slate-600">
                            Today's Prescriptions: <strong>{(prescription?.content?.medications || []).length} active</strong>
                        </div>
                        <button
                            onClick={() => navigate('/patient/schedule')}
                            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Open Care Plan</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Doctor & Clinical Care Banner */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-2xl">
                        🩺
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attending Clinician</p>
                        <h4 className="text-lg font-extrabold text-slate-900">
                            {profile?.assigned_doctor ? profile.assigned_doctor.name : "Clinical Neurology Team"}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                            {profile?.assigned_doctor?.hospital || "Hospital Cognitive Care Division"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/patient/schedule')}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
                    >
                        View Prescriptions
                    </button>
                    <button
                        onClick={() => navigate('/patient/notifications')}
                        className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all cursor-pointer"
                    >
                        Messages &amp; Alerts
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
