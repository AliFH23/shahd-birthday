// ================= الإعدادات (عدّل من هون) =================
const AGE = 24;

const MESSAGE = `
كل سنة وإنتِ طيبة يا أحلى خالة بالدنيا 🎂
24 سنة وإنتِ منوّرة حياتنا بضحكتك وخفّة دمك 😂
بتمنّالك سنة مليانة فرح ونجاح وكل اشي بتحبيه،
وإن شاء الله كل أمنياتك تتحقق (إلا إذا كانت إنك تخلصي مني 😜)
ضلّك زي ما إنتِ… الخالة الصاحبة والأخت الكبيرة 💖
`.trim();

// إذا بدك أغنية خاصة: حط ملف mp3 جنب index.html واكتب اسمه هون، مثلاً 'song.mp3'
// إذا خليته فاضي '' رح يعزف لحن Happy Birthday من الكود
const SONG_FILE = 'song.mp3';

// أغنية من يوتيوب (ID الفيديو من الرابط بعد v=) — خليه '' إذا ما بدك يوتيوب
const YOUTUBE_ID = '';

// ================= عناصر الصفحة =================
const $ = (id) => document.getElementById(id);
const gift = $('gift');
const cake = $('cake');
const musicBtn = $('musicBtn');
const balloonsBox = $('balloons');

const COLORS = ['#ff3e7f', '#ffd93d', '#00d2ff', '#a259ff', '#7CFF6B', '#ffffff', '#ff8a00'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(id).classList.add('active');
}

// ================= الكونفيتي والألعاب النارية =================
const canvas = $('confetti');
const ctx = canvas.getContext('2d');
let particles = [];
let animating = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function makeParticle(x, y, vx, vy, gravity, decay) {
  return {
    x, y, vx, vy, gravity, decay,
    size: Math.random() * 7 + 4,
    color: pick(COLORS),
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 12,
    life: 1,
    shape: Math.random() < 0.5 ? 'rect' : 'circle',
  };
}

// انفجار من نقطة معينة
function burst(x, y, count = 80, power = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * power + 2;
    particles.push(makeParticle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 2,
      0.15,
      Math.random() * 0.01 + 0.008
    ));
  }
  startLoop();
}

// مطر كونفيتي من فوق
function rain(count = 150) {
  for (let i = 0; i < count; i++) {
    particles.push(makeParticle(
      Math.random() * canvas.width,
      -20 - Math.random() * canvas.height * 0.5,
      (Math.random() - 0.5) * 2,
      Math.random() * 3 + 2,
      0.04,
      0.003
    ));
  }
  startLoop();
}

function startLoop() {
  if (!animating) {
    animating = true;
    requestAnimationFrame(loop);
  }
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    p.vy += p.gravity;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= p.decay;

    ctx.save();
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.fillStyle = p.color;
    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  particles = particles.filter((p) => p.life > 0 && p.y < canvas.height + 50);

  if (particles.length) {
    requestAnimationFrame(loop);
  } else {
    animating = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function fireworks() {
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      burst(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight * 0.5 + 50,
        90,
        10
      );
    }, i * 350);
  }
  rain(150);
}

// ================= البالونات =================
let balloonTimer = null;

function spawnBalloon() {
  const b = document.createElement('div');
  b.className = 'balloon';
  b.style.left = Math.random() * 90 + 'vw';
  b.style.setProperty('--c', pick(COLORS.slice(0, 5).concat('#ff8a00')));
  b.style.setProperty('--d', Math.random() * 5 + 7 + 's');
  b.style.scale = Math.random() * 0.5 + 0.7;

  b.addEventListener('animationend', () => b.remove());

  b.addEventListener('pointerdown', (e) => {
    if (b.classList.contains('pop')) return;
    // نثبّت مكان البالون قبل ما يفقع
    const r = b.getBoundingClientRect();
    b.style.top = r.top + 'px';
    b.style.bottom = 'auto';
    b.classList.add('pop');
    playPop();
    burst(e.clientX, e.clientY, 25, 5);
  });

  balloonsBox.appendChild(b);
}

function startBalloons() {
  if (balloonTimer) return;
  for (let i = 0; i < 5; i++) setTimeout(spawnBalloon, i * 300);
  balloonTimer = setInterval(spawnBalloon, 900);
}

// ================= الموسيقى =================
let audioCtx = null;
let master = null;
let musicTimer = null;
let isPlaying = false;
let songAudio = null;

// ---------- مشغّل يوتيوب ----------
let ytPlayer = null;
let ytReady = false;
let ytBroken = false;

// يوتيوب بينادي هاي الدالة لحاله لما يجهز
function onYouTubeIframeAPIReady() {
  if (!YOUTUBE_ID) return;
  ytPlayer = new YT.Player('ytPlayer', {
    width: 200,
    height: 200,
    videoId: YOUTUBE_ID,
    playerVars: { loop: 1, playlist: YOUTUBE_ID, playsinline: 1, rel: 0 },
    events: {
      onReady: () => {
        ytReady = true;
        // إذا الهدية انفتحت قبل ما يجهز يوتيوب
        if (isPlaying && !ytBroken) {
          ytPlayer.playVideo();
          $('ytWrap').classList.add('show');
        }
      },
      onError: () => {
        // الفيديو ممنوع أو مش موجود → نرجع للّحن العادي
        ytBroken = true;
        ytReady = false;
        $('ytWrap').classList.remove('show');
        if (isPlaying) {
          stopMusic();
          startMusic();
        }
      },
    },
  });
}

const NOTES = {
  G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
  D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};

// لحن Happy Birthday: [النوتة, المدة بالضربات]
const MELODY = [
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
];
const BEAT = 0.42; // ثواني لكل ضربة

function initAudio() {
  // آيفون: نخلي الصوت يشتغل حتى لو التلفون على الصامت
  if (navigator.audioSession) navigator.audioSession.type = 'playback';
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// صوت النوتة: طبقتين عشان يطلع زي صندوق الموسيقى
function playNote(freq, start, dur) {
  [['triangle', 1, 0.25], ['sine', 2, 0.08]].forEach(([type, mult, vol]) => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.95);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + dur);
  });
}

function playMelody() {
  let t = audioCtx.currentTime + 0.1;
  MELODY.forEach(([note, beats]) => {
    playNote(NOTES[note], t, beats * BEAT);
    t += beats * BEAT;
  });
  const total = MELODY.reduce((sum, [, beats]) => sum + beats, 0) * BEAT;
  musicTimer = setTimeout(playMelody, (total + 1) * 1000); // تكرار
}

function startMusic() {
  if (YOUTUBE_ID && !ytBroken) {
    if (ytReady) {
      ytPlayer.playVideo();
      $('ytWrap').classList.add('show');
    }
  } else if (SONG_FILE) {
    if (!songAudio) {
      songAudio = new Audio(SONG_FILE);
      songAudio.loop = true;
    }
    songAudio.play().catch(() => {});
  } else {
    initAudio();
    master = audioCtx.createGain();
    master.gain.value = 0.8;
    master.connect(audioCtx.destination);
    playMelody();
  }
  isPlaying = true;
  musicBtn.classList.add('playing');
  musicBtn.textContent = '🎵';
}

function stopMusic() {
  if (ytReady) ytPlayer.pauseVideo();
  if (songAudio) songAudio.pause();
  clearTimeout(musicTimer);
  if (master) {
    master.disconnect();
    master = null;
  }
  isPlaying = false;
  musicBtn.classList.remove('playing');
  musicBtn.textContent = '🔇';
}

musicBtn.addEventListener('click', () => (isPlaying ? stopMusic() : startMusic()));

// صوت فقعة البالون
function playPop() {
  initAudio();
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const t = audioCtx.currentTime;
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(g).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.13);
}

// ================= عدّاد العمر =================
function countAge() {
  const el = $('ageNum');
  let n = 0;
  el.textContent = 0;
  const t = setInterval(() => {
    n++;
    el.textContent = n;
    if (n >= AGE) {
      clearInterval(t);
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top, 60, 7);
    }
  }, 70);
}

// ================= كتابة الرسالة =================
let typingTimer = null;

function typeMessage() {
  const el = $('typed');
  el.textContent = '';
  el.classList.remove('done');
  const chars = Array.from(MESSAGE); // Array.from عشان الإيموجي ما تنكسر
  let i = 0;

  function next() {
    if (i < chars.length) {
      const ch = chars[i++];
      el.textContent += ch;
      typingTimer = setTimeout(next, ch === '\n' ? 400 : 45);
    } else {
      el.classList.add('done');
      $('sign').classList.remove('hidden');
      $('replay').classList.remove('hidden');
      rain(120);
    }
  }
  next();
}

// ================= الأحداث =================
let opened = false;
let blown = false;

// 1) فتح الهدية
gift.addEventListener('click', () => {
  if (opened) return;
  opened = true;
  gift.classList.add('open');
  startMusic();
  $('giftHint').textContent = 'مين هالحلوة؟ 😍';
  $('giftSub').classList.add('hidden');
  const r = gift.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 150, 12);
  setTimeout(() => rain(100), 600);

  // نخليها تشوف صورتها شوي قبل الكيكة
  setTimeout(() => {
    showScreen('cakeScreen');
    countAge();
    startBalloons();
  }, 3200);
});

// 2) إطفاء الشموع
cake.addEventListener('click', () => {
  if (blown) return;
  blown = true;
  cake.classList.add('blown');
  $('cakeHint').textContent = 'يااااي! 🎉 إن شاء الله أمنيتك تتحقق';
  fireworks();
  setTimeout(() => $('toMessage').classList.remove('hidden'), 1500);
});

// 3) فتح الرسالة
$('toMessage').addEventListener('click', () => {
  showScreen('messageScreen');
  typeMessage();
});

// 4) من الأول
$('replay').addEventListener('click', () => {
  opened = false;
  blown = false;
  clearTimeout(typingTimer);
  gift.classList.remove('open');
  cake.classList.remove('blown');
  $('giftHint').textContent = 'في إلك مفاجأة يا شهد 👀';
  $('giftSub').classList.remove('hidden');
  $('cakeHint').textContent = 'اتمنّي أمنية واكبسي على الشموع عشان تطفيها 🕯️';
  $('toMessage').classList.add('hidden');
  $('sign').classList.add('hidden');
  $('replay').classList.add('hidden');
  $('typed').textContent = '';
  showScreen('giftScreen');
});