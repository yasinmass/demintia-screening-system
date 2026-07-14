import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { getClinicalPlans, recordTaskCompletion } from '../../utils/api';

const BRAIN_EXERCISES = [
    { id: 'meditation', name: 'Mindfulness Meditation', cat: 'Mental', dur: '10 min', desc: 'Deep breathing and focused awareness to reduce neuro-inflammation.' },
    { id: 'dual_n_back', name: 'Dual N-Back', cat: 'Cognitive', dur: '15 min', desc: 'Working memory training that improves fluid intelligence.' },
    { id: 'speed_match', name: 'Processing Speed Match', cat: 'Speed', dur: '10 min', desc: 'Identify pairs quickly to maintain synaptic firing speed.' },
    { id: 'semantic_link', name: 'Semantic Linking', cat: 'Language', dur: '20 min', desc: 'Link unrelated concepts to strengthen associative memory.' },
    { id: 'spatial_rotation', name: 'Mental Rotation', cat: 'Visual', dur: '15 min', desc: 'Rotate 3D objects mentally to exercise parietal lobe.' },
    { id: 'stretching', name: 'Neurological Stretching', cat: 'Motor', dur: '15 min', desc: 'Gentle movements to maintain motor cortex plasticity.' },
];

const BRAIN_FOODS = [
    { id: 'blueberries', name: 'Blueberries / Berries', cat: 'Antioxidants', desc: 'Rich in flavonoids that delay mental aging.' },
    { id: 'walnuts', name: 'Walnuts', cat: 'Omega-3', desc: 'High in DHA, shown to improve cognitive performance.' },
    { id: 'turmeric', name: 'Turmeric with Black Pepper', cat: 'Anti-inflammatory', desc: 'Curcumin helps clear amyloid plaques in the brain.' },
    { id: 'broccoli', name: 'Steamed Broccoli', cat: 'Vitamin K', desc: 'Essential for forming sphingolipids, a type of fat in brain cells.' },
    { id: 'fatty_fish', name: 'Salmon / Mackerel', cat: 'Omega-3', desc: 'Provides building blocks for brain and nerve cells.' },
    { id: 'dark_choco', name: 'Dark Chocolate (85%+)', cat: 'Flavonoids', desc: 'Powerful antioxidants to protect brain cells from oxidation.' },
    { id: 'leafy_greens', name: 'Spinach / Kale', cat: 'Vitamins', desc: 'Lutein and Vitamin K for slowing cognitive decline.' },
];

const CLINICAL_TASKS = [
    { id: 'blood_pressure', name: 'Blood Pressure Check', cat: 'Monitoring', desc: 'Record your morning blood pressure reading.' },
    { id: 'medication_log', name: 'Medication Log', cat: 'Compliance', desc: 'Log all medications taken today.' },
    { id: 'sleep_diary', name: 'Sleep Diary', cat: 'Monitoring', desc: 'Record sleep hours and quality rating.' },
    { id: 'social_activity', name: 'Social Interaction', cat: 'Neuro-Social', desc: 'Engage in a conversation, phone call, or group activity.' },
    { id: 'reading', name: 'Reading Session', cat: 'Cognitive', desc: 'Read a book, newspaper, or article for at least 15 minutes.' },
    { id: 'puzzle', name: 'Crossword / Puzzle', cat: 'Cognitive', desc: 'Complete a crossword, Sudoku, or brain puzzle.' },
    { id: 'walk', name: 'Daily Walk', cat: 'Physical', desc: 'Take a 20+ minute outdoor or indoor walk.' },
    { id: 'hydration', name: 'Hydration Tracking', cat: 'Health', desc: 'Drink 8 glasses of water and log your intake.' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

export default function PatientSchedule() {
    const [plans, setPlans] = useState(null);
    const [activeType, setActiveType] = useState('exercise');
    const [completed, setCompleted] = useState({}); // Stores { task_id: true }
    const [activeDay, setActiveDay] = useState(TODAY);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const loadPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getClinicalPlans();
            console.log('Clinical plans API response:', data); // debug
            if (data.success) {
                setPlans(data.plans);
                // Extract completions from all plans and set them in state
                const allCompletions = {};
                Object.values(data.plans).forEach(p => {
                    (p.completed_today || []).forEach(tid => {
                        allCompletions[tid] = true;
                    });
                });
                setCompleted(allCompletions);
            } else {
                setError(data.error || 'Failed to load plans.');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
            console.error("Load plans failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    async function handleComplete(planId, taskId) {
        if (completed[taskId]) return; // Already done

        try {
            const res = await recordTaskCompletion(planId, taskId, `Completed on ${activeDay}`);
            if (res.success) {
                setCompleted(prev => ({ ...prev, [taskId]: true }));
            }
        } catch (err) {
            alert("Connection error. Could not log completion.");
        }
    }

    const currentPlan = plans?.[activeType] || {};
    const currentSchedule = currentPlan.content || {};
    const instructions = currentPlan.special_instructions || "Follow the daily scheduled interventions as prescribed.";
    const doctorName = currentPlan.assigned_by || "Clinical Team";

    // For prescription type, count medications; otherwise count schedule items
    const totalTasks = activeType === 'prescription'
        ? (currentSchedule.medications || []).length
        : Object.values(currentSchedule).flat().length;
    const doneTasks = Object.keys(completed).length;
    const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    if (error) return (
        <DashboardLayout role="patient" title="Therapeutic Schedule">
            <div className="flex flex-col items-center justify-center py-40 text-center">
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h3 style={{ fontWeight: 800, color: '#374151', marginBottom: 8 }}>Could not load schedule</h3>
                <p style={{ color: '#6b7280', marginBottom: 24 }}>{error}</p>
                <button onClick={loadPlans} className="btn btn-primary">Retry</button>
            </div>
        </DashboardLayout>
    );

    // No plans assigned at all
    const hasAnyPlan = plans && Object.keys(plans).length > 0;

    if (!loading && !hasAnyPlan) return (
        <DashboardLayout role="patient" title="Therapeutic Schedule">
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div style={{ fontSize: 64, marginBottom: 20 }}>🩺</div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>No Schedule Assigned Yet</h3>
                <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 440, lineHeight: 1.8, marginBottom: 32 }}>
                    Your doctor hasn't assigned any clinical plan to you yet. Follow these steps to get started:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480, width: '100%', marginBottom: 32 }}>
                    {[
                        { step: '1', icon: '🏠', title: 'Go to Home', desc: 'Navigate to your Home page and connect with your doctor under "Clinical Network".' },
                        { step: '2', icon: '👨‍⚕️', title: 'Doctor Assigns Plans', desc: 'Your doctor logs in and assigns exercises, diet, tasks or prescriptions to you from their portal.' },
                        { step: '3', icon: '🔄', title: 'Refresh This Page', desc: 'Once the doctor assigns plans, click Refresh below to see your personalized schedule.' },
                    ].map(s => (
                        <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 16, padding: '16px 20px', textAlign: 'left' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{s.step}</div>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 2 }}>{s.icon} {s.title}</p>
                                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <a href="/patient" style={{ padding: '10px 24px', borderRadius: 8, background: '#1f2937', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', textDecoration: 'none', fontSize: 14 }}>Go to Home →</a>
                    <button onClick={loadPlans} style={{ padding: '10px 24px', borderRadius: 8, background: '#0d9488', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>🔄 Refresh Plans</button>
                </div>
            </div>
        </DashboardLayout>
    );

    const activeDayTasks = currentSchedule[activeDay] || [];
    const activeLibrary = activeType === 'diet' ? BRAIN_FOODS : activeType === 'task' ? CLINICAL_TASKS : BRAIN_EXERCISES;

    return (
        <DashboardLayout role="patient" title="Therapeutic Schedule">
            <div className="page-header mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Clinical Interventions</h2>
                    <p className="text-gray-500 font-medium italic">Personalized neuro-protective schedule from Dr. {doctorName}</p>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-2 shadow-inner">
                    {[
                        { id: 'exercise', label: 'Exercises', icon: '🧠' },
                        { id: 'diet', label: 'Diet Chart', icon: '🥗' },
                        { id: 'task', label: 'Tasks', icon: '📋' },
                        { id: 'prescription', label: 'Prescription', icon: '💊' }
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveType(t.id)}
                            className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all ${activeType === t.id ? 'bg-white text-teal-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                            <span>{t.icon}</span> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-12">
                {/* Week overview — hidden for prescriptions since they have no day schedule */}
                {activeType !== 'prescription' && (
                    <div className="card shadow-2xl border-0 bg-white overflow-hidden">
                        <div className="px-10 py-6 bg-gray-900 flex items-center justify-between">
                            <h3 className="text-white font-black uppercase tracking-widest text-xs">Diagnostic Timeline</h3>
                            <div className="flex gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
                                <span>{activeType} track active</span>
                            </div>
                        </div>
                        <div className="p-10 text-center">
                            <div className="flex justify-between gap-2 overflow-x-auto pb-4">
                                {DAYS.map(day => {
                                    const dayTasks = currentSchedule[day] || [];
                                    const isToday = day === TODAY;
                                    const isActive = day === activeDay;

                                    return (
                                        <div key={day}
                                            onClick={() => setActiveDay(day)}
                                            className={`flex-1 min-w-[60px] cursor-pointer transition-all ${isActive ? 'scale-105' : ''}`}>
                                            <div className={`text-center py-4 rounded-2xl border-2 transition-all ${isActive ? 'bg-teal-600 border-teal-600 shadow-xl shadow-teal-100 text-white' : isToday ? 'bg-white border-teal-600 text-teal-600' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'}`}>
                                                <div className="text-[10px] font-black uppercase tracking-widest mb-1">{day.slice(0, 3)}</div>
                                                <div className="text-xs font-black">{dayTasks.length}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeType === 'prescription' ? (
                    <div className="card shadow-2xl border-0 bg-white rounded-[40px] p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full -mr-32 -mt-32 opacity-30"></div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-4">
                            💊 Professional Medical Guidelines
                        </h3>
                        <div className="space-y-4 relative z-10">
                            {currentSchedule.medications && currentSchedule.medications.length > 0 ? currentSchedule.medications.map((med, i) => (
                                <div key={i} className="flex gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100 items-center">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">💊</div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">{med.name}</h4>
                                        <div className="flex gap-3 mt-1">
                                            <span className="text-[10px] font-black uppercase text-teal-600">{med.dose}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-[10px] font-medium text-gray-400 italic">{med.freq}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-400 font-medium italic p-10 text-center uppercase tracking-widest text-[10px]">No medications prescribed currently.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">
                                {activeDay} {activeType === 'diet' ? 'Nutrients' : 'Interventions'} {activeDay === TODAY && <span className="text-teal-600 ml-2">— Today</span>}
                            </h3>
                            <span className="bg-gray-100 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">{activeDayTasks.length} Targets</span>
                        </div>

                        {activeDayTasks.length === 0 ? (
                            <div className="card border-2 border-dashed border-gray-100 p-20 text-center rounded-[40px] bg-gray-50/30">
                                <div className="text-5xl mb-6 grayscale opacity-30">{activeType === 'diet' ? '🍽️' : '🧘'}</div>
                                <h4 className="text-xl font-black text-gray-300 uppercase tracking-widest">No {activeType} scheduled</h4>
                                <p className="text-gray-400 font-medium italic mt-2">Consult with clinical portal for customization.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {activeDayTasks.map((itemId, i) => {
                                    const item = activeLibrary.find(e => e.id === itemId) || { name: itemId, desc: 'Clinical instruction.' };
                                    const taskId = `${activeType}_${activeDay}_${itemId}`;
                                    const done = completed[taskId];

                                    return (
                                        <div key={i} className={`card shadow-xl border-0 rounded-[32px] overflow-hidden transition-all hover:shadow-2xl ${done ? 'bg-emerald-50 opacity-70' : 'bg-white'}`}>
                                            <div className="p-8 flex items-start gap-8">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${done ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white shadow-xl shadow-gray-200'}`}>
                                                    {activeType === 'diet' ? '🥗' : (done ? '✓' : i + 1)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className={`text-xl font-black uppercase tracking-tight ${done ? 'text-emerald-900 line-through' : 'text-gray-900'}`}>{item.name}</h4>
                                                            <div className="flex gap-2 mt-2">
                                                                {item.dur && <span className="bg-white border border-gray-100 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">⏱ {item.dur}</span>}
                                                                <span className="bg-white border border-gray-100 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400"># {item.cat || 'Nutritional'}</span>
                                                            </div>
                                                        </div>
                                                        {done && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-4 py-1 rounded-full shadow-inner shadow-emerald-200">Logged Completed</span>}
                                                    </div>
                                                    <p className={`text-sm font-medium leading-relaxed italic ${done ? 'text-emerald-700' : 'text-gray-500'}`}>{item.desc}</p>
                                                    <div className="mt-8 flex gap-3">
                                                        {!done && activeDay === TODAY ? (
                                                            <button
                                                                className="bg-white border-2 border-emerald-600 text-emerald-600 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 hover:text-white transition-all underline decoration-4"
                                                                onClick={() => handleComplete(currentPlan.id, taskId)}
                                                            >
                                                                Commit Completion
                                                            </button>
                                                        ) : done ? (
                                                            <span className="text-emerald-600 font-black text-[10px] uppercase italic">Verified Clinical Record</span>
                                                        ) : (
                                                            <span className="text-gray-300 font-black text-[10px] uppercase italic">Await Active Day</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
