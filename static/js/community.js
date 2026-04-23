const CATEGORY_LABELS = {
  stress:      '😰 Exam Stress',
  placement:   '💼 Placement Anxiety',
  overwhelmed: '😤 Overwhelmed',
  sleep:       '😴 Sleep Issues',
  motivation:  '🔥 Motivation',
  win:         '🎉 Small Win',
  general:     '💭 General'
};

const CATEGORY_COLORS = {
  stress:      'rgba(224,120,120,0.15)',
  placement:   'rgba(99,179,193,0.15)',
  overwhelmed: 'rgba(224,184,120,0.15)',
  sleep:       'rgba(142,210,192,0.15)',
  motivation:  'rgba(167,139,250,0.15)',
  win:         'rgba(120,201,160,0.15)',
  general:     'rgba(255,255,255,0.05)'
};

const DEMO_POSTS = [
  { id:1, category:'stress', content:"Exam season is killing me. 3 exams in 2 days and I haven't slept properly in a week. Just needed to say this somewhere.", likes:12, replies:3, time:'2h ago' },
  { id:2, category:'win', content:"Got my first internship offer today! Was rejected 11 times before this. Don't give up — it takes time but it happens.", likes:47, replies:8, time:'4h ago' },
  { id:3, category:'placement', content:"Everyone in my batch seems to be getting placed and I'm still waiting. It's hard not to compare myself. Anyone else feeling this?", likes:23, replies:6, time:'6h ago' },
  { id:4, category:'overwhelmed', content:"Between assignments, hackathon prep, and internship — I feel like I'm drowning. Taking a 30 minute break right now. Self care is important.", likes:31, replies:4, time:'8h ago' },
  { id:5, category:'motivation', content:"Remember: you got into engineering college. That alone means you are capable of things most people aren't. Keep going.", likes:58, replies:2, time:'1d ago' },
  { id:6, category:'sleep', content:"Slept only 3 hours last night studying and then blanked on the exam. Please sleep before exams. I learned the hard way.", likes:19, replies:5, time:'1d ago' },
  { id:7, category:'stress', content:"My CGPA dropped this semester and I'm scared of telling my parents. Anyone else dealing with family pressure?", likes:34, replies:9, time:'2d ago' },
  { id:8, category:'win', content:"Finally understood recursion after struggling for 2 weeks. Sometimes things just click. Never stop trying!", likes:41, replies:3, time:'2d ago' },
];

let currentFilter = 'all';
let posts = [...DEMO_POSTS];

function renderPost(post) {
  const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general;
  const catLabel = CATEGORY_LABELS[post.category] || '💭 General';

  return `
    <div class="community-post fade-up" data-cat="${post.category}" style="
      background:var(--card); border:1px solid var(--border);
      border-radius:16px; padding:1.5rem; margin-bottom:1.25rem;
      transition:all 0.3s; position:relative; overflow:hidden;
    ">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${catColor.replace('0.15', '0.6')};border-radius:16px 16px 0 0;"></div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
        <span style="font-size:0.72rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);background:${catColor};padding:0.25rem 0.75rem;border-radius:100px;">${catLabel}</span>
        <span style="font-size:0.75rem;color:var(--text3);">${post.time}</span>
      </div>
      <p style="color:var(--text);line-height:1.7;font-size:0.95rem;margin-bottom:1rem;">${post.content}</p>
      <div style="display:flex;gap:1rem;align-items:center;">
        <button onclick="likePost(${post.id}, this)" style="
          background:none;border:1px solid var(--border);color:var(--text2);
          padding:0.3rem 0.75rem;border-radius:100px;cursor:pointer;
          font-size:0.82rem;transition:all 0.2s;display:flex;align-items:center;gap:0.4rem;
        ">❤️ <span class="like-count">${post.likes}</span></button>
        <button onclick="replyToPost(${post.id}, this)" style="
          background:none;border:1px solid var(--border);color:var(--text2);
          padding:0.3rem 0.75rem;border-radius:100px;cursor:pointer;
          font-size:0.82rem;transition:all 0.2s;
        ">💬 ${post.replies} replies</button>
        <span style="font-size:0.75rem;color:var(--text3);margin-left:auto;">Anonymous</span>
      </div>
      <div class="reply-box" id="reply-${post.id}" style="display:none;margin-top:1rem;">
        <textarea placeholder="Write a supportive reply..." style="
          width:100%;background:var(--bg2);border:1px solid var(--border);
          border-radius:10px;color:var(--text);padding:0.75rem;
          font-size:0.88rem;resize:none;outline:none;font-family:inherit;
        " rows="2"></textarea>
        <button onclick="submitReply(${post.id}, this)" class="btn-primary" style="margin-top:0.5rem;font-size:0.85rem;padding:0.5rem 1.2rem;">
          Send Support
        </button>
      </div>
    </div>
  `;
}

function renderPosts(filter = 'all') {
  const feed = document.getElementById('posts-feed');
  const loading = document.getElementById('posts-loading');
  const empty = document.getElementById('posts-empty');

  loading.style.display = 'none';

  const filtered = filter === 'all' ? posts : posts.filter(p => p.category === filter);

  if (filtered.length === 0) {
    feed.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  feed.innerHTML = filtered.map(renderPost).join('');
}

function filterPosts(cat, el) {
  currentFilter = cat;
  document.querySelectorAll('#filter-tags .tag').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderPosts(cat);
}

function likePost(id, btn) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  post.likes++;
  btn.querySelector('.like-count').textContent = post.likes;
  btn.style.borderColor = 'rgba(224,120,120,0.5)';
  btn.style.color = '#e07878';
  btn.disabled = true;
}

function replyToPost(id, btn) {
  const box = document.getElementById(`reply-${id}`);
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function submitReply(id, btn) {
  const box = document.getElementById(`reply-${id}`);
  const textarea = box.querySelector('textarea');
  const text = textarea.value.trim();
  if (!text) return;

  const post = posts.find(p => p.id === id);
  if (post) post.replies++;

  textarea.value = '';
  box.style.display = 'none';

  showToast('Your support has been shared! 💙');

  fetch('/community/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_id: id, content: text })
  }).catch(() => {});
}

async function submitPost() {
  const content = document.getElementById('post-content').value.trim();
  const category = document.getElementById('post-category').value;

  if (!content) {
    document.getElementById('post-content').style.borderColor = 'var(--danger)';
    return;
  }

  const btn = document.getElementById('post-btn');
  btn.textContent = '⏳ Posting...';
  btn.disabled = true;

  const newPost = {
    id: Date.now(),
    category,
    content,
    likes: 0,
    replies: 0,
    time: 'Just now'
  };

  try {
    const res = await fetch('/community/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, content })
    });
    if (res.ok) {
      const data = await res.json();
      newPost.id = data.id || newPost.id;
    }
  } catch (e) {}

  posts.unshift(newPost);
  document.getElementById('post-content').value = '';
  document.getElementById('post-success').style.display = 'block';
  setTimeout(() => document.getElementById('post-success').style.display = 'none', 4000);

  btn.textContent = 'Post Anonymously';
  btn.disabled = false;

  renderPosts(currentFilter);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);
    background:var(--card);border:1px solid var(--border);
    color:var(--text);padding:0.75rem 1.5rem;border-radius:100px;
    font-size:0.88rem;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,0.3);
    animation:fadeUp 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Fix #6: Merged both DOMContentLoaded listeners into one to prevent race condition
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/community/posts');
    const data = await res.json();
    if (data.posts && data.posts.length > 0) {
      posts = [...data.posts, ...DEMO_POSTS];
    }
  } catch (e) {
    // Server not available — demo posts will show
  }
  setTimeout(() => renderPosts(), 600);
});
