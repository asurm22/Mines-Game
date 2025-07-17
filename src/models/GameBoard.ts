import { Cell } from './Cell';

export enum GameState {
  PLAYING = 'playing',
  WON = 'won',
  LOST = 'lost',
  READY = 'ready'
}

export class GameBoard {
  private _rows: number;
  private _cols: number;
  private _mines: number;
  private _grid: Cell[][];
  private _gameState: GameState;
  private _revealedCount: number;
  private _flaggedCount: number;

  constructor(rows: number = 5, cols: number = 5, mines: number) {
    this._rows = rows;
    this._cols = cols;
    this._mines = mines
    this._grid = [];
    this._gameState = GameState.READY;
    this._revealedCount = 0;
    this._flaggedCount = 0;
    this.initializeGrid();
  }

  // Getters
  get rows(): number {
    return this._rows;
  }

  get cols(): number {
    return this._cols;
  }

  get mines(): number {
    return this._mines;
  }

  get grid(): Cell[][] {
    return this._grid;
  }

  get gameState(): GameState {
    return this._gameState;
  }

  get revealedCount(): number {
    return this._revealedCount;
  }

  get flaggedCount(): number {
    return this._flaggedCount;
  }

  get safeCellsCount(): number {
    return this._rows * this._cols - this._mines;
  }

  get remainingMines(): number {
    return this._mines - this._flaggedCount;
  }

  private initializeGrid(): void {
    this._grid = [];
    for (let row = 0; row < this._rows; row++) {
      this._grid[row] = [];
      for (let col = 0; col < this._cols; col++) {
        this._grid[row][col] = new Cell(row, col);
      }
    }
  }

  public startGame(): void {
    this.placeMines();
    this._gameState = GameState.PLAYING;
    this._revealedCount = 0;
    this._flaggedCount = 0;
  }

  private placeMines(): void {
    for (let row = 0; row < this._rows; row++) {
      for (let col = 0; col < this._cols; col++) {
        this._grid[row][col] = new Cell(row, col, false);
      }
    }

    const positions: [number, number][] = [];
    for (let row = 0; row < this._rows; row++) {
      for (let col = 0; col < this._cols; col++) {
        positions.push([row, col]);
      }
    }

    for (let i = 0; i < this._mines; i++) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      const [row, col] = positions.splice(randomIndex, 1)[0];
      this._grid[row][col] = new Cell(row, col, true);
    }
  }

  private checkWinCondition(): boolean {
    return this._revealedCount === this.safeCellsCount;
  }

  private revealAll(): void {
    for (let row = 0; row < this._rows; row++) {
      for (let col = 0; col < this._cols; col++) {
          this._grid[row][col].reveal();
      }
    }
  }

  revealCell(row: number, col: number): boolean {
    const cell = this._grid[row][col];
    if (cell.isRevealed) {
      return false;
    }
    cell.reveal();
    this._revealedCount++;
    if (cell.isMine) {
      this._gameState = GameState.LOST;
      this.revealAll();
      return false;
    }

    if (this.checkWinCondition()) {
      this._gameState = GameState.WON;
      this.revealAll();
    }
    return true;
  }

  chooseRandom(): Cell {
    const positions: [number, number][] = [];
    for (let row = 0; row < this._rows; row++) {
      for (let col = 0; col < this._cols; col++) {
        if (!this._grid[row][col].isRevealed) {
          positions.push([row, col]);
        }
      }
    }
    const randomIndex = Math.floor(Math.random() * positions.length); 
    const [row, col] = positions[randomIndex];
    return this._grid[row][col];
  }


  reset(): void {
    this._gameState = GameState.READY;
    this._revealedCount = 0;
    this._flaggedCount = 0;
    this.initializeGrid();
  }

  getCell(row: number, col: number): Cell | null {
    if (row >= 0 && row < this._rows && col >= 0 && col < this._cols) {
      return this._grid[row][col];
    }
    return null;
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this._rows && col >= 0 && col < this._cols;
  }
} 