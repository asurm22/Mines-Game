import { ref } from 'vue';
import { GameBoard, GameState } from '../models/GameBoard';

export interface GameResult {
  won: boolean;
  multiplier: number;
  payout: number;
  betAmount: number;
}

export class GameService {
  public gameBoard;
  private _currentBet: number;
  private _balance: number;
  private _gameHistory: GameResult[];
  private _currentMultiplier: number;
  private _isGameActive: boolean;
  private _mineCount: number;

  constructor(initialBalance: number = 1000) {
    this._balance = initialBalance;
    this._currentBet = 1;
    this._gameHistory = [];
    this._currentMultiplier = 1;
    this._isGameActive = false;
    this._mineCount = 3;
    this.gameBoard = ref(new GameBoard(5, 5, this._mineCount));
  }

  // Getters
  get currentBet(): number {
    return this._currentBet;
  }

  get balance(): number {
    return this._balance;
  }

  get gameHistory(): GameResult[] {
    return [...this._gameHistory];
  }

  get currentMultiplier(): number {
    return this._currentMultiplier;
  }

  get isGameActive(): boolean {
    return this._isGameActive;
  }

  get gameState(): GameState {
    return this.gameBoard.value.gameState;
  }

  get mineCount(): number {
    return this._mineCount;
  }

  setMineCount(count: number): void {
    if (count < 1) count = 1;
    if (count > 20) count = 20;
    this._mineCount = count;
    this.gameBoard.value = new GameBoard(5, 5, this._mineCount);
  }

  startNewGame(): boolean {
    if (this._currentBet > this._balance) {
      return false;
    }
    this._balance -= this._currentBet;
    this._currentMultiplier = 1;
    this._isGameActive = true;
    this.gameBoard.value = new GameBoard(5, 5, this._mineCount);
    this.gameBoard.value.startGame();
    return true;
  }

  revealCell(row: number, col: number): boolean {
    if (!this._isGameActive) {
      return false;
    }
    const success = this.gameBoard.value.revealCell(row, col);
    if (success) {
      this.updateMultiplier();
    }
    if (this.gameBoard.value.gameState === GameState.WON || this.gameBoard.value.gameState === GameState.LOST) {
      this.endGame();
    }
    return success;
  }


  cashOut(): GameResult | null {
    if (!this._isGameActive || this.gameBoard.value.gameState !== GameState.PLAYING) {
      return null;
    }
    const result: GameResult = {
      won: true,
      multiplier: this._currentMultiplier,
      payout: this._currentBet * this._currentMultiplier,
      betAmount: this._currentBet
    };
    this._balance += result.payout;
    this._gameHistory.push(result);
    this._isGameActive = false;
    return result;
  }

  setBet(amount: number): boolean {
    if (amount <= 0 || amount > this._balance) {
      return false;
    }
    this._currentBet = amount;
    return true;
  }

  increaseBet(): boolean {
    const newBet = this._currentBet * 2;
    return this.setBet(newBet);
  }

  decreaseBet(): boolean {
    const newBet = Math.max(1, Math.floor(this._currentBet / 2));
    return this.setBet(newBet);
  }

  resetGame(): void {
    this._isGameActive = false;
    this._currentMultiplier = 1;
    this.gameBoard.value = new GameBoard(5, 5, this._mineCount);
    this.gameBoard.value.reset();
  }

  private updateMultiplier(): void {
    const totalCells = this.gameBoard.value.rows * this.gameBoard.value.cols;
    const revealed = this.gameBoard.value.revealedCount;
    const mines = this._mineCount;
    const safeCells = totalCells - mines;
    // Probability of not hitting a mine so far
    // Multiplier = (totalCells / safeCells) ^ revealed
    if (revealed === 0) {
      this._currentMultiplier = 1;
    } else {
      this._currentMultiplier = Math.pow(totalCells / safeCells, revealed);
      this._currentMultiplier = Math.round(this._currentMultiplier * 100) / 100;
    }
  }

  private endGame(): void {
    this._isGameActive = false;
    const result: GameResult = {
      won: this.gameBoard.value.gameState === GameState.WON,
      multiplier: this._currentMultiplier,
      payout: this.gameBoard.value.gameState === GameState.WON ? this._currentBet * this._currentMultiplier : 0,
      betAmount: this._currentBet
    };
    if (result.won) {
      this._balance += result.payout;
    }
    this._gameHistory.push(result);
  }

  getWinRate(): number {
    if (this._gameHistory.length === 0) {
      return 0;
    }
    const wins = this._gameHistory.filter(result => result.won).length;
    return (wins / this._gameHistory.length) * 100;
  }

  getTotalWinnings(): number {
    return this._gameHistory.reduce((total, result) => total + result.payout, 0);
  }

  getTotalBets(): number {
    return this._gameHistory.reduce((total, result) => total + result.betAmount, 0);
  }

  getProfit(): number {
    return this.getTotalWinnings() - this.getTotalBets();
  }

  canAffordBet(amount: number): boolean {
    return amount <= this._balance;
  }

  getMaxBet(): number {
    return this._balance;
  }
} 