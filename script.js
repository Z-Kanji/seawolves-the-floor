// Image list (full GitHub paths)
let dessertFiles = [
  "/seawolves-the-floor/Apple Pie.jpg",
  "/seawolves-the-floor/Banana Pudding.jpg",
  "/seawolves-the-floor/Banana Split.jpg",
  "/seawolves-the-floor/Brownie.jpg",
  "/seawolves-the-floor/Caramel Apple.jpg",
  "/seawolves-the-floor/Carrot Cake.jpg",
  "/seawolves-the-floor/Cheesecake.jpg",
  "/seawolves-the-floor/Chocolate Chip Cookie.jpg",
  "/seawolves-the-floor/Chocolate Cake.jpg",
  "/seawolves-the-floor/Chocolate Pudding.jpg",
  "/seawolves-the-floor/Creme Brulee.jpg",
  "/seawolves-the-floor/Cupcake.jpg",
  "/seawolves-the-floor/Doughnut.jpg",
  "/seawolves-the-floor/Eclair.jpg",
  "/seawolves-the-floor/Frozen Yogurt.jpg",
  "/seawolves-the-floor/Fudge.jpg",
  "/seawolves-the-floor/Ice Cream Sundae.jpg",
  "/seawolves-the-floor/Ice Cream.jpg",
  "/seawolves-the-floor/Key Lime Pie.jpg",
  "/seawolves-the-floor/Milkshake.jpg",
  "/seawolves-the-floor/Peach Cobbler.jpg",
  "/seawolves-the-floor/Pecan Pie.jpg",
  "/seawolves-the-floor/Pineapple Upside Down Cake.jpg",
  "/seawolves-the-floor/Pumpkin Pie.jpg",
  "/seawolves-the-floor/Red Velvet Cake.jpg",
  "/seawolves-the-floor/S'more.jpg",
  "/seawolves-the-floor/Snow Cone.jpg",
  "/seawolves-the-floor/Strawberry Shortcake.jpg",
  "/seawolves-the-floor/Tiramisu.jpg",
  "/seawolves-the-floor/Tres Leches.jpg"
];

// DOM elements
const imgEl = document.getElementById("dessert-img");
const answerEl = document.getElementById("answer-area");
const btn = document.getElementById("toggle-btn");
const resetBtn = document.getElementById("reset-btn");

const timer1El = document.getElementById("timer1");
const timer2El = document.getElementById("timer2");

let t1 = 20.0;
let t2 = 20.0;
let activePlayer = 0; // 0 = not started, 1 = player1, 2 = player2
let interval = null;
let firstPress = true;

// Shuffle function
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Prepare randomized order
shuffle(dessertFiles);

// Load first image
let currentIndex = 0;
imgEl.src = dessertFiles[currentIndex];

// Format answer
function formatAnswer(path) {
  let file = path.split("/").pop();
  return file.replace(".jpg", "").trim();
}

// Timers
function startPlayer(player) {
  activePlayer = player;

  if (interval) clearInterval(interval);

  interval = setInterval(() => {
    if (activePlayer === 1) {
      t1 -= 0.1;
      timer1El.textContent = t1.toFixed(1);
      if (t1 <= 0) stopGame();
    } else if (activePlayer === 2) {
      t2 -= 0.1;
      timer2El.textContent = t2.toFixed(1);
      if (t2 <= 0) stopGame();
    }
  }, 100);
}

// Rotate to next image + show answer
function showAnswerAndNext() {
  answerEl.textContent = formatAnswer(dessertFiles[currentIndex]);

  currentIndex++;
  if (currentIndex >= dessertFiles.length) return;

  imgEl.src = dessertFiles[currentIndex];
}

// Stop everything
function stopGame() {
  clearInterval(interval);
  activePlayer = 0;
}

// Handle button press
btn.addEventListener("click", () => {
  if (firstPress) {
    firstPress = false;
    answerEl.textContent = "";
    startPlayer(1);
    return;
  }

  if (activePlayer === 1) {
    startPlayer(2);
    showAnswerAndNext();
  } else if (activePlayer === 2) {
    startPlayer(1);
    showAnswerAndNext();
  }
});

// Reset logic
let resetClicks = 0;
let resetTimer = null;

resetBtn.addEventListener("click", () => {
  resetClicks++;

  if (resetTimer) clearTimeout(resetTimer);

  resetTimer = setTimeout(() => {
    if (resetClicks >= 2) {
      document.getElementById("player1-name").value = "Player 1";
      document.getElementById("player2-name").value = "Player 2";
    }

    resetClicks = 0;
  }, 300);

  // Reset game state
  clearInterval(interval);
  t1 = 20.0;
  t2 = 20.0;
  timer1El.textContent = "20.0";
  timer2El.textContent = "20.0";

  firstPress = true;
  activePlayer = 0;
  answerEl.textContent = "";

  shuffle(dessertFiles);
  currentIndex = 0;
  imgEl.src = dessertFiles[currentIndex];
});
