export class TextPuzzleModel {
    constructor(data) {
        this.data = data;
    }
    getPuzzleData() {
        return this.data;
    }
    checkWin(input) {
        const goalState = this.data.goal_state;
        if (!goalState || !goalState.answer)
            return false;
        // Fuzzy matching: convert to lowercase and remove all whitespace
        const cleanInput = input.toLowerCase().replace(/\s+/g, '');
        const cleanAnswer = goalState.answer.toLowerCase().replace(/\s+/g, '');
        return cleanInput === cleanAnswer;
    }
}
//# sourceMappingURL=TextPuzzleModel.js.map