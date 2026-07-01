import { PuzzleData } from './PuzzleData';

export class TextPuzzleModel {
  private data: PuzzleData;

  constructor(data: PuzzleData) {
    this.data = data;
  }

  getPuzzleData(): PuzzleData {
    return this.data;
  }

  checkWin(input: string): boolean {
    const goalState = this.data.goal_state as { answer?: string };
    if (!goalState || !goalState.answer) return false;

    // Fuzzy matching: convert to lowercase and remove all whitespace
    const cleanInput = input.toLowerCase().replace(/\s+/g, '');
    const cleanAnswer = goalState.answer.toLowerCase().replace(/\s+/g, '');

    return cleanInput === cleanAnswer;
  }
}
