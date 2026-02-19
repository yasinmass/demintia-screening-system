// js/quiz.js
import { startReactionTimer, stopReactionTimer, getAverageReactionTime } from '../modules/reaction_time/reaction.js';
import { getFinalOutput } from '../modules/cognitive_scoring/scoring.js';

// Protocol Warning for ES6 Modules
if (window.location.protocol === 'file:') {
    console.warn("ES6 modules require a web server. If the quiz doesn't start, please use a local server (e.g., Live Server or 'npx serve').");
}

const quizContainer = document.getElementById('quiz-container');
const progressBar = document.getElementById('quiz-progress');

let currentStep = 0;
let domainCorrectCounts = {
    orientation: 0,
    memory: 0,
    executive: 0
};

// Dynamic Orientation Data
const now = new Date();
const currentYear = now.getFullYear().toString();
const currentMonth = now.toLocaleString('en-US', { month: 'long' });
const currentDate = now.getDate().toString();
const currentDay = now.toLocaleString('en-US', { weekday: 'long' });

function getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Autumn';
    return 'Winter';
}
const currentSeason = getSeason(now);

const questions = [
    // Orientation (5 questions)
    { q: "What is the current year?", opts: ['2024', '2025', '2026', '2027'], a: currentYear, domain: 'orientation' },
    { q: "Which month is it?", opts: ['January', 'February', 'March', 'April'], a: currentMonth, domain: 'orientation' },
    { q: "What is today's date?", opts: [currentDate, '15', '20', '25'].sort(() => Math.random() - 0.5), a: currentDate, domain: 'orientation' },
    { q: "What day of the week is it?", opts: ['Monday', 'Wednesday', 'Thursday', 'Friday'], a: currentDay, domain: 'orientation' },
    { q: "Which season is it currently?", opts: ['Spring', 'Summer', 'Autumn', 'Winter'], a: currentSeason, domain: 'orientation' },

    // Memory (5 questions - Recalling the 5 words)
    { q: "Memory Recall: Was 'Apple' one of the words shown?", opts: ['Yes', 'No'], a: 'Yes', domain: 'memory' },
    { q: "Memory Recall: Was 'Bike' one of the words shown?", opts: ['Yes', 'No'], a: 'No', domain: 'memory' },
    { q: "Memory Recall: Was 'Car' one of the words shown?", opts: ['Yes', 'No'], a: 'Yes', domain: 'memory' },
    { q: "Memory Recall: Was 'Tree' one of the words shown?", opts: ['Yes', 'No'], a: 'Yes', domain: 'memory' },
    { q: "Memory Recall: Was 'Pen' one of the words shown?", opts: ['Yes', 'No'], a: 'Yes', domain: 'memory' },

    // Executive Function (5 questions)
    { q: "Serial 7s: 100 minus 7 is ?", opts: ['93', '97', '83', '91'], a: '93', domain: 'executive' },
    { q: "Logical Step: If January is the 1st month, March is the...?", opts: ['2nd', '3rd', '4th', '5th'], a: '3rd', domain: 'executive' },
    { q: "Arithmetic: What is 12 multiplied by 3?", opts: ['32', '34', '36', '38'], a: '36', domain: 'executive' },
    { q: "Logic: All Roses are flowers. Some flowers fade. Do all Roses definitely fade?", opts: ['Yes', 'No', 'Maybe'], a: 'Maybe', domain: 'executive' },
    { q: "Pattern: 2, 4, 8, 16... What comes next?", opts: ['24', '30', '32', '64'], a: '32', domain: 'executive' }
];

function renderQuestion() {
    if (currentStep >= questions.length) {
        finish();
        return;
    }

    const q = questions[currentStep];
    progressBar.style.width = `${((currentStep + 1) / questions.length) * 100}%`;

    startReactionTimer();

    let html = `<div class="fade-in">
        <div class="mb-4 text-xs font-bold text-teal-600 uppercase tracking-widest">${q.domain} Assessment</div>
        <h3 class="text-2xl font-bold mb-8">${q.q}</h3>
        <div class="grid gap-4">`;

    q.opts.forEach(o => {
        html += `<button class="option-btn p-5 border-2 rounded-2xl text-xl font-bold hover:bg-teal-50 transition-colors" onclick="handleAnswer('${o}')">${o}</button>`;
    });

    quizContainer.innerHTML = html + `</div></div>`;
}

window.handleAnswer = (selectedAnswer) => {
    const q = questions[currentStep];
    stopReactionTimer();

    if (selectedAnswer === q.a) {
        domainCorrectCounts[q.domain]++;
    }

    currentStep++;
    renderQuestion();
};

function finish() {
    const avgRT = getAverageReactionTime();

    const finalScores = {
        orientation: domainCorrectCounts.orientation * 2,
        memory: domainCorrectCounts.memory * 2,
        executive: domainCorrectCounts.executive * 2
    };

    const finalResults = getFinalOutput(finalScores, avgRT);

    // Save to localStorage
    localStorage.setItem('assessment_results', JSON.stringify(finalResults));
    localStorage.setItem('quizScore', finalResults.total_score);
    localStorage.setItem('reaction_time', finalResults.average_reaction_time);

    quizContainer.innerHTML = `
        <div class="text-center fade-in">
            <h2 class="text-3xl font-bold mb-4">Assessment Completed</h2>
            <p class="text-gray-600 mb-8">Your cognitive profile has been updated.</p>
            <button onclick="window.location.href='result.html'" class="px-12 py-5 bg-teal-500 text-white font-bold rounded-2xl shadow-xl hover:bg-teal-600 transition-all">View In-Depth Results</button>
        </div>`;
}

const startBtn = document.getElementById('start-quiz-btn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        renderQuestion();
    });
}
