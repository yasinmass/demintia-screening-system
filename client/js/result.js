// js/result.js

function loadResults() {
    try {
        const resultsData = localStorage.getItem('assessment_results');
        if (!resultsData) {
            console.warn("No assessment data found. Redirecting to quiz...");
            // Non-blocking redirect if on the same origin
            if (window.location.protocol !== 'file:') {
                // window.location.href = 'quiz.html';
            }
            return;
        }

        const assessment = JSON.parse(resultsData);

        // Update UI elements with basic checks
        updateElementText('orientation-score', `${assessment.orientation_score}/10`);
        updateElementText('memory-score', `${assessment.memory_score}/10`);
        updateElementText('executive-score', `${assessment.executive_score}/10`);
        updateElementText('total-score-display', `${assessment.total_score}/30`);
        updateElementText('reaction-time-display', `${assessment.average_reaction_time}s`);

        displayRisk(assessment.final_risk_level);

        // Log for debugging
        console.log("Assessment results loaded successfully:", assessment);
    } catch (error) {
        console.error("Error loading assessment results:", error);
        document.getElementById('risk-level-text').textContent = "Error Loading Data";
    }
}

function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function displayRisk(level) {
    const card = document.getElementById('risk-card');
    const icon = document.getElementById('risk-icon');
    const text = document.getElementById('risk-level-text');
    const desc = document.getElementById('risk-description');
    const summary = document.getElementById('final-index-summary');

    if (!text) return;

    text.textContent = `${level} Risk`;

    if (level === 'Low') {
        card.className = "mb-8 p-10 rounded-3xl transition-all duration-700 bg-teal-50 border-2 border-teal-200";
        icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-teal-500 text-white text-3xl font-bold";
        icon.textContent = "✔";
        desc.textContent = "Excellent! Your orientation, memory, and executive functions are performing at optimal levels.";
        summary.textContent = "Cognitive biomarkers show strong retention and processing speed. No immediate follow-up required.";
    } else if (level === 'Moderate') {
        card.className = "mb-8 p-10 rounded-3xl transition-all duration-700 bg-yellow-50 border-2 border-yellow-200";
        icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-yellow-500 text-white text-3xl font-bold";
        icon.textContent = "⚠";
        desc.textContent = "Moderate cognitive drift detected. We suggest monitoring your metrics over the next few weeks.";
        summary.textContent = "Variations in memory recall or reaction times were identified. Consider consulting a health professional if symptoms persist.";
    } else {
        card.className = "mb-8 p-10 rounded-3xl transition-all duration-700 bg-red-50 border-2 border-red-200";
        icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-500 text-white text-3xl font-bold";
        icon.textContent = "!";
        desc.textContent = "Significant variance identified. A professional clinical consultation is advised.";
        summary.textContent = "Significant deviations in core cognitive domains or slowed processing speeds have been recorded.";
    }
}

document.addEventListener('DOMContentLoaded', loadResults);
