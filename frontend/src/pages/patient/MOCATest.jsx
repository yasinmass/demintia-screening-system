import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiFetch } from '../../utils/api';

// -- SVG Icons ---------------------------------------------------------------
function CheckIcon({ size = 16, color = '#059669' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function CrossIcon({ size = 16, color = '#dc2626' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

// -- Helpers -----------------------------------------------------------------
function SectionHeader({ num, title, marks }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{num}</div>
            <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-800)', margin: 0 }}>{title}</h3>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{marks} marks</span>
            </div>
        </div>
    );
}

function ScoreBadge({ score, max }) {
    const pct = max > 0 ? score / max : 0;
    const color = pct >= 0.8 ? 'var(--success)' : pct >= 0.4 ? 'var(--warning)' : 'var(--danger)';
    return <span style={{ background: color, color: '#fff', borderRadius: 20, padding: '4px 12px', fontWeight: 800, fontSize: 13 }}>{score}/{max}</span>;
}

// -- ANIMAL IMAGE BANK -------------------------------------------------------
const ANIMAL_IMAGES = [
    { url: '/assets/moca/lion.png', answer: 'lion', hints: ['lion', 'big cat', 'panthera leo'] },
    { url: '/assets/moca/rhino.png', answer: 'rhinoceros', hints: ['rhino', 'rhinoceros', 'rhinocheros'] },
    { url: '/assets/moca/camel.png', answer: 'camel', hints: ['camel', 'dromedary', 'bactrian'] },
];

// -- SECTION 1: Visuospatial / Trail Making ----------------------------------
function VisuospatialSection({ onScore }) {
    const [selected, setSelected] = useState([]);
    const [done, setDone] = useState(false);
    const correctOrder = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'];
    const nodes = [
        { id: '1', x: 70, y: 200 }, { id: 'A', x: 170, y: 80 }, { id: '2', x: 290, y: 100 },
        { id: 'B', x: 210, y: 200 }, { id: '3', x: 330, y: 230 }, { id: 'C', x: 230, y: 320 },
        { id: '4', x: 110, y: 320 }, { id: 'D', x: 60, y: 310 }, { id: '5', x: 160, y: 380 }, { id: 'E', x: 290, y: 370 },
    ];
    const getNode = id => nodes.find(n => n.id === id);

    function handleClick(id) {
        if (done) return;
        if (selected.includes(id)) return;
        const next = [...selected, id];
        setSelected(next);
        if (next.length === correctOrder.length) {
            setDone(true);
            const correct = next.every((v, i) => v === correctOrder[i]);
            onScore(correct ? 3 : next.filter((v, i) => v === correctOrder[i]).length >= 7 ? 2 : next.filter((v, i) => v === correctOrder[i]).length >= 4 ? 1 : 0);
        }
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={1} title="Visuospatial / Trail Making" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12 }}>
                    Connect the dots in the correct alternating order:
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                    {['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'].map((node, i, arr) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                background: 'var(--primary-pale)', color: 'var(--primary)',
                                padding: '4px 10px', borderRadius: 6, fontWeight: 800, fontSize: 14
                            }}>{node}</span>
                            {i < arr.length - 1 && <span style={{ color: 'var(--gray-300)', fontWeight: 800 }}>→</span>}
                        </div>
                    ))}
                </div>
                <div style={{ position: 'relative', width: 400, height: 430, border: '1px solid var(--gray-200)', borderRadius: 8, margin: '0 auto', background: 'var(--gray-50)' }}>
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {selected.slice(0, -1).map((id, i) => {
                            const a = getNode(id), b = getNode(selected[i + 1]);
                            return b ? <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--primary)" strokeWidth={2} /> : null;
                        })}
                    </svg>
                    {nodes.map(n => (
                        <button key={n.id} onClick={() => handleClick(n.id)}
                            style={{
                                position: 'absolute', left: n.x - 20, top: n.y - 20,
                                width: 40, height: 40, borderRadius: '50%',
                                border: selected.includes(n.id) ? '2px solid var(--primary)' : '2px solid var(--gray-400)',
                                background: selected.includes(n.id) ? 'var(--primary)' : '#fff',
                                color: selected.includes(n.id) ? '#fff' : 'var(--gray-700)',
                                fontWeight: 800, fontSize: 13, cursor: done ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{n.id}</button>
                    ))}
                </div>
                {done && <p style={{ textAlign: 'center', marginTop: 12, color: 'var(--success)', fontWeight: 700 }}>Pattern complete! Moving to next section...</p>}
                {!done && <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--gray-400)' }}>Selected: {selected.join(' → ') || 'none'}</p>}
            </div>
        </div>
    );
}

// -- SECTION 2: Naming -------------------------------------------------------
function NamingSection({ onScore }) {
    const [answers, setAnswers] = useState(['', '', '']);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [evalResults, setEvalResults] = useState([]);

    function levenshtein(a, b) {
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
            }
        }
        return matrix[a.length][b.length];
    }

    function checkAnswer(ans, animalRef) {
        const a = ans.toLowerCase().trim();
        if (!a) return false;
        if (animalRef.hints.some(h => a.includes(h) || h.includes(a))) return true;
        const main = animalRef.answer;
        const dist = levenshtein(a, main);
        return dist <= Math.max(1, Math.floor(main.length * 0.3));
    }

    function submit() {
        const newAnswers = answers.map((ans, i) => {
            const correct = checkAnswer(ans, ANIMAL_IMAGES[i]);
            return {
                userAnswer: ans,
                correct,
                expected: ANIMAL_IMAGES[i].answer,
                score: correct ? 1 : 0
            };
        });

        const totalScore = newAnswers.reduce((sum, curr) => sum + curr.score, 0);
        setEvalResults(newAnswers);
        setScore(totalScore);
        setSubmitted(true);
        onScore(totalScore);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={2} title="Naming — Identify the Animals" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Look at each picture and type the name of the animal:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                    {ANIMAL_IMAGES.map((item, i) => (
                        <div key={i} style={{ border: '1px solid var(--gray-200)', borderRadius: 10, padding: 12, textAlign: 'center', background: 'var(--gray-50)' }}>
                            <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                <img src={item.url} alt={`Animal ${i + 1}`}
                                    style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }}
                                    onError={e => {
                                        e.target.onerror = null;
                                        e.target.parentElement.innerHTML = `<span style="font-size:48px">${i === 0 ? '🦁' : i === 1 ? '🦏' : '🐪'}</span>`;
                                    }} />
                            </div>
                            <input
                                className="form-control"
                                placeholder={`Animal ${i + 1} name...`}
                                value={answers[i]}
                                onChange={e => {
                                    const n = [...answers];
                                    n[i] = e.target.value;
                                    setAnswers(n);
                                }}
                                disabled={submitted}
                                style={{ textAlign: 'center', fontWeight: 600 }}
                            />
                        </div>
                    ))}
                </div>

                {!submitted ? (
                    <button className="btn btn-primary" style={{ width: '100%', minHeight: 48, fontSize: 15 }} onClick={submit}
                        disabled={answers.every(a => !a.trim())}>
                        Submit Naming Answers
                    </button>
                ) : (
                    <div style={{ padding: 16, background: 'var(--primary-light)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Evaluation Results</span>
                            <ScoreBadge score={score} max={3} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {evalResults.map((res, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                    {res.correct ? <CheckIcon /> : <CrossIcon />}
                                    <span>Animal {i + 1}: <strong>{res.userAnswer || '(no answer)'}</strong></span>
                                    {!res.correct && <span style={{ color: 'var(--gray-500)' }}>(Expected: {res.expected})</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// -- SECTION 3: Memory (Immediate Recall) ------------------------------------
const MOCA_WORDS = ['FACE', 'VELVET', 'CHURCH', 'DAISY', 'RED'];

function MemorySection({ onScore, onWordsReady }) {
    const [step, setStep] = useState(0);
    const [t1Inputs, setT1] = useState(['', '', '', '', '']);
    const [t2Inputs, setT2] = useState(['', '', '', '', '']);

    useEffect(() => {
        onWordsReady && onWordsReady(MOCA_WORDS);
    }, []);

    function submitTrials() {
        setStep(3);
        onScore(3);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={3} title="Memory — Word Registration" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Read and memorize these 5 words carefully. You will be asked to recall them at the end of the test.
                </p>

                {step === 0 && (
                    <div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', margin: '24px 0' }}>
                            {MOCA_WORDS.map((w, i) => (
                                <span key={i} style={{
                                    background: 'var(--primary)', color: '#fff',
                                    padding: '12px 20px', borderRadius: 10, fontWeight: 900,
                                    fontSize: 18, letterSpacing: '0.05em'
                                }}>{w}</span>
                            ))}
                        </div>
                        <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 13, marginBottom: 16 }}>
                            Take your time to memorize all 5 words.
                        </p>
                        <button className="btn btn-primary" style={{ width: '100%', minHeight: 48, fontSize: 15 }} onClick={() => setStep(1)}>
                            I Have Memorized Them → Practice Recall
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <p style={{ fontWeight: 700, marginBottom: 12 }}>Practice Trial 1: Type as many words as you remember</p>
                        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                            {MOCA_WORDS.map((_, i) => (
                                <input key={i} className="form-control" placeholder={`Word ${i + 1}`}
                                    value={t1Inputs[i]} onChange={e => {
                                        const n = [...t1Inputs]; n[i] = e.target.value; setT1(n);
                                    }} />
                            ))}
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', minHeight: 48, fontSize: 15 }} onClick={() => setStep(2)}>
                            Next Practice Trial →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <p style={{ fontWeight: 700, marginBottom: 12 }}>Practice Trial 2: One more time to solidify memory</p>
                        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                            {MOCA_WORDS.map((_, i) => (
                                <input key={i} className="form-control" placeholder={`Word ${i + 1}`}
                                    value={t2Inputs[i]} onChange={e => {
                                        const n = [...t2Inputs]; n[i] = e.target.value; setT2(n);
                                    }} />
                            ))}
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', minHeight: 48, fontSize: 15 }} onClick={submitTrials}>
                            Complete Memory Phase →
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ padding: 16, background: 'var(--success-light)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <CheckIcon />
                            <p style={{ fontWeight: 700, color: 'var(--success)', margin: 0 }}>Words Registered Successfully!</p>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0 }}>
                            A delayed recall timer has started. You will be asked to recall these words in the final section.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// -- SECTION 4: Attention 1 — Digit Sequences --------------------------------
const CORRECT_FWD = '21854';
const CORRECT_BWD = '247'; // reverse of 7-4-2

function Attention1Section({ onScore }) {
    const [fwd, setFwd] = useState('');
    const [bwd, setBwd] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [fwdCorrect, setFwdCorrect] = useState(false);
    const [bwdCorrect, setBwdCorrect] = useState(false);

    function submit() {
        const cleanFwd = fwd.replace(/\D/g, '');
        const cleanBwd = bwd.replace(/\D/g, '');
        const isFwd = cleanFwd === CORRECT_FWD;
        const isBwd = cleanBwd === CORRECT_BWD;
        const s = (isFwd ? 1.5 : 0) + (isBwd ? 1.5 : 0);
        setFwdCorrect(isFwd);
        setBwdCorrect(isBwd);
        setScore(Math.round(s));
        setSubmitted(true);
        onScore(Math.round(s));
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={4} title="Attention — Digit Sequences" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Follow the instructions for forward and backward digit recall:
                </p>

                <div style={{ background: 'var(--primary-pale)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 4 }}>Part 1: Forward Sequence</p>
                    <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 10 }}>Read these numbers once: <strong style={{ letterSpacing: '0.15em', fontSize: 15 }}>2 - 1 - 8 - 5 - 4</strong></p>
                    <input className="form-control" value={fwd} onChange={e => setFwd(e.target.value)} placeholder="Type the numbers in order (e.g. 2 1 8 5 4)..." disabled={submitted} />
                </div>

                <div style={{ background: 'var(--primary-pale)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 4 }}>Part 2: Backward Sequence</p>
                    <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 10 }}>Read these numbers: <strong style={{ letterSpacing: '0.15em', fontSize: 15 }}>7 - 4 - 2</strong> (Type them in reverse order)</p>
                    <input className="form-control" value={bwd} onChange={e => setBwd(e.target.value)} placeholder="Type in reverse (e.g. 2 4 7)..." disabled={submitted} />
                </div>

                <button className="btn btn-primary" style={{ width: '100%', minHeight: 48, fontSize: 15 }} onClick={submit} disabled={submitted || (!fwd && !bwd)}>
                    Submit Digit Sequences
                </button>

                {submitted && (
                    <div style={{ marginTop: 12, padding: 14, background: 'var(--primary-light)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontWeight: 700, fontSize: 14 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: fwdCorrect ? '#059669' : '#dc2626' }}>
                                    {fwdCorrect ? <CheckIcon /> : <CrossIcon />} Forward Recall
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: bwdCorrect ? '#059669' : '#dc2626' }}>
                                    {bwdCorrect ? <CheckIcon /> : <CrossIcon />} Backward Recall
                                </span>
                            </div>
                            <ScoreBadge score={score} max={3} />
                        </div>
                        {!fwdCorrect && <p style={{ fontSize: 12, color: '#dc2626', margin: '2px 0' }}>Forward: the correct sequence was 2-1-8-5-4.</p>}
                        {!bwdCorrect && <p style={{ fontSize: 12, color: '#dc2626', margin: '2px 0' }}>Backward: reverse of 7-4-2 is 2-4-7.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

// -- SECTION 5: Attention 2 — Tap on A (CPT Vigilance) -----------------------
const LETTER_SEQ = 'FBACMNAAAJKLBAFAKDEAAAJAMOFAAB'.split('');

function Attention2Section({ onScore }) {
    const [idx, setIdx] = useState(-1);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [currentLetter, setCurrentLetter] = useState('');
    const [finalScore, setFinalScore] = useState(null);
    const [stats, setStats] = useState(null);
    const [tapFeedback, setTapFeedback] = useState(null); // 'correct' | 'wrong' | null
    const timerRef = useRef(null);
    const feedbackTimerRef = useRef(null);
    const idxRef = useRef(-1);
    const tapsRef = useRef([]);

    const speak = useCallback(letter => {
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(letter);
            u.rate = 0.9; window.speechSynthesis.speak(u);
        }
    }, []);

    function start() {
        tapsRef.current = [];
        setTapFeedback(null);
        setRunning(true); setIdx(0); idxRef.current = 0;
        timerRef.current = setInterval(() => {
            const i = idxRef.current;
            if (i >= LETTER_SEQ.length) { clearInterval(timerRef.current); finish(); return; }
            setCurrentLetter(LETTER_SEQ[i]);
            speak(LETTER_SEQ[i]);
            setIdx(i + 1); idxRef.current = i + 1;
        }, 1500);
    }

    function handleTap() {
        if (!running) return;
        const letter = LETTER_SEQ[idxRef.current - 1] || '';
        const correct = letter === 'A';
        const t = { letter, correct };
        tapsRef.current = [...tapsRef.current, t];
        setTapFeedback(correct ? 'correct' : 'wrong');
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => setTapFeedback(null), 600);
    }

    function finish() {
        setRunning(false); setDone(true);
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        const correctTaps = tapsRef.current.filter(t => t.correct).length;
        const wrongTaps = tapsRef.current.filter(t => !t.correct).length;
        const totalAs = LETTER_SEQ.filter(l => l === 'A').length;
        const missed = Math.max(0, totalAs - correctTaps);
        const errors = wrongTaps + missed;
        const s = errors === 0 ? 3 : errors <= 1 ? 2 : errors <= 3 ? 1 : 0;
        setFinalScore(s);
        setStats({ correctTaps, wrongTaps, totalAs, missed, errors });
        onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={5} title="Attention — Vigilance (Tap on 'A')" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Letters will appear and be read aloud. <strong>Tap the button every time you see or hear the letter &quot;A&quot;</strong>. Do not tap for other letters.
                </p>

                {!running && !done && (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <p style={{ color: 'var(--gray-600)', marginBottom: 16 }}>30 letters will be presented at 1.5-second intervals.</p>
                        <button className="btn btn-primary btn-lg" onClick={start}>Start Vigilance Task</button>
                    </div>
                )}

                {running && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{
                            width: 120, height: 120, borderRadius: 16, margin: '0 auto 24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 54, fontWeight: 900,
                            background: currentLetter === 'A' ? '#eff6ff' : '#f8fafc',
                            color: currentLetter === 'A' ? 'var(--primary)' : '#1e293b',
                            border: `3px solid ${currentLetter === 'A' ? 'var(--primary)' : '#cbd5e1'}`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                            {currentLetter || '...'}
                        </div>

                        <p style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 16 }}>Letter {idx} of {LETTER_SEQ.length}</p>

                        <button
                            onClick={handleTap}
                            style={{
                                padding: '18px 48px', fontSize: 18, fontWeight: 900,
                                borderRadius: 14, border: 'none', cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: tapFeedback === 'correct' ? '#10b981' : tapFeedback === 'wrong' ? '#ef4444' : 'var(--primary)',
                                color: '#fff',
                                transform: tapFeedback ? 'scale(0.96)' : 'scale(1)',
                                boxShadow: tapFeedback ? '0 0 20px rgba(16,185,129,0.5)' : '0 4px 14px rgba(0,0,0,0.15)'
                            }}
                        >
                            {tapFeedback === 'correct' ? 'HIT! (A Detected)' : tapFeedback === 'wrong' ? 'MISSED (Not an A)' : '👆 TAP NOW FOR "A"'}
                        </button>
                    </div>
                )}

                {done && stats && (
                    <div style={{ padding: 16, background: 'var(--primary-light)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Vigilance Task Results</span>
                            <ScoreBadge score={finalScore} max={3} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13 }}>
                            <div>Correct Hits: <strong>{stats.correctTaps} / {stats.totalAs}</strong></div>
                            <div>False Alarms (Wrong taps): <strong>{stats.wrongTaps}</strong></div>
                            <div>Missed &apos;A&apos;s: <strong>{stats.missed}</strong></div>
                            <div>Total Errors: <strong>{stats.errors}</strong></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// -- SECTION 6: Attention 3 — Serial Subtraction (Bug 1 Fix) ------------------
const SERIAL7_ANSWERS = [93, 86, 79, 72, 65];

function Attention3Section({ onScore }) {
    const [inputs, setInputs] = useState(['', '', '', '', '']);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [current, setCurrent] = useState(100);
    const [step, setStep] = useState(0);

    function handleInput(val) {
        const n = parseInt(val, 10);
        if (isNaN(n)) return;
        const newInputs = [...inputs]; newInputs[step] = val; setInputs(newInputs);
        const next = step + 1;
        if (next >= 5) { submit(newInputs); return; }
        setStep(next); setCurrent(SERIAL7_ANSWERS[step]);
    }

    function submit(finalInputs) {
        const correct = finalInputs.filter((v, i) => parseInt(v, 10) === SERIAL7_ANSWERS[i]).length;
        const s = correct >= 4 ? 3 : correct >= 2 ? 2 : correct >= 1 ? 1 : 0;
        setScore(s); setSubmitted(true); onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={6} title="Attention — Serial Subtraction" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Start at <strong>100</strong> and keep subtracting 7 at each step. Type your answer and press Enter.
                </p>
                {!submitted && (
                    <>
                        <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary)', textAlign: 'center', marginBottom: 16 }}>{current}</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-500)' }}>- 7 =</span>
                            <input className="form-control" type="number" placeholder="Your answer" style={{ fontSize: 20, fontWeight: 700, maxWidth: 160, textAlign: 'center' }}
                                key={step}
                                onKeyDown={e => e.key === 'Enter' && e.target.value && handleInput(e.target.value)}
                                autoFocus />
                        </div>
                        <p style={{ marginTop: 12, color: 'var(--gray-400)', fontSize: 13, textAlign: 'center' }}>Step {step + 1} of 5 — press Enter after each answer</p>
                    </>
                )}
                {submitted && (
                    <div style={{ padding: 16, background: 'var(--primary-light)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700 }}>Subtraction Answers: {inputs.join(', ')}</span>
                            <ScoreBadge score={score} max={3} />
                        </div>
                        <p style={{ color: 'var(--gray-600)', margin: 0, fontSize: 13 }}>Standard series: 100 → 93 → 86 → 79 → 72 → 65</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// -- SECTION 7: Language Fluency ---------------------------------------------
function LanguageSection({ onScore }) {
    const [timeLeft, setTimeLeft] = useState(60);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [words, setWords] = useState([]);
    const [score, setScore] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [textInput, setTextInput] = useState('');
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const wordsRef = useRef([]);

    function processWords(transcript) {
        const raw = transcript.toLowerCase()
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1);

        const fWords = raw.filter(w => w.startsWith('f'));
        const unique = Array.from(new Set([...wordsRef.current, ...fWords]));
        wordsRef.current = unique;
        setWords(unique);
    }

    function addManualWord() {
        if (!textInput.trim()) return;
        const w = textInput.toLowerCase().trim();
        if (w.startsWith('f') && !wordsRef.current.includes(w)) {
            const next = [...wordsRef.current, w];
            wordsRef.current = next;
            setWords(next);
        }
        setTextInput('');
    }

    function start() {
        wordsRef.current = [];
        setWords([]);
        setRunning(true);
        setTimeLeft(60);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            try {
                const rec = new SpeechRecognition();
                rec.continuous = true;
                rec.interimResults = true;
                rec.lang = 'en-US';
                rec.onresult = e => {
                    let transcript = '';
                    for (let i = 0; i < e.results.length; i++) {
                        transcript += e.results[i][0].transcript + ' ';
                    }
                    processWords(transcript);
                };
                rec.onerror = () => setIsListening(false);
                rec.start();
                recognitionRef.current = rec;
                setIsListening(true);
            } catch {
                // Speech recognition error handling
            }
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    finishLanguage();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    function finishLanguage() {
        setRunning(false);
        setDone(true);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }
        setIsListening(false);
        const count = wordsRef.current.length;
        const s = count >= 11 ? 3 : count >= 8 ? 2 : count >= 4 ? 1 : 0;
        setScore(s);
        onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={7} title="Language — Verbal Fluency ('F' Words)" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Name as many words as possible that begin with the letter <strong>&quot;F&quot;</strong> in 60 seconds (no proper nouns or numbers).
                </p>

                {!running && !done && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <button className="btn btn-primary btn-lg" onClick={start}>Start 60-Second Timer</button>
                    </div>
                )}

                {running && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '12px 16px', background: 'var(--primary-pale)', borderRadius: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>Time Remaining: {timeLeft}s</span>
                            {isListening && <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>● Microphone Active</span>}
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                            <input className="form-control" placeholder="Or type words starting with F..." value={textInput}
                                onChange={e => setTextInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addManualWord()} />
                            <button className="btn btn-secondary" onClick={addManualWord}>Add Word</button>
                        </div>

                        <div style={{ minHeight: 60, padding: 12, border: '1px dashed var(--gray-300)', borderRadius: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {words.map((w, i) => (
                                <span key={i} style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                                    {w}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {done && (
                    <div style={{ padding: 16, background: 'var(--primary-light)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Words Logged: {words.length}</span>
                            <ScoreBadge score={score} max={3} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {words.map((w, i) => (
                                <span key={i} style={{ background: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12, border: '1px solid var(--gray-200)' }}>{w}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// -- SECTION 8: Abstraction / Similarity (Bug 2 Fix) --------------------------
const ABSTRACT_QUESTIONS = [
    {
        q: 'What do a train and a bicycle have in common?',
        keywords: [
            'transport', 'transportation', 'vehicle', 'vehicles', 'travel',
            'move', 'movement', 'wheel', 'wheels', 'ride', 'riding',
            'go', 'carry', 'motion', 'mode', 'locomotion', 'commute',
            'passenger', 'journey', 'transit'
        ]
    },
    {
        q: 'What do a watch and a ruler have in common?',
        keywords: [
            'measure', 'measurement', 'measuring', 'tool', 'tools',
            'numeric', 'number', 'numbers', 'count', 'counting',
            'instrument', 'gauge', 'quantify', 'scale', 'precision',
            'unit', 'units', 'mark', 'marks', 'time', 'length'
        ]
    },
];

function matchAbstraction(answer, keywords) {
    const a = answer.trim().toLowerCase();
    if (!a) return null;
    return keywords.find(k => a.includes(k) || k.includes(a)) || null;
}

function AbstractionSection({ onScore }) {
    const [qIdx] = useState(() => Math.floor(Math.random() * ABSTRACT_QUESTIONS.length));
    const q = ABSTRACT_QUESTIONS[qIdx];
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [matchedKeyword, setMatchedKeyword] = useState(null);

    function submit() {
        const matched = matchAbstraction(answer, q.keywords);
        const s = matched ? 3 : 0;
        setMatchedKeyword(matched);
        setScore(s);
        setSubmitted(true);
        onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={8} title="Abstraction — Similarity" marks={3} />
                <div style={{ background: 'var(--primary-pale)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', margin: 0 }}>{q.q}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input className="form-control" value={answer} onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer..." disabled={submitted}
                        onKeyDown={e => e.key === 'Enter' && !submitted && answer.trim() && submit()} />
                    <button className="btn btn-primary" onClick={submit} disabled={submitted || !answer.trim()}>Submit</button>
                </div>
                {submitted && (
                    <div style={{ marginTop: 12, padding: 14, background: score > 0 ? 'var(--success-light)' : '#fef2f2', borderRadius: 8, border: `1px solid ${score > 0 ? 'var(--success-pale)' : '#fecaca'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {score > 0 ? <CheckIcon /> : <CrossIcon />}
                                <span style={{ fontWeight: 600, color: score > 0 ? '#065f46' : '#991b1b' }}>
                                    {score > 0
                                        ? `Correct! "${matchedKeyword}" relates them logically.`
                                        : 'Not quite. Think about what category or purpose connects them.'}
                                </span>
                            </div>
                            <ScoreBadge score={score} max={3} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// -- SECTION 9: Orientation --------------------------------------------------
function OrientationSection({ onScore }) {
    const now = new Date();
    const dateNum = String(now.getDate());
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const dayOfWeekNum = String(now.getDay() === 0 ? 7 : now.getDay());
    const monthName = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][now.getMonth()];
    const monthNum = String(now.getMonth() + 1);
    const yearStr = String(now.getFullYear());

    const fields = [
        {
            label: "Today's Date (day number)",
            check: a => a === dateNum || a.startsWith(dateNum + '/') || a.startsWith(dateNum + '-') || a.includes('/' + dateNum + '/')
        },
        {
            label: 'Day of Week',
            check: a => a === dayName || a.startsWith(dayName.slice(0, 3)) || a === dayOfWeekNum
        },
        {
            label: 'Month',
            check: a => a === monthName || a.startsWith(monthName.slice(0, 3)) || a === monthNum || a === monthNum.padStart(2, '0')
        },
        {
            label: 'Year',
            check: a => a === yearStr || a === yearStr.slice(-2)
        },
        {
            label: 'City / Location',
            check: a => a.length > 0
        },
    ];

    const [answers, setAnswers] = useState(Array(5).fill(''));
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [fieldResults, setFieldResults] = useState([]);

    function submit() {
        let correct = 0;
        const results = [];
        for (let i = 0; i < fields.length; i++) {
            const a = answers[i].toLowerCase().trim();
            const ok = a ? fields[i].check(a) : false;
            if (ok) correct++;
            results.push(ok);
        }
        const s = correct >= 5 ? 3 : correct >= 3 ? 2 : correct >= 1 ? 1 : 0;
        setFieldResults(results);
        setScore(s); setSubmitted(true); onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={9} title="Orientation" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Answer the following questions about the present time and place:
                </p>
                <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                    {fields.map((f, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', alignItems: 'center', gap: 12 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>{f.label}</label>
                            <input className="form-control" value={answers[i]}
                                onChange={e => {
                                    const n = [...answers]; n[i] = e.target.value; setAnswers(n);
                                }}
                                disabled={submitted} />
                            {submitted && (
                                <span>{fieldResults[i] ? <CheckIcon /> : <CrossIcon />}</span>
                            )}
                        </div>
                    ))}
                </div>
                {!submitted ? (
                    <button className="btn btn-primary" style={{ width: '100%', minHeight: 48, fontSize: 15 }} onClick={submit}>Submit Orientation</button>
                ) : (
                    <div style={{ padding: 14, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700 }}>Orientation complete</span>
                        <ScoreBadge score={score} max={3} />
                    </div>
                )}
            </div>
        </div>
    );
}

// -- SECTION 10: Delayed Recall ----------------------------------------------
function DelayedRecallSection({ onScore, timerReady }) {
    const [inputs, setInputs] = useState(Array(5).fill(''));
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    function submit() {
        const text = inputs.map(v => v.toLowerCase().trim()).filter(Boolean);
        const recalled = MOCA_WORDS.filter(w => text.includes(w.toLowerCase())).length;
        const s = recalled >= 5 ? 3 : recalled >= 3 ? 2 : recalled >= 1 ? 1 : 0;
        setScore(s); setSubmitted(true); onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={10} title="Delayed Recall — Memory Retrieval" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Recall the <strong>5 words</strong> you memorized at the start of the assessment:
                </p>

                {!submitted ? (
                    <>
                        <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                            {MOCA_WORDS.map((_, i) => (
                                <input key={i} className="form-control" placeholder={`Word ${i + 1}`}
                                    value={inputs[i]} onChange={e => {
                                        const n = [...inputs]; n[i] = e.target.value; setInputs(n);
                                    }} />
                            ))}
                        </div>
                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submit}>Submit Recall</button>
                    </>
                ) : (
                    <div style={{ padding: 16, background: 'var(--success-light)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <CheckIcon />
                            <span style={{ fontWeight: 700, color: 'var(--success)' }}>Recall entries submitted!</span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--success-pale)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Expected words: {MOCA_WORDS.join(', ')}</span>
                            <ScoreBadge score={score} max={3} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// -- Progress Steps ----------------------------------------------------------
const STEPS = ['Visuospatial', 'Naming', 'Memory', 'Digits', 'Vigilance', 'Serial 7', 'Language', 'Similarity', 'Orientation', 'Delayed Recall'];

function MOCASteps({ current }) {
    return (
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
            {STEPS.map((name, i) => (
                <div key={i} style={{
                    flex: 1, minWidth: 70, textAlign: 'center', padding: '6px 4px',
                    borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: i === current ? 'var(--primary)' : i < current ? '#10b981' : 'var(--gray-200)',
                    color: i <= current ? '#fff' : 'var(--gray-500)',
                    whiteSpace: 'nowrap'
                }}>{i + 1}. {name}</div>
            ))}
        </div>
    );
}

// -- Main MOCA Test Page -----------------------------------------------------
export default function MOCATest({ embedded = false, onComplete }) {
    const [section, setSection] = useState(0); // 0-9 = sections, 10 = results
    const [scores, setScores] = useState({
        visuospatial: null, naming: null, memory: null,
        attention1: null, attention2: null, attention3: null,
        language: null, abstraction: null, orientation: null, delayed_recall: null
    });
    const [memoryWords, setMemoryWords] = useState(null);
    const [delayedReady, setDelayedReady] = useState(false);
    const [delayTimer, setDelayTimer] = useState(30); // 30s timer for testing flow
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const delayIntervalRef = useRef(null);
    const answersRef = useRef({});

    const scoreKeys = ['visuospatial', 'naming', 'memory', 'attention1', 'attention2', 'attention3', 'language', 'abstraction', 'orientation', 'delayed_recall'];

    function recordScore(key, val) {
        setScores(prev => ({ ...prev, [key]: val }));
        answersRef.current[key] = val;
    }

    function advanceSection() {
        setSection(prev => prev + 1);
    }

    useEffect(() => {
        if (section >= 3 && !delayedReady && !delayIntervalRef.current) {
            delayIntervalRef.current = setInterval(() => {
                setDelayTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(delayIntervalRef.current);
                        setDelayedReady(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }, [section, delayedReady]);

    async function saveResults() {
        setSaving(true);
        const s = {
            visuospatial_score: scores.visuospatial ?? 0,
            naming_score: scores.naming ?? 0,
            memory_score: scores.memory ?? 0,
            attention1_score: scores.attention1 ?? 0,
            attention2_score: scores.attention2 ?? 0,
            attention3_score: scores.attention3 ?? 0,
            language_score: scores.language ?? 0,
            abstraction_score: scores.abstraction ?? 0,
            orientation_score: scores.orientation ?? 0,
            delayed_recall_score: scores.delayed_recall ?? 0,
            answers_json: answersRef.current,
        };
        try {
            const res = await apiFetch('/moca/save/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
            const data = await res.json();
            if (data.success) {
                const finalTotal = scoreKeys.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
                if (embedded && onComplete) {
                    onComplete(finalTotal);
                } else {
                    setSection(10);
                }
            } else {
                throw new Error(data.error || 'Save failed');
            }
        } catch (e) {
            setSaveError(e.message);
        }
        setSaving(false);
    }

    const total = scoreKeys.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
    const mins = Math.floor(delayTimer / 60), secs = delayTimer % 60;

    // Results Screen
    const pct = Math.round((total / 30) * 100);
    const classification = pct >= 85
        ? { label: 'Cognitive Status: Normal Range', bg: '#f0fdfa', border: '#b2f5ea', color: '#0f766e', icon: '✅', desc: 'Patient demonstrates normal cognitive functioning on the MOCA scale. No indicators of impairment found at this time.', badge: 'NORMAL' }
        : pct >= 45
            ? { label: 'Mild Cognitive Impairment (MCI)', bg: '#fffbeb', border: '#fef3c7', color: '#b45309', icon: '⚠️', desc: 'Potential mild cognitive impairment detected. Scores suggest inconsistencies in neuro-cognitive domains. Follow-up diagnostic recommended.', badge: 'MCI INDICATED' }
            : { label: 'Significant Cognitive Indicator', bg: '#fef2f2', border: '#fee2e2', color: '#b91c1c', icon: '🚨', desc: 'Significant neuro-cognitive deficits detected. Clinical intervention and formal neurological review strongly advised for diagnostic confirmation.', badge: 'CLINICAL FOLLOW-UP' };

    if (section === 10) {
        const resultsContent = (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ background: classification.bg, border: `2px solid ${classification.border}`, borderRadius: 16, padding: 28, marginBottom: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{classification.icon}</div>
                    <span style={{ background: classification.color, color: '#fff', padding: '4px 14px', borderRadius: 20, fontWeight: 900, fontSize: 11, letterSpacing: '0.1em' }}>
                        {classification.badge}
                    </span>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: classification.color, margin: '12px 0 6px' }}>{classification.label}</h2>
                    <p style={{ color: 'var(--gray-600)', fontSize: 14, maxWidth: 540, margin: '0 auto 16px', lineHeight: 1.6 }}>{classification.desc}</p>
                    <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--gray-900)' }}>
                        {total} <span style={{ fontSize: 20, color: 'var(--gray-400)', fontWeight: 600 }}>/ 30 marks ({pct}%)</span>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-body">
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 16 }}>Detailed Domain Breakdown</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {scoreKeys.map(k => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-100)' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color: 'var(--gray-700)' }}>{k.replace('_', ' ')}</span>
                                    <ScoreBadge score={scores[k] ?? 0} max={3} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button className="btn btn-outline btn-lg" onClick={() => window.location.href = '/patient/results'}>View All Results</button>
                    <button className="btn btn-primary btn-lg" onClick={() => window.print()}>📄 Download Report</button>
                </div>
            </div>
        );

        return embedded ? resultsContent : <DashboardLayout role="patient" title="MOCA Results">{resultsContent}</DashboardLayout>;
    }

    const sectionDone = key => scores[key] !== null;

    const testContent = (
        <div>
            <div className="page-header">
                <h2>Montreal Cognitive Assessment (MOCA)</h2>
                <p>Complete all 10 sections — 3 marks each — Total: 30 marks</p>
            </div>

            <MOCASteps current={section} />

            {section >= 3 && !delayedReady && (
                <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
                    <span style={{ fontWeight: 700, color: '#92400E' }}>Delayed Recall Timer: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} remaining</span>
                </div>
            )}

            {section === 0 && <VisuospatialSection onScore={s => { recordScore('visuospatial', s); setTimeout(advanceSection, 1500); }} />}

            {section === 1 && (<>
                <NamingSection onScore={s => recordScore('naming', s)} />
                {sectionDone('naming') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Next Section →</button>}
            </>)}

            {section === 2 && (<>
                <MemorySection onScore={s => recordScore('memory', s)} onWordsReady={w => setMemoryWords(w)} />
                {sectionDone('memory') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Next Section →</button>}
            </>)}

            {section === 3 && (<>
                <Attention1Section onScore={s => recordScore('attention1', s)} />
                {sectionDone('attention1') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Next Section →</button>}
            </>)}

            {section === 4 && (<>
                <Attention2Section onScore={s => recordScore('attention2', s)} />
                {sectionDone('attention2') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Next Section →</button>}
            </>)}

            {section === 5 && (<>
                <Attention3Section onScore={s => recordScore('attention3', s)} />
                {sectionDone('attention3') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Next Section →</button>}
            </>)}

            {section === 6 && (<>
                <LanguageSection onScore={s => recordScore('language', s)} />
                {sectionDone('language') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Next Section →</button>}
            </>)}

            {section === 7 && (<>
                <AbstractionSection onScore={s => recordScore('abstraction', s)} />
                {sectionDone('abstraction') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Next Section →</button>}
            </>)}

            {section === 8 && (<>
                <OrientationSection onScore={s => recordScore('orientation', s)} />
                {sectionDone('orientation') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Next: Delayed Recall →</button>}
            </>)}

            {section === 9 && (<>
                <DelayedRecallSection onScore={s => recordScore('delayed_recall', s)} timerReady={delayedReady} />
                {sectionDone('delayed_recall') && (
                    <div style={{ marginTop: 20 }}>
                        {saveError && <p style={{ color: 'var(--danger)', marginBottom: 8, fontWeight: 600 }}>{saveError}</p>}
                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={saveResults} disabled={saving}>
                            {saving ? 'Saving Results...' : 'Submit MOCA Test →'}
                        </button>
                    </div>
                )}
            </>)}
        </div>
    );

    return embedded ? testContent : <DashboardLayout role="patient" title="MOCA Test">{testContent}</DashboardLayout>;
}
