const $ = (id) => document.getElementById(id);

// ---- Local storage (optional progress history per word) ----
const STORAGE_KEY = "wordGameProgress_v2";

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
// Flow rules you requested:
// - Start with words never shown (unseen) => we do this by shuffling once and taking from front
// - If wrong, word comes back later
// - If correct, remove forever
// - Game ends only when all words are correct
let queue = [];                 // items are {word, img}
let current = null;             // current item
let locked = false;

let attempts = 0;               // number of questions asked (attempts)
let masteredCount = 0;          // number of unique words mastered in this run
let totalWords = 0;             // total words this run

function renderStats() {
  $("attempts").textContent = `Attempts: ${attempts}`;
  $("mastered").textContent = `Mastered: ${masteredCount}/${totalWords}`;
}

function buildChoices(correctItem) {
  // Need 3 distractors from the full WORDS list (excluding correct word)
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
  $("word").textContent = "Done!";
  setFeedback("");

  // Your scoring definition:
  // correct answers at end = number of words
  // out of number of question asked = attempts
  $("finalScore").textContent =
    `Score: ${totalWords} / ${attempts} (words mastered / attempts)`;
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

  current = queue.shift(); // take next unseen-or-returned word

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

  // Optional: auto-speak when voice enabled (but only if you click Speak; safer for browsers)
  // If you want auto-speak on each new word, uncomment this:
  // if ($("ttsToggle").checked) speakWord(current.word);
}

function onPick(btn, isCorrect) {
  if (locked) return;
  locked = true;

  attempts += 1;

  if (isCorrect) {
    btn.classList.add("correct");
    setFeedback("✅ Correct!");
    masteredCount += 1;
    saveWordResult(current.word, true);
    // Correct words are NOT re-added: removed forever (your requirement)
  } else {
    btn.classList.add("wrong");
    setFeedback("❌ Try again later!");
    saveWordResult(current.word, false);

    // Wrong words go back into the queue to be asked again later
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
    alert("WORDS must exist and contain at least 4 items.");
    return;
  }

  // Shuffle once so we show “never presented” words first in random order.
  queue = shuffle(WORDS);

  current = null;
  locked = false;

  attempts = 0;
  masteredCount = 0;
  totalWords = WORDS.length;

  renderStats();
  nextWord();
}

startNewGame();
