// Read API key and mode from URL
const urlParams = new URLSearchParams(window.location.search);
const API_KEY = urlParams.get('key'); // must be provided in the URL
const mode = urlParams.get('mode') || 'master';
const isMaster = mode === 'master';

if(!API_KEY){
  alert("API key missing from URL. Append ?mode=master&key=YOUR_KEY (or mode=slave).");
  // still continue but Ably init will fail
}

// DOM
const imgEl = document.getElementById("dessert-img");
const placeholder = document.getElementById("image-placeholder");
const answerEl = document.getElementById("answer-area");
const btn = document.getElementById("toggle-btn");
const resetBtn = document.getElementById("reset-btn");
const timer1El = document.getElementById("timer1");
const timer2El = document.getElementById("timer2");
const player1NameEl = document.getElementById("player1-name");
const player2NameEl = document.getElementById("player2-name");

// Dessert filenames (lowercase + underscores, chocolate chip cookie .jpg)
const dessertFiles = [
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

// State
let t1 = 20.0;
let t2 = 20.0;
let activePlayer = 0; // 0 none, 1 p1, 2 p2
let interval = null;
let firstPress = true;
let dessertQueue = [];
let currentDessert = "";   // currently visible image path
let previousDessert = "";  // previous image path
let gameOver = false;

// Ably init using key from URL
let channel = null;
try {
  // direct key authentication (client-side). Works for testing but not recommended for public keys.
  const ably = new Ably.Realtime(API_KEY);
  channel = ably.channels.get("floor_game");
  // Subscribe to updates
  channel.subscribe("update", (msg) => {
    const state = msg.data;
    if (!state) return;
    // Apply state to UI (slave and master both subscribe: master can ignore its own messages)
    timer1El.textContent = (typeof state.t1 === 'number') ? state.t1.toFixed(1) : timer1El.textContent;
    timer2El.textContent = (typeof state.t2 === 'number') ? state.t2.toFixed(1) : timer2El.textContent;
    if (state.currentDessert) {
      currentDessert = state.currentDessert;
      imgEl.src = currentDessert;
      imgEl.style.display = "block";
      placeholder.style.display = "none";
    }
    if (typeof state.answer === 'string') {
      answerEl.textContent = state.answer;
    }
    if (state.player1Name) player1NameEl.value = state.player1Name;
    if (state.player2Name) player2NameEl.value = state.player2Name;
    activePlayer = state.activePlayer || activePlayer;
    // If game over state included, disable master controls
    if (state.gameOver) {
      gameOver = true;
      if (isMaster) disableControlsAfterWin();
    }
  });
} catch (e) {
  console.error("Ably init failed", e);
  alert("Realtime init failed. Check API key in URL.");
}

/* Utility helpers */
function shuffle(array){ for(let i=array.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [array[i],array[j]]=[array[j],array[i]]; } }
function initDessertQueue(){ dessertQueue = [...dessertFiles]; shuffle(dessertQueue); }
function nextDessert(){ if(dessertQueue.length === 0) initDessertQueue(); return dessertQueue.shift(); }
function stripAndCap(path){ const file = path.split("/").pop().replace(/\.(jpg|jpeg)$/i,"").replace(/_/g," "); return file.replace(/\b\w/g,c=>c.toUpperCase()); }

/* UI updates and state broadcasting */
function sendState(){
  if (!channel) return;
  const state = {
    t1, t2, currentDessert, previousDessert,
    answer: answerEl.textContent,
    activePlayer, player1Name: player1NameEl.value, player2Name: player2NameEl.value,
    gameOver
  };
  channel.publish("update", state);
}

/* Timer loop */
function startTickLoop(){
  if (interval) return;
  interval = setInterval(()=> {
    if (!activePlayer) return;
    if (activePlayer === 1) {
      t1 = Math.max(0, +(t1 - 0.1).toFixed(1));
      timer1El.textContent = t1.toFixed(1);
      if (t1 <= 0) finishGame();
    } else if (activePlayer === 2) {
      t2 = Math.max(0, +(t2 - 0.1).toFixed(1));
      timer2El.textContent = t2.toFixed(1);
      if (t2 <= 0) finishGame();
    }
    sendState();
  }, 100);
}
function stopTickLoop(){ if(interval){ clearInterval(interval); interval = null; } }

function finishGame(){
  stopTickLoop();
  activePlayer = 0;
  gameOver = true;
  // winner is the one with remaining time
  if (t1 > t2) answerEl.textContent = `${player1NameEl.value} WINS!`;
  else if (t2 > t1) answerEl.textContent = `${player2NameEl.value} WINS!`;
  else answerEl.textContent = `TIE!`;
  // disable master button
  if (isMaster) disableControlsAfterWin();
  sendState();
}
function disableControlsAfterWin(){
  btn.disabled = true;
  btn.classList.add('disabled');
  resetBtn.disabled = true;
  resetBtn.classList.add('disabled');
}

/* Reveal previous dessert name briefly */
let revealTimeout = null;
function revealPreviousBriefly(label){
  if (!label) return;
  answerEl.textContent = label;
  if (revealTimeout) clearTimeout(revealTimeout);
  revealTimeout = setTimeout(()=> {
    // keep the winner message if gameOver; otherwise clear
    if (!gameOver) answerEl.textContent = "";
  }, 2500);
}

/* Button behavior (master only) */
if (isMaster) {
  btn.addEventListener("click", () => {
    if (gameOver) return;
    if (firstPress) {
      // First press: show first image, start player 1 timer. No reveal.
      firstPress = false;
      answerEl.textContent = "";
      currentDessert = nextDessert();
      imgEl.src = currentDessert;
      imgEl.style.display = "block";
      placeholder.style.display = "none";
      activePlayer = 1;
      startTickLoop();
      sendState();
      return;
    }

    // Subsequent press: reveal the currentDessert (the image just shown),
    // then advance to nextDessert and switch active player.
    const label = currentDessert ? stripAndCap(currentDessert) : "";
    revealPreviousBriefly(label);

    // advance image for next player
    previousDessert = currentDessert;
    currentDessert = nextDessert();
    imgEl.src = currentDessert;
    imgEl.style.display = "block";
    placeholder.style.display = "none";

    // toggle active player
    if (activePlayer === 1) activePlayer = 2;
    else activePlayer = 1;

    // ensure tick loop running
    startTickLoop();
    sendState();
  });

  // Reset (single clears state; double-press within 500ms resets names)
  let lastReset = 0;
  resetBtn.addEventListener("click", ()=> {
    const now = Date.now();
    if (now - lastReset <= 500) {
      // double press -> also reset names
      player1NameEl.value = "Player 1";
      player2NameEl.value = "Player 2";
    }
    lastReset = now;

    // soft reset game state
    stopTickLoop();
    t1 = 20.0; t2 = 20.0;
    timer1El.textContent = "20.0";
    timer2El.textContent = "20.0";
    firstPress = true;
    activePlayer = 0;
    gameOver = false;
    answerEl.textContent = "";
    imgEl.src = "";
    imgEl.style.display = "none";
    placeholder.style.display = "block";
    btn.disabled = false;
    btn.classList.remove('disabled');
    resetBtn.disabled = false;
    resetBtn.classList.remove('disabled');
    initDessertQueue();
    sendState();
  });
} else {
  // Slave mode: hide reset visually and disable toggle (so it cannot be clicked)
  resetBtn.style.display = "none";
  // keep toggle visible but disabled to avoid accidental clicks
  btn.disabled = true;
  btn.classList.add('disabled');
}

/* Initialize deck and UI */
initDessertQueue();
imgEl.style.display = "none";
placeholder.style.display = "block";
timer1El.textContent = t1.toFixed(1);
timer2El.textContent = t2.toFixed(1);

// Subscribe already set up above; ensure we send initial state from master if needed
if (isMaster) sendState();
