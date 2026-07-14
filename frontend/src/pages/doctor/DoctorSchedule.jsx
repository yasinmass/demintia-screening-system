import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useLocation } from 'react-router-dom';
import { getDoctorPatients, assignClinicalPlan, apiFetch } from '../../utils/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BRAIN_EXERCISES = [
    { id: 'meditation', name: 'Mindfulness Meditation', cat: 'Mental', dur: '10 min', desc: 'Deep breathing & focused awareness.' },
    { id: 'dual_n_back', name: 'Dual N-Back', cat: 'Cognitive', dur: '15 min', desc: 'Working memory training.' },
    { id: 'speed_match', name: 'Processing Speed Match', cat: 'Speed', dur: '10 min', desc: 'Identify matching symbols quickly.' },
    { id: 'semantic_link', name: 'Semantic Linking', cat: 'Language', dur: '20 min', desc: 'Link unrelated concepts.' },
    { id: 'spatial_rotation', name: 'Spatial Rotation', cat: 'Visual', dur: '15 min', desc: 'Mentally rotate 3D objects.' },
    { id: 'stretching', name: 'Daily Stretching', cat: 'Motor', dur: '15 min', desc: 'Gentle movement for brain health.' },
];

const BRAIN_FOODS = [
    { id: 'blueberries', name: 'Blueberries', cat: 'Antioxidants', desc: 'Rich in flavonoids.' },
    { id: 'walnuts', name: 'Walnuts', cat: 'Omega-3', desc: 'Healthy fats for brain cells.' },
    { id: 'turmeric', name: 'Turmeric', cat: 'Anti-inflammatory', desc: 'Curcumin for neuro-health.' },
    { id: 'fatty_fish', name: 'Fatty Fish', cat: 'Omega-3', desc: 'Salmon or trout sources.' },
    { id: 'dark_choco', name: 'Dark Chocolate', cat: 'Flavonoids', desc: 'At least 70% cocoa.' },
    { id: 'leafy_greens', name: 'Leafy Greens', cat: 'Vitamins', desc: 'Spinach, kale, or collards.' },
];

const CLINICAL_TASKS = [
    { id: 'blood_pressure', name: 'Blood Pressure Check', cat: 'Monitoring', desc: 'Record morning BP reading.' },
    { id: 'medication_log', name: 'Medication Log', cat: 'Compliance', desc: 'Log all medications taken today.' },
    { id: 'sleep_diary', name: 'Sleep Diary', cat: 'Monitoring', desc: 'Record sleep hours and quality.' },
    { id: 'social_activity', name: 'Social Interaction', cat: 'Neuro-Social', desc: 'Conversation, phone call, or group activity.' },
    { id: 'reading', name: 'Reading Session', cat: 'Cognitive', desc: 'Read a book for 15+ min.' },
    { id: 'puzzle', name: 'Crossword / Puzzle', cat: 'Cognitive', desc: 'Complete a crossword or Sudoku.' },
    { id: 'walk', name: 'Daily Walk', cat: 'Physical', desc: '20+ minute outdoor or indoor walk.' },
    { id: 'hydration', name: 'Hydration Tracking', cat: 'Health', desc: 'Drink 8 glasses of water.' },
];

const PLAN_CONFIG = {
    exercise: { label: 'Exercise Plan', icon: '🧠', color: '#2563eb', bg: '#eff6ff', library: BRAIN_EXERCISES },
    diet: { label: 'Diet Chart', icon: '🥗', color: '#059669', bg: '#ecfdf5', library: BRAIN_FOODS },
    task: { label: 'Clinical Tasks', icon: '📋', color: '#d97706', bg: '#fffbeb', library: CLINICAL_TASKS },
    prescription: { label: 'Prescription', icon: '💊', color: '#7c3aed', bg: '#f5f3ff', library: [] },
};

export default function DoctorSchedule() {
    const location = useLocation();

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [planType, setPlanType] = useState('exercise');
    const [selectedItems, setSelectedItems] = useState([]);   // ids of toggled exercise/diet/task items
    const [medications, setMedications] = useState([{ name: '', dose: '', freq: '' }]);
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);  // {type:'success'|'error', msg}
    const [existingPlans, setExistingPlans] = useState({});    // type → plan data from DB

    /* ── Load patient list ── */
    useEffect(() => {
        async function load() {
            try {
                const d = await getDoctorPatients();
                if (d.success) {
                    setPatients(d.patients);
                    const pId = new URLSearchParams(location.search).get('pId');
                    if (pId) setSelectedPatient(pId);
                }
            } finally { setLoading(false); }
        }
        load();
    }, [location.search]);

    /* ── When patient changes: load ALL their existing plans ── */
    useEffect(() => {
        if (!selectedPatient) { setExistingPlans({}); resetForm(); return; }
        async function fetchExisting() {
            try {
                const res = await apiFetch(`/clinical/plans/?patient_id=${selectedPatient}`);
                const data = await res.json();
                if (data.success && data.plans) {
                    // Doctor GET returns an array of plans
                    const map = {};
                    if (Array.isArray(data.plans)) {
                        data.plans.forEach(p => { map[p.type] = p; });
                    }
                    setExistingPlans(map);
                }
            } catch (_) { }
        }
        fetchExisting();
    }, [selectedPatient]);

    /* ── When planType changes: pre-fill form from existing plans ── */
    useEffect(() => {
        const existing = existingPlans[planType];
        if (existing) {
            setInstructions(existing.special_instructions || '');
            if (planType === 'prescription') {
                setMedications(existing.content?.medications?.length
                    ? existing.content.medications
                    : [{ name: '', dose: '', freq: '' }]);
                setSelectedItems([]);
            } else {
                // Collect unique item IDs from all days
                const allIds = new Set();
                Object.values(existing.content || {}).forEach(dayArr => {
                    if (Array.isArray(dayArr)) dayArr.forEach(id => allIds.add(id));
                });
                setSelectedItems([...allIds]);
                setMedications([{ name: '', dose: '', freq: '' }]);
            }
        } else {
            resetForm();
        }
    }, [planType, existingPlans]);

    function resetForm() {
        setSelectedItems([]);
        setMedications([{ name: '', dose: '', freq: '' }]);
        setInstructions('');
    }

    function toggleItem(id) {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    function showToast(type, msg) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    }

    async function handleSave() {
        if (!selectedPatient) { showToast('error', 'Please select a patient first.'); return; }

        let content = {};
        if (planType === 'prescription') {
            const valid = medications.filter(m => m.name.trim());
            if (!valid.length) { showToast('error', 'Add at least one medication with a name.'); return; }
            content = { medications: valid };
        } else {
            if (!selectedItems.length) { showToast('error', `Select at least one ${planType} item.`); return; }
            // Assign selected items to ALL 7 days
            DAYS.forEach(day => { content[day] = [...selectedItems]; });
        }

        setSaving(true);
        try {
            const res = await assignClinicalPlan({
                patient_id: selectedPatient,
                plan_type: planType,
                content: content,
                special_instructions: instructions,
            });
            if (res.success) {
                showToast('success', `✓ ${PLAN_CONFIG[planType].label} assigned successfully to patient!`);
                // Refresh existing plans map
                setExistingPlans(prev => ({
                    ...prev,
                    [planType]: { type: planType, content, special_instructions: instructions }
                }));
            } else {
                showToast('error', res.error || 'Failed to save. Make sure you are logged in as a doctor.');
            }
        } catch (e) {
            showToast('error', 'Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    const cfg = PLAN_CONFIG[planType];
    const library = cfg.library;
    const patientName = patients.find(p => String(p.id) === String(selectedPatient))?.name || '';

    if (loading) return (
        <DashboardLayout role="doctor" title="Assign Plans">
            <div className="flex items-center justify-center p-20">
                <div className="spin text-teal-600 text-3xl">⟳</div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="doctor" title="Assign Clinical Plans">

            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 24, right: 24, zIndex: 9999,
                    background: toast.type === 'success' ? '#059669' : '#dc2626',
                    color: '#fff', padding: '14px 24px', borderRadius: 12,
                    fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    maxWidth: 380, lineHeight: 1.5,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginBottom: 4 }}>
                    Assign Clinical Plans
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14 }}>
                    Select a patient, choose a plan type, pick items, then click <strong>Save Plan</strong>.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>

                {/* ── LEFT PANEL ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Patient Selector */}
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                            Step 1 — Select Patient
                        </p>
                        <select
                            style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, background: '#f9fafb' }}
                            value={selectedPatient}
                            onChange={e => { setSelectedPatient(e.target.value); resetForm(); }}
                        >
                            <option value="">— Choose a patient —</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {selectedPatient && (
                            <div style={{ marginTop: 10, padding: '8px 12px', background: '#ecfdf5', borderRadius: 8, fontSize: 12, color: '#059669', fontWeight: 700 }}>
                                ✓ Patient selected: {patientName}
                            </div>
                        )}
                        {patients.length === 0 && (
                            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
                                ⚠ No patients linked yet. Go to <a href="/doctor/patients" style={{ color: '#2563eb', fontWeight: 700 }}>Patient Registry</a> to add patients.
                            </p>
                        )}
                    </div>

                    {/* Plan Type */}
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                            Step 2 — Plan Type
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(PLAN_CONFIG).map(([type, c]) => {
                                const hasExisting = !!existingPlans[type];
                                const active = planType === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setPlanType(type)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 16px', borderRadius: 10, border: `2px solid ${active ? c.color : '#e5e7eb'}`,
                                            background: active ? c.bg : '#fff', cursor: 'pointer', transition: 'all .15s',
                                            fontWeight: 700, fontSize: 13, color: active ? c.color : '#374151',
                                        }}
                                    >
                                        <span>{c.icon} {c.label}</span>
                                        {hasExisting && (
                                            <span style={{ fontSize: 10, background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: 99 }}>ASSIGNED</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                            Special Instructions (optional)
                        </p>
                        <textarea
                            style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 13, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                            placeholder="e.g. Start with 5 minutes and increase gradually..."
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedPatient}
                        style={{
                            width: '100%', padding: '16px 0', borderRadius: 12,
                            background: saving || !selectedPatient ? '#9ca3af' : cfg.color,
                            color: '#fff', fontWeight: 900, fontSize: 15, border: 'none',
                            cursor: saving || !selectedPatient ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'all .2s',
                        }}
                    >
                        {saving ? '⏳ Saving...' : `💾 Save ${cfg.label} to Patient`}
                    </button>

                </div>

                {/* ── RIGHT PANEL ── */}
                <div>
                    {planType === 'prescription' ? (
                        /* ── PRESCRIPTION PAD ── */
                        <div style={{ background: '#fff', border: `2px dashed ${cfg.color}`, borderRadius: 20, padding: 28 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                                💊 Medical Prescription Pad
                            </h3>
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                                Add medications with dosage and frequency. These will appear in the patient's pharmacy section.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {medications.map((med, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 10, background: '#f9fafb', padding: '14px 16px', borderRadius: 12, border: '1px solid #e5e7eb', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 700, color: '#111827', outline: 'none', marginBottom: 6 }}
                                                placeholder="Medication Name (e.g. Donepezil)"
                                                value={med.name}
                                                onChange={e => { const m = [...medications]; m[idx].name = e.target.value; setMedications(m); }}
                                            />
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <input
                                                    style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#6b7280', outline: 'none', width: 90 }}
                                                    placeholder="Dosage (5mg)"
                                                    value={med.dose}
                                                    onChange={e => { const m = [...medications]; m[idx].dose = e.target.value; setMedications(m); }}
                                                />
                                                <span style={{ color: '#d1d5db' }}>|</span>
                                                <input
                                                    style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#6b7280', outline: 'none', flex: 1 }}
                                                    placeholder="Frequency (e.g. Once daily at night)"
                                                    value={med.freq}
                                                    onChange={e => { const m = [...medications]; m[idx].freq = e.target.value; setMedications(m); }}
                                                />
                                            </div>
                                        </div>
                                        {medications.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
                                            >×</button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setMedications([...medications, { name: '', dose: '', freq: '' }])}
                                    style={{ padding: '12px 0', border: `2px dashed ${cfg.color}`, borderRadius: 12, background: '#fff', color: cfg.color, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                >
                                    + Add Medication
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── EXERCISE / DIET / TASK SELECTOR ── */
                        <div>
                            {/* Info banner */}
                            <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}20`, borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: 13, color: cfg.color }}>
                                        Click items below to toggle them ON/OFF
                                    </p>
                                    <p style={{ fontSize: 12, color: '#6b7280' }}>
                                        Selected items will be assigned to <strong>all 7 days</strong> of the patient's weekly schedule.
                                        {selectedItems.length > 0 && <span style={{ color: cfg.color, fontWeight: 700 }}> ({selectedItems.length} selected)</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Item Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                                {library.map(item => {
                                    const active = selectedItems.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleItem(item.id)}
                                            style={{
                                                textAlign: 'left', padding: '16px 18px',
                                                borderRadius: 14, border: `2px solid ${active ? cfg.color : '#e5e7eb'}`,
                                                background: active ? cfg.bg : '#fff',
                                                cursor: 'pointer', transition: 'all .15s',
                                                boxShadow: active ? `0 4px 12px ${cfg.color}25` : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: active ? cfg.color : '#111827' }}>
                                                    {item.name}
                                                </span>
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: '50%',
                                                    border: `2px solid ${active ? cfg.color : '#d1d5db'}`,
                                                    background: active ? cfg.color : '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0, color: '#fff', fontSize: 12, fontWeight: 900,
                                                }}>
                                                    {active ? '✓' : ''}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{item.desc}</p>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: `${cfg.color}15`, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>
                                                    {item.cat}
                                                </span>
                                                {item.dur && (
                                                    <span style={{ fontSize: 10, color: '#9ca3af', padding: '2px 8px', background: '#f3f4f6', borderRadius: 99 }}>
                                                        ⏱ {item.dur}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Preview of what will be saved */}
                            {selectedItems.length > 0 && (
                                <div style={{ marginTop: 20, padding: '16px 20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Weekly Schedule Preview
                                    </p>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {DAYS.map(day => (
                                            <div key={day} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 11 }}>
                                                <span style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: 2 }}>{day.slice(0, 3)}</span>
                                                <span style={{ color: cfg.color, fontWeight: 600 }}>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                                        Selected: {selectedItems.map(id => library.find(x => x.id === id)?.name).join(', ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Existing assignment badge */}
                    {existingPlans[planType] && (
                        <div style={{ marginTop: 16, padding: '10px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, fontSize: 12, color: '#059669', fontWeight: 700 }}>
                            ✓ This patient already has a <strong>{cfg.label}</strong> assigned. Saving will update it.
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
}
