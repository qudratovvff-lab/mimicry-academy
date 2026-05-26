// Управление состоянием пользователя и панель прогресса (Дашборд)
import audio from '../audio.js';

export const USER_LEVELS = [
  { level: 1, name: "Новичок", minXp: 0, maxXp: 100 },
  { level: 2, name: "Внимательный Наблюдатель", minXp: 100, maxXp: 300 },
  { level: 3, name: "Чтец эмоций", minXp: 300, maxXp: 600 },
  { level: 4, name: "Профессиональный Профайлер", minXp: 600, maxXp: 1000 },
  { level: 5, name: "Живой Детектор Лжи", minXp: 1000, maxXp: 99999 }
];

export const ACHIEVEMENTS = [
  { id: "first_step", name: "Первый шаг", description: "Изучите свой первый жест в атласе", icon: "📖" },
  { id: "quiz_expert", name: "Умник", description: "Ответьте правильно на 5 вопросов подряд в викторине", icon: "🧠" },
  { id: "micro_master", name: "Быстрый глаз", description: "Успешно распознайте микровыражение лица", icon: "⚡" },
  { id: "liar_hunter", name: "Охотник за ложью", description: "Раскройте обман кандидата на собеседовании", icon: "🔍" },
  { id: "negotiator", name: "Мастер компромисса", description: "Успешно завершите переговоры по аренде", icon: "🤝" },
  { id: "all_atlas", name: "Энциклопедист", description: "Изучите все жесты во всех категориях атласа", icon: "📚" }
];

class UserState {
  constructor() {
    this.loadState();
  }

  loadState() {
    const defaultState = {
      xp: 0,
      level: 1,
      completedTopics: [], // категории жестов, которые пользователь изучил (например, 'hands')
      viewedGestures: [],  // ID жестов, которые пользователь открыл в атласе
      achievements: [],    // Разблокированные ID ачивок
      viewedArticles: [],  // Прочитанные статьи библиотеки
      stats: {
        totalAnswers: 0,
        correctAnswers: 0,
        streak: 0,
        faceCorrect: 0,
        faceTotal: 0,
        handsCorrect: 0,
        handsTotal: 0,
        legsCorrect: 0,
        legsTotal: 0,
        torsoCorrect: 0,
        torsoTotal: 0
      }
    };

    const saved = localStorage.getItem('mimicry_user_state');
    if (saved) {
      try {
        this.state = { ...defaultState, ...JSON.parse(saved) };
      } catch (e) {
        this.state = defaultState;
      }
    } else {
      this.state = defaultState;
    }
  }

  saveState() {
    localStorage.setItem('mimicry_user_state', JSON.stringify(this.state));
  }

  addXp(amount) {
    const oldLevel = this.getCurrentLevelInfo().level;
    this.state.xp += amount;
    
    // Проверка повышения уровня
    const newLevelInfo = this.getCurrentLevelInfo();
    if (newLevelInfo.level > oldLevel) {
      this.state.level = newLevelInfo.level;
      audio.playLevelUp();
      this.showLevelUpNotification(newLevelInfo);
    }
    
    this.saveState();
  }

  getCurrentLevelInfo() {
    const xp = this.state.xp;
    let current = USER_LEVELS[0];
    for (let lvl of USER_LEVELS) {
      if (xp >= lvl.minXp && xp < lvl.maxXp) {
        current = lvl;
        break;
      }
      if (lvl.level === 5 && xp >= lvl.minXp) {
        current = lvl;
      }
    }
    return current;
  }

  viewGesture(gestureId, categoryId, totalGesturesInCategory) {
    if (!this.state.viewedGestures.includes(gestureId)) {
      this.state.viewedGestures.push(gestureId);
      this.addXp(5); // +5 XP за изучение жеста
      
      // Проверяем, изучена ли вся категория
      // Фильтруем просмотренные жесты по этой категории
      const countViewed = this.state.viewedGestures.filter(id => {
        // Мы проверим это при рендере в компоненте атласа, передавая количество
        return true; 
      });

      this.unlockAchievement("first_step");
      this.saveState();
      return true;
    }
    return false;
  }

  readArticle(articleId) {
    if (!this.state.viewedArticles) {
      this.state.viewedArticles = [];
    }
    if (!this.state.viewedArticles.includes(articleId)) {
      this.state.viewedArticles.push(articleId);
      this.addXp(20); // +20 XP за статью
      this.saveState();
      return true;
    }
    return false;
  }

  markTopicCompleted(category) {
    if (!this.state.completedTopics.includes(category)) {
      this.state.completedTopics.push(category);
      this.saveState();
    }
  }

  recordAnswer(category, isCorrect) {
    this.state.stats.totalAnswers++;
    if (isCorrect) {
      this.state.stats.correctAnswers++;
      this.state.stats.streak++;
      this.addXp(15); // +15 XP за правильный ответ
      
      if (this.state.stats.streak >= 5) {
        this.unlockAchievement("quiz_expert");
      }
    } else {
      this.state.stats.streak = 0;
    }

    // Статистика по категориям
    const catTotalKey = `${category}Total`;
    const catCorrectKey = `${category}Correct`;
    if (catTotalKey in this.state.stats) this.state.stats[catTotalKey]++;
    if (isCorrect && catCorrectKey in this.state.stats) this.state.stats[catCorrectKey]++;

    this.saveState();
  }

  unlockAchievement(id) {
    if (!this.state.achievements.includes(id)) {
      this.state.achievements.push(id);
      this.addXp(30); // +30 XP за достижение
      audio.playLevelUp();
      this.showAchievementNotification(id);
      this.saveState();
    }
  }

  showLevelUpNotification(levelInfo) {
    const banner = document.createElement('div');
    banner.className = 'level-up-banner';
    banner.innerHTML = `
      <div class="level-up-content">
        <span class="level-up-stars">🏆 ⭐ 🏆</span>
        <h2>Новый уровень достигнут!</h2>
        <h1>Уровень ${levelInfo.level} — ${levelInfo.name}</h1>
        <p>Вы разблокировали новые высоты в чтении людей!</p>
        <button class="level-up-close-btn">Отлично</button>
      </div>
    `;
    document.body.appendChild(banner);
    
    const closeBtn = banner.querySelector('.level-up-close-btn');
    closeBtn.onclick = () => {
      audio.playClick();
      banner.remove();
    };
  }

  showAchievementNotification(achievementId) {
    const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!ach) return;

    const notif = document.createElement('div');
    notif.className = 'achievement-toast';
    notif.innerHTML = `
      <div class="ach-toast-icon">${ach.icon}</div>
      <div class="ach-toast-text">
        <div class="ach-toast-title">Достижение получено!</div>
        <div class="ach-toast-name">${ach.name}</div>
      </div>
    `;
    document.body.appendChild(notif);

    // Удалить через 4 секунды с анимацией угасания
    setTimeout(() => {
      notif.classList.add('fade-out');
      setTimeout(() => notif.remove(), 500);
    }, 3500);
  }
}

export const userState = new UserState();

export function renderDashboard() {
  const container = document.getElementById('app');
  const levelInfo = userState.getCurrentLevelInfo();
  const state = userState.state;

  // Рассчитываем процент прогресса до следующего уровня
  let xpPercent = 0;
  if (levelInfo.level === 5) {
    xpPercent = 100;
  } else {
    const currentLevelProgress = state.xp - levelInfo.minXp;
    const levelRange = levelInfo.maxXp - levelInfo.minXp;
    xpPercent = Math.min(100, Math.max(0, (currentLevelProgress / levelRange) * 100));
  }

  // Расчет статистики
  const winRate = state.stats.totalAnswers > 0 
    ? Math.round((state.stats.correctAnswers / state.stats.totalAnswers) * 100) 
    : 0;

  // Отрисовка
  container.innerHTML = `
    <div class="dashboard-container fade-in">
      <header class="section-header">
        <h1>Панель Прогресса</h1>
        <p>Отслеживайте свой путь к мастерству профайлинга</p>
      </header>

      <div class="dashboard-grid">
        <!-- Карточка уровня -->
        <div class="glass-card profile-card">
          <div class="avatar-glow">👤</div>
          <h2>Уровень ${levelInfo.level}</h2>
          <h3>${levelInfo.name}</h3>
          
          <div class="xp-bar-container">
            <div class="xp-bar-labels">
              <span>${state.xp} XP</span>
              <span>${levelInfo.level === 5 ? 'Максимум' : levelInfo.maxXp + ' XP'}</span>
            </div>
            <div class="xp-bar-track">
              <div class="xp-bar-fill" style="width: ${xpPercent}%"></div>
            </div>
          </div>
          <p class="xp-hint">${levelInfo.level === 5 ? 'Вы достигли максимального уровня!' : `Нужно еще ${levelInfo.maxXp - state.xp} XP для следующего уровня`}</p>
        </div>

        <!-- Статистика ответов -->
        <div class="glass-card stats-card">
          <h2>Статистика ответов</h2>
          <div class="stats-summary">
            <div class="stat-box">
              <span class="stat-value">${state.stats.totalAnswers}</span>
              <span class="stat-label">Всего вопросов</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">${state.stats.correctAnswers}</span>
              <span class="stat-label">Правильно</span>
            </div>
            <div class="stat-box">
              <span class="stat-value text-accent">${winRate}%</span>
              <span class="stat-label">Точность</span>
            </div>
          </div>

          <!-- Круговые мини-диаграммы категорий -->
          <div class="categories-progress-list">
            <h4>Точность по зонам тела:</h4>
            ${renderCategoryProgressBar('Лицо и мимика', state.stats.faceCorrect, state.stats.faceTotal)}
            ${renderCategoryProgressBar('Руки и жесты', state.stats.handsCorrect, state.stats.handsTotal)}
            ${renderCategoryProgressBar('Корпус и поза', state.stats.torsoCorrect, state.stats.torsoTotal)}
            ${renderCategoryProgressBar('Ноги и положение', state.stats.legsCorrect, state.stats.legsTotal)}
          </div>
        </div>
      </div>

      <!-- Раздел Достижений -->
      <div class="achievements-section glass-card">
        <h2>Достижения (${state.achievements.length} / ${ACHIEVEMENTS.length})</h2>
        <div class="achievements-grid">
          ${ACHIEVEMENTS.map(ach => {
            const unlocked = state.achievements.includes(ach.id);
            return `
              <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-info">
                  <span class="ach-name">${ach.name}</span>
                  <span class="ach-desc">${ach.description}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Панель рекомендаций -->
      <div class="recommendations-card glass-card">
        <h2>💡 Советы профайлера</h2>
        <ul>
          <li><strong>Не вырывайте жесты из контекста!</strong> Один жест (например, скрещенные руки) может означать просто холод в комнате. Всегда ищите <em>кластеры</em> — сочетание 2–3 сигналов одновременно.</li>
          <li><strong>Обращайте внимание на базовую линию (baseline).</strong> Для определения лжи нужно сначала понять нормальное поведение человека в спокойном состоянии.</li>
          <li><strong>Самые честные части тела — стопы.</strong> Мы контролируем мимику лица лучше всего, так как смотримся в зеркало. А вот положение ног выдает наше истинное желание сбежать.</li>
        </ul>
      </div>
    </div>
  `;
}

function renderCategoryProgressBar(name, correct, total) {
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  return `
    <div class="category-progress-item">
      <div class="category-progress-text">
        <span>${name}</span>
        <span>${percent}% (${correct}/${total})</span>
      </div>
      <div class="category-progress-track">
        <div class="category-progress-fill" style="width: ${percent}%; background: ${percent > 70 ? 'var(--clr-emerald)' : percent > 40 ? 'var(--clr-amber)' : 'var(--clr-purple)'}"></div>
      </div>
    </div>
  `;
}
