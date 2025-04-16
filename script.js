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
const JSONBIN_ID = '67ff95358561e97a5000cbb8';
const JSONBIN_API_KEY = '$2a$10$R9Xds/kGp2j227ZmP4AUjuFMDBShwrbpEOImJs7IKcud9btQmEZRO';

async function loadPlayersFromJsonBin() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        const data = await res.json();
        system.playerPool = data.record.players || [];
        updatePlayerPool();
        updatePlayerCount();
        console.log("Wczytano graczy z JSONBin");
    } catch (e) {
        console.error("Błąd ładowania z JSONBin:", e);
    }
console.log("Lista graczy z JSONBin:", system.playerPool);
	
}

async function savePlayersToJsonBin() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({
                players: system.playerPool
            })
        });
        console.log("Zapisano graczy do JSONBin");
    } catch (e) {
        console.error("Błąd zapisu do JSONBin:", e);
    }
}



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

// Na początku pliku script.js (przed DOMContentLoaded)
window.addToPlayerPool = function() {
    const nameInput = document.getElementById('newPlayerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("Wpisz nazwę gracza!");
        return;
    }
    
    if (system.playerPool.includes(name)) {
        alert("Ten gracz już istnieje!");
        nameInput.value = "";
        return;
    }
    
    system.playerPool.push(name);
    nameInput.value = "";
    
    updatePlayerPool();
    saveToLocalStorage();
    updatePlayerCount();
};




// Inicjalizacja
//document.addEventListener('DOMContentLoaded', function() {
 //   loadFromLocalStorage();
//    updatePlayerCount();
//    updateTournamentPlayerCount();
// });

document.addEventListener("load", async function () {
    await loadPlayersFromJsonBin();
	console.log("System został zainicjalizowany");
   });


// Zarządzanie graczami



function addToPlayerPool() {
    const nameInput = document.getElementById('newPlayerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("Wpisz nazwę gracza!");
        return;
    }
    
    if (system.playerPool.includes(name)) {
        alert("Ten gracz już istnieje!");
        nameInput.value = "";
        return;
    }
    
    system.playerPool.push(name);
    nameInput.value = "";
    
    updatePlayerPool();
    savePlayersToJsonBin();
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
    const playerPoolElement = document.getElementById('playerPool');
    if (!playerPoolElement) {
        console.error("Element 'playerPool' nie został znaleziony!");
        return;
    }

    playerPoolElement.innerHTML = '';
    
    if (system.playerPool.length === 0) {
        playerPoolElement.innerHTML = '<p>Brak graczy w bazie. Dodaj pierwszego gracza.</p>';
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
        
        playerPoolElement.appendChild(playerItem);
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
    // Oznacz wszystkie mecze jako nie-playoff
    system.tournament.allMatches.forEach(match => {
        match.isPlayoff = false;
    });
	
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
	system.tournament.allMatches.forEach(m => m.isPlayoff = false);

    // Inicjalizacja statystyk
    system.tournament.playerStats = {};
    system.tournament.players.forEach(player => {
        system.tournament.playerStats[player] = initPlayerStats();
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

	function updateMatchScore(globalIndex, player, value) {
    const match = system.tournament.allMatches[globalIndex];
    const numValue = Math.max(0, Math.min(3, parseInt(value) || 0));

    // Zachowaj poprzednie wartości
    const prevValues = {
        score1: match.score1,
        score2: match.score2,
        completed: match.completed
    };

    // Aktualizuj wynik
    if (player === 1) {
        match.score1 = numValue;
    } else {
        match.score2 = numValue;
    }

    match.completed = (match.score1 === 3 || match.score2 === 3);
    
    // Aktualizuj tylko ten konkretny mecz
    updateSingleMatchView(match, prevValues);
    
    // Aktualizuj statystyki (tylko dla meczów grupowych)
    if (!match.isPlayoff) {
        updateStatsAfterEdit(match, prevValues.score1, prevValues.score2);
    }

    updateRanking();
}

 function updateSingleMatchView(match, prevValues) {
    const matchElement = document.querySelector(`.match[data-id="${match.id}"]`);
    if (!matchElement) return;

    // Aktualizuj tylko wartości inputów
    const input1 = matchElement.querySelector('input[data-player="1"]');
    const input2 = matchElement.querySelector('input[data-player="2"]');
    
    if (input1) {
        input1.value = match.score1;
        input1.disabled = match.completed;
    }
    if (input2) {
        input2.value = match.score2;
        input2.disabled = match.completed;
    }

    // Aktualizuj przycisk edycji
    const editBtn = matchElement.querySelector('.edit-btn');
    if (match.completed) {
        if (!editBtn) {
            const newEditBtn = document.createElement('button');
            newEditBtn.className = 'edit-btn';
            newEditBtn.textContent = 'Edytuj';
            newEditBtn.onclick = () => enableMatchEdit(match.globalIndex);
            matchElement.querySelector('.match-controls').appendChild(newEditBtn);
        }
    } else if (editBtn) {
        editBtn.remove();
    }

    // Aktualizuj klasę CSS
    match.completed 
        ? matchElement.classList.add('completed') 
        : matchElement.classList.remove('completed');
		matchElement.classList.add('fade-update');
setTimeout(() => matchElement.classList.remove('fade-update'), 500);
}
 
 
 
 
 
 
 

function checkPlayoffConditions() {
    const allGroupMatches = system.tournament.allMatches.filter(m => !m.isPlayoff);
    const allCompleted = allGroupMatches.every(m => m.completed);
    const anyPlayoff = system.tournament.allMatches.some(m => m.isPlayoff);
    
    console.log("Warunki fazy play-off:");
    console.log("- Wszystkie mecze grupowe zakończone:", allCompleted);
    console.log("- Liczba meczy grupowych:", allGroupMatches.length);
    console.log("- Jakiekolwiek mecze play-off:", anyPlayoff);
    console.log("- Liczba graczy:", system.tournament.players.length);
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
    if (!tbody) return;

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
    // Oblicz statystyki tylko na podstawie meczów grupowych
    const groupMatches = system.tournament.allMatches.filter(m => !m.isPlayoff);
    const stats = {};

    // Inicjalizacja statystyk
    system.tournament.players.forEach(player => {
        stats[player] = initPlayerStats();
    });

    // Oblicz statystyki
    groupMatches.forEach(match => {
        if (match.isBye) {
            stats[match.player1].matches++;
            stats[match.player1].wonGames += 3;
            stats[match.player1].totalGames += 3;
            stats[match.player1].byes++;
        } else if (match.completed) {
            stats[match.player1].matches++;
            stats[match.player2].matches++;
            
            stats[match.player1].wonGames += match.score1;
            stats[match.player2].wonGames += match.score2;
            
            const totalGames = match.score1 + match.score2;
            stats[match.player1].totalGames += totalGames;
            stats[match.player2].totalGames += totalGames;
        }
    });

    // Sortowanie
    return Object.entries(stats)
        .map(([name, stats]) => ({ name, stats }))
        .sort((a, b) => {
            const ratioA = a.stats.totalGames > 0 ? a.stats.wonGames / a.stats.totalGames : 0;
            const ratioB = b.stats.totalGames > 0 ? b.stats.wonGames / b.stats.totalGames : 0;
            return ratioB - ratioA || b.stats.wonGames - a.stats.wonGames;
        });
}






// Aktualizacja widoku
function updateTournamentView() {
   
// Zachowaj aktualne wartości inputów
    // const currentValues = {};
    // document.querySelectorAll('.match').forEach(matchEl => {
        // const matchId = matchEl.dataset.id;
        // currentValues[matchId] = {
            // score1: matchEl.querySelector('input[data-player="1"]')?.value,
            // score2: matchEl.querySelector('input[data-player="2"]')?.value
        // };
    // });


   if (!system.tournament.isActive) {
        matchesContainerEl.innerHTML = '<p>Wybierz graczy i rozpocznij turniej</p>';
        return;
    }

    // Zachowaj aktualne wartości wprowadzonych wyników
    const currentValues = {};
    document.querySelectorAll('.match').forEach(matchEl => {
        const matchId = matchEl.dataset.id;
        const score1 = matchEl.querySelector('input[data-player="1"]')?.value || '0';
        const score2 = matchEl.querySelector('input[data-player="2"]')?.value || '0';
        currentValues[matchId] = { score1, score2 };
    });

    // Wyczyść kontener
    matchesContainerEl.innerHTML = '';

    // Grupuj mecze według rund
    const rounds = {};
    system.tournament.allMatches.forEach(match => {
        if (!rounds[match.round]) {
            rounds[match.round] = [];
        }
        rounds[match.round].push(match);
    });

    // Wyświetl rundy w kolejności
    const sortedRounds = Object.keys(rounds).sort((a, b) => a - b);
    for (const roundNum of sortedRounds) {
        // Utwórz kontener rundy (DODAJ DEFINICJĘ roundDiv)
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round';
        
        // Nagłówek rundy
        const roundTitle = document.createElement('div');
        roundTitle.className = 'round-title';
        
        // Określ typ rundy
        let roundType = "";
        const firstMatch = rounds[roundNum][0];
        if (firstMatch.isQualifier) roundType = " (Baraże)";
        else if (firstMatch.isQuarterFinal) roundType = " (Ćwierćfinał)";
        else if (firstMatch.isSemiFinal) roundType = " (Półfinał)";
        else if (firstMatch.isFinal) roundType = " (Finał)";
        
        roundTitle.textContent = `Runda ${roundNum}${roundType}`;

        // Status rundy
        const allCompleted = rounds[roundNum].every(m => m.completed);
        const statusSpan = document.createElement('span');
        statusSpan.className = `status-badge ${allCompleted ? 'status-ended' : 'status-active'}`;
        statusSpan.textContent = allCompleted ? 'Zakończona' : 'W trakcie';
        roundTitle.appendChild(statusSpan);
        roundDiv.appendChild(roundTitle);

        // Dodaj mecze
        rounds[roundNum].forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.className = `match ${match.completed ? 'completed' : ''}`;
            matchDiv.dataset.id = match.id;

            // Przywróć poprzednie wartości jeśli istnieją
            const savedValues = currentValues[match.id] || {};
            const displayScore1 = savedValues.score1 || match.score1;
            const displayScore2 = savedValues.score2 || match.score2;
            
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
                            value="${displayScore1}" 
                            data-player="1"
                            onchange="updateMatchScore(${match.globalIndex}, 1, this.value)" 
                            ${match.completed ? 'disabled' : ''}>
                        <span> - </span>
                        <input type="number" min="0" max="3" 
                            value="${displayScore2}" 
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
	
	// Sprawdź czy wszystkie mecze grupowe są zakończone
    const allGroupMatchesCompleted = system.tournament.allMatches
        .filter(match => !match.isPlayoff)
        .every(match => match.completed);
		
		// Sprawdź czy nie ma jeszcze meczów play-off
    const noPlayoffMatches = !system.tournament.allMatches.some(match => match.isPlayoff);

    if (allGroupMatchesCompleted && noPlayoffMatches) {
        system.tournament.isActive = false;
        updateTournamentStatus();



    // Sprawdź czy turniej jest zakończony
    const allMatchesCompleted = system.tournament.allMatches.every(m => m.completed);
    const isGroupPhase = !system.tournament.allMatches.some(m => m.isPlayoff);

    if (allMatchesCompleted) {
        system.tournament.isActive = false;
        updateTournamentStatus();

        // Dodaj przycisk tylko jeśli to faza grupowa i mamy wystarczająco graczy
         if (system.tournament.players.length >= 4) {
            const existingButton = matchesContainerEl.querySelector('.playoff-button');
            if (!existingButton) {
                const playoffBtn = document.createElement('button');
                playoffBtn.className = 'playoff-button secondary';
                playoffBtn.innerHTML = '🏆 Rozpocznij fazę pucharową';
                playoffBtn.onclick = startPlayoffPhase;
                matchesContainerEl.appendChild(playoffBtn);
                
                console.log("Przycisk fazy pucharowej został dodany"); // Debug
            }
        }
    }
    
    updateRanking();
}
 system.tournament.allMatches.forEach(match => {
        if (currentValues[match.id]) {
            const matchElement = document.querySelector(`.match[data-id="${match.id}"]`);
            if (matchElement) {
                const input1 = matchElement.querySelector('input[data-player="1"]');
                const input2 = matchElement.querySelector('input[data-player="2"]');
                if (input1) input1.value = currentValues[match.id].score1 || match.score1;
                if (input2) input2.value = currentValues[match.id].score2 || match.score2;
            }
        }
    });

}	

// Funkcja rozpoczynająca fazę pucharową
function startPlayoffPhase() {
    const rankedPlayers = getRankedPlayers();
    const playerNames = rankedPlayers.map(p => p.name); // Zawsze pracuj na nazwach
    
    if (playerNames.length < 4) {
        alert('Minimum 4 graczy wymagane do fazy pucharowej');
        return;
    }

    if (playerNames.length >= 12) {
        generateQualifiers(rankedPlayers);
    } else {
        generateQuarterFinals(rankedPlayers);
    }

    system.tournament.isActive = true;
    updateTournamentView();
}

// Generowanie baraży dla 12+ graczy
function generateQualifiers(rankedPlayers) {
    const qualifierPairs = [
        { higherSeed: 4, lowerSeed: 11 }, // 5 vs 12
        { higherSeed: 5, lowerSeed: 10 }, // 6 vs 11
        { higherSeed: 6, lowerSeed: 9 },  // 7 vs 10
        { higherSeed: 7, lowerSeed: 8 }   // 8 vs 9
    ];

    const currentRound = system.tournament.rounds + 1;
    
    qualifierPairs.forEach((pair, index) => {
        // Upewnij się, że pobieramy string z nazwą gracza, a nie cały obiekt
        const player1 = typeof rankedPlayers[pair.higherSeed] === 'object' 
            ? rankedPlayers[pair.higherSeed].name 
            : rankedPlayers[pair.higherSeed];
            
        const player2 = typeof rankedPlayers[pair.lowerSeed] === 'object' 
            ? rankedPlayers[pair.lowerSeed].name 
            : rankedPlayers[pair.lowerSeed];

        if (player1 && player2) {
            system.tournament.allMatches.push({
                id: system.tournament.nextMatchId++,
                player1: player1,
                player2: player2,
                score1: 0,
                score2: 0,
                completed: false,
                round: currentRound,
                isQualifier: true,
				isPlayoff: true ,
                qualifierId: index + 1,
                globalIndex: system.tournament.allMatches.length
            });
        }
    });
}

// Generowanie ćwierćfinałów dla <12 graczy
	function generateQuarterFinals(rankedPlayers) {
    const quarterFinalPairs = [
        { higherSeed: 0, lowerSeed: 7 }, // 1 vs 8
        { higherSeed: 1, lowerSeed: 6 }, // 2 vs 7
        { higherSeed: 2, lowerSeed: 5 }, // 3 vs 6
        { higherSeed: 3, lowerSeed: 4 }  // 4 vs 5
    ];

    const currentRound = system.tournament.rounds + 1;
    
    quarterFinalPairs.forEach((pair, index) => {
        // Sprawdź czy obaj gracze istnieją (dla nieparzystej liczby graczy)
        if (rankedPlayers[pair.lowerSeed]) {
            system.tournament.allMatches.push({
                id: system.tournament.nextMatchId++,
                player1: rankedPlayers[pair.higherSeed],
                player2: rankedPlayers[pair.lowerSeed],
                score1: 0,
                score2: 0,
                completed: false,
                round: currentRound,
                isQuarterFinal: true,
				isPlayoff: true,
                matchId: index + 1,
                globalIndex: system.tournament.allMatches.length
            });
        }
    });
	}
	
	// Funkcja pomocnicza do generowania kolejnych rund (półfinały, finał)
	function generateNextPlayoffRound() {
    const lastRoundMatches = [...system.tournament.allMatches]
        .filter(m => m.isQualifier || m.isQuarterFinal || m.isSemiFinal)
        .sort((a, b) => b.round - a.round)[0]?.round || 0;

    const winners = getRoundWinners(lastRoundMatches);
    
    if (winners.length >= 2) {
        const nextRoundType = winners.length === 2 ? 'isFinal' : 'isSemiFinal';
        const nextRoundNumber = lastRoundMatches + 1;
        
        for (let i = 0; i < winners.length; i += 2) {
            if (winners[i + 1]) {
                system.tournament.allMatches.push({
                    id: system.tournament.nextMatchId++,
                    player1: winners[i],
                    player2: winners[i + 1],
                    score1: 0,
                    score2: 0,
                    completed: false,
                    round: nextRoundNumber,
                    [nextRoundType]: true,
                    globalIndex: system.tournament.allMatches.length
                });
            }
        }
    }
}

// Pobierz zwycięzców danej rundy
function getRoundWinners(roundNumber) {
    return system.tournament.allMatches
        .filter(m => m.round === roundNumber && m.completed)
        .map(match => {
            if (match.score1 > match.score2) return match.player1;
            if (match.score2 > match.score1) return match.player2;
            return null;
        })
        .filter(Boolean);
}

function isGroupPhaseCompleted() {
    return system.tournament.allMatches.every(m => m.completed) && 
           !system.tournament.allMatches.some(m => m.isPlayoff);
}

function showPlayoffButton() {
    if (isGroupPhaseCompleted() && system.tournament.players.length >= 4) {
        const existingButton = matchesContainerEl.querySelector('.playoff-button');
        if (!existingButton) {
            const playoffBtn = document.createElement('button');
            playoffBtn.className = 'playoff-button secondary';
            playoffBtn.innerHTML = '🏆 Rozpocznij fazę pucharową';
            playoffBtn.addEventListener('click', startPlayoffPhase);
            matchesContainerEl.appendChild(playoffBtn);
        }
    }
}



// Funkcje pomocnicze
function saveToLocalStorage() {
    try {
        localStorage.setItem('tournamentSystem', JSON.stringify({
            playerPool: system.playerPool,
            tournament: system.tournament
        }));
        console.log("Zapisano do LocalStorage");
    } catch (e) {
        console.error("Błąd zapisu do LocalStorage:", e);
    }
}

function updateStatsAfterEdit(match, prevScore1, prevScore2) {
    // Pomijaj mecze play-off i wolne losy
    if (match.isPlayoff) return;

    const { player1, player2 } = match;
    const stats = system.tournament.playerStats;

    // Upewnij się, że statystyki istnieją
    if (!stats[player1]) stats[player1] = initPlayerStats();
    if (!stats[player2]) stats[player2] = initPlayerStats();

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

function initPlayerStats() {
    return {
        matches: 0,
        wonGames: 0,
        totalGames: 0,
        byes: 0
    };
}

// function enableMatchEdit(globalIndex) {
    // const match = system.tournament.allMatches[globalIndex];
    // match.completed = false;
    
    // const matchElement = document.querySelector(`.match[data-id="${match.id}"]`);
    // if (matchElement) {
        // matchElement.classList.remove('completed');
        // matchElement.querySelectorAll('input').forEach(input => input.disabled = false);
        // const editBtn = matchElement.querySelector('.edit-btn');
        // if (editBtn) editBtn.remove();
    // }
// }

function enableMatchEdit(globalIndex) {
    const match = system.tournament.allMatches[globalIndex];
    match.completed = false;
    updateSingleMatchView(match, {
        score1: match.score1,
        score2: match.score2,
        completed: true
    });
}




function loadFromLocalStorage() {
    try {
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
        }
    } catch (e) {
        console.error("Błąd wczytywania danych:", e);
    }
}


function updatePlayerCount() {
    const countElement = document.getElementById('playerCount');
    if (countElement) {
        countElement.textContent = system.playerPool.length;
    }
}

function updateTournamentPlayerCount() {
    tournamentPlayerCountEl.textContent = system.tournament.players.length;
}

	document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startBtn').addEventListener('click', startTournament);
    
	document.getElementById('addPlayerBtn').addEventListener('click', addToPlayerPool);
    loadFromLocalStorage();
    updatePlayerPool();
    updatePlayerCount();
})



document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź czy elementy istnieją
    if (!document.getElementById('newPlayerName') || 
        !document.getElementById('playerPool')) {
        console.error("Brak wymaganych elementów w DOM!");
        return;
    }

    // Inicjalizacja danych
    system.playerPool = JSON.parse(localStorage.getItem('playerPool')) || [];
    system.tournament = JSON.parse(localStorage.getItem('tournament')) || {
        players: [],
        rounds: 3,
        currentRound: 0,
        allMatches: [],
        playerStats: {},
        playedPairs: new Set(),
        isActive: false,
        nextMatchId: 1
    };

    // Inicjalizacja widoku
    updatePlayerPool();
    updatePlayerCount();
    loadFromLocalStorage();
    console.log("System został zainicjalizowany"); // Debug
});

