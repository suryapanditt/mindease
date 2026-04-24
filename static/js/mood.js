const TIPS = {
  low: [
    "You're doing well! Keep your sleep schedule consistent and take short breaks.",
    "Great job managing stress. Try gratitude journaling to maintain this positive state.",
    "Keep it up! Stay hydrated and maintain your social connections."
  ],
  medium: [
    "Try the Pomodoro technique: 25 min study, 5 min break. It prevents mental fatigue.",
    "Take a 10-minute walk. Physical movement directly reduces cortisol levels.",
    "Practice box breathing: Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4 times.",
    "Make a priority list — focus on the top 3 tasks only today."
  ],
  high: [
    "Take a break RIGHT NOW. Close your books for 30 minutes. Overworking increases mistakes.",
    "Talk to someone you trust — a friend or family member.",
    "Your sleep is likely suffering. Even a 20-minute nap can restore focus.",
    "Try progressive muscle relaxation: tense each muscle group for 5s, then release.",
    "Consider talking to your college counsellor. Asking for help is strength, not weakness."
  ]
};

function updateSlider(id, labelId, suffix) {
  const val = document.getElementById(id).value;
  document.getElementById(labelId).textContent = val + ' ' + suffix;
}
function toggleTag(el) { el.classList.toggle('active'); }

function animateNeedle(level) {
  const meter  = document.getElementById('stress-meter');
  const needle = document.getElementById('stress-needle');
  if (!meter || !needle) return;
  meter.style.display = 'block';
  const angleMap = { low: -75, medium: 0, high: 75 };
  needle.style.transform = `rotate(${angleMap[level] || 0}deg)`;
  const colors = { low: '#78c9a0', medium: '#e0b878', high: '#e07878' };
  needle.querySelector('line').style.stroke = colors[level];
  needle.querySelectorAll('circle')[0].style.fill = colors[level];
}

function setLoading(on) {
  const btn = document.getElementById('predict-btn');
  btn.textContent = on ? '⏳ Analyzing...' : '🔍 Predict My Stress Level';
  btn.disabled    = on;
  btn.style.opacity = on ? '0.7' : '1';
}

let lastInputs = {};

document.getElementById('mood-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const errBox = document.getElementById('predict-error');
  if (errBox) errBox.style.display = 'none';

  // ✅ BUG FIXED: was reading 'study' element for mood — now correctly reads 'mood'
  lastInputs = {
    sleep:   parseFloat(document.getElementById('sleep').value),
    study:   parseFloat(document.getElementById('study').value),
    mood:    parseInt(document.getElementById('mood').value),    // ✅ FIXED
    anxiety: parseInt(document.getElementById('anxiety').value),
    social:  parseInt(document.getElementById('social').value),
    tags:    [...document.querySelectorAll('#situation-tags .tag.active')]
               .map(t => t.textContent.trim())
  };

  const payload = {
    sleep_hours:    lastInputs.sleep,
    study_hours:    lastInputs.study,
    mood_rating:    lastInputs.mood,
    anxiety_level:  lastInputs.anxiety,
    social_score:   lastInputs.social,
    situation_tags: lastInputs.tags
  };

  setLoading(true);

  try {
    const res = await fetch('/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    showResult(data.stress_level, data.stress_score, data.tip);
  } catch (err) {
    if (errBox) {
      errBox.textContent = '⚠️ Server se connect nahi ho pa raha. Please refresh karein.';
      errBox.style.display = 'block';
    }
    console.error('Predict error:', err);
  }

  setLoading(false);
});

/* ── Share Card ─────────────────────────────────────── */
let lastResult = { level: '', tip: '' };
let activeTab  = 'simple';

const LEVEL_COLORS = {
  low:    { text: '#78c9a0', label: 'Low Stress 🌿' },
  medium: { text: '#e0b878', label: 'Moderate Stress ⚡' },
  high:   { text: '#e07878', label: 'High Stress 🔥' }
};

function showResult(level, score, tip) {
  animateNeedle(level);
  lastResult = { level, tip };

  ['low', 'medium', 'high'].forEach(l => {
    const el = document.getElementById('result-' + l);
    if (el) el.style.display = 'none';
  });

  const resultEl = document.getElementById('result-' + level);
  if (resultEl) resultEl.style.display = 'block';

  const tipsEl = document.getElementById('tips-' + level);
  if (tipsEl) tipsEl.textContent = tip;

  const badge = document.getElementById('model-badge');
  if (badge) {
    badge.textContent   = '🤖 Predicted by Random Forest ML Model (90.5% accuracy)';
    badge.style.display = 'block';
  }

  const chatCta = document.getElementById('chat-cta');
  if (chatCta) chatCta.style.display = 'block';

  const wrap = document.getElementById('share-result-wrap');
  if (wrap) wrap.style.display = 'block';

  if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function openShareCard() {
  const { level, tip } = lastResult;
  if (!level) return;

  const col    = LEVEL_COLORS[level];
  const emojis = { low: '🌿', medium: '⚡', high: '🔥' };
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  document.getElementById('sc-emoji').textContent = emojis[level];
  document.getElementById('sc-level').textContent = col.label;
  document.getElementById('sc-level').style.color = col.text;
  document.getElementById('sc-tip').textContent   = tip;
  document.getElementById('sc-date').textContent  = dateStr;

  document.getElementById('sd-emoji').textContent = emojis[level];
  document.getElementById('sd-level').textContent = col.label;
  document.getElementById('sd-level').style.color = col.text;
  document.getElementById('sd-tip').textContent   = tip;
  document.getElementById('sd-date').textContent  = dateStr;

  const inputRows = [
    { label: '😴 Sleep',   value: lastInputs.sleep   + ' hrs' },
    { label: '📚 Study',   value: lastInputs.study   + ' hrs' },
    { label: '😊 Mood',    value: lastInputs.mood    + '/10'  },
    { label: '😰 Anxiety', value: lastInputs.anxiety + '/10'  },
    { label: '👥 Social',  value: lastInputs.social  + '/10'  },
  ];

  document.getElementById('sd-inputs').innerHTML = inputRows.map(r => `
    <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:0.4rem 0.6rem;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:0.72rem;color:rgba(255,255,255,0.45);">${r.label}</span>
      <span style="font-size:0.78rem;font-weight:600;color:#e8edf5;">${r.value}</span>
    </div>
  `).join('');

  const tagsEl = document.getElementById('sd-tags');
  if (lastInputs.tags && lastInputs.tags.length > 0) {
    tagsEl.innerHTML = lastInputs.tags.map(t => `
      <span style="font-size:0.68rem;padding:0.2rem 0.55rem;background:rgba(99,179,193,0.15);border:1px solid rgba(99,179,193,0.25);border-radius:100px;color:#63b3c1;">${t}</span>
    `).join('');
  } else {
    tagsEl.innerHTML = '';
  }

  switchTab('simple');
  document.getElementById('share-modal').classList.add('open');
}

function closeShareCard() {
  document.getElementById('share-modal').classList.remove('open');
}

function switchTab(tab) {
  activeTab = tab;
  const simpleCard  = document.getElementById('share-card');
  const detailCard  = document.getElementById('share-card-detailed');
  const btnSimple   = document.getElementById('tab-simple');
  const btnDetailed = document.getElementById('tab-detailed');

  if (tab === 'simple') {
    simpleCard.style.display     = 'block';
    detailCard.style.display     = 'none';
    btnSimple.style.background   = 'var(--accent)';
    btnSimple.style.color        = '#fff';
    btnSimple.style.fontWeight   = '600';
    btnDetailed.style.background = 'transparent';
    btnDetailed.style.color      = 'var(--text2)';
    btnDetailed.style.fontWeight = '400';
  } else {
    simpleCard.style.display     = 'none';
    detailCard.style.display     = 'block';
    btnDetailed.style.background = 'var(--accent)';
    btnDetailed.style.color      = '#fff';
    btnDetailed.style.fontWeight = '600';
    btnSimple.style.background   = 'transparent';
    btnSimple.style.color        = 'var(--text2)';
    btnSimple.style.fontWeight   = '400';
  }
}

async function downloadShareCard() {
  const cardId = activeTab === 'simple' ? 'share-card' : 'share-card-detailed';
  const card   = document.getElementById(cardId);
  const btn    = document.getElementById('download-btn');

  btn.textContent = '⏳ Generating...';
  btn.disabled    = true;

  const wasHidden = card.style.display === 'none';
  if (wasHidden) card.style.display = 'block';

  try {
    if (!window.html2canvas) {
      await new Promise((res, rej) => {
        const s  = document.createElement('script');
        s.src    = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const canvas  = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
    const link    = document.createElement('a');
    const suffix  = activeTab === 'simple' ? 'simple' : 'detailed';
    link.download = `mindease-mood-${suffix}-${Date.now()}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  } catch(e) {
    alert('Download failed. Try right-click → Save image on the card.');
  }

  if (wasHidden) card.style.display = 'none';
  btn.textContent = '⬇️ Download PNG';
  btn.disabled    = false;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('share-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeShareCard();
  });
});
