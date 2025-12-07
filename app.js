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
    showingResult: false,
    resultTimeout: null
};

// ===== DOM Elements =====
// ===== DOM Elements =====
let elements = {};

function initElements() {
    console.log("Initializing Elements...");
    elements = {
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
        backButton: document.getElementById('back-button'),
        soundToggleQuiz: document.getElementById('sound-toggle-quiz'),
        soundIcon: document.getElementById('sound-icon'),
        pointsDisplay: document.getElementById('points-display'),
        progressBar: document.getElementById('progress-bar'),
        currentQuestionNum: document.getElementById('current-question-num'),
        totalQuestionsNum: document.getElementById('total-questions-num'),

        // Critical Question Elements
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),

        // Result Elements
        celebration: document.getElementById('celebration'),
        resultCard: document.getElementById('result-card'),
        resultEmoji: document.getElementById('result-emoji'),
        resultTitle: document.getElementById('result-title'),
        resultExplanation: document.getElementById('result-explanation'),
        resultPoints: document.getElementById('result-points'),
        nextButton: document.getElementById('next-button')
    };

    // Debug check
    if (!elements.questionText) console.error("CRITICAL: question-text element not found!");
    if (!elements.optionsContainer) console.error("CRITICAL: options-container element not found!");
}

// ===== Level Locking Config =====
const LEVEL_THRESHOLDS = {
    beginner: 0,
    intermediate: 300,
    advanced: 1000
};

// Check if a level is unlocked
function isLevelUnlocked(level) {
    return state.totalPoints >= LEVEL_THRESHOLDS[level];
}

function updateLevelLocks() {
    const levels = ['beginner', 'intermediate', 'advanced'];

    levels.forEach(level => {
        const btn = document.getElementById(`btn-${level}`);
        const lock = document.getElementById(`lock-${level}`);

        if (btn) {
            if (isLevelUnlocked(level)) {
                btn.classList.remove('locked');
                btn.removeAttribute('disabled');
                if (lock) lock.style.display = 'none';
            } else {
                btn.classList.add('locked');
                btn.setAttribute('disabled', 'true');
                if (lock) lock.style.display = 'flex';
            }
        }
    });
}

function showUnlockToast(levelName) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'unlock-toast';
    toast.innerHTML = `
        <span style="font-size: 2rem;">🔓</span>
        <div>
            <div>Level freigeschaltet!</div>
            <div style="font-size: 0.9rem; font-weight: normal;">${levelName} ist jetzt verfügbar.</div>
        </div>
    `;

    container.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);

    // Play success sound if enabled
    if (state.soundEnabled) {
        // Simple success beep or existing sound
        const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'); // Example generic sound or reuse existing
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play failed", e));
    }
}


function initializeApp() {
    loadStateFromLocalStorage();
    initElements(); // Initialize elements here!

    // Show level screen first (if not already playing)
    if (elements.loading) elements.loading.style.display = 'none';

    // Ensure locks are correct on start
    updateLevelLocks();

    showScreen('level-screen');
    updateHomeScreen();
    setupEventListeners();
}

// ===== Level Selection =====
window.selectLevel = function (level) {
    try {
        if (!isLevelUnlocked(level)) {
            // Should not happen due to pointer-events:none, but as safety:
            alert(`🔒 Du brauchst ${LEVEL_THRESHOLDS[level]} Punkte für dieses Level!`);
            return;
        }

        state.currentLevel = level;

        // Select questions based on level
        if (level === 'beginner') {
            state.allQuestions = window.QUESTIONS_BEGINNER;
        } else if (level === 'intermediate') {
            state.allQuestions = window.QUESTIONS_INTERMEDIATE || {};
        } else if (level === 'advanced') {
            state.allQuestions = window.QUESTIONS_ADVANCED || {};
        } else {
            console.warn("Unknown level, defaulting to beginner");
            state.allQuestions = window.QUESTIONS_BEGINNER;
        }

        // Show category screen
        showScreen('category-screen');
    } catch (e) {
        console.error("Error in selectLevel:", e);
    }
};

function showScreen(screenId) {
    // Hide all screens by ID and Class
    const screens = ['level-screen', 'category-screen', 'question-screen', 'home-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
            el.classList.remove('active');
        }
    });

    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'block';
        screen.classList.add('active');

        // If showing level screen, update locks
        if (screenId === 'level-screen') {
            updateLevelLocks();
        }
    } else {
        console.error(`Screen ID ${screenId} not found!`);
        alert(`Fehler: Screen ${screenId} nicht gefunden.`);
    }
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

    // Reset button
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetProgress);
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
// ===== Question Management =====
function getRandomQuestions(category, count = 10) {
    const questions = state.allQuestions[category];
    if (!questions) return [];
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

window.startCategory = function (category) {
    console.log("Starting category:", category);
    try {
        state.currentCategory = category;

        // Ensure questions are loaded
        if (!state.allQuestions) {
            console.warn("state.allQuestions was null in startCategory");
            if (window.QUESTIONS_BEGINNER) {
                state.allQuestions = window.QUESTIONS_BEGINNER;
            }
        }

        // Check if category exists
        if (!state.allQuestions || !state.allQuestions[category]) {
            console.error(`Category '${category}' not found`);
            alert(`Fehler: Kategorie '${category}' nicht gefunden!`);
            return;
        }

        if (state.allQuestions[category].length === 0) {
            alert("Diese Kategorie ist in diesem Level noch nicht verfügbar! 🚧");
            return;
        }

        state.currentQuestionSet = getRandomQuestions(category, 500);
        if (!state.currentQuestionSet || state.currentQuestionSet.length === 0) {
            console.error("getRandomQuestions returned empty");
            return;
        }

        state.currentQuestionIndex = 0;
        state.selectedAnswer = null;
        state.showingResult = false;

        // Switch to question screen
        showScreen('question-screen');

        // Update UI
        updateQuestionScreen();
    } catch (e) {
        console.error("Error in startCategory:", e);
        alert("Ein Fehler ist aufgetreten: " + e.message);
    }
};

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


function updateQuestionScreen() {
    if (!state.currentQuestionSet || state.currentQuestionSet.length === 0) {
        console.error("currentQuestionSet is empty!");
        return;
    }
    const question = state.currentQuestionSet[state.currentQuestionIndex];
    console.log("Rendering question:", question);

    // Get elements directly to be safe
    const progressBar = document.getElementById('progress-bar');
    const currentQuestionNum = document.getElementById('current-question-num');
    const totalQuestionsNum = document.getElementById('total-questions-num');
    const pointsDisplay = document.getElementById('points-display');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const resultCard = document.getElementById('result-card');
    const nextButton = document.getElementById('next-button');

    // Update progress
    const progress = ((state.currentQuestionIndex + 1) / state.currentQuestionSet.length) * 100;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (currentQuestionNum) currentQuestionNum.textContent = state.currentQuestionIndex + 1;
    if (totalQuestionsNum) totalQuestionsNum.textContent = state.currentQuestionSet.length;

    // Update points display
    if (pointsDisplay) pointsDisplay.textContent = state.totalPoints;

    // Sync global header points
    const globalPoints = document.getElementById('total-points');
    if (globalPoints) globalPoints.textContent = state.totalPoints;

    // Update question text
    if (questionText) {
        questionText.textContent = question.question;
    } else {
        console.error("CRITICAL: question-text not found in updateQuestionScreen");
    }

    // Create option buttons
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = option;
            button.addEventListener('click', () => handleAnswer(index));
            optionsContainer.appendChild(button);
        });
    } else {
        console.error("CRITICAL: options-container not found in updateQuestionScreen");
    }

    // Hide result card and show next button
    if (resultCard) resultCard.style.display = 'none';
    if (nextButton) nextButton.style.display = 'block';
    state.showingResult = false;
}


function handleAnswer(selectedIndex) {
    if (state.showingResult) return;

    if (state.resultTimeout) {
        clearTimeout(state.resultTimeout);
        state.resultTimeout = null;
    }

    const question = state.currentQuestionSet[state.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctIndex;

    console.log("Answer handled:", selectedIndex, "Correct:", isCorrect);

    // Get elements directly
    const resultCard = document.getElementById('result-card');
    const resultEmoji = document.getElementById('result-emoji');
    const resultTitle = document.getElementById('result-title');
    const resultExplanation = document.getElementById('result-explanation');
    const resultPoints = document.getElementById('result-points');
    const nextButton = document.getElementById('next-button');
    const optionsContainer = document.getElementById('options-container');
    const celebration = document.getElementById('celebration');

    // Play sound
    playSound(isCorrect ? 'correct' : 'wrong');

    // Handle correct/incorrect logic
    if (isCorrect) {
        state.selectedAnswer = selectedIndex;
        state.showingResult = true;

        const points = 10 + (state.streak * 5);
        const oldPoints = state.totalPoints;
        state.score++;
        state.totalPoints += points;
        state.streak++;

        // Check for Level Unlocks
        if (oldPoints < 300 && state.totalPoints >= 300) {
            showUnlockToast('Fortgeschritten');
            updateLevelLocks(); // Unlock immediately in background
        }
        if (oldPoints < 1000 && state.totalPoints >= 1000) {
            showUnlockToast('Experte');
            updateLevelLocks();
        }

        saveState(); // Persist unlock status immediately

        // Sync UI immediately
        const pointsDisplay = document.getElementById('points-display');
        const globalPoints = document.getElementById('total-points');
        if (pointsDisplay) pointsDisplay.textContent = state.totalPoints;
        if (globalPoints) globalPoints.textContent = state.totalPoints;

        // Update options appearance - show correct answer
        if (optionsContainer) {
            const optionButtons = optionsContainer.querySelectorAll('.option-button');
            optionButtons.forEach((button, index) => {
                button.disabled = true;

                if (index === question.correctIndex) {
                    button.classList.add('correct');
                    button.textContent += ' ✓';
                } else {
                    button.classList.add('neutral');
                }
            });
        }

        // Show celebration
        if (celebration) {
            celebration.style.display = 'flex';
            setTimeout(() => {
                celebration.style.display = 'none';
            }, 1000);
        }

        // Check for achievements
        checkAchievements();

        // Show result
        if (resultCard) {
            resultCard.className = 'result-card correct';
            resultCard.style.display = 'block'; // Make sure it's visible!

            if (resultEmoji) resultEmoji.textContent = '🎉';
            if (resultTitle) resultTitle.textContent = 'Super! Das ist richtig!';
            if (resultExplanation) resultExplanation.textContent = question.explanation;
            if (resultPoints) resultPoints.textContent = `+${points} Punkte!${state.streak > 1 ? ` 🔥 ${state.streak}x Serie!` : ''}`;
        }

        // Update next button text and show it
        if (nextButton) {
            if (state.currentQuestionIndex < state.currentQuestionSet.length - 1) {
                nextButton.textContent = 'Weiter →';
            } else {
                nextButton.textContent = 'Fertig! 🎊';
            }
            nextButton.style.display = 'block';
        }

        // SAFETY: Ensure card is visible even if timeout tried to hide it
        if (resultCard) resultCard.style.display = 'block';

    } else {
        // Wrong answer - let user try again
        state.streak = 0;

        // Mark wrong answer as incorrect (but don't show correct answer)
        if (optionsContainer) {
            const optionButtons = optionsContainer.querySelectorAll('.option-button');
            if (optionButtons[selectedIndex]) {
                optionButtons[selectedIndex].classList.add('incorrect');
                optionButtons[selectedIndex].textContent += ' ✗';
                optionButtons[selectedIndex].disabled = true;
            }
        }

        // Random encouraging messages
        const encouragingMessages = [
            'Fast, Antoni! Versuch es nochmal! 💪',
            'Nicht ganz, aber du schaffst das! 🌟',
            'Probier eine andere Antwort, Antoni! 🎯',
            'Fast richtig! Welche Antwort könnte es sein? 🤔',
            'Noch ein Versuch, Antoni! Du bist nah dran! ⭐'
        ];

        const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

        // Show encouraging message (without showing correct answer)
        if (resultCard) {
            resultCard.className = 'result-card incorrect';
            resultCard.style.display = 'block';

            if (resultEmoji) resultEmoji.textContent = '💡';
            if (resultTitle) resultTitle.textContent = randomMessage;
            if (resultExplanation) resultExplanation.textContent = 'Überlege nochmal in Ruhe...';
            if (resultPoints) resultPoints.textContent = '';

            // Hide next button - user must try again
            if (nextButton) nextButton.style.display = 'none';

            // Show result card briefly, then hide it so they can retry
            // Show result card briefly, then hide it so they can retry
            state.resultTimeout = setTimeout(() => {
                const currentCard = document.getElementById('result-card');
                if (currentCard) currentCard.style.display = 'none';
                state.resultTimeout = null;
            }, 2000);
        }
    }

    // Save state
    saveStateToLocalStorage();
}

function checkAchievements() {
    const newAchievements = [];

    if (state.streak === 3 && !state.achievements.includes('🔥 3er Serie!')) {
        newAchievements.push('🔥 3er Serie!');
    }
    if (state.streak === 5 && !state.achievements.includes('⚡ 5er Serie!')) {
        newAchievements.push('⚡ 5er Serie!');
    }
    if (state.streak === 10 && !state.achievements.includes('👑 10er Serie!')) {
        newAchievements.push('👑 10er Serie!');
    }

    if (newAchievements.length > 0) {
        state.achievements.push(...newAchievements);
        saveStateToLocalStorage();
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

// Expose functions globally for HTML onclicks
window.startCategory = startCategory;
window.selectLevel = selectLevel;
window.nextQuestion = nextQuestion;
window.goHome = goHome;
window.resetProgress = resetProgress;
window.toggleSound = toggleSound;
window.replay = replay;
window.initElements = initElements;


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

function resetProgress() {
    if (confirm("⚠️ Wirklich ALLES löschen?\n\nDeine Punkte, Level und Erfolge gehen unwiderruflich verloren!")) {
        localStorage.removeItem('grammatikGalaxieState');
        location.reload();
    }
}

// Alias for consistency
function saveState() {
    saveStateToLocalStorage();
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


function updateHomeScreen() {
    // Update points and stats
    if (elements.totalPointsDisplay) elements.totalPointsDisplay.textContent = state.totalPoints;
    if (elements.totalPointsStat) elements.totalPointsStat.textContent = state.totalPoints;
    if (elements.achievementsCount) elements.achievementsCount.textContent = state.achievements.length;



    // Update correct answers count
    if (elements.correctAnswersDisplay) elements.correctAnswersDisplay.textContent = state.score;

    // Update level info
    const currentLevelInfo = getLevel();
    if (elements.levelIcon) elements.levelIcon.textContent = currentLevelInfo.icon;
    if (elements.levelName) elements.levelName.textContent = currentLevelInfo.name;

    // Update sound UI
    updateSoundUI();
}

// ===== Start App =====
function toggleSettings() {
    const content = document.getElementById('settings-content');
    const arrow = document.getElementById('settings-arrow');
    if (!content) return;

    if (content.style.display === 'none') {
        content.style.display = '';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
}
window.toggleSettings = toggleSettings;

document.addEventListener('DOMContentLoaded', initializeApp);
