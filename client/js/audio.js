// js/audio.js
let mediaRecorder; let audioChunks = []; let timerInterval;
let audioContext; let analyser; let silenceStart = 0; let totalSilence = 0;
let recognition; let transcript = ""; let wordCount = 0;
const maxDuration = 60; const minDuration = 10;
const recordBtn = document.getElementById('record-btn'); const nextBtn = document.getElementById('next-btn');
const elapsedTimeDisplay = document.getElementById('elapsed-time'); const progressRing = document.getElementById('progress-ring');
const micContainer = document.getElementById('mic-container'); const micIcon = document.getElementById('mic-icon'); const stopIcon = document.getElementById('stop-icon');
const circumference = 2 * Math.PI * 88; let isRecording = false; let secondsElapsed = 0;

function updateTimer() {
    secondsElapsed++;
    const minutes = Math.floor(secondsElapsed / 60); const seconds = secondsElapsed % 60;
    elapsedTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    progressRing.style.strokeDashoffset = circumference - (secondsElapsed / maxDuration * circumference);
    if (secondsElapsed >= maxDuration) stopRecording();
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // 1. Web Speech API for real word counting
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                let currentTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                transcript = currentTranscript;
                wordCount = transcript.trim().split(/\s+/).filter(w => w.length > 0).length;
            };
            recognition.start();
        }

        // 2. AudioContext for silence/pause detection
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const checkSilence = () => {
            if (!isRecording) return;
            analyser.getByteFrequencyData(data);
            const volume = data.reduce((a, b) => a + b) / data.length;

            if (volume < 3) {
                if (!silenceStart) silenceStart = Date.now();
            } else {
                if (silenceStart) {
                    const pauseDuration = (Date.now() - silenceStart) / 1000;
                    if (pauseDuration > 0.5) {
                        totalSilence += pauseDuration;
                    }
                    silenceStart = 0;
                }
            }
            requestAnimationFrame(checkSilence);
        };

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const duration = secondsElapsed;
            const finalWordCount = wordCount;
            const speechRate = duration > 0 ? (finalWordCount / (duration / 60)).toFixed(2) : 0;

            localStorage.setItem('pause_duration', totalSilence.toFixed(2));
            localStorage.setItem('word_count', finalWordCount);
            localStorage.setItem('speech_rate', speechRate);
            localStorage.setItem('recordingDuration', duration);

            console.log(`Results: Words: ${finalWordCount}, Pauses: ${totalSilence.toFixed(2)}s, Rate: ${speechRate} WPM`);

            if (duration >= minDuration) {
                nextBtn.disabled = false;
                nextBtn.classList.replace('bg-gray-100', 'bg-teal-500');
                nextBtn.classList.replace('text-gray-400', 'text-white');
            }
            micContainer.classList.remove('pulse-animation');
            micIcon.classList.remove('hidden'); stopIcon.classList.add('hidden');
        };

        audioChunks = []; totalSilence = 0; silenceStart = 0; transcript = ""; wordCount = 0;
        mediaRecorder.start(); isRecording = true; secondsElapsed = 0;
        timerInterval = setInterval(updateTimer, 1000);
        checkSilence();

        recordBtn.textContent = 'Stop Recording';
        micContainer.classList.add('pulse-animation');
        micIcon.classList.add('hidden'); stopIcon.classList.remove('hidden');
    } catch (err) {
        console.error("Mic access error:", err);
        const st = document.getElementById('status-text');
        if (st) {
            st.textContent = 'Mic denied or not found';
            st.classList.add('text-red-500');
        }
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    if (recognition) recognition.stop();
    if (audioContext) audioContext.close();
    clearInterval(timerInterval); isRecording = false;
}

recordBtn.addEventListener('click', () => isRecording ? stopRecording() : startRecording());
nextBtn.addEventListener('click', () => window.location.href = 'quiz.html');
