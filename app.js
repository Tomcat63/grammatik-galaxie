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
    try {
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
            return;
        }

        if (state.allQuestions[category].length === 0) {
            alert("Diese Kategorie ist in diesem Level noch nicht verfügbar! 🚧");
            return;
        }

        state.currentQuestionSet = getRandomQuestions(category);
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
    }
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

function updateQuestionScreen() {
    if (!state.currentQuestionSet || state.currentQuestionSet.length === 0) {
        console.error("currentQuestionSet is empty!");
        return;
    }
    const question = state.currentQuestionSet[state.currentQuestionIndex];

    // Update progress
    const progress = ((state.currentQuestionIndex + 1) / state.currentQuestionSet.length) * 100;
    if (elements.progressBar) elements.progressBar.style.width = `${progress}%`;
    if (elements.currentQuestionNum) elements.currentQuestionNum.textContent = state.currentQuestionIndex + 1;
    if (elements.totalQuestionsNum) elements.totalQuestionsNum.textContent = state.currentQuestionSet.length;

    // Update points display
    if (elements.pointsDisplay) elements.pointsDisplay.textContent = state.totalPoints;

    // Update question text
    if (elements.questionText) elements.questionText.textContent = question.question;

    // Create option buttons
    if (elements.optionsContainer) {
        elements.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = option;
            button.addEventListener('click', () => handleAnswer(index));
            elements.optionsContainer.appendChild(button);
        });
    }

    // Hide result card and show next button
    if (elements.resultCard) elements.resultCard.style.display = 'none';
    if (elements.nextButton) elements.nextButton.style.display = 'block';
    state.showingResult = false;
}

function handleAnswer(selectedIndex) {
    if (state.showingResult) return;

    const question = state.currentQuestionSet[state.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctIndex;

    // Play sound
    playSound(isCorrect ? 'correct' : 'wrong');

    // Handle correct/incorrect logic
    if (isCorrect) {
        state.selectedAnswer = selectedIndex;
        state.showingResult = true;

        const points = 10 + (state.streak * 5);
        state.score++;
        state.totalPoints += points;
        state.streak++;

        // Update options appearance - show correct answer
        const optionButtons = elements.optionsContainer.querySelectorAll('.option-button');
        optionButtons.forEach((button, index) => {
            button.disabled = true;

            if (index === question.correctIndex) {
                button.classList.add('correct');
                button.textContent += ' ✓';
            } else {
                button.classList.add('neutral');
            }
        });

        // Show celebration
        if (elements.celebration) {
            elements.celebration.style.display = 'flex';
            setTimeout(() => {
                elements.celebration.style.display = 'none';
            }, 1000);
        }

        // Check for achievements
        checkAchievements();

        // Show result
        if (elements.resultCard) {
            elements.resultCard.className = 'result-card correct';
            elements.resultEmoji.textContent = '🎉';
            elements.resultTitle.textContent = 'Super! Das ist richtig!';
            elements.resultExplanation.textContent = question.explanation;
            elements.resultPoints.textContent = `+${points} Punkte!${state.streak > 1 ? ` 🔥 ${state.streak}x Serie!` : ''}`;

            // Update next button text and show it
            if (state.currentQuestionIndex < state.currentQuestionSet.length - 1) {
                elements.nextButton.textContent = 'Weiter →';
            } else {
                elements.nextButton.textContent = 'Fertig! 🎊';
            }
            elements.nextButton.style.display = 'block';

            // Show result card
            elements.resultCard.style.display = 'block';
        }
    } else {
        // Wrong answer - let user try again
        state.streak = 0;

        // Mark wrong answer as incorrect (but don't show correct answer)
        const optionButtons = elements.optionsContainer.querySelectorAll('.option-button');
        optionButtons[selectedIndex].classList.add('incorrect');
        optionButtons[selectedIndex].textContent += ' ✗';
        optionButtons[selectedIndex].disabled = true;

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
        if (elements.resultCard) {
            elements.resultCard.className = 'result-card incorrect';
            elements.resultEmoji.textContent = '💡';
            elements.resultTitle.textContent = randomMessage;
            elements.resultExplanation.textContent = 'Überlege nochmal in Ruhe...';
            elements.resultPoints.textContent = '';

            // Hide next button - user must try again
            elements.nextButton.style.display = 'none';

            // Show result card briefly, then hide it
            elements.resultCard.style.display = 'block';
            setTimeout(() => {
                elements.resultCard.style.display = 'none';
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
