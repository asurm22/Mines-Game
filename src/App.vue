<template>
  <div class="game-container">
    <div class="game-header">
      <h1 class="game-title"> Mines Game</h1>
    </div>

    <div class="main-controls">
      <label class="mines-number">
        Mines:
        <select v-model.number="mineCount" @change="updateMineCount">
          <option v-for="n in 20" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
      <label>
        <input type="checkbox" v-model="autoPlayEnabled" /> Auto Play
      </label>
      <template v-if="autoPlayEnabled">
        <label>
          Rounds:
          <input type="number" v-model.number="autoPlayRounds" min="1" max="100" class="rounds-input" />
        </label>
        <button class="btn secondary" @click="clearAutoPlayCells">Clear Selection</button>
      </template>
    </div>

    <div class="game-stats">
      <div class="stat">
        <div>Balance</div>
        <div>${{ gameService.balance.toFixed(2) }}</div>
      </div>
      <div class="stat">
        <div>Bet</div>
        <div>${{ betAmount.toFixed(2) }}</div>
      </div>
      <div class="stat">
        <div>Multiplier</div>
        <div>{{ gameService.currentMultiplier.toFixed(2) }}x</div>
      </div>
      <div class="stat">
        <div>Next</div>
        <div>{{ nextMultiplier }}x</div>
      </div>
    </div>

    <div class="game-main-row">
      <div class="bet-controls-col">
        <div class="bet-controls">
          <button class="btn secondary" @click="decreaseBet" :disabled="!canDecreaseBet || autoPlayRunning">
            -
          </button>
          <input 
            type="number" 
            class="bet-input" 
            v-model.number="betAmount" 
            @blur="updateBet"
            @keyup.enter="updateBet"
            :min="1"
            :max="gameService.balance"
            step="1"
            :disabled="autoPlayRunning"
          />
          <button class="btn secondary" @click="increaseBet" :disabled="!canIncreaseBet || autoPlayRunning">
            +
          </button>
        </div>
        <div class="side-stats">
          <div class="stat">
            <div>Win Rate</div>
            <div>{{ gameService.getWinRate().toFixed(1) }}%</div>
          </div>
          <div class="stat">
            <div>Total Winnings</div>
            <div>${{ gameService.getTotalWinnings().toFixed(2) }}</div>
          </div>
          <div class="stat">
            <div>Profit</div>
            <div :class="{ 'positive': gameService.getProfit() >= 0, 'negative': gameService.getProfit() < 0 }">
              ${{ gameService.getProfit().toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
      <div class="game-board-col">
        <div class="game-board">
          <div 
            class="mines-grid" 
            :style="{ 
              gridTemplateColumns: `repeat(${gameService.gameBoard.value.cols}, 54px)`,
              gridTemplateRows: `repeat(${gameService.gameBoard.value.rows}, 54px)`
            }"
          >
            <button
              v-for="cell in flattenedGrid"
              :key="`${cell.row}-${cell.col}`"
              :class="[cell.getCssClasses(), isAutoPlayCell(cell) ? 'autoplay-selected' : '']"
              @click="autoPlayEnabled ? toggleAutoPlayCell(cell) : handleCellClick(cell.row, cell.col)"
              :disabled="cell.isRevealed || autoPlayRunning"
            >
              {{ cell.getDisplayValue() }}
            </button>
          </div>
        </div>
      </div>
      <div class="game-controls-col">
        <div class="game-controls">
          <button 
            class="btn primary" 
            @click="autoPlayEnabled ? startAutoPlay() : startGame()" 
            :disabled="autoPlayRunning"
          >
            {{ autoPlayEnabled ? (autoPlayRunning ? 'Auto Playing' : 'Start Auto Play') : 'Start Game' }}
          </button>
          <button 
            class="btn secondary" 
            @click="cashOut" 
            :disabled="autoPlayRunning"
          >
            Cash Out
          </button>
          <button class="btn danger" @click="resetGame" :disabled="autoPlayRunning">
            Reset
          </button>
          <button 
          class="btn secondary" 
          @click="clickRandom" 
          :disabled="autoPlayRunning || gameService.gameBoard.value.gameState != 'playing'"
          >
            Random
          </button>
        </div>
      </div>
    </div>

    <div :class="['game-message', gameMessageClass]" class="game-message">
      {{ gameMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { GameService } from './services/GameService';
import { GameState } from './models/GameBoard';
import { AutoPlayController } from './services/AutoPlayController';

const gameService = new GameService(1000);
const betAmount = ref(gameService.currentBet);
const mineCount = ref(gameService.mineCount);

// Auto Play State
const autoPlayEnabled = ref(false);
const autoPlayRounds = ref(10);
const autoPlayCells = ref<{row: number, col: number}[]>([]);
const autoPlayRunning = ref(false);

// Game message management
const gameMessage = ref('');
const gameMessageClass = computed(() => {
  if (gameService.gameState === GameState.WON) return 'win';
  if (gameService.gameState === GameState.LOST) return 'lose';
  return '';
});

const showMessage = (message: string, duration: number = 2000) => {
  gameMessage.value = message;
  setTimeout(() => {
    gameMessage.value = '';
  }, duration);
};

const showGameResult = () => {
  if (gameService.gameState === GameState.WON) {
    gameMessage.value = `Congratulations you won $${(betAmount.value * gameService.currentMultiplier).toFixed(2)}!`;
  } else if (gameService.gameState === GameState.LOST) {
    gameMessage.value = 'Game Over';
  }
};

// Computed properties - using betAmount consistently for reactivity
const flattenedGrid = computed(() => {
  const grid = gameService.gameBoard.value.grid;
  return grid.flat();
});

const canIncreaseBet = computed(() => {
  return gameService.canAffordBet(betAmount.value * 2);
});

const canDecreaseBet = computed(() => {
  return betAmount.value > 1;
});

const nextMultiplier = computed(() => {
  const totalCells = gameService.gameBoard.value.rows * gameService.gameBoard.value.cols;
  const revealed = gameService.gameBoard.value.revealedCount + 1;
  const mines = mineCount.value;
  const safeCells = totalCells - mines;
  if (revealed === 0) return '1.00';
  const mult = Math.pow(totalCells / safeCells, revealed);
  return mult.toFixed(2);
});

// Auto play logic
function isAutoPlayCell(cell: any) {
  return autoPlayCells.value.some(sel => sel.row === cell.row && sel.col === cell.col);
}

function toggleAutoPlayCell(cell: any) {
  const idx = autoPlayCells.value.findIndex(sel => sel.row === cell.row && sel.col === cell.col);
  if (idx === -1) {
    autoPlayCells.value.push({ row: cell.row, col: cell.col });
  } else {
    autoPlayCells.value.splice(idx, 1);
  }
}
function clearAutoPlayCells() {
  autoPlayCells.value = [];
}

const autoPlayController = new AutoPlayController(gameService);

// When auto play is on, player can select amount of rounds
//  and select cells to be revealed every round. Then start auto play.
// During auto play other buttons are disabled.
function startAutoPlay() {
  if (autoPlayCells.value.length === 0) {
    showMessage('Select cells to auto play!');
    return;
  }
  autoPlayRunning.value = true;
  autoPlayController.startAutoPlay({
    rounds: autoPlayRounds.value,
    cells: autoPlayCells.value,
    onComplete: () => {
      autoPlayRunning.value = false;
    },
    delayBetweenRounds: 200,
    delayAfterReveal: 400,
  });
}

// Game actions
const startGame = () => {
  const success = gameService.startNewGame();
  if (success) {
    showMessage('Game started');
  } else {
    showMessage('Insufficient balance');
  }
};

const handleCellClick = (row: number, col: number) => {
  if (autoPlayEnabled.value || autoPlayRunning.value) return;
  const success = gameService.revealCell(row, col);
  if (success) {
    showGameResult();
  }
};

const clickRandom = () => {
  const success = gameService.clickRandom();
  if (success) {
    showGameResult();
  }
};

const cashOut = () => {
  if (autoPlayRunning.value) return;
  const result = gameService.cashOut();
  if (result) {
    showMessage(`Cashed out! Won $${result.payout.toFixed(2)} with ${result.multiplier.toFixed(2)}x multiplier!`, 4000);
  }
};

const resetGame = () => {
  if (autoPlayRunning.value) return;
  gameService.resetGame();
  showMessage('Game reset!');
  clearAutoPlayCells();
};


// Bet management
const updateMineCount = () => {
  gameService.setMineCount(mineCount.value);
};

const updateBet = async () => {
  gameService.setBet(betAmount.value);
  betAmount.value = gameService.currentBet;
  await nextTick();
};

const increaseBet = () => {
  if (gameService.increaseBet()) {
    betAmount.value = gameService.currentBet;
  }
};

const decreaseBet = () => {
  if (gameService.decreaseBet()) {
    betAmount.value = gameService.currentBet;
  }
};



onMounted(() => {
  betAmount.value = gameService.currentBet;
  mineCount.value = gameService.mineCount;
});
</script>

<style scoped>
.autoplay-selected {
  outline: 3px solid #ffd700;
  box-shadow: 0 0 0 2px #fff, 0 0 8px 2px #ffd700;
}
</style> 