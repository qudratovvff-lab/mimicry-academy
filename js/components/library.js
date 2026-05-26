// Компонент Библиотеки (Книги и статьи)
import { ARTICLES } from '../data.js';
import { userState } from './dashboard.js';
import audio from '../audio.js';

export function renderLibrary() {
  const container = document.getElementById('app');
  const state = userState.state;
  const viewedArticles = state.viewedArticles || [];

  container.innerHTML = `
    <div class="library-container fade-in">
      <header class="section-header">
        <h1>Библиотека Профайлера</h1>
        <p>Выжимки из ключевых книг по языку тела и практические руководства по детекции лжи</p>
      </header>

      <div class="articles-grid">
        ${ARTICLES.map(art => {
          const isRead = viewedArticles.includes(art.id);
          return `
            <div class="glass-card article-card ${isRead ? 'read' : 'unread'}">
              <div class="article-badge">${isRead ? 'Прочитано ✓' : 'Новое +20 XP'}</div>
              <div class="article-card-icon">📚</div>
              <div class="article-card-body">
                <h2>${art.title}</h2>
                <span class="article-author">${art.author}</span>
                <p class="article-summary">${art.summary}</p>
              </div>
              <div class="article-card-footer">
                <span class="read-time">⏱️ ${art.readTime}</span>
                <button class="btn ${isRead ? 'btn-secondary' : 'btn-primary'} read-art-btn" data-id="${art.id}">
                  ${isRead ? 'Перечитать' : 'Читать'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Навешиваем клики на чтение
  container.querySelectorAll('.read-art-btn').forEach(btn => {
    btn.onclick = () => {
      audio.playClick();
      const id = btn.getAttribute('data-id');
      openArticleReader(id);
    };
  });
}

function openArticleReader(articleId) {
  const container = document.getElementById('app');
  const article = ARTICLES.find(a => a.id === articleId);
  if (!article) return;

  // Начисляем XP за прочтение
  userState.readArticle(articleId);

  container.innerHTML = `
    <div class="reader-container fade-in">
      <div class="reader-header-nav">
        <button class="btn btn-secondary back-to-lib-btn">
          <span>←</span> Назад в Библиотеку
        </button>
      </div>

      <article class="reader-content-card glass-card">
        <div class="reader-meta">
          <h1>${article.title}</h1>
          <span class="reader-author">${article.author}</span>
          <span class="reader-time">⏱️ Время чтения: ${article.readTime}</span>
        </div>
        
        <div class="reader-text">
          ${article.content}
        </div>

        <div class="reader-footer">
          <button class="btn btn-primary finish-reading-btn">Завершить чтение</button>
        </div>
      </article>
    </div>
  `;

  // Обработчики возврата
  const goBack = () => {
    audio.playClick();
    renderLibrary();
  };

  container.querySelector('.back-to-lib-btn').onclick = goBack;
  container.querySelector('.finish-reading-btn').onclick = goBack;
}
