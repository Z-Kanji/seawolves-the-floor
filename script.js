const DESSERT_FILENAMES = [
  "Apple Pie.jpg", "Banana Pudding.jpg", "Banana Split.jpg", "Brownie.jpg",
  "Caramel Apple.jpg", "Carrot Cake.jpg", "Cheesecake.jpg",
  "Chocolate Chip Cookie.jpg", "Chocolate Cake.jpg", "Chocolate Pudding.jpg",
  "Creme Brulee.jpg", "Cupcake.jpg", "Doughnut.jpg", "Eclair.jpg",
  "Frozen Yogurt.jpg", "Fudge.jpg", "Ice Cream Sundae.jpg", "Ice Cream.jpg",
  "Key Lime Pie.jpg", "Milkshake.jpg", "Peach Cobbler.jpg", "Pecan Pie.jpg",
  "Pineapple Upside Down Cake.jpg", "Pumpkin Pie.jpg", "Red Velvet Cake.jpg",
  "S'more.jpg", "Snow Cone.jpg", "Strawberry Shortcake.jpg",
  "Tiramisu.jpg", "Tres Leches.jpg"
];

const dessertImage = document.getElementById("dessertImage");
const answerReveal = document.getElementById("answerReveal");
const mainButton = document.getElementById("mainButton");
const resetBtn = document.getElementById("resetBtn");
const timer1El = document.getElementById("timer1");
const timer2El = document.getElementById("timer2");
const player1NameEl = document.getElementById("player1Name");
const player2NameEl = document.getElementById("player2Name");

let deck = [];
let deckIndex = 0;
let shownFilename = null;
let gameStarted = false;
let firstToggleDone = false;
let activePlayer = null;
let tickInterval = null;
let timeLeft = { p1: 20.0, p2: 20.0 };
let answerTimeout = null;

let lastResetClick = 0;
const DOUBLE_RESET_WINDOW = 500;

function shuffleArray(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildNewDeck(){
  deck = shuffleArray(DESSERT_FILENAMES.slice());
  deckIndex = 0;
}

function imageURLForFilename(filename){
  return "images/" + encodeURIComponent(filename);
}

function formatTenths(num){
  return num.toFixed(1);
}

function updateTimersDisplay(){
  timer1El.textContent = formatTenths(timeLeft.p1);
  timer2El.textContent = formatTenths(timeLeft.p2);

  if (activePlayer === "p1"){
    timer1El.style.boxShadow = "0 6px 22px rgba(153,0,0,0.35)";
    timer2El.style.boxShadow = "inset 0 -6px 12px rgba(0,0,0,0.25)";
  } else if (activePlayer === "p2"){
    timer2El.style.boxShadow = "0 6px 22px rgba(153,0,0,0.35)";
    timer1El.style.boxShadow = "inset 0 -6px 12px rgba(0,0,0,0.25)";
  } else {
    timer1El.style.boxShadow = "inset 0 -6px 12px rgba(0,0,0,0.25)";
    timer2El.style.boxShadow = "inset 0 -6px 12px rgba(0,0,0,0.25)";
  }
}

function showNextImageOnScreen(){
  if (deckIndex >= deck.length) buildNewDeck();
  shownFilename = deck[deckIndex];
  dessertImage.src = imageURLForFilename(shownFilename);
  deckIndex++;
}

function revealAnswerOnce(){
  if (!shownFilename) return;
  const label = shownFilename.replace(/\.[^.]+$/, "");
  answerReveal.textContent = label;
  answerReveal.classList.remove("hidden");
  answerReveal.classList.add("show");

  if (answerTimeout) clearTimeout(answerTimeout);
  answerTimeout = setTimeout(() => {
    answerReveal.classList.remove("show");
    answerReveal.classList.add("hidden");
  }, 2500);
}

function endGame(winner){
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = null;

  activePlayer = null;

  answerReveal.textContent =
    `${winner === "p1" ? player1NameEl.value : player2NameEl.value} wins!`;
  answerReveal.classList.remove("hidden");
  answerReveal.classList.add("show");

  mainButton.disabled = true;
}

function startTickLoop(){
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    if (!activePlayer) return;
    timeLeft[activePlayer] = Math.max(0, +(timeLeft[activePlayer] - 0.1).toFixed(1));
    updateTimersDisplay();

    if (timeLeft[activePlayer] <= 0){
      endGame(activePlayer === "p1" ? "p2" : "p1");
    }
  }, 100);
}

function softReset(){
  if (tickInterval){ clearInterval(tickInterval); tickInterval = null; }
  if (answerTimeout){ clearTimeout(answerTimeout); answerTimeout = null; }

  timeLeft = { p1: 20.0, p2: 20.0 };
  updateTimersDisplay();

  gameStarted = false;
  firstToggleDone = false;
  activePlayer = null;

  mainButton.disabled = false;

  answerReveal.classList.remove("show");
  answerReveal.classList.add("hidden");

  buildNewDeck();
  showNextImageOnScreen();
}

function hardResetNames(){
  player1NameEl.value = "Player 1";
  player2NameEl.value = "Player 2";
}

mainButton.addEventListener("click", () => {
  if (!gameStarted){
    gameStarted = true;
    activePlayer = "p1";
    startTickLoop();
    updateTimersDisplay();
    return;
  }

  revealAnswerOnce();
  showNextImageOnScreen();

  if (!firstToggleDone) firstToggleDone = true;

  activePlayer = activePlayer === "p1" ? "p2" : "p1";
  updateTimersDisplay();
});

resetBtn.addEventListener("click", () => {
  const now = Date.now();
  if (now - lastResetClick <= DOUBLE_RESET_WINDOW){
    softReset();
    hardResetNames();
    lastResetClick = 0;
  } else {
    softReset();
    lastResetClick = now;
  }
});

[player1NameEl, player2NameEl].forEach(input => {
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      input.blur();
    }
  });
});

(function init(){
  buildNewDeck();
  showNextImageOnScreen();
  updateTimersDisplay();
})();