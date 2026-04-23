
(function() {
  const loader = document.createElement('div');
  loader.id = 'mindease-loader';
  loader.innerHTML = `
    <div class="loader-inner">
      <div class="loader-logo">🧘</div>
      <div class="loader-name">Mind<span>Ease</span></div>
      <div class="loader-bar-wrap"><div class="loader-bar"></div></div>
      <div class="loader-text">Loading your safe space...</div>
    </div>
  `;
  loader.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:#080e1a;
    display:flex;align-items:center;justify-content:center;
    transition:opacity 0.5s ease;
  `;
  document.body.prepend(loader);

  const style = document.createElement('style');
  style.textContent = `
    .loader-inner { text-align:center; }
    .loader-logo { font-size:3rem; margin-bottom:0.75rem; animation: loaderPulse 1.2s ease-in-out infinite; }
    .loader-name { font-family:'Syne',sans-serif; font-size:1.8rem; font-weight:800; color:#e8edf5; letter-spacing:-0.02em; margin-bottom:1.5rem; }
    .loader-name span { color:#63b3c1; }
    .loader-bar-wrap { width:180px; height:3px; background:rgba(255,255,255,0.08); border-radius:2px; margin:0 auto 1rem; overflow:hidden; }
    .loader-bar { height:100%; width:0%; background:linear-gradient(90deg,#63b3c1,#8ed2c0); border-radius:2px; transition:width 0.3s ease; }
    .loader-text { font-size:0.8rem; color:#5a6a88; letter-spacing:0.05em; }
    @keyframes loaderPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.12);} }
  `;
  document.head.appendChild(style);

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 25;
    if (progress > 100) progress = 100;
    const bar = document.querySelector('.loader-bar');
    if (bar) bar.style.width = progress + '%';
    if (progress >= 100) clearInterval(interval);
  }, 120);

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }, 600);
  });
})();

(function() {
  const style = document.createElement('style');
  style.textContent = `
    .page-transition-overlay {
      position:fixed;inset:0;z-index:8888;
      background:#080e1a;
      opacity:0;pointer-events:none;
      transition:opacity 0.3s ease;
    }
    .page-transition-overlay.active {
      opacity:1;pointer-events:all;
    }
    .page-wrap { animation: pageFadeIn 0.4s ease forwards; }
    @keyframes pageFadeIn {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  document.body.appendChild(overlay);

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || link.target === '_blank') return;
    e.preventDefault();
    overlay.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 280);
  });
})();

function updateSlider(id, labelId, suffix) {
  const val = document.getElementById(id).value;
  document.getElementById(labelId).textContent = val + ' ' + suffix;
}

function toggleTag(el) {
  el.classList.toggle('active');
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
      entry.target.style.opacity = 1;
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => {
  el.style.animationPlayState = 'paused';
  observer.observe(el);
});

/* ── Burger Menu ─────────────────────────── */
function toggleNav() {
  const btn = document.getElementById('burger-btn');
  const nav = document.getElementById('mobile-nav');
  const overlay = document.getElementById('nav-overlay');
  btn.classList.toggle('open');
  nav.classList.toggle('open');
  overlay.classList.toggle('open');
}
function closeNav() {
  document.getElementById('burger-btn')?.classList.remove('open');
  document.getElementById('mobile-nav')?.classList.remove('open');
  document.getElementById('nav-overlay')?.classList.remove('open');
}

/* ── Emergency Modal ─────────────────────── */
function openEmergency() {
  document.getElementById('emergency-modal').classList.add('open');
}
function closeEmergency() {
  document.getElementById('emergency-modal').classList.remove('open');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeNav(); closeEmergency(); }
});

/* ── Theme Toggle ─────────────────────────── */
(function() {
  const saved = localStorage.getItem('mindease_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

function initThemeToggle() {
  const btns = document.querySelectorAll('.theme-toggle');
  btns.forEach(btn => {
    updateToggleIcon(btn);
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('mindease_theme', next);
      btns.forEach(b => updateToggleIcon(b));
    });
  });
}
function updateToggleIcon(btn) {
  const knob = btn.querySelector('.theme-toggle-knob');
  if (!knob) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  knob.textContent = isDark ? '🌙' : '☀️';
}

/* ── Scroll To Top ────────────────────────── */
function initScrollTop() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── Community post animation ─────────────── */
function animatePosts() {
  const posts = document.querySelectorAll('.community-post');
  posts.forEach((post, i) => {
    post.classList.add('community-post-anim');
    post.style.animationDelay = (i * 0.07) + 's';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initScrollTop();
  const observer2 = new MutationObserver(() => animatePosts());
  const feed = document.getElementById('posts-feed');
  if (feed) observer2.observe(feed, { childList: true });
});
