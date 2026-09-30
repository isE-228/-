/* 游戏引擎：物理碰撞、投放、合成、动画、音效及本地存档。自定义内容请改 config.js。 */
(() => {
  'use strict';
  const C = window.GAME_CONFIG;
  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const items = C.items;
  const play = C.play;
  const state = { score: 0, best: Number(localStorage.getItem('cat-home-best') || 0), balls: [], particles: [], mouseX: play.width / 2, current: 0, next: 0, lastDrop: 0, gameOver: false, sound: C.sound.enabled, dark: localStorage.getItem('cat-home-theme') === 'dark', lastTime: 0, toastTimer: 0, shake: 0, pointerDown: false };
  let audio;
  let installPrompt = null;

  const textMap = { gameTitle:'title', gameSubtitle:'subtitle', eyebrow:'eyebrow', welcomeTitle:'welcome', scoreLabel:'score', bestLabel:'best', nextLabel:'next', restartLabel:'restart', guideTitle:'guideTitle', guideText:'guide', recordTitle:'recordTitle', recordScoreLabel:'current', recordBestLabel:'personalBest', privacyNote:'privacy', tipText:'tip', controlsNote:'controls', boardHint:'hint', footerText:'footer', offlineLabel:'offline', endEyebrow:'endEyebrow', endTitle:'endTitle', resultLabel:'result', playAgainButton:'again', installLabel:'install' };
  Object.entries(textMap).forEach(([id,key]) => { if ($(id)) $(id).textContent = C.text[key]; });
  document.title = `${C.text.title} · ${C.text.pageSuffix}`;
  document.querySelector('.brand').setAttribute('aria-label', `${C.text.title}首页`);
  canvas.setAttribute('aria-label', C.text.canvasLabel);
  $('chain').innerHTML = items.map((item, index) => `${index ? '<i>›</i>' : ''}<span title="${escapeHTML(item.name)}">${item.emoji}</span>`).join('');
  $('soundButton').textContent = state.sound ? '♫' : '♩';
  setupInstallPrompt();
  applyTheme();
  updateScore();

  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  function applyTheme() {
    document.documentElement.style.setProperty('--page', state.dark ? C.theme.darkPage : C.theme.page);
    document.documentElement.style.setProperty('--ink', state.dark ? C.theme.darkInk : C.theme.ink);
    document.documentElement.style.setProperty('--muted', state.dark ? C.theme.darkMuted : C.theme.muted);
    document.documentElement.style.setProperty('--accent', C.theme.accent);
    document.documentElement.style.setProperty('--accent-dark', C.theme.accentDark);
    document.documentElement.style.setProperty('--board', state.dark ? C.theme.darkBoard : C.theme.board);
    document.documentElement.style.setProperty('--board-bottom', C.theme.boardBottom);
    document.documentElement.style.setProperty('--line', C.theme.line);
    document.documentElement.style.setProperty('--card', state.dark ? C.theme.darkCard : C.theme.card);
    document.documentElement.style.setProperty('--highlight', C.theme.highlight);
    document.body.classList.toggle('dark', state.dark);
    $('themeButton').textContent = state.dark ? '☾' : '☼';
  }
  function updateScore() {
    $('score').textContent = state.score;
    $('best').textContent = state.best;
    $('recordScore').textContent = state.score;
    $('recordBest').textContent = state.best;
  }
  function setupInstallPrompt() {
    const installButton = $('installButton');
    const installDialog = $('installDialog');
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault(); installPrompt = event;
      $('androidInstallStep').classList.remove('hidden');
    });
    window.addEventListener('appinstalled', () => {
      installPrompt = null; installButton.classList.add('hidden');
      showToast('🐾 小猫家园住进你的设备啦！', 1800);
    });
    installButton.addEventListener('click', () => {
      if (installPrompt) $('androidInstallStep').classList.remove('hidden');
      else $('androidInstallStep').classList.add('hidden');
      installDialog.showModal();
    });
    $('nativeInstallButton').addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installDialog.close();
    });
  }
  function playTone(frequency, duration = C.sound.duration, type = 'sine') {
    if (!state.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      gain.gain.setValueAtTime(C.sound.volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + duration);
    } catch (_) { /* 浏览器未提供 Web Audio 时静默运行。 */ }
  }
  function playMeow(level = 0) {
    if (!state.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const start = audio.currentTime;
      const length = C.sound.meowDuration;
      const base = C.sound.meowPitch + level * 28;
      const master = audio.createGain();
      master.gain.setValueAtTime(C.sound.volume * 0.8, start);
      master.gain.exponentialRampToValueAtTime(0.001, start + length);
      master.connect(audio.destination);
      for (const [ratio, peak, wave] of [[1, 1, 'sawtooth'], [2.03, .18, 'sine']]) {
        const voice = audio.createOscillator();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        voice.type = wave;
        voice.frequency.setValueAtTime(base * ratio, start);
        voice.frequency.exponentialRampToValueAtTime(base * ratio * 1.7, start + length * .28);
        voice.frequency.exponentialRampToValueAtTime(base * ratio * .72, start + length);
        filter.type = 'bandpass'; filter.frequency.value = base * ratio * 1.65; filter.Q.value = 1.2;
        gain.gain.value = peak;
        voice.connect(filter); filter.connect(gain); gain.connect(master);
        voice.start(start); voice.stop(start + length);
      }
      const vibrato = audio.createOscillator();
      const vibratoGain = audio.createGain();
      vibrato.frequency.value = 15; vibratoGain.gain.value = base * .012;
      vibrato.connect(vibratoGain); vibratoGain.connect(master); vibrato.start(start); vibrato.stop(start + length);
    } catch (_) { /* Web Audio 不可用时跳过音效，不影响离线玩法。 */ }
  }
  function playPawSound(level = 0) {
    if (!state.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const start = audio.currentTime;
      const root = 390 + level * 18;
      for (const [offset, frequency, volume, length] of [[0, root, .45, .11], [.045, root * 1.48, .2, .15]]) {
        const voice = audio.createOscillator(); const envelope = audio.createGain();
        voice.type = 'sine'; voice.frequency.setValueAtTime(frequency, start + offset);
        voice.frequency.exponentialRampToValueAtTime(frequency * .76, start + offset + length);
        envelope.gain.setValueAtTime(.001, start + offset);
        envelope.gain.exponentialRampToValueAtTime(C.sound.volume * volume, start + offset + .012);
        envelope.gain.exponentialRampToValueAtTime(.001, start + offset + length);
        voice.connect(envelope); envelope.connect(audio.destination);
        voice.start(start + offset); voice.stop(start + offset + length);
      }
    } catch (_) { /* 不支持 Web Audio 的浏览器仍可正常游戏。 */ }
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(canvas.width / play.width, 0, 0, canvas.height / play.height, 0, 0);
    draw();
  }
  function radiusFor(index) { return items[Math.min(index, items.length - 1)].radius; }
  function newBall(x, y, index, vy = 0) { return { x, y, vx: 0, vy, index, r: radiusFor(index), born: performance.now(), mergeAt: 0, dead: false }; }
  function reset() {
    state.score = 0; state.balls = []; state.particles = []; state.gameOver = false; state.mouseX = play.width / 2;
    state.current = randomSmall(); state.next = randomSmall(); $('endScreen').classList.add('hidden');
    $('nextItem').textContent = items[state.next].emoji; updateScore(); showToast(C.text.toastStart, 900); draw();
  }
  function randomSmall() { return Math.floor(Math.random() * Math.min(items.length, play.maxItemIndex + 1)); }
  function showToast(message, duration = 1000) {
    const toast = $('toast'); toast.textContent = message; toast.classList.add('visible');
    clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => toast.classList.remove('visible'), duration);
  }
  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return Math.max(play.wallPadding + radiusFor(state.current), Math.min(play.width - play.wallPadding - radiusFor(state.current), (event.clientX - rect.left) / rect.width * play.width));
  }
  function drop() {
    if (state.gameOver || performance.now() - state.lastDrop < play.dropDelay) return;
    state.lastDrop = performance.now();
    const r = radiusFor(state.current);
    state.balls.push(newBall(Math.max(play.wallPadding + r, Math.min(play.width - play.wallPadding - r, state.mouseX)), 39, state.current, 20));
    playPawSound(state.current);
    state.current = state.next; state.next = randomSmall(); $('nextItem').textContent = items[state.next].emoji;
    $('boardHint').style.opacity = '0';
  }
  function move(direction) { state.mouseX = Math.max(play.wallPadding + radiusFor(state.current), Math.min(play.width - play.wallPadding - radiusFor(state.current), state.mouseX + direction * 30)); }
  function burst(x, y, index) {
    const item = items[index];
    for (let i = 0; i < C.animation.particles; i++) {
      const angle = Math.PI * 2 * i / C.animation.particles;
      const speed = 75 + Math.random() * 150;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 45, life: C.animation.particleLife, maxLife: C.animation.particleLife, color: item.color, emoji: Math.random() > .72 ? item.emoji : '' });
    }
  }
  function merge(a, b) {
    if (a.dead || b.dead || a.index !== b.index || a.index >= items.length - 1) return false;
    a.dead = b.dead = true;
    const nextIndex = a.index + 1;
    const merged = newBall((a.x + b.x) / 2, (a.y + b.y) / 2, nextIndex, -95);
    merged.mergeAt = performance.now(); state.balls.push(merged);
    state.score += items[nextIndex].points;
    if (state.score > state.best) { state.best = state.score; localStorage.setItem('cat-home-best', state.best); }
    updateScore(); burst(merged.x, merged.y, nextIndex); state.shake = C.animation.shake;
    showToast(nextIndex === items.length - 1 ? C.text.toastMax : C.text.toastMerge, 800);
    playMeow(nextIndex);
    return true;
  }
  function update(dt, now) {
    const g = C.animation.gravity;
    for (const ball of state.balls) {
      if (ball.dead) continue;
      ball.vy += g * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      const r = ball.r; const floor = play.height - r - 7;
      if (ball.x < play.wallPadding + r) { ball.x = play.wallPadding + r; ball.vx = Math.abs(ball.vx) * C.animation.wallBounce; }
      if (ball.x > play.width - play.wallPadding - r) { ball.x = play.width - play.wallPadding - r; ball.vx = -Math.abs(ball.vx) * C.animation.wallBounce; }
      if (ball.y > floor) { ball.y = floor; ball.vy *= -C.animation.floorBounce; if (Math.abs(ball.vy) < 30) ball.vy = 0; ball.vx *= .985; }
    }
    for (let i = 0; i < state.balls.length; i++) {
      const a = state.balls[i]; if (a.dead) continue;
      for (let j = i + 1; j < state.balls.length; j++) {
        const b = state.balls[j]; if (b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy), min = a.r + b.r;
        if (distance >= min + C.animation.stickyRange) continue;
        const overlap = min - distance;
        if (overlap >= 0 && a.index === b.index && a.index < items.length - 1) { merge(a, b); continue; }
        const nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
        const massA = a.r * a.r, massB = b.r * b.r;
        const inverseA = 1 / massA, inverseB = 1 / massB;
        const invMassSum = inverseA + inverseB;
        if (overlap > 0) {
          a.x -= nx * overlap * inverseA / invMassSum; a.y -= ny * overlap * inverseA / invMassSum;
          b.x += nx * overlap * inverseB / invMassSum; b.y += ny * overlap * inverseB / invMassSum;
          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative < 0) {
            const impulse = -(1 + C.animation.bounce) * relative / invMassSum;
            a.vx -= impulse * nx * inverseA; a.vy -= impulse * ny * inverseA;
            b.vx += impulse * nx * inverseB; b.vy += impulse * ny * inverseB;
          }
        }
        // 软黏附：只在球面即将相碰的极小范围内拉近；接触后切向摩擦帮助猫咪堆叠。
        if (overlap > 0) {
          const tx = -ny, ty = nx;
          const tangentSpeed = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
          const normalSpeed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          const friction = Math.min(Math.abs(tangentSpeed), C.animation.surfaceFriction * Math.abs(normalSpeed) * dt * 60);
          const frictionImpulse = Math.sign(tangentSpeed) * friction / invMassSum;
          a.vx += frictionImpulse * tx * inverseA; a.vy += frictionImpulse * ty * inverseA;
          b.vx -= frictionImpulse * tx * inverseB; b.vy -= frictionImpulse * ty * inverseB;
        } else if (overlap > -C.animation.stickyRange) {
          const gapRatio = Math.max(0, -overlap / C.animation.stickyRange);
          const pull = C.animation.adhesion * (1 - gapRatio) * dt;
          const pullA = pull * inverseA / invMassSum, pullB = pull * inverseB / invMassSum;
          a.vx += nx * pullA; a.vy += ny * pullA;
          b.vx -= nx * pullB; b.vy -= ny * pullB;
        }
      }
    }
    state.balls = state.balls.filter((ball) => !ball.dead);
    for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += g * .32 * dt; p.life -= dt * 1000; }
    state.particles = state.particles.filter((p) => p.life > 0);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 28);
    const dangerY = play.height * play.dangerLine;
    if (state.balls.some((ball) => ball.y - ball.r < dangerY && now - ball.born > 800 && Math.abs(ball.vy) < 75)) finishGame();
  }
  function draw() {
    if (!canvas.width) return;
    const dark = state.dark;
    ctx.save();
    if (state.shake) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
    const gradient = ctx.createLinearGradient(0, 0, 0, play.height);
    gradient.addColorStop(0, dark ? '#3b4941' : '#fffaf0'); gradient.addColorStop(1, dark ? '#313d36' : '#fff1d7');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, play.width, play.height);
    ctx.fillStyle = dark ? '#e5a5a540' : '#dc829c45'; ctx.fillRect(0, play.height - 8, play.width, 8);
    const dangerY = play.height * play.dangerLine;
    ctx.setLineDash([6, 8]); ctx.strokeStyle = dark ? '#cfbba54a' : '#d4bda344'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, dangerY); ctx.lineTo(play.width, dangerY); ctx.stroke(); ctx.setLineDash([]);
    if (!state.gameOver) {
      const r = radiusFor(state.current), x = Math.max(play.wallPadding + r, Math.min(play.width - play.wallPadding - r, state.mouseX));
      ctx.strokeStyle = dark ? '#e7ebd031' : '#aab89855'; ctx.setLineDash([4, 7]); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 47); ctx.stroke(); ctx.setLineDash([]);
      drawBall({ x, y: 38, r, index: state.current, born: 0 }, true);
    }
    for (const ball of state.balls) drawBall(ball, false);
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4 + (1 - p.life / p.maxLife) * 3, 0, Math.PI * 2); ctx.fill();
      if (p.emoji) { ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.emoji, p.x, p.y); }
    }
    ctx.globalAlpha = 1; ctx.restore();
  }
  function drawBall(ball, preview) {
    const item = items[ball.index];
    const age = performance.now() - ball.born;
    const pop = ball.mergeAt && age < C.animation.mergeDuration ? 1 + Math.sin(age / C.animation.mergeDuration * Math.PI) * (C.animation.mergeScale - 1) : 1;
    const r = ball.r * pop;
    ctx.save(); ctx.globalAlpha = preview ? .78 : 1;
    ctx.shadowColor = darkColor(); ctx.shadowBlur = preview ? 0 : 7; ctx.shadowOffsetY = preview ? 0 : 4;
    const gradient = ctx.createRadialGradient(ball.x - r * .32, ball.y - r * .38, 2, ball.x, ball.y, r * 1.2);
    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.32, item.color); gradient.addColorStop(1, darken(item.color));
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#ffffffb8'; ctx.lineWidth = Math.max(1.5, r * .07); ctx.beginPath(); ctx.arc(ball.x, ball.y, r * .82, Math.PI * 1.05, Math.PI * 1.78); ctx.stroke();
    drawKitty(ball.x, ball.y, r, ball.index, item.color);
    ctx.restore();
  }
  function drawKitty(x, y, r, level, furColor) {
    const s = r / 25;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // 幼猫脸型：额头略窄、脸颊鼓鼓，轮廓做成柔软的绒毛暖边。
    ctx.beginPath(); ctx.moveTo(-21, -5); ctx.quadraticCurveTo(-23, -14, -20, -20); ctx.quadraticCurveTo(-18, -24, -15, -22);
    ctx.lineTo(-8, -17); ctx.quadraticCurveTo(0, -20, 8, -17); ctx.lineTo(15, -22); ctx.quadraticCurveTo(19, -24, 21, -18);
    ctx.quadraticCurveTo(25, -5, 22, 7); ctx.quadraticCurveTo(19, 20, 9, 23); ctx.quadraticCurveTo(0, 26, -9, 23);
    ctx.quadraticCurveTo(-20, 20, -23, 7); ctx.quadraticCurveTo(-24, 0, -21, -5); ctx.closePath();
    const fur = ctx.createRadialGradient(-8, -13, 2, 0, 1, 29);
    fur.addColorStop(0, '#fffef8'); fur.addColorStop(.62, furColor); fur.addColorStop(1, '#d39a76');
    ctx.fillStyle = fur; ctx.fill(); ctx.lineWidth = 1.1; ctx.strokeStyle = '#a77562'; ctx.stroke();
    ctx.strokeStyle = '#fffaf1aa'; ctx.lineWidth = .85;
    for (const side of [-1, 1]) {
      for (let tuft = 0; tuft < 4; tuft++) {
        const y = -9 + tuft * 5;
        ctx.beginPath(); ctx.moveTo(side * 21, y); ctx.quadraticCurveTo(side * 23, y + 1, side * 22, y + 3); ctx.stroke();
      }
    }
    // 耳朵里的桃粉色和浅色耳毛。
    ctx.beginPath(); ctx.moveTo(-18, -20); ctx.lineTo(-15, -11); ctx.lineTo(-10, -16); ctx.closePath();
    ctx.moveTo(18, -20); ctx.lineTo(15, -11); ctx.lineTo(10, -16); ctx.closePath(); ctx.fillStyle = '#e9a1a0'; ctx.fill();
    ctx.strokeStyle = '#fff0df'; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(-14, -14); ctx.moveTo(16, -18); ctx.lineTo(14, -14); ctx.stroke();
    // 橘色额纹，呼应照片里的暖橘奶猫；不同等级仍保留各自毛色。
    ctx.strokeStyle = level % 3 === 0 ? '#a86d50' : '#d69668'; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(-4, -17); ctx.quadraticCurveTo(-6, -14, -8, -12); ctx.moveTo(4, -17); ctx.quadraticCurveTo(6, -14, 8, -12); ctx.moveTo(0, -17); ctx.lineTo(0, -13); ctx.stroke();
    // 奶油口鼻区域：两团圆滚滚的小脸颊。
    ctx.fillStyle = '#fff5e9';
    ctx.beginPath(); ctx.ellipse(-5, 6, 7.2, 5.5, -.12, 0, Math.PI * 2); ctx.ellipse(5, 6, 7.2, 5.5, .12, 0, Math.PI * 2); ctx.fill();
    // 水润的深棕大眼睛，搭配双层高光显得像幼猫。
    for (const eyeX of [-9, 9]) {
      const eye = ctx.createRadialGradient(eyeX - 1, -4, .4, eyeX, -2, 4.3);
      eye.addColorStop(0, '#71828d'); eye.addColorStop(.4, '#46505a'); eye.addColorStop(1, '#292c35');
      ctx.fillStyle = eye; ctx.beginPath(); ctx.ellipse(eyeX, -2, 3.5, 4.7, eyeX < 0 ? -.12 : .12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(eyeX - 1, -3.8, 1.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffffb8'; ctx.beginPath(); ctx.arc(eyeX + 1.3, -.2, .55, 0, Math.PI * 2); ctx.fill();
    }
    // 小小的粉鼻头、短短的嘴巴和照片同款淡淡腮红。
    ctx.fillStyle = '#d98283'; ctx.beginPath(); ctx.moveTo(-2.2, 3); ctx.quadraticCurveTo(0, 1.2, 2.2, 3); ctx.quadraticCurveTo(0, 5.5, -2.2, 3); ctx.fill();
    ctx.strokeStyle = '#78575a'; ctx.lineWidth = .85;
    ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, 6.4); ctx.quadraticCurveTo(-2.2, 8.5, -4, 7); ctx.moveTo(0, 6.4); ctx.quadraticCurveTo(2.2, 8.5, 4, 7); ctx.stroke();
    ctx.fillStyle = '#e99b9a78'; ctx.beginPath(); ctx.ellipse(-14, 5, 3.8, 2, -.15, 0, Math.PI * 2); ctx.ellipse(14, 5, 3.8, 2, .15, 0, Math.PI * 2); ctx.fill();
    // 几缕短短的脸边绒毛与细胡须，让圆球看起来更柔软。
    ctx.strokeStyle = '#fff5e8aa'; ctx.lineWidth = .75;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 19, 2); ctx.lineTo(side * 21, 1); ctx.moveTo(side * 20, 8); ctx.lineTo(side * 22, 9); ctx.stroke();
      ctx.strokeStyle = '#9b777099'; ctx.beginPath(); ctx.moveTo(side * 9, 6); ctx.lineTo(side * 20, 3); ctx.moveTo(side * 10, 8); ctx.lineTo(side * 20, 10); ctx.stroke();
      ctx.strokeStyle = '#fff5e8aa';
    }
    if (level === items.length - 1) { ctx.font = '12px sans-serif'; ctx.fillStyle = '#ffd85a'; ctx.fillText('✦', 0, -27); }
    ctx.restore();
  }
  function darkColor() { return state.dark ? '#10171338' : '#69523020'; }
  function darken(hex) { const n = parseInt(hex.slice(1), 16); const r = Math.max(0, (n >> 16) - 18), g = Math.max(0, ((n >> 8) & 255) - 18), b = Math.max(0, (n & 255) - 18); return `rgb(${r},${g},${b})`; }
  function finishGame() {
    if (state.gameOver) return;
    state.gameOver = true; $('resultScore').textContent = state.score; $('endBest').textContent = `${C.text.best} ${state.best}`;
    $('endScreen').classList.remove('hidden'); playTone(180, .35, 'sawtooth');
  }
  function frame(now) {
    const dt = Math.min((now - (state.lastTime || now)) / 1000, .035); state.lastTime = now;
    update(dt, now); draw(); requestAnimationFrame(frame);
  }
  canvas.addEventListener('pointermove', (event) => { state.mouseX = pointerPosition(event); });
  canvas.addEventListener('pointerdown', (event) => { event.preventDefault(); state.mouseX = pointerPosition(event); drop(); });
  $('dropButton').addEventListener('click', drop);
  $('leftButton').addEventListener('click', () => move(-1)); $('rightButton').addEventListener('click', () => move(1));
  $('restartButton').addEventListener('click', reset); $('playAgainButton').addEventListener('click', reset);
  $('soundButton').addEventListener('click', () => { state.sound = !state.sound; $('soundButton').textContent = state.sound ? '♫' : '♩'; if (state.sound) playTone(580); });
  $('themeButton').addEventListener('click', () => { state.dark = !state.dark; localStorage.setItem('cat-home-theme', state.dark ? 'dark' : 'light'); applyTheme(); });
  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft','ArrowRight',' ','ArrowDown'].includes(event.key)) event.preventDefault();
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') move(-1);
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') move(1);
    if (event.key === ' ' || event.key === 'ArrowDown') drop();
    if (event.key.toLowerCase() === 'r') reset();
  });
  window.addEventListener('resize', resize);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  reset(); resize(); requestAnimationFrame(frame);
})();
