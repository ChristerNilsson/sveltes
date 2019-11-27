
const BACK_URL = 'http://5.189.154.110/back2.png';
const FRONTS_URL = 'http://localhost:8111/png/';

export default class Card {
  constructor (type, index, parentBoard){
    this.type = type;
    this.board = parentBoard;
    this.i = index;
    
    const flip_card = document.createElement("div");
    flip_card.className = "flip-card";
    this.board.grid.appendChild(flip_card);
    
    this.flip_card_inner = document.createElement("div");
    this.flip_card_inner.className = "flip-card-inner";
    flip_card.appendChild(this.flip_card_inner);
    this.flip_card_inner.onclick = this.onclick.bind(this);
    
    const flip_card_front = document.createElement("div");
    flip_card_front.className = "flip-card-front";
    this.flip_card_inner.appendChild(flip_card_front);
    
    this.img_front = document.createElement("img");
    this.setFront();
    flip_card_front.appendChild(this.img_front);
    
    const flip_card_back = document.createElement("div");
    flip_card_back.className = "flip-card-back";
    this.flip_card_inner.appendChild(flip_card_back);
    
    const img_back = document.createElement("img");
    img_back.setAttribute('src', BACK_URL);
    flip_card_back.appendChild(img_back);
  }
    
  flipCard() {
    this.flip_card_inner.classList.toggle('is-flipped');
    this.flipped = !this.flipped;
  }
    
  onclick() {
    if(!this.flipped) {
      if(this.board.flipped_cards.length < 2) {
        this.flipCard();
        this.board.flipped_cards.push(this.i);
      }
      if(this.board.flipped_cards.length == 2) {
        if(this.type == this.board.cards[this.board.flipped_cards[0]].type) {
          console.log("match");
          this.board.flipped_cards = [];
        } else {
          console.log("no match");
          setTimeout(() => {
            this.board.flipped_cards.forEach((el) => {
              this.board.cards[el].flipCard();
            });
            this.board.flipped_cards = [];
          }, 1000);
        }
      }
    }
  }

  setFront() {
    this.img_front.setAttribute('src', FRONTS_URL + this.type + '/150');
  }
  
  reset(type) {
    this.type = type;
    if(this.flipped) {
      this.flipCard();
      setTimeout(() => {
        this.setFront();
      }, 1000);
    } else {
        this.setFront();
    };
  }
}
