// Интерактивный атлас жестов (Энциклопедия)
import { GESTURES } from '../data.js';
import { userState } from './dashboard.js';
import audio from '../audio.js';

// Генератор SVG иллюстраций для каждого типа жеста
export function getGestureIllustration(type, width = 150, height = 150) {
  const primary = "var(--clr-cyan)";
  const accent = "var(--clr-purple)";
  const alert = "var(--clr-amber)";
  const success = "var(--clr-emerald)";
  const bg = "rgba(255, 255, 255, 0.05)";

  let paths = "";

  switch (type) {
    case "neutral":
      paths = `
        <!-- Лицо -->
        <circle cx="75" cy="75" r="50" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Брови нейтральные -->
        <path d="M 48 65 Q 58 63 65 65 M 102 65 Q 92 63 85 65" stroke="${primary}" stroke-width="2.5" fill="none" />
        <!-- Глаза -->
        <circle cx="55" cy="78" r="4.5" fill="${primary}" />
        <circle cx="95" cy="78" r="4.5" fill="${primary}" />
        <!-- Легкая улыбка / нейтральный рот -->
        <path d="M 58 100 Q 75 106 92 100" stroke="${primary}" stroke-width="3" fill="none" stroke-linecap="round" />
      `;
      break;

    case "hands_crossed":
    case "crossed_arms":
      paths = `
        <!-- Голова -->
        <circle cx="75" cy="40" r="15" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Корпус -->
        <path d="M 50 85 Q 75 70 100 85" stroke="${primary}" stroke-width="3" fill="none" />
        <path d="M 50 85 L 50 110 L 100 110 L 100 85 Z" fill="${bg}" stroke="${primary}" stroke-width="2" />
        <!-- Скрещенные руки -->
        <path d="M 45 75 Q 75 105 105 75" stroke="${accent}" stroke-width="4" stroke-linecap="round" fill="none" />
        <path d="M 55 75 Q 75 100 95 75" stroke="${accent}" stroke-width="4" stroke-linecap="round" fill="none" />
        <!-- Барьерный замок -->
        <circle cx="65" cy="88" r="4" fill="${accent}" />
        <circle cx="85" cy="88" r="4" fill="${accent}" />
      `;
      break;

    case "neck_touch":
    case "hand_to_neck":
      paths = `
        <!-- Лицо/Шея -->
        <path d="M 60 30 Q 75 15 90 30 L 90 70 Q 75 80 60 70 Z" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Линия уха -->
        <path d="M 90 40 Q 96 45 92 50" stroke="${primary}" stroke-width="2" fill="none" />
        <!-- Плечо -->
        <path d="M 40 100 Q 75 85 110 100" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Рука почесывает шею -->
        <path d="M 120 120 L 95 85 L 85 70" stroke="${accent}" stroke-width="4" stroke-linecap="round" fill="none" />
        <!-- Импульс тревоги -->
        <circle cx="80" cy="70" r="8" stroke="${alert}" stroke-width="1.5" stroke-dasharray="2" fill="none">
          <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
        </circle>
      `;
      break;

    case "nose_touch":
      paths = `
        <!-- Профиль лица -->
        <path d="M 55 25 Q 75 25 75 35 L 75 50 Q 88 53 82 58 L 73 60 Q 73 75 60 85" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Глаз -->
        <circle cx="62" cy="42" r="2" fill="${primary}" />
        <path d="M 58 38 Q 62 35 66 38" stroke="${primary}" stroke-width="1.5" fill="none" />
        <!-- Рука, касающаяся носа -->
        <path d="M 95 110 L 85 75 L 80 57" stroke="${accent}" stroke-width="4" stroke-linecap="round" fill="none" />
        <!-- Зона зуда -->
        <circle cx="80" cy="56" r="6" stroke="${alert}" stroke-width="1" fill="none" stroke-dasharray="2" />
      `;
      break;

    case "steeple":
      paths = `
        <!-- Шпиль из пальцев (две руки) -->
        <!-- Левая рука -->
        <path d="M 40 110 L 60 70 L 73 50" stroke="${primary}" stroke-width="3.5" stroke-linecap="round" fill="none" />
        <path d="M 35 115 L 58 75 L 71 55" stroke="${primary}" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <!-- Правая рука -->
        <path d="M 110 110 L 90 70 L 77 50" stroke="${primary}" stroke-width="3.5" stroke-linecap="round" fill="none" />
        <path d="M 115 115 L 92 75 L 79 55" stroke="${primary}" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <!-- Точка контакта энергии шпиля -->
        <circle cx="75" cy="50" r="5" fill="${success}">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
      `;
      break;

    case "lean_forward":
      paths = `
        <!-- Сиденье стула -->
        <path d="M 50 110 L 95 110" stroke="#555" stroke-width="3" />
        <path d="M 50 110 L 50 70" stroke="#555" stroke-width="3" />
        <!-- Наклоненная фигура человека -->
        <!-- Голова -->
        <circle cx="85" cy="35" r="12" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Корпус -->
        <path d="M 80 47 L 70 85 L 90 110" stroke="${primary}" stroke-width="4" stroke-linecap="round" fill="none" />
        <!-- Стрелка наклона вперед -->
        <path d="M 45 45 Q 65 30 70 32" stroke="${success}" stroke-width="2" fill="none" marker-end="url(#arrow)" />
        <path d="M 65 30 L 70 32 L 67 38" stroke="${success}" stroke-width="2" fill="none" />
      `;
      break;

    case "lean_back":
      paths = `
        <!-- Стул, отклоненный назад -->
        <path d="M 40 110 L 85 110" stroke="#555" stroke-width="3" />
        <path d="M 40 110 L 25 65" stroke="#555" stroke-width="3" />
        <!-- Фигура откинулась -->
        <!-- Голова -->
        <circle cx="45" cy="35" r="12" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Спина -->
        <path d="M 48 47 L 55 90 L 80 110" stroke="${primary}" stroke-width="4" stroke-linecap="round" fill="none" />
        <!-- Стрелка назад -->
        <path d="M 70 35 Q 55 45 50 43" stroke="${alert}" stroke-width="2" fill="none" />
        <path d="M 55 48 L 50 43 L 57 40" stroke="${alert}" stroke-width="2" fill="none" />
      `;
      break;

    case "anger":
      paths = `
        <!-- Лицо -->
        <circle cx="75" cy="75" r="50" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Сведенные злые брови -->
        <path d="M 45 62 L 62 68 M 105 62 L 88 68" stroke="${accent}" stroke-width="4.5" stroke-linecap="round" />
        <!-- Глаза -->
        <circle cx="55" cy="78" r="4" fill="${primary}" />
        <circle cx="95" cy="78" r="4" fill="${primary}" />
        <!-- Рот плотно сжатый -->
        <path d="M 55 105 L 95 105" stroke="${accent}" stroke-width="4.5" stroke-linecap="round" />
        <!-- Морщины гнева на переносице -->
        <path d="M 71 68 L 71 74 M 79 68 L 79 74" stroke="${accent}" stroke-width="1.5" />
      `;
      break;

    case "fear":
      paths = `
        <!-- Лицо -->
        <circle cx="75" cy="75" r="50" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Приподнятые и сведенные брови -->
        <path d="M 45 63 Q 58 52 70 60 M 105 63 Q 92 52 80 60" stroke="${accent}" stroke-width="3.5" fill="none" stroke-linecap="round" />
        <!-- Широко раскрытые глаза -->
        <circle cx="55" cy="76" r="6" stroke="${primary}" stroke-width="2" fill="none" />
        <circle cx="55" cy="76" r="2.5" fill="${primary}" />
        <circle cx="95" cy="76" r="6" stroke="${primary}" stroke-width="2" fill="none" />
        <circle cx="95" cy="76" r="2.5" fill="${primary}" />
        <!-- Испуганный приоткрытый рот -->
        <path d="M 55 105 Q 75 118 95 105 Q 75 95 55 105 Z" fill="${bg}" stroke="${accent}" stroke-width="3.5" />
      `;
      break;

    case "contempt":
      paths = `
        <!-- Лицо -->
        <circle cx="75" cy="75" r="50" stroke="${primary}" stroke-width="3" fill="none" />
        <!-- Нейтральные брови -->
        <path d="M 45 60 L 65 60 M 105 60 L 85 60" stroke="${primary}" stroke-width="3" />
        <!-- Глаза с прищуром -->
        <path d="M 48 75 Q 55 70 62 75" stroke="${primary}" stroke-width="2.5" fill="none" />
        <circle cx="55" cy="76" r="1.5" fill="${primary}" />
        <path d="M 88 75 Q 95 70 102 75" stroke="${primary}" stroke-width="2.5" fill="none" />
        <circle cx="95" cy="76" r="1.5" fill="${primary}" />
        <!-- Асимметричный рот (ухмылка только справа) -->
        <path d="M 52 105 Q 65 105 90 98" stroke="${accent}" stroke-width="4.5" stroke-linecap="round" fill="none" />
        <!-- Ямочка от ухмылки справа -->
        <path d="M 87 93 Q 95 97 91 103" stroke="${accent}" stroke-width="2" fill="none" />
      `;
      break;

    case "foot_exit":
      paths = `
        <!-- Контур двери -->
        <path d="M 110 30 L 110 120 L 130 120" stroke="#777" stroke-width="3" stroke-linecap="round" fill="none" />
        <!-- Ноги сверху -->
        <!-- Левая стопа смотрит прямо -->
        <path d="M 45 100 C 45 80 57 80 57 100 C 57 115 45 115 45 100 Z" fill="${bg}" stroke="${primary}" stroke-width="2.5" />
        <!-- Правая стопа повернута вправо к выходу -->
        <g transform="rotate(45, 80, 100)">
          <path d="M 72 100 C 72 80 84 80 84 100 C 84 115 72 115 72 100 Z" fill="${bg}" stroke="${accent}" stroke-width="3" />
        </g>
        <!-- Стрелка к выходу -->
        <path d="M 90 75 L 115 75" stroke="${alert}" stroke-width="2" stroke-dasharray="3" />
        <path d="M 110 70 L 115 75 L 110 80" stroke="${alert}" stroke-width="2" fill="none" />
      `;
      break;

    default:
      paths = `
        <circle cx="75" cy="75" r="40" stroke="${primary}" stroke-width="3" fill="none" />
        <path d="M 55 75 L 95 75 M 75 55 L 75 95" stroke="${primary}" stroke-width="2" />
      `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" class="gesture-svg">
      ${paths}
    </svg>
  `;
}

export function renderAtlas() {
  const container = document.getElementById('app');
  let currentFilter = "all";
  let searchQuery = "";

  function updateList() {
    const listContainer = document.getElementById('atlas-list');
    if (!listContainer) return;

    // Фильтрация и поиск
    const filtered = GESTURES.filter(g => {
      const matchesCategory = currentFilter === "all" || g.category === currentFilter;
      const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            g.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="no-results">
          <p>Ничего не найдено по вашему запросу. Попробуйте сменить фильтр или ключевые слова.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(g => {
      const isViewed = userState.state.viewedGestures.includes(g.id);
      return `
        <div class="glass-card gesture-card ${isViewed ? 'viewed' : 'new'}" data-id="${g.id}">
          <div class="gesture-badge">${isViewed ? 'Изучено ✓' : 'Новое +5 XP'}</div>
          <div class="gesture-illustration">
            ${getGestureIllustration(g.visualType)}
          </div>
          <h3>${g.name}</h3>
          <p class="gesture-short-desc">${g.description.substring(0, 75)}...</p>
          <button class="btn btn-secondary open-gesture-btn" data-id="${g.id}">Изучить</button>
        </div>
      `;
    }).join('');

    // Навешиваем обработчики кликов на кнопки "Изучить" и на сами карточки
    listContainer.querySelectorAll('.open-gesture-btn, .gesture-card').forEach(elem => {
      elem.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = elem.getAttribute('data-id');
        openGestureModal(id);
      });
    });
  }

  function openGestureModal(gestureId) {
    audio.playClick();
    const gesture = GESTURES.find(g => g.id === gestureId);
    if (!gesture) return;

    // Начисляем XP и запоминаем просмотр
    const wasNew = userState.viewGesture(gestureId, gesture.category);
    // Добавляем категорию в изученные темы для интервального повторения
    userState.markTopicCompleted(gesture.category);
    
    // Проверим ачивку "все изучено"
    const totalGestures = GESTURES.length;
    if (userState.state.viewedGestures.length === totalGestures) {
      userState.unlockAchievement("all_atlas");
    }

    // Рендерим модальное окно
    const modal = document.createElement('div');
    modal.className = 'gesture-modal-overlay fade-in';
    modal.innerHTML = `
      <div class="gesture-modal-content glass-card slide-up">
        <button class="close-modal-btn">&times;</button>
        <div class="modal-grid">
          <div class="modal-left">
            <div class="modal-illustration">
              ${getGestureIllustration(gesture.visualType, 220, 220)}
            </div>
            <h2>${gesture.name}</h2>
            <div class="modal-xp-alert">${wasNew ? '🎉 Вы изучили этот жест и получили +5 XP!' : 'Вы уже изучали этот жест'}</div>
          </div>
          <div class="modal-right">
            <div class="modal-section">
              <h3>Описание сигнала:</h3>
              <p>${gesture.description}</p>
            </div>
            <div class="modal-section text-accent-container">
              <h3>🧠 Скрытый смысл (Психология):</h3>
              <p>${gesture.meaning}</p>
            </div>
            <div class="modal-section text-emerald-container">
              <h3>💡 Что делать вам (Решение):</h3>
              <p>${gesture.tips}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // заблокировать прокрутку страницы

    // Закрытие модального окна
    const close = () => {
      audio.playClick();
      modal.remove();
      document.body.style.overflow = '';
      updateList(); // Обновить бейджики изучено/новое на карточках
    };

    modal.querySelector('.close-modal-btn').onclick = close;
    modal.onclick = (e) => {
      if (e.target === modal) close();
    };
  }

  // Отрисовка разметки структуры Атласа
  container.innerHTML = `
    <div class="atlas-container fade-in">
      <header class="section-header">
        <h1>Атлас Языка Тела</h1>
        <p>Изучите тайные сигналы тела. Нажмите на жест для детального разбора.</p>
      </header>

      <!-- Фильтры и поиск -->
      <div class="atlas-controls glass-card">
        <div class="search-box">
          <input type="text" id="atlas-search" placeholder="Поиск по жестам..." value="${searchQuery}">
        </div>
        <div class="filter-tabs">
          <button class="tab-btn active" data-filter="all">Все зоны</button>
          <button class="tab-btn" data-filter="face">Мимика и лицо</button>
          <button class="tab-btn" data-filter="hands">Руки и жесты</button>
          <button class="tab-btn" data-filter="torso">Корпус и осанка</button>
          <button class="tab-btn" data-filter="legs">Ноги и позы</button>
        </div>
      </div>

      <!-- Контейнер для списка -->
      <div id="atlas-list" class="atlas-grid"></div>
    </div>
  `;

  // Обработчики фильтров
  const searchInput = document.getElementById('atlas-search');
  searchInput.oninput = (e) => {
    searchQuery = e.target.value;
    updateList();
  };

  const tabs = container.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.onclick = () => {
      audio.playClick();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      updateList();
    };
  });

  // Первичный запуск отрисовки списка
  updateList();
}
