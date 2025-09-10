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

function createDeck(){
    const d = [];
    for (const s of SUITS){
        for (const r of RANKS){
            d.push({ rank: r, suit: s, value: baseValue(r) });

        }
    }

    return d;
}

function baseValue(rank) {
    if (rank == "A") return 11;
    if (rank == "J" || rank == "Q" || rank == "K") return 10;
    return Number(rank);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--){
        const j = (Math.random() * ( i + 1)) | 0;
        [array [i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function newDeck() {
    deck = shuffle(createDeck());
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
     Game Play
 ===================== */

function dealCard(toHand) {
    if (deck.length === 0) frehDeck();
    toHand.push (deck.pop());
}

function startGame() {
    roundOver = false;
    dealerHidden = true;
    messageE1.textContent = "";
    playerHand = [];
    dealerHand = [];

    if (deck.length < MIN_DECK_BEFORE_REFRESH) freshDeck();

    dealCard(playerHand);
    dealCard(dealerHand);
    dealCard(playerHand);   
    dealCard(dealerHand);

    render(true);

    const playerBJ = isBlackjack(playerHand);
    const dealerBJ = isBlackjack(dealerHand);
    if (playerBJ || dealerBJ) {
        dealerHidden = false;
        render(false);
        endRound(compareAfterStand());
        return;
    }
    setControls({ deal:false, hit:true, stand:true });
}

function hit() {
    if (roundOver) return;
    dealCard(playerHand);
    render(true);

    const { total } = scoreHand(playerHand);
    if (total > 21) {
        dealerHidden = false;
        render(false);
        endRound("You bust. Dealer wins");
    }
}

function stand(){
    if (roundOver) return;
    dealerHidden = false;
    render(false);
    dealerPlay();
    endRound(compareAfterStand());
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

function CompareAfterStand(){
    const p = scoreHand(playerHand).total;
    const d = scoreHand(dealerHand).total;

    if (isBlackjack(playerHand)&& isBlackjack(dealerHand)) return "Push. Both have Blackjack.";
    if (isBlackjack(playerHand)) return "BlackJack! You Win.";
    if (isBlackjack(dealerHand)) return "Dealer has Blackjack.";

    if (p > 21) return "You bust. Dealer wins.";
    if (d > 21) return "Dealer busts. You win!";
    if (p > d) return "You win!";
    if (p < d) return "Dealer wins.";
    return "Push.";
}

function endRound(text){
    roundOver  = true;
    messageE1.textContent = text;
    setControls({deal:true, hit:false, stand:false});
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

function render(hideDealerHole){
    renderHand(dealerCardsEl, dealerHand, hideDealerHole);
    renderHand(playerCardsEl, playerHand, false);

    const ps = scoreHand(playerHand);
    const ds = scoreHand(dealerHand);
    playerTotalEl.textContent = ps.soft ? 'Total: ${ps.total} (soft)' : 'Total: ${ps.total}';
    dealerTotalEl.textContent = hideDealerHole ? 'Dealer total: ?' :
                                ds.soft ? 'Total: ${ds.total} (soft)' : 'Total: ${ds.total}';

}

function renderHand(container, hand, hideHole){
    container.innerHTML = "";
    hand.forEach((card, idx) => {
        if (hideHole && idx === 1 ) {
            const back = document.createElement("div");
            back.className = "card card--back";
            back.setAttribute("aria-label", "face-down card");
            container.appendChild(back);
        } else {
            container.appendChild(createCardEl(card.rank, card.suit));
        }
     });
 }

 /* =========================
   Controls and Shortcuts
 ========================= */

 function setControls({deal, hit, stand}) {
    if (dealBtn) dealBtn.disabled = !deal;
    if (hitBtn) hitBtm.disabled = !hit;
    if (standBtn) standBtn.disabled = !stand;
 }

if (dealBtn)  dealBtn.addEventListener("click", startGame);
if (hitBtn)   hitBtn.addEventListener("click", hit);
if (standBtn) standBtn.addEventListener("click", stand);

// Keyboard : D deal, H hit, S stand

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return;
    if (key == "d" && !dealBtn?.disabled) startGame();
    if (key === "s" && !standBtn?.disabled) stand();

});

freshDeck();
setControls({ deal:true, hit:false, stand:false });
messageEl.textContent = "Press Deal (d) to start."