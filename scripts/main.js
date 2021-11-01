import {
    addNewPlayer,
    evaluateHand,
    evaluateHandWithServer,
    getRankings, getServerRanking,
    HANDS,
    isConnected,
    setConnected,
} from './game-service.js';

const changeToServerButton = document.querySelector('#change_to_server_button');
const ranking = document.querySelector('#rangliste');
const main = document.querySelector('.Startseite');
const game = document.querySelector('.Game');
const nextRoundParagraph = document.querySelector('#nextRound');
const enemyHandParagraph = document.querySelector('#enemyHand');
const table = document.querySelector('#history');
const nameInput = document.querySelector('#nameInput');
const nameOutput = document.querySelector('#nameOutput');
const nameForm = document.querySelector('#nameForm');
const returnHome = document.querySelector('#returnHome');
const selectionButtons = document.querySelectorAll('.selection');

// Methode von Moodle Q&A um Input zu säubern
function sanitizeString(name, maxlength = 10) {
    return name.substring(0, maxlength)
        .replace(/\W+/g, '');
}

// Erstelle Paragraph für jeden Spieler mit gleicher Anzahl Wins
function nextPlayer(rankings, list) {
    rankings.forEach((rank) => {
        list.insertAdjacentHTML('beforeend', `<p> ${sanitizeString(JSON.stringify(rank.user))} </p>`);
    });
}

// Methode um die Rangliste zu rendern
function renderRanking(serverRankings) {
    [...ranking.childNodes].forEach((el) => el.remove());
    let number = 1;
    let prevWin = null;
    if (!isConnected()) {
        getRankings((rankings) => {
            const localRankSorted = Object.keys(rankings)
                .sort((a, b) => rankings[b].win - rankings[a].win)
                .map((key) => rankings[key])
                .slice(0, 10);
            localRankSorted.forEach((rank) => {
                if (prevWin !== rank.win) {
                    ranking.insertAdjacentHTML('beforeend', `<li><h3>${number++}. Rang mit ${rank.win} Siegen</h3></li>`);
                    nextPlayer(localRankSorted.filter((r) => r.win === rank.win), ranking);
                    prevWin = rank.win;
                }
            });
        });
    } else {
        const serverRankSorted = Object.keys(serverRankings)
            .sort((a, b) => serverRankings[b].win - serverRankings[a].win)
            .map((key) => serverRankings[key])
            .slice(0, 10);
        serverRankSorted.forEach((rank) => {
            if (prevWin !== rank.win) {
                ranking.insertAdjacentHTML('beforeend', `<li><h3>${number++}. Rang mit ${sanitizeString(JSON.stringify(rank.win))} Siegen</h3></li>`);
                nextPlayer(serverRankSorted.filter((r) => r.win === rank.win), ranking);
                prevWin = rank.win;
            }
        });
    }
}

// Anzeige der Webseite von Startseite zur Gamepage und umgekehrt (Single Page App)
async function changeDiv() {
    if (game.hidden === true) {
        main.hidden = true;
        game.hidden = false;
    } else {
        main.hidden = false;
        game.hidden = true;
        if (isConnected()) {
            renderRanking(await getServerRanking());
        } else {
            renderRanking();
        }
    }
}

// Die Webseite umschalten zu Server oder Lokal
async function changeToServerOrLocal() {
    if (isConnected()) {
        setConnected(false);
        renderRanking();
        changeToServerButton.innerHTML = 'Wechsle zu Server';
    } else {
        setConnected(true);
        changeToServerButton.innerHTML = 'Wechsle zu Lokal';
        renderRanking(await getServerRanking());
    }
}

// Die Hand des Computers generieren
function generateHand() {
    const handIndex = Math.floor(Math.random() * 5);
    return Object.keys(HANDS)[handIndex];
}

// Die Runde zurücksetzen e.g Buttons wieder einschalten etc
function resetRound() {
    let timeLeft = 3;
    nextRoundParagraph.innerHTML = `Nächste Runde in ${timeLeft}`;
    const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft === 0) {
            nextRoundParagraph.innerHTML = 'VS';
            selectionButtons.forEach((button) => {
                button.removeAttribute('disabled');

                // eslint-disable-next-line @web-and-design/wed/use-action-map
                if (button.classList.contains('victory')) {
                    button.classList.remove('victory');
                } else if (button.classList.contains('defeat')) {
                    button.classList.remove('defeat');
                } else {
                    button.classList.remove('tie');
                }
            });
            nextRoundParagraph.innerHTML = '?';
            enemyHandParagraph.innerHTML = '?';
            clearInterval(interval);
        } else {
            nextRoundParagraph.innerHTML = `Nächste Runde in ${timeLeft}`;
        }
    }, 1000);
}

// Im HTML Element die Hand des Computers anzeigen
function showEnemyHand(enemyHand) {
    enemyHandParagraph.innerHTML = enemyHand;
}

// History Einträge hinzufügen
function createHistory(didWin, playerHand, enemyHand) {
    const row = table.insertRow(1);
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    const cell3 = row.insertCell(2);
    if (typeof didWin === 'undefined') cell1.innerHTML = '=';
    else cell1.innerHTML = didWin ? '✓' : '✗';
    cell2.innerHTML = playerHand;
    cell3.innerHTML = enemyHand;
}

// Auf Eventhandler registrierte Methode zur Berechnung des Spiels
async function rps() {
    selectionButtons.forEach((button) => {
        button.setAttribute('disabled', 'disabled');
    });
    const name = nameInput.value;
    const playerHand = this.getAttribute('data-value');
    let win;
    let choice;

    if (isConnected()) {
        [win, choice] = await evaluateHandWithServer(name, playerHand);
    } else {
        choice = generateHand();
        win = evaluateHand(name, playerHand, choice);
    }
    showEnemyHand(choice);
    // eslint-disable-next-line @web-and-design/wed/use-action-map
    if (typeof win === 'undefined') {
        this.classList.add('tie');
    } else if (win) {
        this.classList.add('victory');
    } else {
        this.classList.add('defeat');
    }
    createHistory(win, playerHand, choice);
    resetRound();
}

// Methode um das "Spiel" zu starten mit dem eingegebenen Namen
function startGame(event) {
    event.preventDefault();
    changeDiv();
    const playerName = nameInput.value;
    if (!isConnected()) {
        addNewPlayer(playerName);
    }
    nameOutput.innerHTML = `<b>${playerName}!</b> Wähle deine Hand!`;
}

// Funktion am Anfang um den Buttons einen EventListener hinzuzufügen
function addButtonListener() {
    changeToServerButton.addEventListener('click', changeToServerOrLocal);
    nameForm.addEventListener('submit', startGame);
    returnHome.addEventListener('click', changeDiv);
    selectionButtons
        .forEach((button) => {
            button.addEventListener('click', rps);
        });
}

game.hidden = true;
addButtonListener();
renderRanking();
