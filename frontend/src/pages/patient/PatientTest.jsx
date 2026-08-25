import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { blobToWavBlob } from '../../utils/audioUtils';
import { apiFetch } from '../../utils/api';
import { t, getQuestions } from '../../utils/i18n';
import { getFinalOutput, startReactionTimer, stopReactionTimer, getAverageReactionTime, resetReactionTimer } from '../../utils/scoring';
import MOCATest from './MOCATest';

const CIRCUMFERENCE = 2 * Math.PI * 54;
const MAX_DURATION = 60;
const MIN_DURATION = 10;
const MEMORY_WORDS = ['Apple', 'Car', 'Tree', 'Book', 'Pen'];

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ step }) {
    const items = ['Voice Test', 'Questionnaire', 'Results'];
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            {items.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < items.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--gray-200)',
                            color: i <= step ? '#fff' : 'var(--gray-400)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 14, transition: 'all .3s'
                        }}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? 'var(--primary)' : 'var(--gray-400)', whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                    {i < items.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: i < step ? 'var(--success)' : 'var(--gray-200)', margin: '0 8px', marginBottom: 20, transition: 'background .3s' }} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Voice Recording Phase ─────────────────────────────────────────────────────
function VoicePhase({ onDone }) {
    const [showNotice, setShowNotice] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [statusText, setStatusText] = useState('Click the mic to begin recording');
    const [statusColor, setStatusColor] = useState('var(--gray-500)');
    const [nextEnabled, setNextEnabled] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const silenceStartRef = useRef(0);
    const totalSilenceRef = useRef(0);
    const recognitionRef = useRef(null);
    const wordCountRef = useRef(0);
    const secondsRef = useRef(0);
    const isRecordingRef = useRef(false);

    function updateTimer() {
        secondsRef.current++;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_DURATION) stopRecording();
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true; recognition.interimResults = true;
                recognition.onresult = (e) => {
                    let t = '';
                    for (let i = e.resultIndex; i < e.results.length; ++i) t += e.results[i][0].transcript;
                    wordCountRef.current = t.trim().split(/\s+/).filter(w => w.length > 0).length;
                };
                recognition.start();
                recognitionRef.current = recognition;
            }

            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512; source.connect(analyser);
            audioContextRef.current = audioContext;

            const dataArr = new Uint8Array(analyser.frequencyBinCount);
            const checkSilence = () => {
                if (!isRecordingRef.current) return;
                analyser.getByteFrequencyData(dataArr);
                const vol = dataArr.reduce((a, b) => a + b) / dataArr.length;
                if (vol < 3) { if (!silenceStartRef.current) silenceStartRef.current = Date.now(); }
                else { if (silenceStartRef.current) { const d = (Date.now() - silenceStartRef.current) / 1000; if (d > 0.5) totalSilenceRef.current += d; silenceStartRef.current = 0; } }
                requestAnimationFrame(checkSilence);
            };

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = async () => {
                const dur = secondsRef.current;
                sessionStorage.setItem('voice_biomarkers', JSON.stringify({
                    pause_duration: parseFloat(totalSilenceRef.current.toFixed(2)),
                    word_count: wordCountRef.current,
                    speech_rate: dur > 0 ? parseFloat((wordCountRef.current / (dur / 60)).toFixed(2)) : 0,
                    recording_duration: dur,
                }));

                if (dur >= MIN_DURATION) {
                    setAnalyzing(true);
                    setStatusText('Analyzing voice with AI model…');
                    try {
                        const raw = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
                        const wav = await blobToWavBlob(raw);
                        const form = new FormData();
                        form.append('audio', wav, 'recording.wav');
                        const res = await apiFetch('/audio/analyze/', { method: 'POST', body: form });
                        const ml = await res.json();

                        const speechRate = dur > 0 ? parseFloat((wordCountRef.current / (dur / 60)).toFixed(2)) : 0;
                        const pauseRatio = dur > 0 ? totalSilenceRef.current / dur : 1;
                        const words = wordCountRef.current;

                        // ── Real Voice Score calculation ────────────────────────────────
                        // Max 40 points: fluency (16) + content richness (12) + ML result (12)
                        // Fluency: ideal speech rate 100-160 wpm
                        let fluencyScore = 0;
                        if (speechRate >= 100 && speechRate <= 160) fluencyScore = 16;
                        else if (speechRate >= 70 && speechRate < 100) fluencyScore = 12;
                        else if (speechRate >= 50 && speechRate < 70) fluencyScore = 8;
                        else if (speechRate > 0) fluencyScore = 4;

                        // Pause penalty: high pause ratio means unclear speech
                        const pausePenalty = Math.min(8, Math.floor(pauseRatio * 16));
                        fluencyScore = Math.max(0, fluencyScore - pausePenalty);

                        // Content richness: how many unique words spoken
                        let contentScore = 0;
                        if (words >= 60) contentScore = 12;
                        else if (words >= 40) contentScore = 10;
                        else if (words >= 25) contentScore = 7;
                        else if (words >= 10) contentScore = 4;
                        else contentScore = 1;

                        // ML result: normal = 12 pts, borderline = 6, dementia = 0
                        let mlScore = 12;
                        if (ml.success) {
                            sessionStorage.setItem('ml_result', JSON.stringify({
                                ml_prediction: ml.ml_prediction,
                                ml_dementia_probability: ml.ml_dementia_probability,
                                ml_normal_probability: ml.ml_normal_probability,
                            }));
                            const dProb = ml.ml_dementia_probability || 0;
                            if (ml.ml_prediction === 'dementia') {
                                mlScore = dProb > 0.8 ? 0 : 4;
                            } else {
                                mlScore = dProb < 0.3 ? 12 : 8;
                            }
                            setStatusText(ml.ml_prediction === 'dementia' ? '⚠ Voice analysis indicates elevated markers' : '✔ Voice analysis complete — normal pattern');
                            setStatusColor(ml.ml_prediction === 'dementia' ? 'var(--warning)' : 'var(--success)');
                        }

                        const voiceScore = Math.min(40, fluencyScore + contentScore + mlScore);
                        sessionStorage.setItem('voice_score', String(voiceScore));

                    } catch { setStatusText('Voice saved. Proceeding to questionnaire.'); }
                    setAnalyzing(false);
                    setNextEnabled(true);
                } else {
                    setStatusText(`Too short! Please record at least ${MIN_DURATION} seconds.`);
                    setStatusColor('var(--danger)');
                }
                setIsRecording(false);
                isRecordingRef.current = false;
            };

            audioChunksRef.current = [];
            totalSilenceRef.current = 0; silenceStartRef.current = 0;
            wordCountRef.current = 0; secondsRef.current = 0; setSeconds(0);

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            isRecordingRef.current = true; setIsRecording(true);
            timerRef.current = setInterval(updateTimer, 1000);
            checkSilence();
            setStatusText('Recording… speak naturally about your day');
            setStatusColor('var(--primary)');
        } catch (err) {
            setStatusText('Microphone access denied or not available.');
            setStatusColor('var(--danger)');
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
        if (recognitionRef.current) recognitionRef.current.stop();
        if (audioContextRef.current) audioContextRef.current.close();
        clearInterval(timerRef.current);
        isRecordingRef.current = false; setIsRecording(false);
    }

    const strokeOffset = CIRCUMFERENCE - (seconds / MAX_DURATION * CIRCUMFERENCE);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (showNotice) return (
        <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>⚠️</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: 'var(--gray-800)' }}>Before You Begin</h3>
                <div style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
                    <p>• Find a <strong>quiet environment</strong> with minimal background noise</p>
                    <p>• Speak clearly and naturally for <strong>10–60 seconds</strong></p>
                    <p>• Describe your morning routine, a recent memory, or read the passage shown</p>
                    <p>• This voice recording helps our AI detect speech patterns</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowNotice(false)}>I'm Ready →</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 32, textAlign: 'center' }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Voice Analysis</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 28 }}>Speak naturally — our AI will analyze your speech patterns</p>

                {/* Circular mic */}
                <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
                    <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} width={140} height={140}>
                        <circle cx={70} cy={70} r={54} stroke="var(--gray-200)" strokeWidth={8} fill="transparent" />
                        <circle cx={70} cy={70} r={54} stroke={isRecording ? 'var(--danger)' : 'var(--primary)'} strokeWidth={8} fill="transparent"
                            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeOffset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }} />
                    </svg>
                    <button
                        className={`mic-btn ${isRecording ? 'recording' : ''} ${isRecording ? 'pulse-ring' : ''}`}
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                        onClick={() => isRecording ? stopRecording() : startRecording()}
                        disabled={analyzing}
                    >
                        {isRecording ? (
                            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <rect x={6} y={6} width={12} height={12} rx={2} fill="currentColor" stroke="none" />
                            </svg>
                        ) : (
                            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>
                </div>

                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }}>
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
                <p style={{ fontSize: 14, color: statusColor, fontWeight: 600, marginBottom: 24, minHeight: 20 }}>
                    {analyzing ? <span className="spin" style={{ display: 'inline-block' }}>⟳</span> : null} {statusText}
                </p>

                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 24, textAlign: 'left' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Suggested prompt:</p>
                    <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7, fontStyle: 'italic' }}>
                        "Tell me about what you did this morning — what you ate, where you went, and what you plan to do today."
                    </p>
                </div>

                <div className="flex gap-4">
                    <button 
                        style={{ backgroundColor: isRecording ? '#dc2626' : '#2563eb', color: '#ffffff' }}
                        className="flex-1 py-4 px-6 rounded-2xl font-extrabold text-base shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                        onClick={() => isRecording ? stopRecording() : startRecording()} 
                        disabled={analyzing}
                    >
                        {isRecording ? '⏹ Stop Recording' : '🎙 Start Recording'}
                    </button>
                    <button 
                        style={{ backgroundColor: nextEnabled ? '#059669' : '#e2e8f0', color: nextEnabled ? '#ffffff' : '#94a3b8' }}
                        className="flex-1 py-4 px-6 rounded-2xl font-extrabold text-base shadow-md transition-all active:scale-[0.98]"
                        disabled={!nextEnabled} 
                        onClick={onDone}
                    >
                        Continue to Next Test →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Quiz Phase ────────────────────────────────────────────────────────────────
function QuizPhase({ onDone }) {
    const [phase, setPhase] = useState('memory'); // memory | quiz | saving
    const [questions] = useState(() => getQuestions());
    const [step, setStep] = useState(0);
    const [domainCounts, setDomainCounts] = useState({ orientation: 0, memory: 0, executive: 0 });
    const [progress, setProgress] = useState(0);
    const [errMsg, setErrMsg] = useState('');

    function startQuiz() {
        setPhase('quiz');
        setProgress((1 / questions.length) * 100);
        resetReactionTimer();
        startReactionTimer();
    }

    function handleAnswer(opt) {
        stopReactionTimer();
        const q = questions[step];
        const nc = { ...domainCounts };
        if (opt === q.a) nc[q.domain] = (nc[q.domain] || 0) + 1;
        setDomainCounts(nc);
        const next = step + 1;
        setStep(next);
        if (next >= questions.length) { finish(nc); return; }
        setProgress(((next + 1) / questions.length) * 100);
        startReactionTimer();
    }

    async function finish(counts) {
        setPhase('saving');
        const avgRT = getAverageReactionTime();
        // 4 orientation questions (x2.5 = 10 max), 5 memory (x2 = 10 max), 5 executive (x2 = 10 max) -> Total 30
        const scores = { 
            orientation: Math.min(10, Math.round(counts.orientation * 2.5)), 
            memory: Math.min(10, counts.memory * 2), 
            executive: Math.min(10, counts.executive * 2) 
        };
        const finalResults = getFinalOutput(scores, avgRT);
        sessionStorage.setItem('mmse_score', String(finalResults.total_score));
        sessionStorage.setItem('mmse_exam_done', '1');

        let voiceBio = {}; let mlRes = {};
        try { voiceBio = JSON.parse(sessionStorage.getItem('voice_biomarkers') || '{}'); } catch { }
        try { mlRes = JSON.parse(sessionStorage.getItem('ml_result') || '{}'); } catch { }
        const payload = { ...finalResults, ...voiceBio, ...mlRes };

        try {
            const res = await apiFetch('/assessment/save/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (data.success) { 
                sessionStorage.removeItem('voice_biomarkers'); 
                sessionStorage.removeItem('ml_result'); 
                onDone(finalResults.total_score); 
            } else {
                throw new Error(data.error || 'Save failed');
            }
        } catch (e) { 
            setErrMsg(e.message); 
            setPhase('error'); 
        }
    }

    const q = questions[step];

    if (phase === 'memory') return (
        <div className="card shadow-lg border border-slate-200 rounded-3xl" style={{ maxWidth: 620, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 36, textAlign: 'center' }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>Memory Warm-Up</h3>
                <p style={{ fontSize: 15, color: '#64748b', marginBottom: 28 }}>
                    Please read and memorize these words carefully. You will be asked about them in the quiz:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
                    {MEMORY_WORDS.map(w => (
                        <span key={w} style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 14, padding: '14px 28px', fontWeight: 800, fontSize: 20, border: '2px solid #bfdbfe' }}>
                            {w}
                        </span>
                    ))}
                </div>
                <button 
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    className="w-full py-4 rounded-2xl font-extrabold text-base shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer" 
                    onClick={startQuiz}
                >
                    I Have Memorized Them — Start Questionnaire →
                </button>
            </div>
        </div>
    );

    if (phase === 'quiz') return (
        <div className="card shadow-lg border border-slate-200 rounded-3xl overflow-hidden" style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ height: 8, background: '#e2e8f0' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #2563eb, #0d9488)', width: `${progress}%`, transition: 'width .5s ease' }} />
            </div>
            <div className="card-body" style={{ padding: 36 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: 'capitalize' }}>
                        {q?.domain} Section
                    </span>
                    <span style={{ fontSize: 14, color: '#64748b', fontWeight: 700 }}>Question {step + 1} of {questions.length}</span>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 28, color: '#0f172a', lineHeight: 1.4 }}>{q?.q}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {q?.opts.map(opt => (
                        <button 
                            key={opt} 
                            onClick={() => handleAnswer(opt)}
                            style={{ 
                                padding: '16px 20px', 
                                border: '2px solid #cbd5e1', 
                                borderRadius: 14, 
                                background: '#ffffff', 
                                fontSize: 17, 
                                fontWeight: 700, 
                                cursor: 'pointer', 
                                textAlign: 'left', 
                                transition: 'all .15s', 
                                color: '#1e293b' 
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1d4ed8'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#1e293b'; }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    if (phase === 'saving') return (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 48, textAlign: 'center' }}>
                <div className="loader-ring" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Analyzing Your Results…</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Our AI is combining your voice patterns and quiz responses to generate a comprehensive assessment.</p>
            </div>
        </div>
    );

    if (phase === 'error') return (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: 'var(--danger)', marginBottom: 8 }}>Save Error</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Could not save to database. Make sure the Django server is running.</p>
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{errMsg}</p>
            </div>
        </div>
    );
}

// ── Result Phase ──────────────────────────────────────────────────────────────
function ResultPhase() {
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/assessment/latest/').then(r => r.json()).then(d => { if (d.success) setAssessment(d.assessment); }).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: 48 }}>
            <div className="loader-ring" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--gray-400)' }}>Finalizing results…</p>
        </div>
    );

    if (!assessment) return (
        <div className="card shadow-2xl border-0 p-20 text-center bg-white rounded-[40px]">
            <p style={{ color: 'var(--gray-500)' }}>Assessment summary not available.</p>
        </div>
    );

    const { total_score, ml_prediction, ml_dementia_probability, orientation_score, memory_score, executive_score, created_at } = assessment;

    const pct = Math.round((total_score / 30) * 100);
    const getClassification = () => {
        if (pct >= 85) return {
            text: 'No Dementia Detected',
            color: '#059669',
            icon: '✅',
            desc: 'Your cognitive health is excellent (above 85%). No significant markers detected at this time.',
            badge: 'NORMAL'
        };
        if (pct >= 40) return {
            text: 'Moderate Cognitive Concern',
            color: '#D97706',
            icon: '⚠️',
            desc: 'Moderate cognitive concerns detected (40-85%). We recommend a clinical follow-up for monitoring.',
            badge: 'MODERATE'
        };
        return {
            text: 'Significant Clinical Flag',
            color: '#DC2626',
            icon: '🚨',
            desc: 'Romba demtasis iruku doctgor poarunga (below 40%). Professional medical evaluation is urgently required.',
            badge: 'SEE DOCTOR'
        };
    };

    const c = getClassification();

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="card shadow-2xl border-0 bg-white overflow-hidden rounded-[40px] mb-8">
                <div style={{ background: `linear-gradient(135deg, ${c.color}, #000)` }} className="p-12 text-center text-white">
                    <div className="text-7xl mb-6">{c.icon}</div>
                    <div className="inline-block bg-white/20 px-5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">{c.badge}</div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{c.text}</h2>
                    <p className="text-lg font-serif italic text-white/70 max-w-lg mx-auto leading-relaxed mb-8">"{c.desc}"</p>

                    <div className="inline-flex items-baseline gap-4 bg-black/20 p-8 rounded-[32px] border border-white/5">
                        <span className="text-8xl font-black tracking-tighter">{pct}%</span>
                        <div className="text-left">
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Diagnostic Score</div>
                            <div className="text-xl font-black">{total_score}<span className="opacity-50 text-sm">/30</span></div>
                        </div>
                    </div>
                </div>

                <div className="p-12">
                    <div className="grid grid-cols-3 gap-6 mb-10">
                        {[
                            { label: 'Orientation', score: orientation_score, color: 'var(--primary)' },
                            { label: 'Memory', score: memory_score, color: 'var(--accent)' },
                            { label: 'Executive', score: executive_score, color: 'var(--teal)' },
                        ].map(s => (
                            <div key={s.label} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">{s.label}</div>
                                <div className="text-2xl font-black" style={{ color: s.color }}>{s.score}<span className="text-xs opacity-30 ml-1">/10</span></div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-2xl flex items-center gap-4 border border-emerald-100 mb-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">✓</div>
                        <p className="text-sm font-bold text-emerald-800">Your secure clinical report has been automatically synchronized with your medical portal.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="btn btn-primary py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-900/10" onClick={() => navigate('/patient/results')}>
                            View Technical Report →
                        </button>
                        <button className="btn bg-gray-100 hover:bg-gray-200 text-gray-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest" onClick={() => window.location.reload()}>
                            Take Another Test
                        </button>
                    </div>
                </div>
            </div>

            <button className="w-full text-center text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-gray-600 transition-all" onClick={() => navigate('/patient')}>
                Return to Dashboard
            </button>
        </div>
    );
}

// ── Exam Selection Hub ─────────────────────────────────────────────────────────
function ExamHub({ onStart }) {
    const voiceDone = !!sessionStorage.getItem('voice_exam_done');
    const mmseDone = !!sessionStorage.getItem('mmse_exam_done');
    const mocaDone = !!sessionStorage.getItem('moca_exam_done');
    
    const voiceScore = sessionStorage.getItem('voice_score') ? parseInt(sessionStorage.getItem('voice_score'), 10) : null;
    const mmseScore = sessionStorage.getItem('mmse_score') ? parseInt(sessionStorage.getItem('mmse_score'), 10) : null;
    const mocaScore = sessionStorage.getItem('moca_score') ? parseInt(sessionStorage.getItem('moca_score'), 10) : null;
    
    const completedCount = [voiceDone, mmseDone, mocaDone].filter(Boolean).length;
    
    // Calculate current cumulative score
    let cumulativeScore = 0;
    let maxPossible = 0;
    if (voiceDone && voiceScore !== null) { cumulativeScore += voiceScore; maxPossible += 40; }
    if (mmseDone && mmseScore !== null) { cumulativeScore += mmseScore; maxPossible += 30; }
    if (mocaDone && mocaScore !== null) { cumulativeScore += mocaScore; maxPossible += 30; }

    const exams = [
        {
            key: 'voice', icon: '🎙️', title: 'Voice Test', marks: 40,
            borderColor: '#2563EB', done: voiceDone,
            scoreText: voiceDone && voiceScore !== null ? `${voiceScore} / 40` : (voiceDone ? 'Completed' : null),
            desc: 'Record your voice for 10–60 seconds. AI analyzes pause patterns, speech rate, and vocal biomarkers.',
            steps: ['Find a quiet room', 'Press Start and speak naturally', 'Talk about your day or read the prompt'],
        },
        {
            key: 'mmse', icon: '🧠', title: 'MMSE Questionnaire', marks: 30,
            borderColor: '#0284c7', done: mmseDone,
            scoreText: mmseDone && mmseScore !== null ? `${mmseScore} / 30` : (mmseDone ? 'Completed' : null),
            desc: 'Answer questions about orientation, memory, and executive function. Multiple-choice, ~5 minutes.',
            steps: ['No preparation needed', 'Answer each question honestly', 'Results analyzed instantly'],
        },
        {
            key: 'moca', icon: '📋', title: 'MOCA Test', marks: 30,
            borderColor: '#0d9488', done: mocaDone,
            scoreText: mocaDone && mocaScore !== null ? `${mocaScore} / 30` : (mocaDone ? 'Completed' : null),
            desc: 'Montreal Cognitive Assessment: 10 interactive sections covering memory, attention, language, and more.',
            steps: ['Allow microphone access', 'Complete each section in order', 'Automatic evaluation'],
        },
    ];

    return (
        <div>
            <div className="page-header mb-6">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Cognitive Screening Tests</h2>
                <p className="text-slate-500 font-medium">Complete the 3 quick screening tasks to evaluate your overall cognitive score out of 100.</p>
            </div>

            {/* Progress / Summary Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 w-full">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-700">Screening Progress</span>
                        <span className="text-sm font-extrabold text-blue-600">{completedCount} of 3 completed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                            className="bg-blue-600 h-full transition-all duration-500 rounded-full" 
                            style={{ width: `${(completedCount / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {maxPossible > 0 && (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-5 py-2.5 rounded-2xl">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Score So Far:</span>
                        <span className="text-xl font-extrabold text-blue-900">{cumulativeScore} <span className="text-xs text-blue-600 font-bold">/ {maxPossible}</span></span>
                    </div>
                )}
            </div>

            {/* Test Cards */}
            <div className="space-y-4 mb-8">
                {exams.map(exam => (
                    <div 
                        key={exam.key} 
                        style={{ borderLeftColor: exam.borderColor, borderLeftWidth: '6px' }}
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <span className="text-2xl">{exam.icon}</span>
                                    <h3 className="text-lg font-extrabold text-slate-900">{exam.title}</h3>
                                    <span className="text-xs font-bold text-slate-400">({exam.marks} marks)</span>
                                    {exam.done && (
                                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-3 py-0.5 text-xs font-extrabold flex items-center gap-1">
                                            <span>✓</span>
                                            <span>{exam.scoreText || 'Completed'}</span>
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 font-medium mb-3">{exam.desc}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {exam.steps.map((s, i) => (
                                        <span key={i} className="text-xs bg-slate-100 text-slate-600 rounded-lg px-2.5 py-1 font-semibold">
                                            {i + 1}. {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                <button 
                                    style={{ backgroundColor: exam.borderColor, color: '#ffffff' }}
                                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                                    onClick={() => onStart(exam.key)}
                                >
                                    {exam.done ? '↻ Retake Test' : '▶ Start Test'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {completedCount === 3 && (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🎉</span>
                        <div>
                            <p className="font-extrabold text-emerald-900 text-base">All 3 Screening Tests Complete!</p>
                            <p className="text-sm text-emerald-700">Total Score: <strong>{cumulativeScore} / 100</strong>. View complete diagnostic report in My Reports.</p>
                        </div>
                    </div>
                    <a 
                        href="/patient/results" 
                        style={{ backgroundColor: '#059669', color: '#ffffff' }}
                        className="px-6 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-emerald-700 transition-all inline-block"
                    >
                        View Full Medical Report →
                    </a>
                </div>
            )}
        </div>
    );
}

// ── Main Patient Test Page ─────────────────────────────────────────────────────
export default function PatientTest() {
    const [mode, setMode] = useState('hub');

    function back() { setMode('hub'); }

    return (
        <DashboardLayout role="patient" title="AI Screening">
            <div className="fade-in" key={mode}>

                {mode === 'hub' && <ExamHub onStart={setMode} />}

                {mode === 'voice' && (
                    <div>
                        <div className="mb-4">
                            <button className="btn btn-secondary btn-sm" onClick={back}>← Back to Tests</button>
                        </div>
                        <div className="page-header mb-6">
                            <h2>Voice Biomarker Test <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)' }}>— 40 marks</span></h2>
                            <p>Speak naturally for 10–60 seconds about your day or read the suggested prompt.</p>
                        </div>
                        <VoicePhase onDone={() => { sessionStorage.setItem('voice_exam_done', '1'); back(); }} />
                    </div>
                )}

                {mode === 'mmse' && (
                    <div>
                        <div className="mb-4">
                            <button className="btn btn-secondary btn-sm" onClick={back}>← Back to Tests</button>
                        </div>
                        <div className="page-header mb-6">
                            <h2>MMSE Questionnaire <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)' }}>— 30 marks</span></h2>
                            <p>Answer questions about orientation, memory, and executive function.</p>
                        </div>
                        <QuizPhase onDone={(score) => { 
                            sessionStorage.setItem('mmse_exam_done', '1'); 
                            if (score !== undefined) sessionStorage.setItem('mmse_score', String(score));
                            back(); 
                        }} />
                    </div>
                )}

                {mode === 'moca' && (
                    <div>
                        <div className="mb-4">
                            <button className="btn btn-secondary btn-sm" onClick={back}>← Back to Tests</button>
                        </div>
                        <MOCATest embedded onComplete={(score) => {
                            sessionStorage.setItem('moca_exam_done', '1');
                            sessionStorage.setItem('moca_score', String(score));
                            back();
                        }} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
