import { GameService } from './GameService';

export interface AutoPlayOptions {
  rounds: number;
  cells: { row: number; col: number }[];
  onRoundStart?: (round: number) => void;
  onRoundEnd?: (round: number, result: any) => void;
  onComplete?: () => void;
  delayBetweenRounds?: number;
  delayAfterReveal?: number;
}

export class AutoPlayController {
  private gameService: GameService;
  private running = false;

  constructor(gameService: GameService) {
    this.gameService = gameService;
  }

  isRunning() {
    return this.running;
  }

  async startAutoPlay(options: AutoPlayOptions) {
    if (options.cells.length === 0) return;
    this.running = true;
    this.gameService.resetGame();
    for (let round = 1; round <= options.rounds; ++round) {
      if (!this.gameService.canAffordBet(this.gameService.currentBet)) break;
      options.onRoundStart?.(round);
      this.gameService.startNewGame();
      await this.delay(options.delayBetweenRounds ?? 200);
      let gameEnded = false;
      for (const cell of options.cells) {
        this.gameService.revealCell(cell.row, cell.col);
        if (this.gameService.gameBoard.value.gameState !== 'playing') {
          gameEnded = true;
          break;
        }
      }
      
      let result = null;
      if (this.gameService.gameBoard.value.gameState === 'playing') {
        result = this.gameService.cashOut();
      }
      options.onRoundEnd?.(round, result);
      await this.delay(options.delayAfterReveal ?? 400);
    }
    this.running = false;
    options.onComplete?.();
  }

  stop() {
    this.running = false;
  }

  private delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
} 