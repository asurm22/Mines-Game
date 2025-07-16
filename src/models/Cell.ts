export enum CellState {
  HIDDEN = 'hidden',
  REVEALED = 'revealed'
}


export class Cell {
  private _row: number;
  private _col: number;
  private hasMine: boolean;
  private _state: CellState;

  constructor(row: number, col: number, hasMine: boolean = false) {
    this._row = row;
    this._col = col;
    this.hasMine = hasMine;
    this._state = CellState.HIDDEN;
  }

  // Getters
  get row(): number {
    return this._row;
  }

  get col(): number {
    return this._col;
  }

  get isMine(): boolean {
    return this.hasMine;
  }

  get state(): CellState {
    return this._state;
  }


  get isRevealed(): boolean {
    return this._state === CellState.REVEALED;
  }


  get isHidden(): boolean {
    return this._state === CellState.HIDDEN;
  }


  // Methods
  reveal(): void {
    this._state = CellState.REVEALED;
  }

  reset(): void {
    this._state = CellState.HIDDEN;
  }

  // Utility methods
  getDisplayValue(): string {
    if (this._state === CellState.HIDDEN) {
      return '•'; // Dot
    }
    
    if (this._state === CellState.REVEALED) {
      if (this.hasMine) {
        return '💣'; // Bomb emoji
      } else {
        return '⭐'; // Star emoji
      }
    }

    return '';
  }

  getCssClasses(): string[] {
    const classes = ['mine-cell'];
    
    if (this._state === CellState.REVEALED) {
      classes.push('revealed');
      
      if (this.hasMine) {
        classes.push('mine');
      } else {
        classes.push('safe');
      }
    }

    return classes;
  }
} 