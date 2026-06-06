const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const WPM_HIGH   = 160;
const WORDS_YAP  = 60;

let recognition   = null;
let isListening   = false;
let totalWords    = 0;
let startTime     = null;
let fullTranscript = '';
let silenceTimer  = null;
let sessionHistory = [];

// ── DOM refs ──
const verdictWrap  = document.getElementById('verdictWrap');
const verdictEmoji = document.getElementById('verdictEmoji');
const verdictLabel = document.getElementById('verdictLabel');
const verdictSub   = document.getElementById('verdictSub');
const wordCountEl  = document.getElementById('wordCount');
const wpmEl        = document.getElementById('wpmDisplay');
const yapScoreEl   = document.getElementById('yapScore');
const meterFill    = document.getElementById('meterFill');
const meterLabel   = document.getElementById('meterLabel');
const transcriptEl = document.getElementById('transcriptText');
const startBtn     = document.getElementById('startBtn');
const historyList  = document.getElementById('historyList');

// ── Init ──
if (!SpeechRecognition) {
  verdictLabel.textContent = 'Browser not supported';
  verdictSub.textContent   = 'Please use Chrome or Edge';
  startBtn.disabled = true;
} else {
  recognition = new SpeechRecognition();
  recognition.continuous      = true;
  recognition.interimResults  = true;
  recognition.lang            = 'en-US';

  recognition.addEventListener('result', onResult);
  recognition.addEventListener('end', () => { if (isListening) recognition.start(); });
  recognition.addEventListener('error', (e) => { if (e.error !== 'no-speech') console.warn(e.error); });
}

// ── Controls ──
function toggleListening() {
  isListening ? stopListening() : startListening();
}

function startListening() {
  isListening   = true;
  startTime     = Date.now();
  recognition.start();
  startBtn.textContent = '⏹ Stop';
  startBtn.classList.add('listening');
  transcriptEl.classList.remove('placeholder');
  transcriptEl.textContent = '';
}

function stopListening() {
  isListening = false;
  recognition.stop();
  startBtn.textContent = '🎙 Start';
  startBtn.classList.remove('listening');

  if (totalWords > 0) {
    const elapsed = (Date.now() - startTime) / 60000;
    const wpm     = elapsed > 0 ? Math.round(totalWords / elapsed) : 0;
    const isYap   = totalWords >= WORDS_YAP || wpm >= WPM_HIGH;
    sessionHistory.unshift({ words: totalWords, wpm, isYap });
    if (sessionHistory.length > 5) sessionHistory.pop();
    renderHistory();
  }
}

function resetAll() {
  if (isListening) stopListening();
  totalWords     = 0;
  fullTranscript = '';
  startTime      = null;
  clearTimeout(silenceTimer);

  wordCountEl.textContent  = '0';
  wpmEl.textContent        = '0';
  yapScoreEl.textContent   = '0%';
  meterFill.style.width    = '0%';
  meterFill.classList.remove('hot');
  meterLabel.textContent   = `0 / ${WPM_HIGH} wpm`;
  transcriptEl.textContent = 'Your words will appear here...';
  transcriptEl.classList.add('placeholder');

  verdictWrap.className   = 'verdict idle';
  verdictEmoji.textContent = '—';
  verdictLabel.textContent = 'Waiting...';
  verdictSub.textContent   = 'Press Start and say something';
}

// ── Speech result handler ──
function onResult(e) {
  let interim = '';
  let finalChunk = '';

  for (let i = e.resultIndex; i < e.results.length; i++) {
    const t = e.results[i][0].transcript;
    e.results[i].isFinal ? (finalChunk += t + ' ') : (interim += t);
  }

  if (finalChunk) fullTranscript += finalChunk;

  transcriptEl.textContent = fullTranscript + (interim ? interim : '') || '...';

  const allText = fullTranscript + interim;
  totalWords = allText.trim() ? allText.trim().split(/\s+/).length : 0;

  const elapsed = (Date.now() - startTime) / 60000;
  const wpm     = elapsed > 0 ? Math.round(totalWords / elapsed) : 0;

  updateUI(totalWords, wpm);

  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => { if (isListening) updateUI(totalWords, 0); }, 3000);
}

// ── UI update ──
function updateUI(words, wpm) {
  wordCountEl.textContent = words;
  wpmEl.textContent       = wpm;

  const pct = Math.min((wpm / WPM_HIGH) * 100, 100);
  meterFill.style.width   = pct + '%';
  meterFill.classList.toggle('hot', wpm >= WPM_HIGH);
  meterLabel.textContent  = `${wpm} / ${WPM_HIGH} wpm`;

  const score = Math.round(
    Math.min(words / WORDS_YAP, 1) * 50 + Math.min(wpm / WPM_HIGH, 1) * 50
  );
  yapScoreEl.textContent = score + '%';

  const highWPM   = wpm   >= WPM_HIGH;
  const highWords = words >= WORDS_YAP;

  if (!isListening && words === 0) return setIdle();

  if (highWPM && highWords) {
    setVerdict('yapping', '🗣️🔥', 'Certified Yapper', `${words} words @ ${wpm} wpm — bro chill`);
  } else if (highWPM) {
    setVerdict('yapping', '💨', 'Speed Yapper', `${wpm} wpm is genuinely unhinged`);
  } else if (highWords) {
    setVerdict('yapping', '📢', 'Word Yapper', `${words} words deep... say less`);
  } else {
    const nearEdge = words > 35 || wpm > 110;
    setVerdict(
      'not-yapping',
      nearEdge ? '😬' : '😌',
      nearEdge ? 'Getting suspicious...' : 'Not Yapping',
      nearEdge
        ? `${WORDS_YAP - words} words left before you're cooked`
        : `${words} words @ ${wpm} wpm`
    );
  }
}

function setVerdict(cls, emoji, label, sub) {
  verdictWrap.className    = `verdict ${cls}`;
  verdictEmoji.textContent = emoji;
  verdictLabel.textContent = label;
  verdictSub.textContent   = sub;
}

function setIdle() {
  verdictWrap.className    = 'verdict idle';
  verdictEmoji.textContent = '—';
  verdictLabel.textContent = 'Waiting...';
  verdictSub.textContent   = 'Press Start and say something';
}

// ── History ──
function renderHistory() {
  if (!sessionHistory.length) {
    historyList.innerHTML = '<span class="empty-history">No sessions yet</span>';
    return;
  }
  historyList.innerHTML = sessionHistory.map(s => `
    <div class="history-item ${s.isYap ? 'yap' : 'noyap'}">
      <span>${s.words} words · ${s.wpm} wpm</span>
      <span class="badge">${s.isYap ? 'Yapper' : 'Chill'}</span>
    </div>
  `).join('');
}

// ── Wire up buttons ──
startBtn.addEventListener('click', toggleListening);
document.getElementById('resetBtn').addEventListener('click', resetAll);
