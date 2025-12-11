const API_KEY = "BGWSwA.NpfizA:we2gmPkZe-Bwj8v07GEV1rLkjp8bl3xP7o8ecGIpFYs";
const CHANNEL_NAME = "floor_game";

const imgEl = document.getElementById("dessert-img");
const placeholder = document.getElementById("image-placeholder");
const answerEl = document.getElementById("answer-area");
const timer1El = document.querySelector("#timer1");
const timer2El = document.querySelector("#timer2");
const player1NameEl = document.getElementById("player1-name");
const player2NameEl = document.getElementById("player2-name");

// Ably realtime
const ably = new Ably.Realtime.Promise({ authUrl: `/ably-auth?key=${API_KEY}` });
const channel = ably.channels.get(CHANNEL_NAME);

channel.subscribe("update", state=>{
  timer1El.textContent = state.t1.toFixed(1);
  timer2El.textContent = state.t2.toFixed(1);
  if(state.currentDessert){ imgEl.src = state.currentDessert; imgEl.style.display="block"; placeholder.style.display="none"; }
  answerEl.textContent = state.answer;
  player1NameEl.value = state.player1Name || player1NameEl.value;
  player2NameEl.value = state.player2Name || player2NameEl.value;
});
