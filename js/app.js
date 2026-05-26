// Главный модуль приложения (SPA Router & Инициализация)
import { renderDashboard } from './components/dashboard.js';
import { renderAtlas } from './components/atlas.js';
import { renderQuiz } from './components/quiz.js';
import { renderSimulator } from './components/simulator.js';
import { renderLibrary } from './components/library.js';
import audio from './audio.js';

// Словарь маршрутов
const ROUTES = {
  dashboard: renderDashboard,
  atlas: renderAtlas,
  quiz: renderQuiz,
  simulator: renderSimulator,
  library: renderLibrary
};

let currentRoute = 'dashboard';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupSoundToggle();
  
  // Первая отрисовка
  navigate(currentRoute);

  // Разблокировка звука при первом клике пользователя (требование современных браузеров)
  document.body.addEventListener('click', () => {
    audio.init();
  }, { once: true });
});

// Настройка навигации
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const route = e.currentTarget.getAttribute('data-route');
      if (route && ROUTES[route]) {
        audio.playClick();
        
        // Убираем класс active у старой кнопки и ставим новой
        navItems.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        navigate(route);
      }
    });
  });
}

// Навигационный переход
function navigate(route) {
  currentRoute = route;
  
  const appContainer = document.getElementById('app');
  // Добавляем класс анимации угасания перед сменой экрана (если нужно, но в CSS настроен fade-in для новых контейнеров)
  
  // Рендерим нужный компонент
  ROUTES[route]();
}

// Настройка кнопки включения/выключения звука в шапке
function setupSoundToggle() {
  const soundBtn = document.getElementById('sound-toggle');
  if (!soundBtn) return;

  // Устанавливаем начальную иконку
  updateSoundIcon(audio.isMuted());

  soundBtn.addEventListener('click', () => {
    const isMutedNow = audio.toggleMute();
    updateSoundIcon(isMutedNow);
    
    // Если размутили — играем подтверждающий клик
    if (!isMutedNow) {
      audio.playClick();
    }
  });
}

function updateSoundIcon(isMuted) {
  const soundBtn = document.getElementById('sound-toggle');
  if (!soundBtn) return;
  
  if (isMuted) {
    soundBtn.innerHTML = '🔇';
    soundBtn.title = 'Включить звук';
  } else {
    soundBtn.innerHTML = '🔊';
    soundBtn.title = 'Отключить звук';
  }
}
