// Dessert list (lowercase, underscores)
let dessertFiles = [
  "/seawolves-the-floor/apple_pie.jpg",
  "/seawolves-the-floor/banana_pudding.jpg",
  "/seawolves-the-floor/banana_split.jpg",
  "/seawolves-the-floor/brownie.jpg",
  "/seawolves-the-floor/caramel_apple.jpg",
  "/seawolves-the-floor/carrot_cake.jpg",
  "/seawolves-the-floor/cheesecake.jpg",
  "/seawolves-the-floor/chocolate_chip_cookie.jpeg",
  "/seawolves-the-floor/chocolate_cake.jpg",
  "/seawolves-the-floor/chocolate_pudding.jpg",
  "/seawolves-the-floor/creme_brulee.jpg",
  "/seawolves-the-floor/cupcake.jpg",
  "/seawolves-the-floor/doughnut.jpg",
  "/seawolves-the-floor/eclair.jpg",
  "/seawolves-the-floor/frozen_yogurt.jpg",
  "/seawolves-the-floor/fudge.jpg",
  "/seawolves-the-floor/ice_cream_sundae.jpg",
  "/seawolves-the-floor/ice_cream.jpg",
  "/seawolves-the-floor/key_lime_pie.jpg",
  "/seawolves-the-floor/milkshake.jpg",
  "/seawolves-the-floor/peach_cobbler.jpg",
  "/seawolves-the-floor/pecan_pie.jpg",
  "/seawolves-the-floor/pineapple_upside_down_cake.jpg",
  "/seawolves-the-floor/pumpkin_pie.jpg",
  "/seawolves-the-floor/red_velvet_cake.jpg",
  "/seawolves-the-floor/smores.jpg",
  "/seawolves-the-floor/snow_cone.jpg",
  "/seawolves-the-floor/strawberry_shortcake.jpg",
  "/seawolves-the-floor/tiramisu.jpg",
  "/seawolves-the-floor/tres_leches.jpg"
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
  return file.replace(".jpg", "").replace(/_/g, " ").trim();
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
