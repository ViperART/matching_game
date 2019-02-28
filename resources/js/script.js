let game = {
    tiles: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8],
    gameField: document.querySelector('.game-field'),
    movesCount: document.querySelector('.moves'),
    startBtn: document.querySelector('.start'),
    timer: document.querySelector('.timer'),
    state: "on-hold",
    wrongBlock: 'no', // if 'yes' all actions blocked (used for 0.5 sec block when guessed wrong)
    stage: 'first', // 'first', 'second' or 'comparison'; depending on this value, game decides what to do next
    first: '',
    second: '',
    rightMoves: 0,
    moves: 0,
    finalTime: 0,
    finalTimeNum: 0,

    shuffleAlgorithm(a, b) {
        return Math.random() - 0.5;
    },

    // Shuffle tiles
    shuffle() {
        this.shuffledTiles = this.tiles.sort(this.shuffleAlgorithm);
    },

    // Print tiles on page
    inject() {
        this.gameField.innerHTML = '';
        this.shuffledTiles.forEach((e) => {
            this.gameField.insertAdjacentHTML('beforeend', 
        `
        <div class="tile">
            <img draggable="false" src="./resources/images/${e}.svg" data-num="${e}">
        </div>
        `);
        });
    },

    init() {
        this.startBtn.addEventListener('click', this.start.bind(game));
    },

    // Start game and clear results of previous one if they exist
    start() {
        if (this.state == 'on-hold') {
            this.timer.innerHTML = 'Time: 00:00';
            this.movesCount.innerHTML = 'Moves: 0';
            this.shuffle();
            this.inject();
            this.timerStart();
            this.rightMoves = 0;
            this.moves = 0;
            this.state = 'playing';
        }
    },

    // Clear styles and variables for next try
    reset() {
        this.first.classList.remove('show');
        this.second.classList.remove('show');
        this.first = '';
        this.second = '';
        this.stage = 'first';
    },

    // If choose two identical tiles 
    guessedRight() {
        this.first.classList.add('right');
        this.second.classList.add('right');
        this.first.dataset.num = '';
        this.second.dataset.num = '';
        this.reset();
        this.rightMoves++;
    },

    // If choose two different tiles
    guessedWrong() { 
        this.first.classList.add('wrong');
        this.second.classList.add('wrong');
        let timer = setTimeout(() => {
            this.first.classList.remove('wrong');
            this.second.classList.remove('wrong');
            this.reset();
            clearTimeout(timer);
            this.wrongBlock = 'no';
        }, 500);
        
    },

    // Begin timer
    timerStart() {
        const secondsMax = 60;
        let min = 0;
        let sec = 0;
        var timer = setInterval(() => {
            if (this.rightMoves == this.tiles.length / 2) {
                clearInterval(timer);
                this.finalTimeNum = min * 60 + sec;
            } else {
                sec++;
                if (sec == secondsMax) {
                    min++;
                    sec = 0;
                }
                this.timer.innerHTML = `Time: ${`${min}`.length > 1 ? min : `0${min}`}:${`${sec}`.length > 1 ? sec : `0${sec}`}`;
            }
        }, 1000);
    },

    // Update num of moves
    printMoves() {
        this.moves++;
        this.movesCount.innerHTML = `Moves: ${this.moves}`;
    },


    countHighscore() {
        let highscore = 1000 - (this.moves * 15 + this.finalTimeNum * 9);
        if (highscore > 0) {
            return highscore;
        } else {
            return 0;
        }
    }
};

class HighscoreEntry {
    constructor(date, time, moves, score) {
        this.date = date;
        this.time = time;
        this.moves = moves;
        this.score = score;
    }
    
}

let records = [];
let highscoreBoard = document.querySelector('.entry-block');

formatDate = (date) => {

    var dd = date.getDate();
    if (dd < 10) dd = '0' + dd;
  
    var mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;
  
    var yy = date.getFullYear() % 100;
    if (yy < 10) yy = '0' + yy;
  
    return dd + '.' + mm + '.' + '20' + yy;
};

function compare(a, b) {
    if (a.score < b.score)
      return 1;
    if (a.score > b.score)
      return -1;
    return 0;
}



// Tiles interaction
document.addEventListener('click', (e) => {
    if (e.target.dataset.num && game.wrongBlock == 'no') {
        e.target.classList.add('show');
        if (game.stage == 'first') {
            game.first = e.target;
            game.stage = 'second';
        } else if (game.stage == 'second' && e.target != game.first) {
            game.second = e.target;
            game.stage = 'comparison';
            if (game.first && game.second && game.first.dataset.num == game.second.dataset.num && game.stage == 'comparison') {
                game.guessedRight();
                game.printMoves();
                if (game.rightMoves == game.tiles.length / 2) {
                    game.state = 'on-hold';
                    game.countHighscore();
                    game.finalTime = game.timer.innerHTML.slice(6, 11);
                    records.push(new HighscoreEntry(formatDate(new Date()), game.finalTime, game.moves, game.countHighscore()));
                    localStorage.setItem('highscores', JSON.stringify(records));
                    highscoreBoard.innerHTML = '';
                    records.sort(compare);
                    if (records.length > 10) records.pop();
                    records.forEach((e) => {
                        let markup = 
                        `
                        <div class="highscore-entry">
                            <p class="entry-item date-item">${e.date}</p>
                            <p class="entry-item time-item">${e.time}</p>
                            <p class="entry-item moves-item">${e.moves}</p>
                            <p class="entry-item score-item">${e.score}</p>
                        </div>
                        `;
                        highscoreBoard.insertAdjacentHTML('beforeend', markup);
                    });
                }
            } else if (game.first && game.second && game.first.dataset.num != game.second.dataset.num && game.stage == 'comparison') {
                game.guessedWrong();
                game.printMoves();
                game.wrongBlock = 'yes';
            }
        }
    }
});

readStorage = () => {
    let storage = JSON.parse(localStorage.getItem('highscores'));
    if (storage) {
        records = storage;
    }
};

window.addEventListener('load', () => {
    readStorage();
    records.sort(compare);
    records.forEach((e) => {
        let markup = 
        `
        <div class="highscore-entry">
            <p class="entry-item date-item">${e.date}</p>
            <p class="entry-item time-item">${e.time}</p>
            <p class="entry-item moves-item">${e.moves}</p>
            <p class="entry-item score-item">${e.score}</p>
        </div>
        `;
        highscoreBoard.insertAdjacentHTML('beforeend', markup);
    });
});


game.init();


