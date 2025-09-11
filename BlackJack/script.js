/***************************************************
 *  single hand  single deck baseline
 *  standard house rules
 * card sprites created by spriters-resource.com
 **************************************************/

const DEALER_STANDS_ON_SOFT_17 = true; 
const MIN_DECK_BEFORE_REFRESH = 15; 

let deck = [];
let playerHand = [];
let roundOver = false;
let dealerHidden = true;

const $ = (id) => document.getElementById(id);

const dealerCardsE1 = $("dealer-cards");
const playerCardsE1 = $("player-cards");
const dealerTotalE1 = $("dealer-total");
const playerTotalE1 = $("player-total");
const messageE1 = $("message");

const dealBtn = $("deal-btn") || document.querySelector("#controls button:nth-child(1)");
const hitBtn = $("hit-btn") || document.querySelector("#controls button:nth-child(2)");
const standBtn = $("stand-btn") || document.querySelector("#controls button:nth-child(3)");

/* ======================
     Deck Formation
====================== */

const SUITS = ["C", "D", "H", "S"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function createSingleDeck() {
     const d = [];
     for (const s of SUITS) for (const r of RANKS)
          d.push({ rank:r, suit:s, value: baseValue(r) });
     return d;
}
function baseValue(r){
     if (r == "A") return 11;
     if (r == "J" || r == "Q" || r == "K") return 10; 
     return Number(r);
}
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--){
        const j = (Math.random() * ( i + 1)) | 0;
        [array [i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function freshShoe() {
     shoe = [];
     for (let i=0; i < NUM_DECKS; i++) shoe.push (...createSingleDeck());
     shuffle(shoe);
     cardsDealt = 0;
     cutCardAt = Math.floor(shoe.length * PENETRATION);
     shoeNeedsShuffle = false;
     sendInfo('New ${NUM_DECKS}-deck show shuffled.');
}

 /* ==================
      Score Rules
 ================== */

function scoreHand(hand) {
    let total = 0;
    let aces = 0;

    for (const c of hand){
        total += c.value;
        if (c.rank === "A") aces++;
    }

    while (total > 21 && aces > 0){
        total -= 10;
        aces--;
    }

    const soft = hand.some(c => c.rank === "A") && aces > 0;
    return { total, soft };

}

function isBlackjack(hand) {
    return hand.length == 2 && scoreHand(hand).total === 21;
}

 /*======================
     Banking + Bets
 ===================== */
function addBet(amount) {
     if (roundInProgress()) { 
          sendInfo ("Can't change bet during a round.");
          return;
     }
     if (bank < amount) {
          sendInfo ("Not enough bank for that chip.");
          return;
     }
     bank -= amount;
     currentBet += amount;
     updateBankUI();
}
function clearBet() {
     if (roundInProgress()) {
          sendInfo("Can't clear bet during a round.");
          return;
     }
     bank += currentBet;
     currentBet = 0;
     updateBankUI();

}
function lockInitialBet() {
     if (currentBet <+ 0 ) {
          sendInfo ("place a bet first"); 
          return false;
     }
     playerHands[0].bet = currentBet;
     return true;
}
function trySpend(amount) {
     if (bank < amount) {
          return false;
     }
     bank -= amount;
     updateBankUI();
     return true;
}
function pay(amount) {
     bank += amount;
     updateBankUI();
}
function updateBankUI() {
     bankEl.textContent = bank;
     betEl.textContent = currentBet;
}
     
 /*======================
     Game Play
 ===================== */

function dealCard(to) {
     if (shoe.length === 0){
          freshShoe();
     } 
     const card = shoe.pop();
     to.push(card);
     cardsDealt++;
     if (cardsDealt >= cutCardsAt) {
          shoeNeedsShuffle = true;
     }
     return card;
}

function roundInProgress() {
     return !roundOVer && playerHands.length > 0;
} 
     

function startGame() {
     if (roundInProgress()) {
          return;
     }
     if (shoe.length === 0) {
          freshShoe();
     }
     dealerHidden = true;
     roundOver = false;
     splitUsed = false;
     messageEl.textContent = "";

     dealerHand = [];
     playerHand = [{ cards: [], bet:0, doubled:false, busted:false, naturalBJ:false }];

     if (!lockInitialBet()) {
          return;
     }

     dealCard(playerHands[0].cards);
     dealCard(dealerHand);
     dealCard(playerHands[0].cards);
     dealCard(dealerHand);

     playerHands[0].nautralBJ = isBlackjack(playerHands[0].cards);
     const dealerBJ = isBlackjack(dealerHand);

     render(true);
     setControls({ deal:false, hit:true, stand:true, double:canDouble(), split:canSplit()});
     if (playerHands[0].naturalBJ || dealerBJ) { 
          dealerHidden = false; 
          render(false);
          resolveRoundImmediate(playerHands[0].nautralBJ, dealerBJ);
          return;
     } 
     sendInfo("Your move. (H)it, (S)tand, (X) Double, (P) Split");
}

function hit() {
    if (!roundInProgress()){
         return;
    }
     const hand = activeHand();
     if (hand.done) {
          return;
     }
     dealCard(hand.cards);
     render(true);
     const { total } = scoreHand(hand.cards);
     if (total > 21) {
          hand.busted = true;
          hand.done = true; 
          advancedHandOrDealer();
     } else {
          setControls({ deal:false, hit:true, stand:true, double:false, split:false });
     }
}

function stand(){
    if (!roundInProgress()){
         return;
    }
     const hand = activeHand();
     hand.done = true;
     advancedHandOrDealer();
}
function doubleDown() {
     if(!roundInProgress()) {
          return;
     }
     if(!canDouble()){
          sendInfo("Double not allowed now.");
          return;
     }
     const hand = activeHand();
     if(!trySpend(hand.bet)) {
          sendInfo("not enough bank to double.");
          return;
     }
     hand.bet += hand.bet;
     hand.doubled = true;

     dealCard(hand.cards);
     render(true);
     const { total } = scoreHand(hand.cards);
     if (total > 21){
          hand.busted = true;
          hand.done = true;
          advancedHandOrDealer();
     }
    }
function splitHand() {
     if(!roundInProgress()){
          return;
     } 
     if(!canSplit()) {
          sendInfo("Split not allowed now.")
          return;
     } 
     const hand = activeHand();
     const [c1, c2] = hand.cards;
     if (!trySpend(hand.bet)) {
          sendInfo("Not enough bank to split.");
          return;
     }
     const newHand = { cards:[c2], bet:hand.bet, doubled:false, done:false, busted:false, naturalBJ:false};
     hand.cards = [c1];
     dealCard(hand.cards);
     dealCard(newHand.cards);
     playerHands.splice(currentHandIndex+1, 0, newHand);
     splitUsed = true;
     render(true);
     setControls({deal:false, hit:true, stand:true, double:canDouble(), split:false });
}
function advancedHandOrDealer() {
     while(currentHandIndex < playerHands.length && playerHands[currentHandIndex].done){
          currentHandIndex++;
     }
     if (currentHandIndex < playerHands.length) {
          render(true);
          setControls({ deal:false, hit:true, stand:true, double:canDouble(), split:canSplit() });
          return;
     }
     dealerHidden = false;
     render(false);
     dealerPlay();
     settleBets();
}
function dealerPlay(){
    while (true){
        const { total, soft } = scoreHand(dealerHand);
        if (total > 21) break;
        if (total > 17) break;
        if (total === 17) {
            if (soft && !DEALER_STANDS_ON_SOFT_17){
                dealerCardsE1(dealerHand);
                continue;
            }else{
                break;
            }
        } 
        
        dealCard(dealerHand);
    }

    render(false);
}
function resolveRoundImmediate(playerBJ, dealerBJ) {
     if (playerBJ && dealerBJ) {
          pay(playerHands[0].bet);
          sendInfo("Push. Both have Blackjack.");
     } else if (playerBJ) {
          const win =Math.floor(playerHands[0].bet * (1 + BLACKJACK_PAYOUT));
          pay(win);
          sendInfo("Blackjack! Paid 3:2.");
     } else if (dealerBJ) {
          sendInfo("Dealer Blackjack.");
     }
     endRound();
}
function settleBets() { 
     const d = scoreHand(dealerHand).total;
     let messages = [];
     for (let i=0; i<playerHands.length; i++){
          const hand = playerHands[i];
          const p =scoreHand(hand.cards).total;

          if (hand.busted){
                message.push('Hand ${i+1}: Bust (-$${hand.bet}).');
               continue;
          }
          if ( d > 21) {
               pay(hand.bet * 2);
               message.push(`Hand ${i+1}: Dealer busts, you win (+$${hand.bet}).`);
               continue;
              } 
          if ( p > d) {
               pay(hand.bet * 2);
               message.push('Hand ${i+1}: Win (+$${hand.bet}).');
          } else if ( p < d){
               messages.push('Hand ${i+1}: Lose (-$${hand.bet}).');
          } else {
               pay(hand.bet);
               messages.push('Hand ${i+1}: Push (bet returned).');
          }
     }
          sendInfo(messages.join(""));
          endRound();
}
               

function endRound(text){
    roundOver  = true;
    currentBet = 0;     
    updateBankUI();
    setControls({ deal:true, hit:false, stand:false, double:false, split:false});
     if (shoeNeedsShuffle){
          freshShoe();
     }
}

 /* ======================
     Sprite Rendering 
 ======================= */

function createCardEl(rank, suit){
     const el = document.createElement("div");
     el.className = 'card card--${rank}${suit}';
     el.setAttribute("aria-label", '${rank} of ${suitFullName(suit)}');
     return el;
}
function suitFullName(s) {
    return s == "C" ? "Clubs" :
           s == "D" ? "Diamonds" :
           s == "H" ? "Hearts" :
                      "Spades";
}
function activeHand() {
     return playerHands[currentHandIndex] || null;
}
function setControls({ deal, hit, stand, double, split}) {
     if (dealBtn) dealBtn.disabled = deal === false;
     if (hitBtn) hitBtn.disabled = hit === false; 
     if (standBtn) standBtn.disabled = stand === false;
     if (doubleBtn) doubleBtn.disabled = double === false;
     if (splitBtn) splitBtn.disabled = split === false;
}
function canDouble() {
     const hand = activeHand();
     if (!hand || hand.done){
          return false;
     }
     if (hand.cards.length !== 2){
          return false;
     }
     if (bank < hand.bet){
          return false;
     }
     return true;
}
function canSplit() {
     if (splitUsed){
          return false;
     }
     const hand = activeHand();
     if(!hand || hand.done){
          return false;
     }
     if(hand.cards.length !== 2){
          return false;
     }
     const [a,b] = hand.cards;
     const sameRank = a.rank == b.rank;
     const tenValue = (v) => v === 10;
     const bothTenVal = tenValue(a.value) && tenValue(b.value);
     if (bank < hand.bet){
          return false;
     }
     return sameRank || (ALLOW_SPLIT_10_VALUES && bothTenVal);
}
          
function sendInfo(txt){
     messageEl.textContent = txt;
}



 /* =========================
   Controls and Shortcuts
 ========================= */
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (["input","textarea","select"].includes(tag)) {
    return;
  }

  if (key === "d" && !dealBtn.disabled){
    startGame();
  }
  if (key === "h" && !hitBtn.disabled){
       hit();
  }
  if (key === "s" && !standBtn.disabled){
    stand();
  }
  if (key === "x" && !doubleBtn.disabled){
     doubleDown();
  }
  if (key === "p" && !splitBtn.disabled){
     splitHand();
  }
});


freshShoe();
updateBankUI();
setControls({ deal:true, hit:false, stand:false, double:false, split:false});
sendInfo("Place chips, then Deal. Keys: D/H/S, X=Double, P=Split");
