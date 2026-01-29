const $ = (id) => document.getElementById(id);

// ---- Local storage (optional progress history per word) ----
const STORAGE_KEY = "wordGameProgress_v4";

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveWordResult(word, ok) {
  const data = loadProgress();
  data[word] ??= { correct: 0, wrong: 0 };
  if (ok) data[word].correct += 1;
  else data[word].wrong += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- Helpers ----
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speakWord(word) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
}

function setFeedback(text) {
  $("feedback").textContent = text;
}

function setFinalVisible(isVisible) {
  $("finalPanel").classList.toggle("hidden", !isVisible);
}

// ---- Game state ----
let queue = [];                 
let current = null;             
let locked = false;

let attempts = 0;               
let masteredCount = 0;          
let totalWords = 0;             

// Track words that were ever missed
let missedWords = new Set();    

function renderStats() {
  $("attempts").textContent = `Attempts: ${attempts}`;
  $("mastered").textContent = `Mastered: ${masteredCount}/${totalWords}`;
}

function buildChoices(correctItem) {
  const pool = WORDS.filter(w => w.word !== correctItem.word);
  const distractors = shuffle(pool).slice(0, 3);

  return shuffle([
    { img: correctItem.img, correct: true },
    ...distractors.map(d => ({ img: d.img, correct: false }))
  ]);
}

function showEndScreen() {
  setFinalVisible(true);
  $("grid").innerHTML = "";
  $("word").textContent = "סיימנו!";
  setFeedback("");

  const scoreLine =
    `תוצאה: ${totalWords} / ${attempts} (מילים נכונות / ניסיונות)`;

  const missedList = Array.from(missedWords).sort();

  let missedLine;
  if (missedList.length === 0) {
    missedLine = "אלופה! בלי טעויות 🎉";
  } else {
    missedLine =
      `מילים שכדאי לתרגל שוב: ${missedList.join(", ")}`;
  }

  $("finalScore").textContent = `${scoreLine}\n${missedLine}`;
}

function nextWord() {
  locked = false;
  $("nextBtn").disabled = true;
  setFinalVisible(false);
  setFeedback("");

  if (queue.length === 0) {
    showEndScreen();
    return;
  }

  current = queue.shift();
  $("word").textContent = current.word;

  const choices = buildChoices(current);
  const grid = $("grid");
  grid.innerHTML = "";

  for (const c of choices) {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";

    const img = document.createElement("img");
    img.src = c.img;
    img.alt = "choice";
    btn.appendChild(img);

    btn.addEventListener("click", () => onPick(btn, c.correct));
    grid.appendChild(btn);
  }

  renderStats();
}

function onPick(btn, isCorrect) {
  if (locked) return;
  locked = true;

  attempts += 1;

  if (isCorrect) {
    btn.classList.add("correct");
    setFeedback("כל הכבוד! ✅");
    masteredCount += 1;
    saveWordResult(current.word, true);
  } else {
    btn.classList.add("wrong");
    setFeedback("לא נורא, ננסה שוב 💪");
    saveWordResult(current.word, false);

    missedWords.add(current.word);
    queue.push(current);
  }

  renderStats();
  $("nextBtn").disabled = false;
}

// ---- Buttons ----
$("nextBtn").addEventListener("click", () => {
  nextWord();
});

$("speakBtn").addEventListener("click", () => {
  if ($("ttsToggle").checked) speakWord($("word").textContent);
});

$("restartBtn").addEventListener("click", () => {
  startNewGame();
});

// ---- Init / start ----
function startNewGame() {
  if (!Array.isArray(WORDS) || WORDS.length < 4) {
    alert("חייבות להיות לפחות 4 מילים במשחק");
    return;
  }

  queue = shuffle(WORDS);

  current = null;
  locked = false;

  attempts = 0;
  masteredCount = 0;
  totalWords = WORDS.length;

  missedWords = new Set();

  renderStats();
  nextWord();
}

startNewGame();
