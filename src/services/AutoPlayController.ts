import { GameService } from './GameService';

export interface AutoPlayOptions {
  rounds: number;
  cells: { row: number; col: number }[];
  onRoundStart?: (round: number) => void;
  onRoundEnd?: (round: number, result: any) => void;
  onComplete?: (reason: 'completed' | 'insufficient_balance' | 'stopped') => void;
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
    let completionReason: 'completed' | 'insufficient_balance' | 'stopped' = 'completed';
    
    for (let round = 1; round <= options.rounds; ++round) {
      if (!this.running) {
        completionReason = 'stopped';
        break;
      }
      
      options.onRoundStart?.(round);
      const gameStarted = this.gameService.startNewGame();
      if (!gameStarted) {
        completionReason = 'insufficient_balance';
        break;
      }
      await this.delay(options.delayBetweenRounds ?? 200);
      for (const cell of options.cells) {
        this.gameService.revealCell(cell.row, cell.col);
        if (this.gameService.gameBoard.value.gameState !== 'playing') {
          break;
        }
      }
      
      const result = this.gameService.cashOut();
      options.onRoundEnd?.(round, result);
      await this.delay(options.delayAfterReveal ?? 400);
    }
    this.running = false;
    options.onComplete?.(completionReason);
  }

  stop() {
    this.running = false;
  }

  private delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
} 