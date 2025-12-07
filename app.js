// ===== State Management =====
const state = {
    allQuestions: null,
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
    homeScreen: document.getElementById('home-screen'),
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
    // Load saved state from localStorage
    loadStateFromLocalStorage();

    // Load questions from global variable or JSON file
    if (window.QUESTIONS_DATA) {
        // Use embedded questions data (works with file:// protocol)
        state.allQuestions = window.QUESTIONS_DATA;
        initializeApp();
    } else {
        // Fallback: Try to fetch questions.json
        try {
            const response = await fetch('./questions.json');
            if (!response.ok) throw new Error('Fetch failed');
            state.allQuestions = await response.json();
            initializeApp();
        } catch (error) {
            console.error('Fehler beim Laden der Fragen:', error);
            elements.loading.querySelector('p').textContent = 'Fehler beim Laden der Fragen. Bitte Seite neu laden.';
        }
    }
}

function initializeApp() {
    // Hide loading, show home screen
    elements.loading.style.display = 'none';
    elements.homeScreen.style.display = 'block';

    // Update UI
    updateHomeScreen();

    // Setup event listeners
    setupEventListeners();
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Sound toggle (home)
    elements.soundToggle.addEventListener('click', toggleSound);

    // Category selection
    elements.categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            startCategory(category);
        });
    });

    // Replay button
    elements.replayButton.addEventListener('click', replay);

    // Back button
    elements.backButton.addEventListener('click', goHome);

    // Sound toggle (quiz)
    elements.soundToggleQuiz.addEventListener('click', toggleSound);

    // Next button
    elements.nextButton.addEventListener('click', nextQuestion);
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
    state.currentQuestionSet = getRandomQuestions(category);
    state.currentQuestionIndex = 0;
    state.selectedAnswer = null;
    state.showingResult = false;

    // Switch to question screen
    elements.homeScreen.style.display = 'none';
    elements.questionScreen.style.display = 'block';

    // Update UI
    updateQuestionScreen();
}

function updateQuestionScreen() {
    const question = state.currentQuestionSet[state.currentQuestionIndex];

    // Update progress
    const progress = ((state.currentQuestionIndex + 1) / state.currentQuestionSet.length) * 100;
    elements.progressBar.style.width = `${progress}%`;
    elements.currentQuestionNum.textContent = state.currentQuestionIndex + 1;
    elements.totalQuestionsNum.textContent = state.currentQuestionSet.length;

    // Update points display
    elements.pointsDisplay.textContent = state.totalPoints;

    // Update question text
    elements.questionText.textContent = question.question;

    // Create option buttons
    elements.optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.addEventListener('click', () => handleAnswer(index));
        elements.optionsContainer.appendChild(button);
    });

    // Hide result card and show next button
    elements.resultCard.style.display = 'none';
    elements.nextButton.style.display = 'block';
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
        elements.celebration.style.display = 'flex';
        setTimeout(() => {
            elements.celebration.style.display = 'none';
        }, 1000);

        // Check for achievements
        checkAchievements();

        // Show result
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

    elements.questionScreen.style.display = 'none';
    elements.homeScreen.style.display = 'block';

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
