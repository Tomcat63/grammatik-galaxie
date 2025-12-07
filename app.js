// ===== State Management =====
const state = {
    allQuestions: null,
    currentLevel: null,
    currentCategory: null,
    currentQuestionSet: [],
    currentQuestionIndex: 0,
    score: 0,
    totalPoints: 0,
    streak: 0,
    achievements: [],
    soundEnabled: true,
    selectedAnswer: null,
    showingResult: false
};

// ===== DOM Elements =====
const elements = {
    loading: document.getElementById('loading'),
    levelScreen: document.getElementById('level-screen'),
    categoryScreen: document.getElementById('category-screen'),
    questionScreen: document.getElementById('question-screen'),

    // Home screen elements
    totalPointsDisplay: document.getElementById('total-points'),
    totalPointsStat: document.getElementById('total-points-stat'),
    levelIcon: document.getElementById('level-icon'),
    levelName: document.getElementById('level-name'),
    soundToggle: document.getElementById('sound-toggle'),
    achievementsContainer: document.getElementById('achievements-container'),
    achievementsList: document.getElementById('achievements-list'),
    streakContainer: document.getElementById('streak-container'),
    streakText: document.getElementById('streak-text'),
    correctAnswersDisplay: document.getElementById('correct-answers'),
    achievementsCount: document.getElementById('achievements-count'),
    replayButton: document.getElementById('replay-button'),
    categoryButtons: document.querySelectorAll('[data-category]'),

    // Question screen elements
    celebration: document.getElementById('celebration'),
    backButton: document.getElementById('back-button'),
    soundToggleQuiz: document.getElementById('sound-toggle-quiz'),
    soundIcon: document.getElementById('sound-icon'),
    pointsDisplay: document.getElementById('points-display'),
    progressBar: document.getElementById('progress-bar'),
    currentQuestionNum: document.getElementById('current-question-num'),
    totalQuestionsNum: document.getElementById('total-questions-num'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    resultCard: document.getElementById('result-card'),
    resultEmoji: document.getElementById('result-emoji'),
    resultTitle: document.getElementById('result-title'),
    resultExplanation: document.getElementById('result-explanation'),
    resultPoints: document.getElementById('result-points'),
    nextButton: document.getElementById('next-button')
};

// ===== Initialization =====
async function init() {
    loadStateFromLocalStorage();
    initializeApp();
}

function initializeApp() {
    // Show level screen first (if not already playing)
    if (elements.loading) elements.loading.style.display = 'none';
    showScreen('level-screen');
    updateHomeScreen();
    setupEventListeners();
}

// ===== Level Selection =====
window.selectLevel = function (level) {
    state.currentLevel = level;

    // Select questions based on level
    if (level === 'beginner') {
        state.allQuestions = window.QUESTIONS_BEGINNER;
    } else if (level === 'intermediate') {
        state.allQuestions = window.QUESTIONS_INTERMEDIATE;
    } else if (level === 'advanced') {
        state.allQuestions = window.QUESTIONS_ADVANCED;
    } else {
        // Fallback to beginner if something is wrong
        state.allQuestions = window.QUESTIONS_BEGINNER;
    }

    // Show category screen
    showScreen('category-screen');
};

function showScreen(screenId) {
    // Hide all screens
    if (elements.levelScreen) elements.levelScreen.style.display = 'none';
    if (elements.categoryScreen) elements.categoryScreen.style.display = 'none';
    if (elements.questionScreen) elements.questionScreen.style.display = 'none';
    if (elements.homeScreen) elements.homeScreen.style.display = 'none'; // Legacy support

    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) screen.style.display = 'block';
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Sound toggle (home)
    if (elements.soundToggle) {
        elements.soundToggle.addEventListener('click', toggleSound);
    }

    // Category selection
    if (elements.categoryButtons) {
        elements.categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                startCategory(category);
            });
        });
    }

    // Replay button
    if (elements.replayButton) {
        elements.replayButton.addEventListener('click', replay);
    }

    // Back button - now goes back to category screen
    if (elements.backButton) {
        elements.backButton.addEventListener('click', goHome);
    }

    // Sound toggle (quiz)
    if (elements.soundToggleQuiz) {
        elements.soundToggleQuiz.addEventListener('click', toggleSound);
    }

    // Next button
    if (elements.nextButton) {
        elements.nextButton.addEventListener('click', nextQuestion);
    }
}

// ===== Sound Functions =====
function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    updateSoundUI();
    saveStateToLocalStorage();
}

function updateSoundUI() {
    if (state.soundEnabled) {
        elements.soundToggle.classList.add('active');
        elements.soundToggle.querySelector('.toggle-text').textContent = 'An';
        elements.soundToggleQuiz.classList.remove('muted');
        elements.soundIcon.textContent = '🔊';
    } else {
        elements.soundToggle.classList.remove('active');
        elements.soundToggle.querySelector('.toggle-text').textContent = 'Aus';
        elements.soundToggleQuiz.classList.add('muted');
        elements.soundIcon.textContent = '🔇';
    }
}

function playSound(type) {
    if (!state.soundEnabled) return;

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        if (type === 'correct') {
            // Happy success sound: C-E-G chord
            const notes = [523.25, 659.25, 783.99]; // C, E, G in Hz
            notes.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                const startTime = audioContext.currentTime + i * 0.1;
                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.3);
            });
        } else {
            // Gentle "try again" sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 200;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    } catch (error) {
        console.warn('Web Audio API nicht verfügbar:', error);
    }
}

// ===== Level System =====
function getLevel() {
    const points = state.totalPoints;

    if (points < 100) return { name: 'Anfänger', icon: '🌱' };
    if (points < 300) return { name: 'Lerner', icon: '🌿' };
    if (points < 600) return { name: 'Profi', icon: '🌳' };
    if (points < 1000) return { name: 'Experte', icon: '🏆' };
    return { name: 'Meister', icon: '👑' };
}

// ===== Question Management =====
function getRandomQuestions(category, count = 10) {
    const questions = state.allQuestions[category];
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function startCategory(category) {
    state.currentCategory = category;

    // Ensure questions are loaded
    if (!state.allQuestions) {
        state.allQuestions = window.QUESTIONS_BEGINNER;
    }

    // Check if category exists
    if (!state.allQuestions[category] || state.allQuestions[category].length === 0) {
        alert("Diese Kategorie ist in diesem Level noch nicht verfügbar! 🚧");
        return;
    }

    state.currentQuestionSet = getRandomQuestions(category);
    state.currentQuestionIndex = 0;
    state.selectedAnswer = null;
    state.showingResult = false;

    // Switch to question screen
    showScreen('question-screen');

    // Update UI
    updateQuestionScreen();
}

function nextQuestion() {
    if (state.currentQuestionIndex < state.currentQuestionSet.length - 1) {
        state.currentQuestionIndex++;
        state.selectedAnswer = null;
        state.showingResult = false;
        updateQuestionScreen();
    } else {
        // Finished all questions, go home
        goHome();
    }
}

function goHome() {
    state.currentCategory = null;
    state.currentQuestionIndex = 0;
    state.selectedAnswer = null;
    state.showingResult = false;

    // Go back to category screen
    showScreen('category-screen');

    updateHomeScreen();
}

function replay() {
    state.currentCategory = null;
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.selectedAnswer = null;
    state.showingResult = false;
    state.streak = 0;

    saveStateToLocalStorage();
    // Go to level selection or category? Let's go to level selection for replay to allow change
    showScreen('level-screen');
    updateHomeScreen();
}

// ===== Home Screen Updates =====
function updateHomeScreen() {
    // Update points
    elements.totalPointsDisplay.textContent = state.totalPoints;
    elements.totalPointsStat.textContent = state.totalPoints;

    // Update level
    const level = getLevel();
    elements.levelIcon.textContent = level.icon;
    elements.levelName.textContent = level.name;

    // Update stats
    elements.correctAnswersDisplay.textContent = state.score;
    elements.achievementsCount.textContent = state.achievements.length;

    // Update achievements display
    if (state.achievements.length > 0) {
        elements.achievementsContainer.style.display = 'block';
        elements.achievementsList.innerHTML = state.achievements
            .map(achievement => `<span class="achievement-badge">${achievement}</span>`)
            .join('');
    } else {
        elements.achievementsContainer.style.display = 'none';
    }

    // Update streak display
    if (state.streak > 0) {
        elements.streakContainer.style.display = 'block';
        elements.streakText.textContent = `${state.streak}x Serie! +${state.streak * 5} Bonuspunkte`;
    } else {
        elements.streakContainer.style.display = 'none';
    }

    // Update sound UI
    updateSoundUI();
}

// ===== LocalStorage =====
function saveStateToLocalStorage() {
    const dataToSave = {
        totalPoints: state.totalPoints,
        score: state.score,
        achievements: state.achievements,
        soundEnabled: state.soundEnabled,
        streak: state.streak
    };

    try {
        localStorage.setItem('grammatikGalaxieState', JSON.stringify(dataToSave));
    } catch (error) {
        console.warn('LocalStorage nicht verfügbar:', error);
    }
}

function loadStateFromLocalStorage() {
    try {
        const saved = localStorage.getItem('grammatikGalaxieState');
        if (saved) {
            const data = JSON.parse(saved);
            state.totalPoints = data.totalPoints || 0;
            state.score = data.score || 0;
            state.achievements = data.achievements || [];
            state.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
            state.streak = data.streak || 0;
        }
    } catch (error) {
        console.warn('Fehler beim Laden des Spielstands:', error);
    }
}

// ===== Start App =====
init();
