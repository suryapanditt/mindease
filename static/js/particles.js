(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W, H, stars = [], shoots = [], nebulae = [], sparkles = [];
  const N = 700;
  const COLS_DARK  = ['#63b3c1','#8ed2c0','#5eead4','#a78bfa','#ffffff','#ffffff','#ffffff','#7dd3fc'];
  const COLS_LIGHT = ['#1a7a8a','#2a9a7a','#1a6a8a','#5a4aaa','#2a5a7a','#1a6a7a','#3a5a8a','#1a7aaa'];
  function COLS() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? COLS_LIGHT : COLS_DARK;
  }
  const mouse = { x:-9999, y:-9999 };

  function R(a,b){ return Math.random()*(b-a)+a; }
  function RI(a,b){ return Math.floor(R(a,b)); }
  function toRgb(hex){
    const h=hex.replace('#','');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }

  function mkStar(){
    const x=R(0,W), y=R(0,H);
    return { x, y, ox:x, oy:y,
      vx:R(-0.15,0.15), vy:R(-0.15,0.15),
      r:R(0.5,2.2), col:COLS()[~~(Math.random()*COLS().length)],
      a:R(0.3,1.0), tw:R(0,Math.PI*2), tws:R(0.005,0.04) };
  }

  function mkNeb(){
    return { x:R(0,W), y:R(0,H), r:R(100,220), col:COLS()[~~(Math.random()*COLS().length)],
      a:R(0.01,0.03), p:R(0,Math.PI*2), ps:R(0.003,0.007) };
  }

  function mkShoot(){
    return { x:R(0,W*0.6), y:R(0,H*0.3), vx:R(7,13), vy:R(2,5), life:1, decay:R(0.015,0.028) };
  }

  function mkSparkle(){
    return {
      x:R(0,W), y:R(0,H),
      size:R(4,10),
      col:COLS()[~~(Math.random()*COLS().length)],
      life:1, decay:R(0.008,0.02),
      growing:true
    };
  }

  function init(){
    resize();
    stars   = Array.from({length:N}, mkStar);
    nebulae = Array.from({length:5}, mkNeb);
    shoots  = [];
    sparkles = [];
  }

  function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }

  function drawStarShape(x, y, size, col, alpha){
    const [r,g,b] = toRgb(col);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(${r},${g},${b},1)`;
    ctx.fillRect(x - 0.8, y - size, 1.6, size*2);
    ctx.fillRect(x - size, y - 0.8, size*2, 1.6);
    const gr = ctx.createRadialGradient(x,y,0,x,y,size*1.5);
    gr.addColorStop(0,`rgba(${r},${g},${b},0.3)`);
    gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x,y,size*1.5,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function frame(){
    ctx.clearRect(0,0,W,H);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    nebulae.forEach(n=>{
      n.p += n.ps;
      const alpha = (n.a + 0.01*Math.sin(n.p)) * (isLight ? 2.5 : 1);
      const [r,g,b] = toRgb(n.col);
      const gr = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
      gr.addColorStop(0,`rgba(${r},${g},${b},${alpha})`);
      gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle = gr;
      ctx.fill();
    });
    ctx.save();
    if(Math.random()<0.004) shoots.push(mkShoot());
    shoots = shoots.filter(s=>s.life>0);
    shoots.forEach(s=>{
      s.x+=s.vx; s.y+=s.vy; s.life-=s.decay;
      const gr = ctx.createLinearGradient(s.x-s.vx*8,s.y-s.vy*8,s.x,s.y);
      gr.addColorStop(0,'rgba(255,255,255,0)');
      gr.addColorStop(1,`rgba(255,255,255,${s.life*0.9})`);
      ctx.beginPath();
      ctx.moveTo(s.x-s.vx*8, s.y-s.vy*8);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = gr;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.restore();
    if(Math.random()<0.03) sparkles.push(mkSparkle());
    sparkles = sparkles.filter(s=>s.life>0);
    sparkles.forEach(s=>{
      s.life -= s.decay;
      const alpha = s.life;
      drawStarShape(s.x, s.y, s.size, s.col, alpha);
    });
    stars.forEach(p=>{
      const dx=p.x-mouse.x, dy=p.y-mouse.y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<90&&d>0){ p.vx+=(dx/d)*0.12; p.vy+=(dy/d)*0.12; }
      p.vx += (p.ox - p.x) * 0.004;
      p.vy += (p.oy - p.y) * 0.004;

      p.vx*=0.95; p.vy*=0.95;
      p.x+=p.vx; p.y+=p.vy;
      p.tw+=p.tws;
      p.ox += p.vx * 0.005;
      p.oy += p.vy * 0.005;
      if(p.ox<0)p.ox=W; if(p.ox>W)p.ox=0;
      if(p.oy<0)p.oy=H; if(p.oy>H)p.oy=0;
      if(p.x<0)p.x=W;   if(p.x>W)p.x=0;
      if(p.y<0)p.y=H;   if(p.y>H)p.y=0;

      const alpha = p.a*(0.5+0.5*Math.sin(p.tw)) * (isLight ? 1.8 : 1);
      const [r,g,b] = toRgb(p.col);

      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();

      if(p.r>1.5){
        const gr = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);
        gr.addColorStop(0,`rgba(${r},${g},${b},${alpha*0.15})`);
        gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r*4,0,Math.PI*2);
        ctx.fillStyle = gr;
        ctx.fill();
      }
    });

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', init);
  window.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
  window.addEventListener('mouseleave', ()=>{ mouse.x=-9999; mouse.y=-9999; });

  // Reinit particles when theme changes — no refresh needed!
  new MutationObserver(() => { init(); }).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['data-theme'] }
  );

  init();
  frame();
})();
