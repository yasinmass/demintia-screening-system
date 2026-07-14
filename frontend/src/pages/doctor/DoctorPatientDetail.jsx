import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatientDetail } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level} Risk</span>;
}

export default function DoctorPatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [adherence, setAdherence] = useState({ completed_count: 0, expected_weekly: 0, recent_activities: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const data = await getDoctorPatientDetail(id);
                if (data.success) {
                    setPatient(data.patient);
                    setAssessments(data.assessments);
                    if (data.adherence) setAdherence(data.adherence);
                }
            } catch (err) {
                console.error("Failed to load patient detail:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    if (loading) return (
        <DashboardLayout role="doctor" title="Loading Profile...">
            <div className="flex items-center justify-center p-20">
                <div className="spin text-teal-600 text-3xl">⟳</div>
            </div>
        </DashboardLayout>
    );

    if (!patient) return (
        <DashboardLayout role="doctor" title="Error">
            <div className="p-20 text-center">
                <h3 className="text-2xl font-bold text-gray-400 mb-4">Patient Not Found</h3>
                <button className="bg-primary text-white px-4 py-2 rounded" onClick={() => navigate('/doctor/patients')}>Back to Registry</button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="doctor" title="Patient Detail">
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">← Back</button>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Case ID: {id}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                {/* Profile Card */}
                <div className="md:col-span-1 bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
                    <div className="w-20 h-20 rounded bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                        {patient.name[0]}
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>
                        <p className="text-sm text-gray-500 mb-6">{patient.email}</p>

                        <div className="text-left space-y-4 pt-6 border-t border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Age</p>
                                <p className="text-sm font-bold text-gray-700">{patient.age || '—'} yrs</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Assessments</p>
                                <p className="text-sm font-bold text-gray-700">{assessments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-8">
                    {/* Latest Summary */}
                    <div className="bg-gray-800 text-white p-8 rounded-lg shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Latest Diagnostic Summary</h3>
                        {assessments.length > 0 ? (
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">Risk Level</p>
                                    <RiskBadge level={assessments[0].risk_level} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">MoCA Score</p>
                                    <p className="text-2xl font-bold">{assessments[0].total_score}/30</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">ML Prediction</p>
                                    <p className="text-sm font-bold uppercase">{assessments[0].ml_prediction}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic">No assessment history found for this patient.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4">Therapeutic Adherence</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-gray-600 font-bold">Exercise Compliance</span>
                                    <span className="text-sm font-black text-teal-600">{adherence.completed_count || 0} / {adherence.expected_weekly || '—'}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner font-bold">
                                    <div
                                        className="h-full bg-teal-500 transition-all duration-1000"
                                        style={{ width: `${adherence.expected_weekly ? Math.min(100, (adherence.completed_count / adherence.expected_weekly) * 100) : 0}%` }}
                                    ></div>
                                </div>
                                <p className="text-[9px] text-gray-400 font-medium italic">Based on active clinical prescriptions for the current cycle.</p>
                                <button onClick={() => navigate(`/doctor/schedule?pId=${id}`)} className="w-full mt-2 py-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded shadow hover:bg-black transition-all">Update Clinical Plans</button>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4">Clinical Guidance</h4>
                            <div className="flex-1 flex flex-col justify-center items-center gap-3 border-2 border-dashed border-gray-100 rounded-xl p-4">
                                <span className="text-3xl">🩺</span>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase italic mb-2 tracking-tighter">NeuroScan Direct Message</p>
                                    <button onClick={() => navigate('/doctor/messages')} className="bg-primary text-white border border-primary px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Consult with Patient</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Adherence History / Task Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden auto-rows-min">
                    <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Patient Activity Log</h3>
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black uppercase tracking-widest">Self-Reported Data</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                        {adherence.recent_activities && adherence.recent_activities.length > 0 ? adherence.recent_activities.map((act, i) => (
                            <div key={i} className="px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold shadow-sm ring-1 ring-emerald-100">✓</div>
                                    <div>
                                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{act.task.replace(/_/g, ' ')}</p>
                                        <p className="text-[10px] text-gray-400 font-medium italic">{act.date}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-gray-100 text-gray-500`}>
                                    {act.type}
                                </span>
                            </div>
                        )) : (
                            <div className="p-20 text-center">
                                <p className="text-sm font-medium text-gray-300 italic">No historical adherence markers found.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                    <div className="px-8 py-5 border-b border-gray-200 bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Cognitive Maintenance Goals</h3>
                    </div>
                    <div className="p-8 flex-1 space-y-6">
                        <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm">
                            <h5 className="text-[10px] font-black text-blue-600 uppercase mb-3 tracking-widest">Phase 01: Stabilization</h5>
                            <ul className="space-y-2">
                                <li className="flex gap-2 items-center text-xs text-blue-800 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    Daily Mindful Meditation (15m)
                                </li>
                                <li className="flex gap-2 items-center text-xs text-blue-800 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    Blueberry-rich Mediterranean Diet
                                </li>
                            </ul>
                        </div>
                        <div className="p-5 border border-gray-100 rounded-2xl opacity-40">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Phase 02: Intensive Focus</h5>
                            <p className="text-[10px] text-gray-400 font-medium italic">Available after 14 days of successful adherence.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assessment History Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-12 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Detailed Assessment History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Breakdown</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Prediction</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</th>
                                <th className="px-8 py-4 text-right">Risk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {assessments.map(a => (
                                <tr key={a.id}>
                                    <td className="px-8 py-4">
                                        <p className="text-xs font-bold text-gray-800">{a.created_at}</p>
                                        <p className="text-[10px] text-gray-400">ID: {a.id}</p>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="text-[10px] flex gap-3 text-gray-500 font-medium">
                                            <span>M: {a.memory_score}</span>
                                            <span>O: {a.orientation_score}</span>
                                            <span>E: {a.executive_score}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <p className="text-[10px] font-bold uppercase text-gray-600">{a.ml_prediction}</p>
                                        <p className="text-[9px] text-gray-400">Prob: {(a.ml_dementia_probability * 100).toFixed(1)}%</p>
                                    </td>
                                    <td className="px-8 py-4 font-bold text-sm text-primary">
                                        {a.total_score}/30
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <RiskBadge level={a.risk_level} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
