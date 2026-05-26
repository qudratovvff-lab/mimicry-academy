// Интерактивный симулятор диалогов и детекции лжи
import { SIMULATOR_SCENARIOS } from '../data.js';
import { getGestureIllustration } from './atlas.js';
import { userState } from './dashboard.js';
import audio from '../audio.js';

export function renderSimulator() {
  const container = document.getElementById('app');

  // Меню выбора сценария
  container.innerHTML = `
    <div class="simulator-container fade-in">
      <header class="section-header">
        <h1>Симулятор Общения</h1>
        <p>Применяйте навыки чтения языка тела на практике в реальных жизненных сценариях</p>
      </header>

      <div class="scenarios-grid">
        ${Object.keys(SIMULATOR_SCENARIOS).map(key => {
          const sc = SIMULATOR_SCENARIOS[key];
          return `
            <div class="glass-card scenario-card">
              <div class="scenario-meta">
                <h2>${sc.title}</h2>
                <p class="scenario-desc">${sc.description}</p>
              </div>
              <div class="scenario-details">
                <span>📍 Локация: ${sc.background.split('.')[0]}</span>
              </div>
              <button class="btn btn-primary start-scenario-btn" data-id="${key}">Запустить сценарий</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Обработчик запуска сценария
  container.querySelectorAll('.start-scenario-btn').forEach(btn => {
    btn.onclick = () => {
      audio.playClick();
      const id = btn.getAttribute('data-id');
      startScenario(id);
    };
  });
}

function startScenario(scenarioId) {
  const container = document.getElementById('app');
  const scenario = SIMULATOR_SCENARIOS[scenarioId];
  let currentNodeId = scenario.startNode;
  
  // Метрики прохождения
  let trust = 50;
  let suspicion = 30;

  function renderNode() {
    const node = scenario.nodes[currentNodeId];
    
    // Проверка финала
    if (node.isEnd) {
      renderScenarioEnd(scenario, node, trust, suspicion, scenarioId);
      return;
    }

    container.innerHTML = `
      <div class="simulator-play-container fade-in">
        <!-- Заголовок сценария и метрики -->
        <div class="simulator-header">
          <div class="sim-title-box">
            <h2>${scenario.title}</h2>
            <p>${scenario.background}</p>
          </div>
          <div class="sim-metrics">
            <div class="metric-item">
              <span>Доверие:</span>
              <div class="metric-bar-track">
                <div class="metric-bar-fill trust-fill" style="width: ${trust}%"></div>
              </div>
              <span>${trust}%</span>
            </div>
            <div class="metric-item">
              <span>Подозрение во лжи:</span>
              <div class="metric-bar-track">
                <div class="metric-bar-fill suspicion-fill" style="width: ${suspicion}%"></div>
              </div>
              <span>${suspicion}%</span>
            </div>
          </div>
        </div>

        <div class="simulator-main-grid">
          <!-- Левая колонка: Персонаж и описание жеста -->
          <div class="character-visual-card glass-card">
            <div class="char-avatar-container">
              ${getGestureIllustration(node.characterPose, 220, 220)}
            </div>
            <div class="cue-description-box">
              <h4>🔍 Наблюдение за телом:</h4>
              <p>${node.nonVerbalCue}</p>
            </div>
          </div>

          <!-- Правая колонка: Диалог и реплики -->
          <div class="dialogue-box glass-card">
            <div class="char-speech-bubble">
              <span class="char-name">Собеседник:</span>
              <p class="char-speech-text">"${node.characterText}"</p>
            </div>

            <div class="user-choices-list">
              <h4>Ваша реакция:</h4>
              ${node.choices.map((ch, idx) => `
                <button class="choice-btn" data-index="${idx}">
                  <span class="choice-index">${idx + 1}</span>
                  <span class="choice-text">${ch.text}</span>
                </button>
              `).join('')}
            </div>

            <!-- Блок разбора хода, появляется после клика -->
            <div class="choice-feedback-card hidden" id="choice-feedback">
              <div class="feedback-header"></div>
              <p class="feedback-desc"></p>
              <button class="btn btn-primary next-node-btn">Продолжить</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const choiceButtons = container.querySelectorAll('.choice-btn');
    const feedbackCard = document.getElementById('choice-feedback');
    const choicesList = container.querySelector('.user-choices-list');
    let hasChosen = false;

    choiceButtons.forEach(btn => {
      btn.onclick = () => {
        if (hasChosen) return;
        hasChosen = true;

        const idx = parseInt(btn.getAttribute('data-index'));
        const ch = node.choices[idx];

        // Обновляем метрики
        if (ch.trustChange) trust = Math.max(0, Math.min(100, trust + ch.trustChange));
        if (ch.suspicionChange) suspicion = Math.max(0, Math.min(100, suspicion + ch.suspicionChange));

        // Выделяем выбранную кнопку
        btn.classList.add('selected');
        choiceButtons.forEach(b => b.setAttribute('disabled', 'true'));

        // Звук клика
        audio.playClick();

        // Показываем разбор хода
        const feedbackHeader = feedbackCard.querySelector('.feedback-header');
        if (ch.trustChange > 0 && ch.suspicionChange <= 0) {
          feedbackHeader.innerHTML = `<span class="res-badge success">Хороший контакт</span>`;
        } else if (ch.trustChange < 0 && ch.suspicionChange >= 0) {
          feedbackHeader.innerHTML = `<span class="res-badge danger">Напряжение выросло</span>`;
        } else {
          feedbackHeader.innerHTML = `<span class="res-badge warning">Смена позиций</span>`;
        }

        feedbackCard.querySelector('.feedback-desc').innerText = ch.correctReason || "Вы перешли к следующему этапу диалога.";
        
        // Показываем фидбэк, скрываем список выборов
        choicesList.style.display = 'none';
        feedbackCard.classList.remove('hidden');

        // Кнопка продолжения диалога
        feedbackCard.querySelector('.next-node-btn').onclick = () => {
          audio.playClick();
          currentNodeId = ch.leadsTo;
          renderNode();
        };
      };
    });
  }

  renderNode();
}

function renderScenarioEnd(scenario, endNode, finalTrust, finalSuspicion, scenarioId) {
  const container = document.getElementById('app');
  
  // Логика раздачи опыта и достижений на основе результатов
  let resultTitle = "";
  let resultText = "";
  let xpAwarded = 10;
  let statusClass = "fail";

  switch (endNode.scoreType) {
    case "success":
      resultTitle = "🏆 Блестящий успех!";
      resultText = "Вы идеально провели собеседование! Распознали тревожные сигналы почесывания шеи, не скатились в агрессию и наняли честного, сильного кандидата.";
      xpAwarded = 50;
      statusClass = "success";
      break;
    case "compromise":
      resultTitle = "🤝 Удовлетворительный компромисс";
      resultText = "Вы заметили скрытый стресс и почесывание шеи. Хотя кандидат приукрасил свое резюме (в чем и сознался после ваших точных вопросов), вы сохранили контроль и выявили истинные компетенции.";
      xpAwarded = 30;
      statusClass = "warning";
      if (scenarioId === "interview") userState.unlockAchievement("liar_hunter");
      break;
    case "success_hard":
      resultTitle = "⚡ Жесткий прорыв!";
      resultText = "Вы успешно выявили ухмылку Виктора Петровича и вскрыли его блеф! В итоге получили скидку в 10% на аренду при длительном контракте.";
      xpAwarded = 50;
      statusClass = "success";
      if (scenarioId === "negotiation") userState.unlockAchievement("negotiator");
      break;
    case "success_soft":
      resultTitle = "🤝 Взаимовыгодное соглашение";
      resultText = "Вы действовали мягко, сняли психологические барьеры скрещенных рук и договорились о скидке 10% за счет предложения аванса.";
      xpAwarded = 50;
      statusClass = "success";
      if (scenarioId === "negotiation") userState.unlockAchievement("negotiator");
      break;
    case "low_gain":
      resultTitle = "📉 Минимальный результат";
      resultText = "Вы пошли на уступку при первой же возможности и получили всего 7% скидки, хотя по сигналам тела оппонента можно было понять, что он готов уступить больше.";
      xpAwarded = 20;
      statusClass = "warning";
      break;
    case "naive_fail":
      resultTitle = "🤡 Жертва манипуляции";
      resultText = "Вы проигнорировали все сигналы лжи и поверили кандидату на слово. Нанятый сотрудник окажется неэффективным и лживым.";
      xpAwarded = 10;
      statusClass = "danger";
      break;
    case "fail":
    default:
      resultTitle = "✗ Полный провал переговоров";
      resultText = "Вы проигнорировали сигналы закрытости оппонента, перешли на открытый конфликт или обвинения. Диалог полностью сорван.";
      xpAwarded = 10;
      statusClass = "danger";
      break;
  }

  // Зачисляем XP
  userState.addXp(xpAwarded);

  container.innerHTML = `
    <div class="scenario-end-container fade-in">
      <div class="glass-card result-end-card ${statusClass}">
        <div class="result-end-header">
          <h1>${resultTitle}</h1>
          <h3>Сценарий: ${scenario.title}</h3>
        </div>

        <div class="result-end-body">
          <p class="final-explanation-text">${endNode.nonVerbalCue}</p>
          <p class="result-summary-desc">${resultText}</p>
          
          <div class="final-metrics-row">
            <div class="final-metric-box">
              <span class="final-metric-val">${finalTrust}%</span>
              <span class="final-metric-lbl">Итоговое Доверие</span>
            </div>
            <div class="final-metric-box">
              <span class="final-metric-val">${finalSuspicion}%</span>
              <span class="final-metric-lbl">Итоговое Подозрение</span>
            </div>
            <div class="final-metric-box">
              <span class="final-metric-val text-emerald">+${xpAwarded} XP</span>
              <span class="final-metric-lbl">Награда опыта</span>
            </div>
          </div>
        </div>

        <div class="result-end-actions">
          <button class="btn btn-primary restart-scenario-btn">Повторить сценарий</button>
          <button class="btn btn-secondary exit-sim-btn">Выйти в меню симулятора</button>
        </div>
      </div>
    </div>
  `;

  // Подключаем кнопки перезапуска и выхода
  container.querySelector('.restart-scenario-btn').onclick = () => {
    audio.playClick();
    startScenario(scenarioId);
  };

  container.querySelector('.exit-sim-btn').onclick = () => {
    audio.playClick();
    renderSimulator();
  };
}
