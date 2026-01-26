const $ = (id) => document.getElementById(id);

let score = 0;
let streak = 0;
let currentIndex = 0;
let locked = false;

const STORAGE_KEY = "wordGameProgress_v1";

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

function renderStats() {
  $("score").textContent = `Score: ${score}`;
  $("streak").textContent = `Streak: ${streak}`;
}

function setFeedback(text) {
  $("feedback").textContent = text;
}

function renderQuestion() {
  locked = false;
  $("nextBtn").disabled = true;
  setFeedback("");

  const correct = WORDS[currentIndex % WORDS.length];
  $("word").textContent = correct.word;

  // pick 3 random wrong images
  const others = WORDS
    .filter(w => w.word !== correct.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const choices = shuffle([
    { img: correct.img, correct: true },
    ...others.map(o => ({ img: o.img, correct: false }))
  ]);

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

    btn.addEventListener("click", () =>
      onPick(btn, c.correct, correct.word)
    );

    grid.appendChild(btn);
  }
}


function onPick(btn, isCorrect, word) {
  if (locked) return;
  locked = true;

  if (isCorrect) {
    score += 1;
    streak += 1;
    btn.classList.add("correct");
    setFeedback("✅ Correct!");
  } else {
    streak = 0;
    btn.classList.add("wrong");
    setFeedback("❌ Try the next one!");
  }

  saveWordResult(word, isCorrect);
  renderStats();
  $("nextBtn").disabled = false;
}

$("nextBtn").addEventListener("click", () => {
  currentIndex += 1;
  renderQuestion();
});

$("speakBtn").addEventListener("click", () => {
  if ($("ttsToggle").checked) speakWord($("word").textContent);
});

// Init
renderStats();
renderQuestion();

