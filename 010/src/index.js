require('../styles/index.scss');

import Board from './board.js';

class Game {
  constructor() {
    this.button = document.getElementById("restart");
    this.button.onclick = this.restart.bind(this);
    this.board1 = new Board (8, "grid");
  }  

  restart() {
    console.log("in restart");
    this.board1.reset();
  }
}

let game1 = new Game();
