// js/result.js
async function loadResults() {
    const features = {
        pause_duration: parseFloat(localStorage.getItem('pause_duration') || '0'),
        speech_rate: parseFloat(localStorage.getItem('speech_rate') || '0'),
        word_count: parseInt(localStorage.getItem('word_count') || '0'),
        reaction_time: parseFloat(localStorage.getItem('reaction_time') || '0'),
        quiz_score: parseFloat(localStorage.getItem('quizScore') || '0')
    };

    document.getElementById('quiz-score-display').textContent = `${features.quiz_score}%`;
    document.getElementById('speech-rate-display').textContent = features.speech_rate;
    document.getElementById('reaction-time-display').textContent = `${features.reaction_time}s`;

    try {
        const response = await fetch("http://localhost:8000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(features)
        });

        const data = await response.json();
        displayRisk(data.risk_level, data.risk_probability);
    } catch (err) {
        console.error("AI Backend offline:", err);
        document.getElementById('risk-level-text').textContent = "Offline";
        document.getElementById('risk-description').textContent = "Could not connect to AI prediction service. Please ensure the Python backend is running.";
    }
}

function displayRisk(level, prob) {
    const card = document.getElementById('risk-card');
    const icon = document.getElementById('risk-icon');
    const text = document.getElementById('risk-level-text');
    const desc = document.getElementById('risk-description');
    const probDisp = document.getElementById('risk-prob-display');
    const summary = document.getElementById('final-index-summary');

    probDisp.textContent = `${(prob * 100).toFixed(1)}%`;
    text.textContent = `${level} Risk`;

    if (level === 'Low') {
        card.className = "mb-8 p-10 rounded-3xl transition-all duration-700 risk-low";
        icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 icon-bg-low text-white text-3xl font-bold";
        icon.textContent = "✔";
        desc.textContent = "Your biomarkers indicate a healthy cognitive state.";
        summary.textContent = "Combined analysis shows stable cognitive function with high speech coherence and strong quiz performance.";
    } else if (level === 'Moderate') {
        card.className = "mb-8 p-10 rounded-3xl transition-all duration-700 risk-moderate";
        icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 icon-bg-moderate text-white text-3xl font-bold";
        icon.textContent = "⚠";
        desc.textContent = "Potential cognitive drift detected. Monitor symptoms.";
        summary.textContent = "Minor variances in speech patterns or reaction times identified. Recommended to repeat test in 30 days.";
    } else {
        card.className = "mb-8 p-10 rounded-3xl transition-all duration-700 risk-high";
        icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 icon-bg-high text-white text-3xl font-bold";
        icon.textContent = "!";
        desc.textContent = "Significant variance detected. Professional consult advised.";
        summary.textContent = "High correlation between prolonged pauses and low cognitive orientation scores. Please consult a healthcare professional.";
    }
}

document.addEventListener('DOMContentLoaded', loadResults);
