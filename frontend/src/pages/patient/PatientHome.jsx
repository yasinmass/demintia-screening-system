import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getLatestAssessment, getAssessmentHistory, getDoctors, setDoctor, apiFetch, getClinicalPlans } from '../../utils/api';

export default function PatientHome() {
    const navigate = useNavigate();
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingDoctor, setUpdatingDoctor] = useState(false);
    const [prescription, setPrescription] = useState(null);
    const [exercisePlan, setExercisePlan] = useState(null);
    const [dietPlan, setDietPlan] = useState(null);
    const [taskPlan, setTaskPlan] = useState(null);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const lData = await getLatestAssessment();
                const hData = await getAssessmentHistory();
                const dData = await getDoctors();
                const pRes = await apiFetch('/me/');

                if (lData.success) setLatest(lData.assessment);
                if (hData.success) setHistory(hData.assessments);
                if (dData.success) setDoctors(dData.doctors);
                if (pRes.ok) {
                    const pj = await pRes.json();
                    setProfile(pj.patient);
                }

                // Load all clinical plans
                try {
                    const planData = await getClinicalPlans();
                    if (planData.success) {
                        if (planData.plans?.prescription) setPrescription(planData.plans.prescription);
                        if (planData.plans?.exercise) setExercisePlan(planData.plans.exercise);
                        if (planData.plans?.diet) setDietPlan(planData.plans.diet);
                        if (planData.plans?.task) setTaskPlan(planData.plans.task);
                    }
                } catch{ }
            } catch (err) {
                console.error("Failed to load patient data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const todayExercises = exercisePlan?.content?.[TODAY] || [];
    const todayDiet = dietPlan?.content?.[TODAY] || [];
    const todayTasks = taskPlan?.content?.[TODAY] || [];

    async function handleEnroll(docId) {
        setUpdatingDoctor(true);
        try {
            const res = await setDoctor(docId);
            if (res.success) {
                window.location.reload();
            }
        } catch (err) {
            alert("Enrollment failed");
        } finally {
            setUpdatingDoctor(false);
        }
    }

    const name = profile?.name || sessionStorage.getItem('patient_name') || 'Patient';

    if (loading) return (
        <DashboardLayout role="patient" title="My Health Portal">
            <div className="flex items-center justify-center p-20">
                <div className="spin text-teal-600 text-4xl">⟳</div>
            </div>
        </DashboardLayout>
    );

    const stats = [
        { label: 'Total Assessments', value: history.length, icon: '📋', color: 'var(--primary)', bg: 'var(--primary-pale)' },
        { label: 'Latest MMSE Score', value: latest ? `${latest.total_score}/30` : 'None', icon: '🎯', color: 'var(--success)', bg: 'var(--success-light)' },
        { label: 'Risk Level', value: latest?.risk_level || (latest?.final_risk_level) || 'Pending', icon: '🛡️', color: 'var(--accent)', bg: 'var(--accent-light)' },
        { label: 'MOCA Test', value: 'Available', icon: '📋', color: 'var(--teal)', bg: 'var(--teal-light)' },
    ];

    return (
        <DashboardLayout role="patient" title="My Health Portal">
            {/* Welcome */}
            <div className="fade-in" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '32px',
                padding: '48px',
                marginBottom: 32,
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%' }}></div>
                <div style={{ maxWidth: 650, position: 'relative', zIndex: 1 }}>
                    <h5 className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-4">Precision Neurology Platform</h5>
                    <h2 className="text-5xl font-black mb-6 tracking-tighter">Welcome, <span className="text-sky-400">{name}</span></h2>
                    <p className="text-gray-400 text-lg font-medium leading-relaxed mb-10">
                        Your personalized neuro-protective dashboard is ready. Review your active clinical interventions and cognitive trends below.
                    </p>
                    <div className="flex gap-4">
                        <button className="bg-sky-500 hover:bg-sky-400 text-white font-black px-10 py-5 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-widest" onClick={() => navigate('/patient/test')}>
                            Start Screening
                        </button>
                        <button className="bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 px-8 py-5 rounded-2xl text-xs uppercase tracking-widest transition-all" onClick={() => navigate('/patient/moca')}>
                            MOCA Test
                        </button>
                    </div>
                </div>
            </div>

            {/* Today's Interventions Summary row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-100 border border-gray-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">🧠</div>
                        <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{TODAY}</span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Today's Exercises</h4>
                    <p className="text-xs text-gray-400 font-medium mb-6 italic">{todayExercises.length} Activities scheduled</p>
                    <button className="w-full py-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all" onClick={() => navigate('/patient/schedule')}>Open Schedule</button>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-100 border border-gray-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl">🥗</div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{TODAY}</span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Brain Diet</h4>
                    <p className="text-xs text-gray-400 font-medium mb-6 italic">{todayDiet.length} Nutrients prescribed</p>
                    <button className="w-full py-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all" onClick={() => navigate('/patient/schedule')}>View Diet Chart</button>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-100 border border-gray-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl">💊</div>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Active</span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Prescriptions</h4>
                    <p className="text-xs text-gray-400 font-medium mb-6 italic">{(prescription?.content?.medications || []).length} Medications logged</p>
                    <button className="w-full py-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all" onClick={() => navigate('/patient/schedule')}>Open Pharmacy</button>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-100 border border-gray-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl">📋</div>
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{TODAY}</span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Clinical Tasks</h4>
                    <p className="text-xs text-gray-400 font-medium mb-6 italic">{todayTasks.length} Tasks & Goals</p>
                    <button className="w-full py-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all" onClick={() => navigate('/patient/schedule')}>Open Tasks</button>
                </div>
            </div>

            {/* Today's Detailed Plan Preview */}
            {(todayExercises.length > 0 || todayDiet.length > 0 || todayTasks.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Exercise Detail */}
                    {todayExercises.length > 0 && (
                        <div className="bg-white rounded-[28px] border border-gray-100 shadow-md overflow-hidden">
                            <div style={{ background: '#fffbeb', borderBottom: '1px solid #fef3c7', padding: '14px 20px' }}>
                                <p className="text-xs font-black uppercase tracking-widest text-amber-700">🧠 Today's Exercises</p>
                            </div>
                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {todayExercises.map((itemId, i) => {
                                    const EXERCISE_MAP = { meditation: 'Mindfulness Meditation', dual_n_back: 'Dual N-Back', speed_match: 'Processing Speed Match', semantic_link: 'Semantic Linking', spatial_rotation: 'Spatial Rotation', stretching: 'Daily Stretching' };
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fffbeb', borderRadius: 10 }}>
                                            <span style={{ fontSize: 14 }}>✓</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{EXERCISE_MAP[itemId] || itemId}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Diet Detail */}
                    {todayDiet.length > 0 && (
                        <div className="bg-white rounded-[28px] border border-gray-100 shadow-md overflow-hidden">
                            <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '14px 20px' }}>
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-700">🥗 Today's Diet</p>
                            </div>
                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {todayDiet.map((itemId, i) => {
                                    const DIET_MAP = { blueberries: 'Blueberries', walnuts: 'Walnuts', turmeric: 'Turmeric', fatty_fish: 'Fatty Fish', dark_choco: 'Dark Chocolate', leafy_greens: 'Leafy Greens', broccoli: 'Steamed Broccoli' };
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 10 }}>
                                            <span style={{ fontSize: 14 }}>✓</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>{DIET_MAP[itemId] || itemId}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Task Detail */}
                    {todayTasks.length > 0 && (
                        <div className="bg-white rounded-[28px] border border-gray-100 shadow-md overflow-hidden">
                            <div style={{ background: '#eef2ff', borderBottom: '1px solid #c7d2fe', padding: '14px 20px' }}>
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-700">📋 Today's Tasks</p>
                            </div>
                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {todayTasks.map((itemId, i) => {
                                    const TASK_MAP = { blood_pressure: 'Blood Pressure Check', medication_log: 'Medication Log', sleep_diary: 'Sleep Diary', social_activity: 'Social Interaction', reading: 'Reading Session', puzzle: 'Crossword / Puzzle', walk: 'Daily Walk', hydration: 'Hydration Tracking' };
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#eef2ff', borderRadius: 10 }}>
                                            <span style={{ fontSize: 14 }}>✓</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#3730a3' }}>{TASK_MAP[itemId] || itemId}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
                {/* Latest Result Card */}
                <div className="card shadow-xl border-0 overflow-hidden rounded-[32px]">
                    <div className="card-header bg-gray-50/50 py-6 px-8 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Assessment</h3>
                        {latest && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{latest.created_at}</span>}
                    </div>
                    <div className="card-body p-10">
                        {latest ? (
                            <div className="flex flex-col md:flex-row gap-12 items-center">
                                <div className="circ-progress" style={{ width: 180, height: 180 }}>
                                    <svg width="180" height="180">
                                        <circle cx="90" cy="90" r="80" fill="transparent" stroke="var(--gray-100)" strokeWidth="12" />
                                        <circle cx="90" cy="90" r="80" fill="transparent" stroke="var(--primary)" strokeWidth="12"
                                            strokeDasharray={502} strokeDashoffset={502 - (502 * latest.total_score) / 30}
                                            strokeLinecap="round" />
                                    </svg>
                                    <div className="inner">
                                        <span className="text-5xl font-black text-gray-900 leading-tight">{latest.total_score}</span>
                                        <span className="block text-xs font-black text-gray-400 uppercase tracking-widest">Score / 30</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className={`badge ${latest.final_risk_level === 'Low' || latest.risk_level === 'Low' ? 'badge-low' : (latest.final_risk_level === 'Moderate' || latest.risk_level === 'Moderate') ? 'badge-moderate' : 'badge-high'} p-4 px-6 rounded-2xl mb-6 flex justify-center text-lg font-black`}>
                                        {latest.final_risk_level || latest.risk_level} Risk Level
                                    </div>
                                    <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                        Screening indicates a <b className="text-gray-900">{latest.final_risk_level || latest.risk_level}</b> risk of dementia based on acoustic and memory markers.
                                    </p>
                                    <button className="btn btn-outline w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border-2" onClick={() => navigate('/patient/results')}>
                                        Detailed Clinical Report
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500 font-medium text-lg mb-8">No assessment recorded yet. Early screening is crucial for brain health monitoring.</p>
                                <button className="btn btn-primary btn-lg" onClick={() => navigate('/patient/test')}>Take your first AI screening →</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cognitive Wellness & Personal Monitoring */}
                <div className="card shadow-xl border-0 overflow-hidden bg-gray-900 text-white rounded-[32px]">
                    <div className="card-header border-white/5 py-6 px-8 flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase tracking-tight">Clinical Supervisor</h3>
                        <span className="text-emerald-400 text-[10px] font-black uppercase bg-emerald-400/10 px-3 py-1 rounded-full">Secure Link</span>
                    </div>
                    <div className="card-body p-8 space-y-6">
                        {/* Maintenance Doctor Enrollment */}
                        <div className="p-8 bg-white/5 rounded-[28px] border border-white/10 mb-6">
                            <h4 className="text-sm font-black uppercase mb-1">Clinical Network</h4>
                            <p className="text-white/40 text-[9px] font-medium italic mb-6">Connect with a neurologist for professional plan management.</p>

                            {profile?.assigned_doctor ? (
                                <div className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-1">Attending Physician</p>
                                        <p className="text-sm font-black text-white">{profile.assigned_doctor.name}</p>
                                        <p className="text-[10px] text-white/40">{profile.assigned_doctor.hospital || 'Specialist'}</p>
                                    </div>
                                    <button className="w-full py-3 bg-white/5 text-white/40 hover:text-white/80 font-black uppercase text-[8px] rounded-xl border border-white/5 transition-all"
                                        onClick={() => handleEnroll(null)} disabled={updatingDoctor}>
                                        Disconnect Provider
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <select className="w-full bg-white/10 border-0 p-4 rounded-xl text-white text-xs font-bold focus:ring-1 ring-sky-500"
                                        onChange={e => handleEnroll(e.target.value)} disabled={updatingDoctor}>
                                        <option value="" className="text-black">Choose Clinical Provider…</option>
                                        {doctors.map(d => <option key={d.id} value={d.id} className="text-black">{d.name} ({d.specialization})</option>)}
                                    </select>
                                    <p className="text-[8px] text-white/20 text-center uppercase tracking-widest">Enrollment enables expert cognitive monitoring</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 text-center bg-sky-500/10 rounded-[28px] border border-sky-500/20">
                            <h4 className="text-sm font-black uppercase tracking-tight mb-2">Health Timeline</h4>
                            <p className="text-white/40 text-[10px] font-medium italic mb-6">Open your daily therapeutic schedule.</p>
                            <button className="w-full py-4 bg-sky-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20"
                                onClick={() => navigate('/patient/schedule')}>
                                Open Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Doctor Prescription Section - Detailed */}
            <div className="card shadow-xl border-0 overflow-hidden rounded-[32px]" style={{ marginTop: 28 }}>
                <div className="card-header bg-gray-50/50 py-6 px-8 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span style={{ fontSize: 22 }}>📋</span>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Official Prescription Pad</h3>
                    </div>
                    {prescription && (
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Verified by Dr. {prescription.assigned_by}</span>
                        </div>
                    )}
                </div>
                <div className="card-body p-8">
                    {prescription ? (
                        <div>
                            {prescription.content?.medications && prescription.content.medications.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {prescription.content.medications.map((med, i) => (
                                        <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-5 transition-all hover:bg-white hover:shadow-md">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">💊</div>
                                            <div>
                                                <div className="font-black text-gray-900 text-sm uppercase tracking-tight">{med.name || 'Medication'}</div>
                                                <div className="flex gap-2 mt-1">
                                                    {med.dose && <span className="text-[9px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase">{med.dose}</span>}
                                                    {med.freq && <span className="text-[9px] font-medium text-gray-400 italic">{med.freq}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 font-medium italic text-center py-4 uppercase tracking-widest text-[9px]">No medications listed in this record.</p>
                            )}
                            {prescription.special_instructions && (
                                <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 italic">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700 mb-2">Clinical Directive</p>
                                    <p className="text-sm font-medium text-amber-900 leading-relaxed">{prescription.special_instructions}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-6 opacity-10">💊</div>
                            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No prescription assigned yet.</p>
                            <p className="text-gray-300 text-[10px] mt-2 italic font-medium">Connect with a physician to receive professional clinical guidance.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

