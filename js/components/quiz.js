// Компонент Викторины и Тренажёра микромимики
import { QUIZ_QUESTIONS } from '../data.js';
import { userState } from './dashboard.js';
import { getGestureIllustration } from './atlas.js';
import audio from '../audio.js';

export function renderQuiz() {
  const container = document.getElementById('app');

  // Главное меню выбора режима тестов
  container.innerHTML = `
    <div class="quiz-container fade-in">
      <header class="section-header">
        <h1>Тренажёрный Зал</h1>
        <p>Выберите режим тренировки для оттачивания навыков профайлинга</p>
      </header>

      <div class="quiz-modes-grid">
        <!-- Режим 1: Викторина -->
        <div class="glass-card mode-card">
          <div class="mode-icon">🧠</div>
          <h2>Викторина с повторением</h2>
          <p>Комплексный тест из 5 вопросов на знание языка тела. Система автоматически внедряет вопросы по ранее изученным вами темам из Атласа для закрепления материала.</p>
          <button class="btn btn-primary start-quiz-btn">Начать тест</button>
        </div>

        <!-- Режим 2: Тренажер микромимики -->
        <div class="glass-card mode-card">
          <div class="mode-icon">⚡</div>
          <h2>Тренажёр микромимики</h2>
          <p>Тренировка быстрого распознавания эмоций. Выражение лица персонажа вспыхнет всего на 0.3 секунды. Успеете ли вы заметить гнев, страх или презрение?</p>
          <button class="btn btn-accent start-micro-btn">Запустить тренажёр</button>
        </div>
      </div>
    </div>
  `;

  // Обработчики кнопок запуска режимов
  container.querySelector('.start-quiz-btn').onclick = () => {
    audio.playClick();
    startStandardQuiz();
  };

  container.querySelector('.start-micro-btn').onclick = () => {
    audio.playClick();
    startMicroQuiz();
  };
}

// ----------------------------------------------------
// 1. РЕЖИМ СТАНДАРТНОЙ ВИКТОРИНЫ (ИНТЕРВАЛЬНОЕ ПОВТОРЕНИЕ)
// ----------------------------------------------------
function startStandardQuiz() {
  const container = document.getElementById('app');
  
  // Генерация вопросов с учетом интервального повторения
  const questions = generateQuizQuestions();
  let currentQuestionIndex = 0;
  let score = 0;
  let answersHistory = []; // Хранит { questionId, selectedIndex, isCorrect }

  function renderQuestion() {
    if (currentQuestionIndex >= questions.length) {
      renderQuizResults(questions, answersHistory, score);
      return;
    }

    const q = questions[currentQuestionIndex];
    
    // Проверяем, относится ли вопрос к теме, которую пользователь уже проходил
    const completed = userState.state.completedTopics || [];
    const isReviewQuestion = completed.includes(q.category);

    container.innerHTML = `
      <div class="quiz-play-container fade-in">
        <div class="quiz-header">
          <span class="quiz-progress">Вопрос ${currentQuestionIndex + 1} из ${questions.length}</span>
          ${isReviewQuestion ? `<span class="review-badge">🔁 Повторение темы: ${getCategoryNameRu(q.category)}</span>` : ''}
          <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" style="width: ${(currentQuestionIndex / questions.length) * 100}%"></div>
          </div>
        </div>

        <div class="glass-card quiz-card">
          <div class="quiz-question-box">
            <h2>${q.question}</h2>
          </div>

          <div class="options-list">
            ${q.options.map((opt, index) => `
              <button class="option-btn" data-index="${index}">
                <span class="option-marker">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${opt}</span>
              </button>
            `).join('')}
          </div>

          <!-- Скрытый блок разбора ситуации, появляется после ответа -->
          <div class="explanation-card hidden">
            <div class="explanation-header"></div>
            <div class="explanation-body">
              <div class="expl-section">
                <h4>🧠 Психологическое объяснение:</h4>
                <p class="expl-text"></p>
              </div>
              <div class="expl-section res-section">
                <h4>💡 Решение ситуации (Практика):</h4>
                <p class="res-text"></p>
              </div>
            </div>
            <button class="btn btn-primary next-question-btn">Дальше</button>
          </div>
        </div>
      </div>
    `;

    // Обработчик выбора ответа
    const optionButtons = container.querySelectorAll('.option-btn');
    const explanationCard = container.querySelector('.explanation-card');
    let hasAnswered = false;

    optionButtons.forEach(btn => {
      btn.onclick = () => {
        if (hasAnswered) return;
        hasAnswered = true;

        const selectedIndex = parseInt(btn.getAttribute('data-index'));
        const isCorrect = selectedIndex === q.correctIndex;

        // Запись результатов
        userState.recordAnswer(q.category, isCorrect);
        answersHistory.push({ questionId: q.id, selectedIndex, isCorrect });

        if (isCorrect) {
          score++;
          audio.playCorrect();
          btn.classList.add('correct');
          explanationCard.querySelector('.explanation-header').innerHTML = `<span class="res-badge success">✓ Верно (+15 XP)</span>`;
        } else {
          audio.playIncorrect();
          btn.classList.add('incorrect');
          optionButtons[q.correctIndex].classList.add('correct-highlight');
          explanationCard.querySelector('.explanation-header').innerHTML = `<span class="res-badge danger">✗ Ошибка</span>`;
        }

        // Блокируем кнопки
        optionButtons.forEach(b => b.setAttribute('disabled', 'true'));

        // Показ разбора и решения ситуации
        explanationCard.querySelector('.expl-text').innerText = q.explanation;
        explanationCard.querySelector('.res-text').innerText = q.solution;
        explanationCard.classList.remove('hidden');

        // Кнопка перехода к следующему вопросу
        explanationCard.querySelector('.next-question-btn').onclick = () => {
          audio.playClick();
          currentQuestionIndex++;
          renderQuestion();
        };
      };
    });
  }

  renderQuestion();
}

// Генератор вопросов для викторины с логикой интервального повторения
function generateQuizQuestions() {
  const completed = userState.state.completedTopics || [];
  const allQuestions = [...QUIZ_QUESTIONS].filter(q => q.type === "text"); // Обычные текстовые вопросы
  let selected = [];

  // 1. Выбираем 1-2 вопроса по ранее изученным темам
  if (completed.length > 0) {
    const reviewPool = allQuestions.filter(q => completed.includes(q.category));
    if (reviewPool.length > 0) {
      const shuffledReview = reviewPool.sort(() => 0.5 - Math.random());
      const reviewCount = Math.min(2, shuffledReview.length);
      for (let i = 0; i < reviewCount; i++) {
        selected.push(shuffledReview[i]);
      }
    }
  }

  // 2. Дозаполняем оставшиеся до 5 вопросов случайным образом из общего списка
  const remainingPool = allQuestions.filter(q => !selected.some(sq => sq.id === q.id));
  const shuffledRemaining = remainingPool.sort(() => 0.5 - Math.random());
  
  const needed = 5 - selected.length;
  for (let i = 0; i < Math.min(needed, shuffledRemaining.length); i++) {
    selected.push(shuffledRemaining[i]);
  }

  // Случайным образом перемешиваем вопросы в финальном тесте
  return selected.sort(() => 0.5 - Math.random());
}

function getCategoryNameRu(cat) {
  const names = {
    hands: "Руки и жесты",
    face: "Мимика и лицо",
    torso: "Корпус и поза",
    legs: "Ноги и позы"
  };
  return names[cat] || cat;
}

// ----------------------------------------------------
// 2. РЕЖИМ ТРЕНАЖЁРА МИКРОМИМИКИ
// ----------------------------------------------------
function startMicroQuiz() {
  const container = document.getElementById('app');
  
  // Выбираем вопросы типа microexpression
  const microQuestions = QUIZ_QUESTIONS.filter(q => q.type === "microexpression");
  let currentQuestionIndex = 0;
  let score = 0;
  let answersHistory = [];

  function renderMicroQuestion() {
    if (currentQuestionIndex >= microQuestions.length) {
      renderQuizResults(microQuestions, answersHistory, score, true);
      return;
    }

    const q = microQuestions[currentQuestionIndex];
    let isFlashed = false;
    let hasAnswered = false;

    container.innerHTML = `
      <div class="quiz-play-container fade-in">
        <div class="quiz-header">
          <span class="quiz-progress">Микромимика: Вопрос ${currentQuestionIndex + 1} из ${microQuestions.length}</span>
          <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" style="width: ${(currentQuestionIndex / microQuestions.length) * 100}%"></div>
          </div>
        </div>

        <div class="glass-card quiz-card micro-quiz-card">
          
          <!-- Зона отображения аватара-лица -->
          <div class="micro-avatar-container">
            <div id="micro-face-box" class="micro-face-box">
              <!-- Первично рисуем нейтральное лицо -->
              ${getGestureIllustration('neutral', 180, 180)}
            </div>
            <div class="flash-overlay-effect"></div>
          </div>

          <div class="flash-controls">
            <button class="btn btn-accent trigger-flash-btn">⚡ ПОКАЗАТЬ ВСПЫШКУ</button>
            <p class="flash-hint">Нажмите кнопку, лицо изменится на 0.3 сек., после чего выберите эмоцию.</p>
          </div>

          <!-- Блок с выбором ответа (заблокирован до вспышки) -->
          <div class="options-list disabled" id="micro-options">
            ${q.options.map((opt, index) => `
              <button class="option-btn micro-opt-btn" data-index="${index}" disabled>
                <span class="option-marker">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${opt}</span>
              </button>
            `).join('')}
          </div>

          <!-- Скрытый блок разбора ситуации, появляется после ответа -->
          <div class="explanation-card hidden" id="micro-explanation">
            <div class="explanation-header"></div>
            <div class="explanation-body">
              <div class="expl-section">
                <h4>🧠 Психологическое объяснение:</h4>
                <p class="expl-text"></p>
              </div>
              <div class="expl-section res-section">
                <h4>💡 Решение ситуации (Практика):</h4>
                <p class="res-text"></p>
              </div>
            </div>
            <button class="btn btn-primary next-question-btn">Дальше</button>
          </div>
        </div>
      </div>
    `;

    const flashBtn = container.querySelector('.trigger-flash-btn');
    const faceBox = document.getElementById('micro-face-box');
    const optionsContainer = document.getElementById('micro-options');
    const optButtons = container.querySelectorAll('.micro-opt-btn');

    // Клик на вспышку
    flashBtn.onclick = () => {
      if (isFlashed) return;
      isFlashed = true;

      flashBtn.setAttribute('disabled', 'true');
      flashBtn.innerText = "Вспышка проигрывается...";

      // Звуковой эффект вспышки
      audio.playFlash();

      // Шаг 1: Показываем микровыражение
      faceBox.innerHTML = getGestureIllustration(q.expressionType, 180, 180);
      faceBox.classList.add('flashing');
      
      // Эффект свечения
      const overlay = container.querySelector('.flash-overlay-effect');
      overlay.classList.add('active');

      // Шаг 2: Через 300 мс возвращаем нейтральное лицо
      setTimeout(() => {
        faceBox.innerHTML = getGestureIllustration('neutral', 180, 180);
        faceBox.classList.remove('flashing');
        overlay.classList.remove('active');
        
        flashBtn.innerText = "Вспышка завершена";
        
        // Разблокируем варианты ответов
        optionsContainer.classList.remove('disabled');
        optButtons.forEach(b => b.removeAttribute('disabled'));
      }, 300);
    };

    // Клики по вариантам ответов
    optButtons.forEach(btn => {
      btn.onclick = () => {
        if (hasAnswered) return;
        hasAnswered = true;

        const selectedIndex = parseInt(btn.getAttribute('data-index'));
        const isCorrect = selectedIndex === q.correctIndex;

        // Записываем статистику
        userState.recordAnswer(q.category, isCorrect);
        answersHistory.push({ questionId: q.id, selectedIndex, isCorrect });

        const explCard = document.getElementById('micro-explanation');

        if (isCorrect) {
          score++;
          audio.playCorrect();
          btn.classList.add('correct');
          explCard.querySelector('.explanation-header').innerHTML = `<span class="res-badge success">✓ Верно (+15 XP)</span>`;
          userState.unlockAchievement("micro_master");
        } else {
          audio.playIncorrect();
          btn.classList.add('incorrect');
          optButtons[q.correctIndex].classList.add('correct-highlight');
          explCard.querySelector('.explanation-header').innerHTML = `<span class="res-badge danger">✗ Ошибка</span>`;
        }

        // Показываем правильное лицо для подробного разбора
        faceBox.innerHTML = getGestureIllustration(q.expressionType, 180, 180);

        // Блокируем выбор
        optButtons.forEach(b => b.setAttribute('disabled', 'true'));

        // Рендерим объяснения
        explCard.querySelector('.expl-text').innerText = q.explanation;
        explCard.querySelector('.res-text').innerText = q.solution;
        explCard.classList.remove('hidden');

        // Кнопка "Дальше"
        explCard.querySelector('.next-question-btn').onclick = () => {
          audio.playClick();
          currentQuestionIndex++;
          renderMicroQuestion();
        };
      };
    });
  }

  renderMicroQuestion();
}

// ----------------------------------------------------
// 3. ЭКРАН РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ
// ----------------------------------------------------
function renderQuizResults(questions, history, score, isMicro = false) {
  const container = document.getElementById('app');
  const winRate = Math.round((score / questions.length) * 100);
  const earnedXp = score * 15;

  container.innerHTML = `
    <div class="quiz-results-container fade-in">
      <div class="glass-card results-card">
        <div class="results-header">
          <span class="medal-icon">${winRate >= 80 ? '🥇' : winRate >= 50 ? '🥈' : '🥉'}</span>
          <h1>Тренировка завершена!</h1>
          <p>${isMicro ? 'Тренажер микромимики' : 'Викторина с повторением'}</p>
        </div>

        <div class="results-summary">
          <div class="res-stat-box">
            <span class="res-stat-value">${score} / ${questions.length}</span>
            <span class="res-stat-label">Правильных ответов</span>
          </div>
          <div class="res-stat-box">
            <span class="res-stat-value text-accent">${winRate}%</span>
            <span class="res-stat-label">Точность</span>
          </div>
          <div class="res-stat-box">
            <span class="res-stat-value text-emerald">+${earnedXp} XP</span>
            <span class="res-stat-label">Получено опыта</span>
          </div>
        </div>

        <!-- Краткий лог вопросов -->
        <div class="results-log-list">
          <h3>Разбор вопросов:</h3>
          ${questions.map((q, index) => {
            const hist = history.find(h => h.questionId === q.id);
            const isCorrect = hist ? hist.isCorrect : false;
            return `
              <div class="result-log-item ${isCorrect ? 'correct' : 'incorrect'}">
                <span class="log-status-icon">${isCorrect ? '✓' : '✗'}</span>
                <div class="log-text-box">
                  <span class="log-q-text">${q.question.length > 70 ? q.question.substring(0, 70) + '...' : q.question}</span>
                  <span class="log-q-sub">Вы ответили: ${q.options[hist ? hist.selectedIndex : 0]}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="results-actions">
          <button class="btn btn-primary retry-btn">Тренироваться снова</button>
          <button class="btn btn-secondary home-btn">Вернуться в профиль</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('.retry-btn').onclick = () => {
    audio.playClick();
    if (isMicro) {
      startMicroQuiz();
    } else {
      startStandardQuiz();
    }
  };

  container.querySelector('.home-btn').onclick = () => {
    audio.playClick();
    // Перенаправляем на дашборд
    const navDashboard = document.querySelector('[data-route="dashboard"]');
    if (navDashboard) navDashboard.click();
  };
}
