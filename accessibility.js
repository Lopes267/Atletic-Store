(function () {
  const css = `
    #a11y-lupa-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9998;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #D42B2B;
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 14px rgba(0,0,0,0.25);
      transition: background .2s, transform .15s, box-shadow .15s;
      outline: none;
    }
    #a11y-lupa-btn:hover {
      background: #A91E1E;
      transform: scale(1.1);
      box-shadow: 0 5px 18px rgba(0,0,0,0.3);
    }
    #a11y-lupa-btn.lupa-on {
      background: #111;
      box-shadow: 0 3px 14px rgba(0,0,0,0.4);
    }
    #a11y-lupa-btn.lupa-on:hover { background: #333; }

    #a11y-lens-box {
      display: none;
      position: absolute;
      z-index: 9999;
      background: #fff;
      border: 2px solid #D42B2B;
      box-shadow: 0 8px 28px rgba(0,0,0,0.18);
      padding: 14px 18px;
      width: 320px;
      max-height: 160px;
      overflow: hidden;
      pointer-events: none;
      line-height: 1.45;
      word-break: break-word;
      animation: lupa-fade-in .12s ease;
    }
    @keyframes lupa-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    #a11y-tooltip {
      position: fixed;
      bottom: 80px;
      right: 24px;
      background: #111;
      color: #fff;
      font-family: 'Barlow', sans-serif;
      font-size: 11px;
      padding: 5px 10px;
      border-radius: 3px;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transition: opacity .2s;
      white-space: nowrap;
    }
    #a11y-tooltip.visible { opacity: 1; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const btn = document.createElement('button');
  btn.id = 'a11y-lupa-btn';
  btn.setAttribute('title', 'Lupa de acessibilidade');
  btn.setAttribute('aria-label', 'Ativar lupa de acessibilidade');
  btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="7"/>
    <line x1="16.65" y1="16.65" x2="21" y2="21"/>
  </svg>`;
  document.body.appendChild(btn);

  const tooltip = document.createElement('div');
  tooltip.id = 'a11y-tooltip';
  tooltip.textContent = 'Lupa ativada — passe o mouse sobre o texto';
  document.body.appendChild(tooltip);

  const lensBox = document.createElement('div');
  lensBox.id = 'a11y-lens-box';
  document.body.appendChild(lensBox);

  let lupOn = false;
  let tooltipTimer = null;

  btn.addEventListener('click', () => {
    lupOn = !lupOn;
    btn.classList.toggle('lupa-on', lupOn);
    btn.setAttribute('aria-pressed', String(lupOn));
    document.body.style.cursor = lupOn ? 'crosshair' : '';
    lensBox.style.display = 'none';

    if (lupOn) {
      tooltip.classList.add('visible');
      clearTimeout(tooltipTimer);
      tooltipTimer = setTimeout(() => tooltip.classList.remove('visible'), 2800);
    } else {
      tooltip.classList.remove('visible');
    }
  });

  document.addEventListener('mousemove', handleMove);
  document.addEventListener('scroll', () => { if (lupOn) lensBox.style.display = 'none'; }, true);
  document.addEventListener('mouseleave', () => { if (lupOn) lensBox.style.display = 'none'; });

  function handleMove(e) {
    if (!lupOn) return;
    lensBox.style.display = 'none';

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || btn.contains(el) || el === btn || lensBox.contains(el)) return;

    const info = getTextInfo(el);
    if (!info.text) return;

    const base = parseFloat(info.fontSize) || 16;
    const enlarged = Math.max(Math.round(base * 1.8), 22);

    lensBox.style.fontSize = enlarged + 'px';
    lensBox.style.fontFamily = info.fontFamily;
    lensBox.style.fontWeight = info.fontWeight;
    lensBox.style.color = info.color;
    lensBox.textContent = info.text.length > 180 ? info.text.slice(0, 177) + '…' : info.text;
    lensBox.style.display = 'block';

    const vw = window.innerWidth;
    const boxW = 320;
    const boxH = lensBox.offsetHeight || 120;
    const gap = 16;

    let lx = e.clientX + 20;
    let ly = e.clientY - boxH - gap;

    if (lx + boxW > vw - 8) lx = e.clientX - boxW - 20;
    if (lx < 8) lx = 8;
    if (ly < 8) ly = e.clientY + gap;

    lensBox.style.left = (lx + window.scrollX) + 'px';
    lensBox.style.top  = (ly + window.scrollY) + 'px';
  }

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'HTML', 'HEAD', 'NOSCRIPT', 'IFRAME', 'SVG', 'PATH', 'CIRCLE', 'LINE']);

  function getTextInfo(el) {
    let node = el;
    while (node && !SKIP_TAGS.has(node.tagName)) {
      const direct = directText(node);
      if (direct.length > 1) {
        const cs = window.getComputedStyle(node);
        const col = cs.color;
        const darkEnough = !col.match(/^rgb\(2[4-9]\d|^rgb\(25[0-5]/);
        return {
          text: direct,
          fontSize: cs.fontSize,
          fontFamily: cs.fontFamily,
          fontWeight: cs.fontWeight,
          color: darkEnough ? col : '#111'
        };
      }
      node = node.parentElement;
    }
    return { text: '', fontSize: '16px', fontFamily: 'inherit', fontWeight: 'normal', color: '#111' };
  }

  function directText(el) {
    let t = '';
    el.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) t += n.textContent;
    });
    return t.trim().replace(/\s+/g, ' ');
  }
})();
