const API_KEY="BGWSwA.NpfizA:we2gmPkZe-Bwj8v07GEV1rLkjp8bl3xP7o8ecGIpFYs";
const BASE_URL="https://push-api.ably.io";

const imgEl=document.getElementById("dessert-img");
const placeholder=document.getElementById("image-placeholder");
const answerEl=document.getElementById("answer-area");
const timer1El=document.querySelector("#timer1");
const timer2El=document.querySelector("#timer2");
const player1NameEl=document.getElementById("player1-name");
const player2NameEl=document.getElementById("player2-name");

let t1=20, t2=20, activePlayer=0, currentDessert="", previousDessert="";

async function pollState(){
  const res=await fetch(`${BASE_URL}/channels/floor_game/publish`,{
    headers:{"Authorization":"Basic "+btoa(API_KEY)}
  });
  const data=await res.json();
  if(!data||!data.items) return;
  const state=data.items[data.items.length-1].data;
  if(!state) return;

  t1=state.t1; t2=state.t2; activePlayer=state.activePlayer;
  currentDessert=state.currentDessert; previousDessert=state.previousDessert;

  timer1El.textContent=t1.toFixed(1);
  timer2El.textContent=t2.toFixed(1);

  if(currentDessert){ imgEl.src=currentDessert; imgEl.style.display="block"; placeholder.style.display="none"; }
  answerEl.textContent=state.answer;
  player1NameEl.value=state.player1Name||player1NameEl.value;
  player2NameEl.value=state.player2Name||player2NameEl.value;
}

setInterval(pollState,250);
