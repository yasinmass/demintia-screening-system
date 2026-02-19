// js/quiz.js
const quizContainer = document.getElementById('quiz-container');
const progressBar = document.getElementById('quiz-progress');
let currentStep = 0; let score = 0; let reactionTimes = []; let questionStartTime;

const questions = [
    { q: "What is today's date?", type: 'date' },
    { q: "What is 7 + 5?", opts: ['11', '12', '13', '15'], a: '12' },
    { q: "Memory Check: 3 words?", opts: ['Apple, Car, Tree', 'Apple, Bike, Tree', 'Banana, Bus, Tree'], a: 'Apple, Car, Tree' },
    { q: "Pattern: Circle, Square, Triangle, Circle...", opts: ['Square', 'Circle', 'Triangle'], a: 'Square' }
];

function renderQuestion() {
    const q = questions[currentStep];
    progressBar.style.width = `${((currentStep + 1) / questions.length) * 100}%`;
    questionStartTime = Date.now();

    let html = `<div class="fade-in"><h3 class="text-2xl font-bold mb-8">${q.q}</h3><div class="grid gap-4">`;
    if (q.type === 'date') {
        const d = new Date().toLocaleDateString();
        [d, '1/1/2026', '12/12/2025'].sort().forEach(o => {
            html += `<button class="option-btn p-5 border-2 rounded-2xl text-xl font-bold" onclick="handleAnswer('${o}', '${d}')">${o}</button>`;
        });
    } else {
        q.opts.forEach(o => {
            html += `<button class="option-btn p-5 border-2 rounded-2xl text-xl font-bold" onclick="handleAnswer('${o}', '${q.a}')">${o}</button>`;
        });
    }
    quizContainer.innerHTML = html + `</div></div>`;
}

window.handleAnswer = (sel, cor) => {
    reactionTimes.push((Date.now() - questionStartTime) / 1000);
    if (sel === cor) score += 25;
    currentStep++;
    if (currentStep < questions.length) renderQuestion();
    else finish();
};

function finish() {
    const avgReaction = reactionTimes.reduce((a, b) => a + b) / reactionTimes.length;
    localStorage.setItem('quizScore', score);
    localStorage.setItem('reaction_time', avgReaction.toFixed(2));
    quizContainer.innerHTML = `<div class="text-center fade-in"><h2 class="text-3xl font-bold mb-8">Completed</h2><button onclick="window.location.href='result.html'" class="px-12 py-5 bg-teal-500 text-white font-bold rounded-2xl">Analyze AI Results</button></div>`;
}

document.getElementById('start-quiz-btn').addEventListener('click', renderQuestion);
