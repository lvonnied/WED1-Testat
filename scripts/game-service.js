// Objekt mit allen Personen in der Rangliste
const rankings = {
    Lucas: {user: 'Lucas', win: 100},
    Markus: {user: 'Markus', win: 3},
    Michael: {user: 'Michael', win: 4},
    Lisa: {user: 'Lisa', win: 4},
};

// Objekt mit allen "Händen" und deren Gewinnkondition
export const HANDS = {
    Stein: {win: ['Schere', 'Streichholz']},
    Papier: {win: ['Stein', 'Brunnen']},
    Schere: {win: ['Papier', 'Streichholz']},
    Brunnen: {win: ['Stein', 'Schere']},
    Streichholz: {win: ['Papier', 'Brunnen']},
};

const SERVER_API = 'https://stone.dev.ifs.hsr.ch';

let isConnectedState = false;

export function setConnected(newIsConnected) {
    isConnectedState = Boolean(newIsConnected);
}

export function isConnected() {
    return isConnectedState;
}

// Hinzufügen eines neuen Spieleren wenn dessen Namen nicht in der Liste schon ist
export function addNewPlayer(name) {
    if (!rankings[name]) {
        rankings[name] = {
            user: name,
            win: 0,
            loss: 0,
        };
    }
}

// Hände vergleichen um herauszufinden wer gewonnen hat
function compareHands(playerHand, enemyHand) {
    if (playerHand === enemyHand) {
        return undefined;
    }
    return HANDS[playerHand].win.includes(enemyHand);
}

// Wenn Spieler gewonnen hat werden seine gewonnenen Spiele inkrementiert
function updateRankings(playerName, didWin) {
    if (didWin) {
            rankings[playerName].win++;
        }
}

// Funktion um die Rangliste zu bekommen
export function getRankings(rankingsCallbackHandlerFn) {
    rankingsCallbackHandlerFn(rankings);
}

// Funktion um die Hand zu evaluieren
export function evaluateHand(playerName, playerHand, enemyHand) {
    const didWin = compareHands(playerHand, enemyHand);
    updateRankings(playerName, didWin);
    return didWin;
}

// Funktion um die Hand über den Server zu evaluieren
export async function evaluateHandWithServer(playerName, playerHand) {
    const SERVER_RPS = `/play?playerName=${playerName}&playerHand=${playerHand}`;
    let win;
    let choice;
    const serverResponse = [];
    let response = await fetch(SERVER_API + SERVER_RPS);
    if (response.ok && response.status === 200) {
        response = await response.json();
        ({win, choice} = response);
    }
    serverResponse[0] = win;
    serverResponse[1] = choice;
    return serverResponse;
}

// Funktion um die Rangliste vom Server zurückzugeben
export async function getServerRanking() {
    const SERVER_RANKING = '/ranking';
    const response = await fetch(SERVER_API + SERVER_RANKING);
    let serverRanking;
    if (response.ok && response.status === 200) {
        serverRanking = await response.json();
    }
    return serverRanking;
}
