// Dessert files (chocolate chip cookie fixed to .jpg)
let dessertFiles = [
  "/seawolves-the-floor/apple_pie.jpg",
  "/seawolves-the-floor/banana_pudding.jpg",
  "/seawolves-the-floor/banana_split.jpg",
  "/seawolves-the-floor/brownie.jpg",
  "/seawolves-the-floor/caramel_apple.jpg",
  "/seawolves-the-floor/carrot_cake.jpg",
  "/seawolves-the-floor/cheesecake.jpg",
  "/seawolves-the-floor/chocolate_chip_cookie.jpg",
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
const placeholder = document.getElementById("image-placeholder");
const answerEl = document.getElementById("answer-area");
const btn = document.getElementById("toggle-btn");
const resetBtn = document.getElementById("reset-btn");
const timer1El = document.querySelector("#timer1");
const timer2El = document.querySelector("#timer2");
const player1NameEl = document.getElementById("player1-name");
const player2NameEl = document.getElementById("player2-name");

// Game state
let t1 = 20.0;
let t2 = 20.0;
let activePlayer = 0;
let interval = null;
let firstPress = true;
let dessertQueue = [];
let currentDessert = "";
let previousDessert = "";

// Shuffle helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Capitalize helper
function capitalizeWords(str) {
  return str.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Initialize dessert queue
function initDessertQueue() {
  dessertQueue = [...dessertFiles];
  shuffle(dessertQueue);
}

// Get next dessert
function nextDessert() {
  if (dessertQueue.length === 0) initDessertQueue();
  return dessertQueue.shift();
}

// Load next dessert
function loadNextDessert() {
  previousDessert = currentDessert;
  currentDessert = nextDessert();
  imgEl.src = currentDessert;
  imgEl.style.display = "block";
  placeholder.style.display = "none";
  return previousDessert ? capitalizeWords(previousDessert.split("/").pop().replace(/\.(jpg|jpeg)$/i, "")) : "";
}

// Start player timer
function startPlayer(player) {
  activePlayer = player;
  if (interval) clearInterval(interval);

  interval = setInterval(() => {
    if (activePlayer === 1) {
      t1 -= 0.1;
      if (t1 < 0) t1 = 0;
      timer1El.textContent = t1.toFixed(1);
      if (t1 <= 0) endGame();
    } else if (activePlayer === 2) {
      t2 -= 0.1;
      if (t2 < 0) t2 = 0;
      timer2El.textContent = t2.toFixed(1);
      if (t2 <= 0) endGame();
    }
  }, 100);
}

// End game
function endGame() {
  clearInterval(interval);
  activePlayer = 0;
  if (t1 > t2) answerEl.textContent = `${player1NameEl.value} WINS!`;
  else if (t2 > t1) answerEl.textContent = `${player2NameEl.value} WINS!`;
  else answerEl.textContent = "TIE!";
}

// Toggle button
btn.addEventListener("click", () => {
  if (firstPress) {
    firstPress = false;
    answerEl.textContent = "";
    currentDessert = nextDessert();
    imgEl.src = currentDessert;
    imgEl.style.display = "block";
    placeholder.style.display = "none";
    startPlayer(1);
    return;
  }

  const prevName = loadNextDessert();
  if (prevName) answerEl.textContent = prevName;

  if (activePlayer === 1) startPlayer(2);
  else if (activePlayer === 2) startPlayer(1);
});

// Reset button
let resetClicks = 0;
let resetTimer = null;

resetBtn.addEventListener("click", () => {
  resetClicks++;
  if (resetTimer) clearTimeout(resetTimer);

  resetTimer = setTimeout(() => {
    if (resetClicks >= 2) {
      player1NameEl.value = "Player 1";
      player2NameEl.value = "Player 2";
    }
    resetClicks = 0;
  }, 300);

  clearInterval(interval);
  t1 = 20.0;
  t2 = 20.0;
  timer1El.textContent = "20.0";
  timer2El.textContent = "20.0";

  firstPress = true;
  activePlayer = 0;
  answerEl.textContent = "";
  imgEl.src = "";
  imgEl.style.display = "none";
  placeholder.style.display = "block";

  initDessertQueue();
});

// Initialize
initDessertQueue();
imgEl.style.display = "none";
placeholder.style.display = "block";
