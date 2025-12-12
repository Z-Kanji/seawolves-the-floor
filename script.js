// Reads API key and mode from URL. Use links including &key=... and &mode=master|slave
const urlParams = new URLSearchParams(window.location.search);
const API_KEY = urlParams.get('key'); // REQUIRED in URL
const mode = (urlParams.get('mode') || 'master').toLowerCase();
const isMaster = mode === 'master';

// DOM
const imgEl = document.getElementById("dessert-img");
const placeholder = document.getElementById("image-placeholder");
const answerEl = document.getElementById("answer-area");
const toggleBtn = document.getElementById("toggle-btn");
const resetBtn = document.getElementById("reset-btn");
const timer1El = document.getElementById("timer1");
const timer2El = document.getElementById("timer2");
const p1NameEl = document.getElementById("player1-name");
const p2NameEl = document.getElementById("player2-name");
const pass1Btn = document.getElementById("pass1");
const pass2Btn = document.getElementById("pass2");

// Desserts (use exact paths on your GitHub Pages)
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
let firstPress = true;
let gameOver = false;
let dessertQueue = [];
let currentDessert = "";
let previousDessert = "";
let passUsed1 = false;
let passUsed2 = false;
let tickInterval = null;

// Ably realtime (key from URL)
let channel = null;
if (!API_KEY) {
  alert("API key missing from URL. Append &key=YOUR_KEY");
} else {
  try {
    const ably = new Ably.Realtime(API_KEY);
    channel = ably.channels.get("floor_game_seawolves");
    // Subscribe to updates
    channel.subscribe("update", (msg) => {
      const state = msg.data;
      if (!state) return;
      // Mirror state on both master and slave (master will safely re-apply its own state)
      applyState(state);
    });
  } catch (e) {
    console.error("Ably init failed", e);
    alert("Realtime init failed. Check API key in URL.");
  }
}

/* Helpers */
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
function initQueue(){ dessertQueue = [...dessertFiles]; shuffle(dessertQueue); }
function nextDessert(){ if(dessertQueue.length===0) initQueue(); return dessertQueue.shift(); }
function stripCap(path){ if(!path) return ""; const f = path.split("/").pop().replace(/\.(jpg|jpeg)$/i,"").replace(/_/g," "); return f.replace(/\b\w/g,c=>c.toUpperCase()); }
function showImage(path){ if(!path){ imgEl.style.display="none"; placeholder.style.display="block"; imgEl.src=""; return; } imgEl.src = path; imgEl.style.display="block"; placeholder.style.display="none"; }

/* Send current state to channel */
function publishState(){
  if (!channel) return;
  const state = {
    t1, t2, activePlayer, firstPress, gameOver,
    currentDessert, previousDessert,
    passUsed1, passUsed2,
    p1Name: p1NameEl.value, p2Name: p2NameEl.value,
    answer: answerEl.textContent
  };
  channel.publish("update", state);
}

/* Apply incoming state to UI */
function applyState(state){
  // Timers
  if (typeof state.t1 === "number") { t1 = state.t1; timer1.textContent = t1.toFixed(1); }
  if (typeof state.t2 === "number") { t2 = state.t2; timer2.textContent = t2.toFixed(1); }
  // Active player
  if (typeof state.activePlayer === "number") activePlayer = state.activePlayer;
  if (typeof state.firstPress === "boolean") firstPress = state.firstPress;
  if (typeof state.gameOver === "boolean") gameOver = state.gameOver;
  // Desserts
  if (typeof state.currentDessert === "string") { currentDessert = state.currentDessert; showImage(currentDessert); }
  if (typeof state.previousDessert === "string") { previousDessert = state.previousDessert; }
  // Passes
  if (typeof state.passUsed1 === "boolean") { passUsed1 = state.passUsed1; pass1.disabled = passUsed1; }
  if (typeof state.passUsed2 === "boolean") { passUsed2 = state.passUsed2; pass2.disabled = passUsed2; }
  // Names
  if (state.p1Name) p1NameEl.value = state.p1Name;
  if (state.p2Name) p2NameEl.value = state.p2Name;
  // Answer text
  if (typeof state.answer === "string") answerEl.textContent = state.answer;
  // Winner/gameOver handling
  if (gameOver) {
    // disable controls (except reset)
    toggleBtn.disabled = true;
    pass1.disabled = true;
    pass2.disabled = true;
    toggleBtn.classList.add("disabled");
    pass1.classList.add("disabled");
    pass2.classList.add("disabled");
    // ensure reset stays enabled
    resetBtn.disabled = false; resetBtn.classList.remove("disabled");
  } else {
    if (isMaster) {
      toggleBtn.disabled = false;
      pass1.disabled = passUsed1;
      pass2.disabled = passUsed2;
      toggleBtn.classList.remove("disabled");
      pass1.classList.remove("disabled");
      pass2.classList.remove("disabled");
    } else {
      // Slave should not be interactive
      toggleBtn.disabled = true; toggleBtn.classList.add("disabled");
      pass1.disabled = true; pass1.classList.add("disabled");
      pass2.disabled = true; pass2.classList.add("disabled");
    }
  }
}

/* Timer tick loop (only master runs the ticking) */
function startTick(){
  if (tickInterval) return;
  tickInterval = setInterval(()=> {
    if (!activePlayer || gameOver) return;
    if (activePlayer === 1) {
      t1 = Math.max(0, +(t1 - 0.1).toFixed(1));
      timer1.textContent = t1.toFixed(1);
      if (t1 <= 0) concludeGame();
    } else if (activePlayer === 2) {
      t2 = Math.max(0, +(t2 - 0.1).toFixed(1));
      timer2.textContent = t2.toFixed(1);
      if (t2 <= 0) concludeGame();
    }
    publishState();
  }, 100);
}
function stopTick(){ if (tickInterval) { clearInterval(tickInterval); tickInterval = null; } }

function concludeGame(){
  stopTick();
  gameOver = true;
  // winner = the player with > 0
  if (t1 > t2) answerEl.textContent = `${p1NameEl.value} WINS!`;
  else if (t2 > t1) answerEl.textContent = `${p2NameEl.value} WINS!`;
  else answerEl.textContent = `TIE!`;
  // disable controls (master still keeps reset active)
  publishState();
}

/* Master interactions */
const timer1 = document.getElementById("timer1");
const timer2 = document.getElementById("timer2");
const pass1 = document.getElementById("pass1");
const pass2 = document.getElementById("pass2");

// Ensure UI for slave vs master
if (!isMaster) {
  // Slave: hide reset, disable interactive controls
  resetBtn.style.display = "none";
  toggleBtn.disabled = true; toggleBtn.classList.add("disabled");
  pass1.disabled = true; pass1.classList.add("disabled");
  pass2.disabled = true; pass2.classList.add("disabled");
}

/* Master-only event handlers publish state after applying local change */
if (isMaster) {
  initQueue();
  // Toggle/Wolfhead button
  toggleBtn.addEventListener("click", () => {
    if (gameOver) return;
    if (firstPress) {
      // first press: show first image, start P1 timer, no answer shown
      firstPress = false;
      answerEl.textContent = "";
      currentDessert = nextDessert();
      showImage(currentDessert);
      activePlayer = 1;
      startTick();
      publishState();
      return;
    }

    // Subsequent presses: reveal the image that was just shown (previous)
    const reveal = currentDessert ? stripCap(currentDessert) : "";
    answerEl.textContent = reveal;

    // Advance to next image for next round
    previousDessert = currentDessert;
    currentDessert = nextDessert();
    showImage(currentDessert);

    // Switch active player
    activePlayer = activePlayer === 1 ? 2 : 1;

    // ensure timers running
    startTick();
    publishState();
  });

  // Pass buttons (change image only, do not affect timers or active player)
  pass1.addEventListener("click", () => {
    if (gameOver || passUsed1) return;
    passUsed1 = true;
    pass1.disabled = true;
    previousDessert = currentDessert;
    currentDessert = nextDessert();
    showImage(currentDessert);
    publishState();
  });

  pass2.addEventListener("click", () => {
    if (gameOver || passUsed2) return;
    passUsed2 = true;
    pass2.disabled = true;
    previousDessert = currentDessert;
    currentDessert = nextDessert();
    showImage(currentDessert);
    publishState();
  });

  // Reset ALWAYS available on master
  let lastReset = 0;
  resetBtn.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastReset <= 500) {
      // double-press resets names too
      p1NameEl.value = "Player 1";
      p2NameEl.value = "Player 2";
    }
    lastReset = now;

    stopTick();
    t1 = 20.0; t2 = 20.0;
    timer1.textContent = t1.toFixed(1);
    timer2.textContent = t2.toFixed(1);
    activePlayer = 0; firstPress = true; gameOver = false;
    currentDessert = ""; previousDessert = "";
    passUsed1 = false; passUsed2 = false;
    pass1.disabled = false; pass2.disabled = false;
    showImage(""); answerEl.textContent = "";
    toggleBtn.disabled = false; toggleBtn.classList.remove("disabled");
    publishState();
  });
} else {
  // Slave: initialize queue so local nextDessert() won't accidentally run (but we won't call it)
  initQueue();
}

/* final init UI */
timer1.textContent = t1.toFixed(1);
timer2.textContent = t2.toFixed(1);
showImage("");
publishState(); // master will push initial state; slave will receive it

// Apply URL scale parameter to #game-container
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const scale = parseFloat(urlParams.get('scale') || '1'); // default 1
  if (scale !== 1) {
    const container = document.getElementById('game-container');
    if (container) {
      container.style.transformOrigin = 'top left';
      container.style.transform = `scale(${scale})`;
    }
  }
})();
