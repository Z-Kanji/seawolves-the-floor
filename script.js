const API_KEY = "BGWSwA.NpfizA:we2gmPkZe-Bwj8v07GEV1rLkjp8bl3xP7o8ecGIpFYs";
const CHANNEL_NAME = "floor_game";

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'master';
const isMaster = mode === 'master';

const imgEl = document.getElementById("dessert-img");
const placeholder = document.getElementById("image-placeholder");
const answerEl = document.getElementById("answer-area");
const btn = document.getElementById("toggle-btn");
const resetBtn = document.getElementById("reset-btn");
const timer1El = document.querySelector("#timer1");
const timer2El = document.querySelector("#timer2");
const player1NameEl = document.getElementById("player1-name");
const player2NameEl = document.getElementById("player2-name");

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

let t1 = 20.0, t2 = 20.0, activePlayer = 0, interval = null;
let firstPress = true, dessertQueue = [], currentDessert = "", previousDessert = "", gameOver = false;

// Ably Realtime
const ably = new Ably.Realtime.Promise({ authUrl: `/ably-auth?key=${API_KEY}` });
const channel = ably.channels.get(CHANNEL_NAME);

function shuffle(array){for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}}
function initDessertQueue(){dessertQueue=[...dessertFiles]; shuffle(dessertQueue);}
function nextDessert(){if(dessertQueue.length===0) initDessertQueue(); return dessertQueue.shift();}
function capitalizeWords(str){return str.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());}

function loadNextDessert(){
  previousDessert = currentDessert;
  currentDessert = nextDessert();
  imgEl.src = currentDessert;
  imgEl.style.display = "block";
  placeholder.style.display = "none";
  return previousDessert?capitalizeWords(previousDessert.split("/").pop().replace(/\.(jpg|jpeg)$/i,"")):"";
}

function startPlayer(player){
  activePlayer = player;
  if(interval) clearInterval(interval);
  interval = setInterval(()=>{
    if(activePlayer===1){ t1-=0.1; if(t1<0) t1=0; timer1El.textContent=t1.toFixed(1); if(t1<=0) endGame();}
    if(activePlayer===2){ t2-=0.1; if(t2<0) t2=0; timer2El.textContent=t2.toFixed(1); if(t2<=0) endGame();}
    sendState();
  },100);
}

function endGame(){
  clearInterval(interval);
  activePlayer=0; gameOver=true;
  if(t1>t2) answerEl.textContent=`${player1NameEl.value} WINS!`;
  else if(t2>t1) answerEl.textContent=`${player2NameEl.value} WINS!`;
  else answerEl.textContent="TIE!";
  sendState();
}

function sendState(){
  const state={
    t1, t2, currentDessert, previousDessert, answer:answerEl.textContent,
    activePlayer, player1Name:player1NameEl.value, player2Name:player2NameEl.value
  };
  channel.publish("update", state);
}

if(isMaster){
  btn.addEventListener("click",()=>{
    if(gameOver) return;
    if(firstPress){
      firstPress=false; answerEl.textContent="";
      currentDessert = nextDessert();
      imgEl.src=currentDessert; imgEl.style.display="block"; placeholder.style.display="none";
      startPlayer(1); sendState(); return;
    }
    const prevName = loadNextDessert();
    if(prevName) answerEl.textContent = prevName;
    if(activePlayer===1) startPlayer(2); else startPlayer(1);
    sendState();
  });

  let resetClicks=0, resetTimer=null;
  resetBtn.addEventListener("click",()=>{
    resetClicks++;
    if(resetTimer) clearTimeout(resetTimer);
    resetTimer=setTimeout(()=>{
      if(resetClicks>=2){player1NameEl.value="Player 1"; player2NameEl.value="Player 2";}
      resetClicks=0;
    },300);
    clearInterval(interval); t1=20; t2=20;
    timer1El.textContent="20.0"; timer2El.textContent="20.0";
    firstPress=true; activePlayer=0; gameOver=false;
    answerEl.textContent=""; imgEl.src=""; imgEl.style.display="none"; placeholder.style.display="block";
    initDessertQueue(); sendState();
  });
} else {
  // Slave disables buttons
  btn.style.display="none";
  resetBtn.style.display="none";
}

// Slave subscribes to Ably
channel.subscribe("update", state=>{
  timer1El.textContent = state.t1.toFixed(1);
  timer2El.textContent = state.t2.toFixed(1);
  if(state.currentDessert){ imgEl.src = state.currentDessert; imgEl.style.display="block"; placeholder.style.display="none"; }
  answerEl.textContent = state.answer;
  player1NameEl.value = state.player1Name || player1NameEl.value;
  player2NameEl.value = state.player2Name || player2NameEl.value;
});

initDessertQueue(); imgEl.style.display="none"; placeholder.style.display="block";
