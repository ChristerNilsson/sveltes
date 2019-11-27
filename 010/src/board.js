
import Card from './card.js'

export default class Board {
  constructor(numCards, anchorEl) {
    this.numCards = numCards;
    this.cards = [];
    this.flipped_cards = [];
    this.grid = document.getElementById(anchorEl);
    this.createBoard();
  }

  createBoard() {
    const shuffledArr = this.createShuffle();
    this.cards = shuffledArr.map((type, i) => {
        return new Card (type, i, this);
      }); 
  }

  createShuffle() {
    let fromArr = [];
    let shuffledArr = [];
    for(let i = 0; i < this.numCards; i++) {
      fromArr.push(parseInt(i/2));
    }
    for(let i = 0; i < this.numCards; i++) {
      let r = parseInt(Math.random() * (this.numCards - i));
      shuffledArr.push(fromArr.splice(r, 1)[0]);
    }
    return shuffledArr;  
  }
  
  reset() {
    this.flipped = [];
    const shuffledArr = this.createShuffle();
    this.cards.forEach((card, i) => {
      card.reset(shuffledArr[i]);
    });
  }
}
		