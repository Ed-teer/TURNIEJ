// Dane systemu
const system = {
    playerPool: [],
    tournament: {
        players: [],
        rounds: 3,
        currentRound: 0,
        allMatches: [],
        playerStats: {},
        playedPairs: new Set(),
        isActive: false,
        nextMatchId: 1
    }
};

// Elementy DOM
const playerPoolEl = document.getElementById('playerPool');
const tournamentPlayersEl = document.getElementById('tournamentPlayers');
const matchesContainerEl = document.getElementById('matchesContainer');
const rankingTableEl = document.getElementById('rankingTable').querySelector('tbody');
const roundsSelectEl = document.getElementById('rounds');
const gameTypeSelectEl = document.getElementById('gameType');
const newPlayerNameEl = document.getElementById('newPlayerName');
const startBtnEl = document.getElementById('startBtn');
const resetBtnEl = document.getElementById('resetBtn');
const exportBtnEl = document.getElementById('exportBtn');
const tournamentStatusEl = document.getElementById('tournamentStatus');
const currentRoundInfoEl = document.getElementById('currentRoundInfo');
const playerCountEl = document.getElementById('playerCount');
const tournamentPlayerCountEl = document.getElementById('tournamentPlayerCount');

// Funkcje pomocnicze
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getPlayerColor(player) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const index = system.tournament.players.indexOf(player) % colors.length;
    return colors[index];
}

// Inicjalizacja
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    updatePlayerCount();
    updateTournamentPlayerCount();
});

// Zarządzanie graczami

function addToPlayerPool() {
    const name = document.getElementById('newPlayerName').value.trim();
    
    if (!name===null) {
        alert("Wpisz nazwę gracza!");
        return;
    }
    
    if (system.playerPool.includes(name)) {
      //  alert("Ten gracz już istnieje!");
      //  document.getElementById('newPlayerName').value = "";
        return;
    }
    
    system.playerPool.push(name);
    document.getElementById('newPlayerName').value = "";
    
    updatePlayerPool();
    saveToLocalStorage();
    updatePlayerCount();
}

function updateTournamentPlayersList() {
    const container = document.getElementById('tournamentPlayers');
    container.innerHTML = '';

    if (system.tournament.players.length === 0) {
        container.innerHTML = '<p>Wybierz graczy z bazy powyżej</p>';
        return;
    }

    system.tournament.players.forEach((player, index) => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.innerHTML = `
            <span>${player}</span>
            <button class="warning" onclick="removeFromTournament(${index})">Usuń</button>
        `;
        container.appendChild(playerElement);
    });
}

function removeFromTournament(index) {
    system.tournament.players.splice(index, 1);
    updateTournamentPlayersList();
    updatePlayerPool(); // Odświeża checkboxy w głównej liście
    updateTournamentPlayerCount();
    startBtnEl.disabled = system.tournament.players.length < 2;
}

function updateTournamentPlayerCount() {
    document.getElementById('tournamentPlayerCount').textContent = system.tournament.players.length;
}






function updatePlayerPool() {
    playerPoolEl.innerHTML = '';
    
    if (system.playerPool.length === 0) {
        playerPoolEl.innerHTML = '<p>Brak graczy. Dodaj pierwszego gracza.</p>';
        return;
    }
    
    system.playerPool.forEach((player, index) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.innerHTML = `
            <label class="checkbox-label">
                <input type="checkbox" 
                       onchange="toggleTournamentPlayer(${index})"
                       ${system.tournament.players.includes(player) ? 'checked' : ''}>
                <span>${player}</span>
            </label>
            <button class="danger" onclick="removeFromPool(${index})">Usuń</button>
        `;
        playerPoolEl.appendChild(playerItem);
    });
}

function removeFromPool(index) {
    const player = system.playerPool[index];
    
    // Usuń z turnieju jeśli był wybrany
    const tournamentIndex = system.tournament.players.indexOf(player);
    if (tournamentIndex !== -1) {
        system.tournament.players.splice(tournamentIndex, 1);
        updateTournamentPlayersList();
        updateTournamentPlayerCount();
        startBtnEl.disabled = system.tournament.players.length < 2;
    }
    
    system.playerPool.splice(index, 1);
    updatePlayerPool();
    saveToLocalStorage();
    updatePlayerCount();
}

function toggleTournamentPlayer(poolIndex) {
    const player = system.playerPool[poolIndex];
    const index = system.tournament.players.indexOf(player);
    
    if (index === -1) {
        system.tournament.players.push(player);
    } else {
        system.tournament.players.splice(index, 1);
    }
    
    updateTournamentPlayersList(); // Teraz ta funkcja istnieje
    updateTournamentPlayerCount();
    startBtnEl.disabled = system.tournament.players.length < 2;
    saveToLocalStorage();
}

// Zarządzanie turniejem
function startTournament() {
    // Upewnij się, że te elementy istnieją
    const roundsSelect = document.getElementById('rounds');
    const gameTypeSelect = document.getElementById('gameType');
    
    if (!roundsSelect || !gameTypeSelect) {
        alert('Brak wymaganych elementów na stronie!');
        return;
    }

    system.tournament.rounds = parseInt(roundsSelect.value);
    system.tournament.gameType = gameTypeSelect.value;
    system.tournament.currentRound = 1;
    system.tournament.allMatches = [];
    system.tournament.playedPairs = new Set();
    system.tournament.isActive = true;
    system.tournament.nextMatchId = 1;

    // Inicjalizacja statystyk
    system.tournament.playerStats = {};
    system.tournament.players.forEach(player => {
        system.tournament.playerStats[player] = {
            matches: 0,
            wonGames: 0,
            totalGames: 0,
            byes: 0
        };
    });

    generateAllRounds();
    updateTournamentView();
    updateRanking();
    updateTournamentStatus(); // Teraz funkcja istnieje
    
    // Aktualizacja przycisków
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    if (startBtn) startBtn.disabled = true;
    if (resetBtn) resetBtn.disabled = false;
}

function updateMatchScore(globalIndex, playerNumber, value) {
    const match = system.tournament.allMatches[globalIndex];
    const numValue = Math.max(0, Math.min(3, parseInt(value) || 0));

    // Zapisz poprzednie wyniki przed zmianą
    const prevScore1 = match.score1;
    const prevScore2 = match.score2;

    if (playerNumber === 1) {
        match.score1 = numValue;
    } else {
        match.score2 = numValue;
    }

    // Aktualizuj statystyki
    updateStatsAfterEdit(match, prevScore1, prevScore2);
    
    // Sprawdź czy mecz zakończony
    match.completed = (match.score1 === 3 || match.score2 === 3);
    
    // Znajdź element meczu w DOM
    const matchElement = document.querySelector(`.match[data-id="${match.id}"]`);
    if (matchElement) {
        // Aktualizuj stan inputów
        const input1 = matchElement.querySelector('input[data-player="1"]');
        const input2 = matchElement.querySelector('input[data-player="2"]');
        
        if (input1) input1.value = match.score1;
        if (input2) input2.value = match.score2;
        
        if (match.completed) {
            // Dodaj przycisk edycji jeśli mecz zakończony
            if (!matchElement.querySelector('.edit-btn')) {
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.textContent = 'Edytuj';
                editBtn.onclick = () => enableMatchEdit(globalIndex);
                matchElement.querySelector('.match-controls').appendChild(editBtn);
            }
        } else {
            // Usuń przycisk edycji jeśli mecz wznowiony
            const editBtn = matchElement.querySelector('.edit-btn');
            if (editBtn) editBtn.remove();
        }
    }
    
    updateRanking();
}











function updateTournamentStatus() {
    const statusElement = document.getElementById('tournamentStatus');
    if (!statusElement) return;

    if (system.tournament.isActive) {
        statusElement.textContent = 'Aktywny';
        statusElement.className = 'status-badge status-active';
    } else {
        statusElement.textContent = 'Zakończony';
        statusElement.className = 'status-badge status-ended';
    }
}






function resetTournament() {
    if (confirm('Czy na pewno chcesz zresetować turniej? Wszystkie wyniki zostaną utracone.')) {
        // Zresetuj dane turnieju
        system.tournament = {
            players: [...system.tournament.players], // Zachowaj obecnych graczy
            rounds: parseInt(document.getElementById('rounds').value) || 3,
            currentRound: 0,
            allMatches: [],
            playerStats: {},
            playedPairs: new Set(),
            isActive: false,
            nextMatchId: 1,
            gameType: document.getElementById('gameType').value || "8-ball"
        };

        // Bezpieczna aktualizacja przycisków
        const startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (startBtn) startBtn.disabled = system.tournament.players.length < 2;
        if (resetBtn) resetBtn.disabled = true;
        if (exportBtn) exportBtn.style.display = 'none';

        // Aktualizacja widoku
        updateTournamentView();
        updateRanking();
        updateTournamentStatus();
        
        console.log("Turniej został zresetowany"); // Debug
    }
}

// Generowanie meczów
function generateAllRounds() {
    const playersWithBye = new Set();
    
    for (let round = 1; round <= system.tournament.rounds; round++) {
        const roundMatches = [];
        const playersInRound = [...system.tournament.players];
        const hasBye = playersInRound.length % 2 !== 0;
        
        if (hasBye) {
            const eligiblePlayers = playersInRound.filter(
                player => !playersWithBye.has(player)
            );
            
            const byePlayer = eligiblePlayers.length > 0 
                ? eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)]
                : playersInRound[Math.floor(Math.random() * playersInRound.length)];
            
            roundMatches.push({
                id: system.tournament.nextMatchId++,
                player1: byePlayer,
                player2: null,
                score1: 3,
                score2: 0,
                completed: true,
                round: round,
                isBye: true,
                globalIndex: system.tournament.allMatches.length + roundMatches.length
            });
            
            playersWithBye.add(byePlayer);
            playersInRound.splice(playersInRound.indexOf(byePlayer), 1);
            
            system.tournament.playerStats[byePlayer].matches++;
            system.tournament.playerStats[byePlayer].wonGames += 3;
            system.tournament.playerStats[byePlayer].totalGames += 3;
            system.tournament.playerStats[byePlayer].byes++;
        }
        
        shuffleArray(playersInRound);
        
        for (let i = 0; i < playersInRound.length; i += 2) {
            if (i + 1 < playersInRound.length) {
                const player1 = playersInRound[i];
                const player2 = playersInRound[i + 1];
                const pairKey = `${player1}-${player2}`;
                
                roundMatches.push({
                    id: system.tournament.nextMatchId++,
                    player1: player1,
                    player2: player2,
                    score1: 0,
                    score2: 0,
                    completed: false,
                    round: round,
                    pairKey: pairKey,
                    globalIndex: system.tournament.allMatches.length + roundMatches.length
                });
                system.tournament.playedPairs.add(pairKey);
            }
        }
        
        system.tournament.allMatches.push(...roundMatches);
    }
}


function updateRanking() {
    const rankedPlayers = getRankedPlayers();
    const tbody = document.querySelector('#rankingTable tbody');
    tbody.innerHTML = '';

    rankedPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        const winPercentage = player.stats.totalGames > 0 
            ? (player.stats.wonGames / player.stats.totalGames * 100).toFixed(1)
            : '0.0';

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.name}</td>
            <td>${player.stats.matches}</td>
            <td>${player.stats.wonGames}</td>
            <td>${player.stats.totalGames}</td>
            <td>${winPercentage}%</td>
        `;
        tbody.appendChild(row);
    });
}

function getRankedPlayers() {
    console.log("Sprawdzam playerStats:", system.tournament.playerStats); // 🔍 Debugowanie

    return system.tournament.players.map(player => {
        const stats = system.tournament.playerStats[player] || { totalGames: 0, wonGames: 0, matches: 0 }; // Dodaj domyślne wartości

        return {
            name: player,
            stats: stats
        };
    }).sort((a, b) => {
        const ratioA = a.stats.totalGames > 0 ? a.stats.wonGames / a.stats.totalGames : 0;
        const ratioB = b.stats.totalGames > 0 ? b.stats.wonGames / b.stats.totalGames : 0;

        if (ratioB !== ratioA) return ratioB - ratioA;
        return b.stats.wonGames - a.stats.wonGames;
    });
}






// Aktualizacja widoku
function updateTournamentView() {
    if (!system.tournament.isActive) {
        matchesContainerEl.innerHTML = '<p>Wybierz graczy i rozpocznij turniej</p>';
        return;
    }
    
    matchesContainerEl.innerHTML = '';
    
    const rounds = {};
    system.tournament.allMatches.forEach(match => {
        if (!rounds[match.round]) rounds[match.round] = [];
        rounds[match.round].push(match);
    });
    
    for (const roundNum in rounds) {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round';
        
        const roundTitle = document.createElement('div');
        roundTitle.className = 'round-title';
        roundTitle.textContent = `Runda ${roundNum} (${system.tournament.gameType})`;
        
        roundDiv.appendChild(roundTitle);
        
        rounds[roundNum].forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.className = `match ${match.completed ? 'completed' : ''}`;
            matchDiv.dataset.id = match.id;
            
            if (match.player2 === null) {
                matchDiv.innerHTML = `
                    <p><strong>${match.player1}</strong> <span class="bye">(wolny los - wygrana 3:0)</span></p>
                `;
            } else {
                matchDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="billiard-ball" style="background: ${getPlayerColor(match.player1)}"></div>
                        <strong>${match.player1}</strong>
                        <span>vs</span>
                        <strong>${match.player2}</strong>
                        <div class="billiard-ball" style="background: ${getPlayerColor(match.player2)}"></div>
                    </div>
                    <div class="match-controls">
                        <input type="number" min="0" max="3" 
                            value="${match.score1}" 
                            data-player="1"
                            onchange="updateMatchScore(${match.globalIndex}, 1, this.value)" 
                            ${match.completed ? 'disabled' : ''}>
                        <span> - </span>
                        <input type="number" min="0" max="3" 
                            value="${match.score2}" 
                            data-player="2"
                            onchange="updateMatchScore(${match.globalIndex}, 2, this.value)" 
                            ${match.completed ? 'disabled' : ''}>
                        ${match.completed ? `
                            <button class="edit-btn" onclick="enableMatchEdit(${match.globalIndex})">Edytuj</button>
                        ` : ''}
                    </div>
                `;
            }
            
            roundDiv.appendChild(matchDiv);
        });
        
        matchesContainerEl.appendChild(roundDiv);
    }
    
    updateRanking();
}

// Funkcje pomocnicze
function saveToLocalStorage() {
    localStorage.setItem('tournamentSystem', JSON.stringify({
        playerPool: system.playerPool,
        tournament: system.tournament
    }));
    console.log("Zapisano do LocalStorage"); // Debug
}

function updateStatsAfterEdit(match, prevScore1, prevScore2) {
    if (match.isBye) return;

    const { player1, player2 } = match;
    const stats = system.tournament.playerStats;

    // Odejmij poprzednie wyniki
    stats[player1].wonGames -= prevScore1;
    stats[player2].wonGames -= prevScore2;
    
    const prevTotal = prevScore1 + prevScore2;
    stats[player1].totalGames -= prevTotal;
    stats[player2].totalGames -= prevTotal;

    // Dodaj nowe wyniki
    stats[player1].wonGames += match.score1;
    stats[player2].wonGames += match.score2;
    
    const newTotal = match.score1 + match.score2;
    stats[player1].totalGames += newTotal;
    stats[player2].totalGames += newTotal;

    // Aktualizuj liczbę meczy
    const wasCompleted = (prevScore1 === 3 || prevScore2 === 3);
    const isCompleted = (match.score1 === 3 || match.score2 === 3);
    
    if (wasCompleted && !isCompleted) {
        stats[player1].matches--;
        stats[player2].matches--;
    } else if (!wasCompleted && isCompleted) {
        stats[player1].matches++;
        stats[player2].matches++;
    }
}

function enableMatchEdit(globalIndex) {
    const match = system.tournament.allMatches[globalIndex];
    match.completed = false;
    
    const matchElement = document.querySelector(`.match[data-id="${match.id}"]`);
    if (matchElement) {
        matchElement.classList.remove('completed');
        matchElement.querySelectorAll('input').forEach(input => input.disabled = false);
        const editBtn = matchElement.querySelector('.edit-btn');
        if (editBtn) editBtn.remove();
    }
}






function loadFromLocalStorage() {
    const savedData = localStorage.getItem('tournamentSystem');
    if (savedData) {
        const data = JSON.parse(savedData);
        system.playerPool = data.playerPool || [];
        system.tournament = data.tournament || {
            players: [],
            rounds: 3,
            currentRound: 0,
            allMatches: [],
            playerStats: {},
            playedPairs: new Set(),
            isActive: false,
            nextMatchId: 1
        };
        updatePlayerPool();
        updatePlayerCount();
        console.log("Wczytano z LocalStorage"); // Debug
    }
}
function updatePlayerCount() {
    playerCountEl.textContent = system.playerPool.length;
}

function updateTournamentPlayerCount() {
    tournamentPlayerCountEl.textContent = system.tournament.players.length;
}

function getTop12Players() {
    const ranked = getRankedPlayers();
    return ranked.slice(0, 12); // Zwraca 12 najlepszych graczy
}


function generatePlayoffBracket() {
    const topPlayers = getTop12Players(); // Zakładamy, że posortowani
    const totalPlayers = topPlayers.length;

    if (totalPlayers < 8) {
        alert("Za mało graczy do fazy play-off! Minimalna liczba to 8.");
        return;
    }

    const bracket = {
        roundOf12: [],
        quarterfinals: [
            [topPlayers[0], null], // 1 vs winner 8 vs 9
            [topPlayers[3], null], // 4 vs winner 5 vs 12
            [topPlayers[1], null], // 2 vs winner 7 vs 10
            [topPlayers[2], null]  // 3 vs winner 6 vs 11
        ],
        semifinals: [[], []],
        final: [],
        thirdPlace: []
    };

    const playInPairs = [
        [4, 11], // 5 vs 12 → ćw 1
        [5, 10], // 6 vs 11 → ćw 3
        [6, 9],  // 7 vs 10 → ćw 2
        [7, 8]   // 8 vs 9 → ćw 0
    ];

    const totalSpots = 12;
    const missingPlayers = totalSpots - totalPlayers;

    // Wypełnianie par barażowych z brakującymi miejscami jako "bye"
    for (let i = 0; i < 4; i++) {
        const [aIdx, bIdx] = playInPairs[i];
        const playerA = topPlayers[aIdx] || { name: "bye" };
        const playerB = topPlayers[bIdx] || { name: "bye" };
        bracket.roundOf12.push([playerA, playerB]);
    }

    console.log("Drzewko play-off:", bracket);
    return bracket;
}

function displayPlayoffBracket(playoffBracket) {
    const container = document.getElementById('playoffContainer');

    // 1. Zachowaj wcześniej wpisane wyniki
    const savedScores = {};
    const inputs = container.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        savedScores[input.id] = input.value;
    });

    container.innerHTML = ''; // Wyczyść stare drzewko

    const createMatch = (round, index, player1, player2) => {
        const div = document.createElement('div');
        div.classList.add('match');

        const p1Name = document.createElement('span');
        p1Name.id = `${round}${index}_p1`;
        p1Name.textContent = player1 ? player1.name : "???";

        const p1Score = document.createElement('input');
        p1Score.type = 'number';
        p1Score.id = `${round}_${index}_a`;

        const vs = document.createElement('span');
        vs.textContent = ' vs ';

        const p2Name = document.createElement('span');
        p2Name.id = `${round}${index}_p2`;
        p2Name.textContent = player2 ? player2.name : "???";

        const p2Score = document.createElement('input');
        p2Score.type = 'number';
        p2Score.id = `${round}_${index}_b`;

        // Przywróć zapisane wyniki, jeśli są
        if (savedScores[p1Score.id]) p1Score.value = savedScores[p1Score.id];
        if (savedScores[p2Score.id]) p2Score.value = savedScores[p2Score.id];

        div.appendChild(p1Name);
        div.appendChild(p1Score);
        div.appendChild(vs);
        div.appendChild(p2Name);
        div.appendChild(p2Score);

        return div;
    };

    const addRound = (title, roundData, roundKey) => {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('round');
        const heading = document.createElement('h3');
        heading.textContent = title;
        roundDiv.appendChild(heading);

        roundData.forEach((match, i) => {
            const matchDiv = createMatch(roundKey, i, match[0], match[1]);
            roundDiv.appendChild(matchDiv);
        });

        container.appendChild(roundDiv);
    };

    // Baraże
    addRound('Baraże', playoffBracket.roundOf12, 'roundOf12');

    // Ćwierćfinały
    addRound('Ćwierćfinały', playoffBracket.quarterfinals, 'quarterfinals');

    // Półfinały
    playoffBracket.semifinals = playoffBracket.semifinals || [[], []];
    addRound('Półfinały', playoffBracket.semifinals, 'semifinals');

    // Finał
    playoffBracket.final = playoffBracket.final || [];
    if (playoffBracket.final.length !== 2) playoffBracket.final = [null, null];
    addRound('Finał', [playoffBracket.final], 'final');

    // Mecz o 3. miejsce
    playoffBracket.thirdPlace = playoffBracket.thirdPlace || [];
    if (playoffBracket.thirdPlace.length !== 2) playoffBracket.thirdPlace = [null, null];
    addRound('Mecz o 3. miejsce', [playoffBracket.thirdPlace], 'thirdPlace');
}












let currentPlayoffBracket = null;

document.getElementById('generatePlayoffBtn').addEventListener('click', () => {
    currentPlayoffBracket = generatePlayoffBracket();
    displayPlayoffBracket(currentPlayoffBracket);
});

document.getElementById('updatePlayoffBtn').addEventListener('click', () => {
    if (currentPlayoffBracket) {
        handlePlayoffResults(currentPlayoffBracket);
    }
});

function handlePlayoffResults(playoffBracket) {
    const getScore = (id) => {
        const el = document.getElementById(id);
        return el ? parseInt(el.value) || 0 : 0;
    };

    const determineWinner = (idA, idB, playerA, playerB) => {
        const scoreA = getScore(idA);
        const scoreB = getScore(idB);

        if (!playerA || playerA.name === 'bye') return playerB;
        if (!playerB || playerB.name === 'bye') return playerA;

        if (scoreA === 3) return playerA;
        if (scoreB === 3) return playerB;

        return null;
    };

    // Runda: baraże → ćwierćfinały
    playoffBracket.roundOf12.forEach((match, i) => {
        const [a, b] = match;
        const winner = determineWinner(`roundOf12_${i}_a`, `roundOf12_${i}_b`, a, b);
        if (winner) {
            const targetMap = [1, 3, 2, 0]; // kolejność przypisań do ćwierćfinałów
            const targetIndex = targetMap[i];
            playoffBracket.quarterfinals[targetIndex][1] = winner;
        }
    });

    // Runda: ćwierćfinały → półfinały
    playoffBracket.quarterfinals.forEach((match, i) => {
        const [a, b] = match;
        const winner = determineWinner(`quarterfinals_${i}_a`, `quarterfinals_${i}_b`, a, b);
        if (winner) {
            const semiIndex = i < 2 ? 0 : 1;
            const pos = i % 2;
            playoffBracket.semifinals[semiIndex][pos] = winner;
        }
    });

    // Runda: półfinały → finał i mecz o 3. miejsce
    playoffBracket.semifinals.forEach((match, i) => {
        const [a, b] = match;
        const winner = determineWinner(`semifinals_${i}_a`, `semifinals_${i}_b`, a, b);
        const loser = (winner === a) ? b : (winner === b ? a : null);

        if (winner) playoffBracket.final[i] = winner;
        if (loser) playoffBracket.thirdPlace[i] = loser;
    });

    // Finał
    const finalWinner = determineWinner(`final_0_a`, `final_0_b`, playoffBracket.final[0], playoffBracket.final[1]);
    if (finalWinner) {
        console.log("Zwycięzca turnieju:", finalWinner.name);
    }

    // Mecz o 3. miejsce
    const thirdPlaceWinner = determineWinner(`thirdPlace_0_a`, `thirdPlace_0_b`, playoffBracket.thirdPlace[0], playoffBracket.thirdPlace[1]);
    if (thirdPlaceWinner) {
        console.log("3. miejsce:", thirdPlaceWinner.name);
    }

    displayPlayoffBracket(playoffBracket);
}








let playoffBracket;

document.addEventListener('DOMContentLoaded', () => {
    
    document.getElementById('startBtn').addEventListener('click', startTournament);
    document.querySelector('button[onclick="addToPlayerPool()"]').addEventListener('click', addToPlayerPool);
	document.querySelectorAll('input.playoff-score').forEach(input => {
    input.addEventListener('input', () => {
        handlePlayoffResults(playoffBracket);
    });
	});
	document.getElementById('generatePlayoffBtn').addEventListener('click', () => {
        const playoffBracket = generatePlayoffBracket();
        displayPlayoffBracket(playoffBracket);
    });
	 
console.log("playoffBracket:", playoffBracket); // 👈 to sprawdzi, co faktycznie zwraca

    
	
    loadFromLocalStorage();
});
