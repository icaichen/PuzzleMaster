import { PuzzleData, PuzzleType, PuzzleEngine } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
import { GoogleGenAI, Type } from '@google/genai';

function getAIClient(): GoogleGenAI | null {
  const key = localStorage.getItem('GEMINI_API_KEY') || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!key || key === 'MISSING_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
}

export class LLMPuzzleEngine implements PuzzleEngine {
  readonly isBank = false;

  constructor(private puzzleType: PuzzleType = PuzzleType.LATERAL_THINKING) {}

  /**
   * Generates a Professor Layton style text-based puzzle dynamically.
   */
  async generate(difficulty: number, seed?: number): Promise<PuzzleData | null> {
    const ai = getAIClient();
    if (!ai) {
      console.warn("No Gemini API key provided for LLMPuzzleEngine. Returning null to trigger fallback.");
      return null;
    }

    const type = this.puzzleType;
    const actualSeed = seed ?? SeededRandom.randomSeed();
    const rng = new SeededRandom(actualSeed);
    const picarat = difficulty * 10 + 10;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { 
            role: 'user', 
            parts: [{ text: this.buildPrompt(type, difficulty, actualSeed) }] 
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A catchy, Professor Layton style title (in Chinese)" },
              scenario: { type: Type.STRING, description: "An engaging narrative context in Chinese featuring Luke, Professor Layton, or residents of a mysterious town." },
              question: { type: Type.STRING, description: "The specific question or brain teaser to solve (in Chinese). The question must require a short and unambiguous answer (like a number, a single word, or a simple phrase)." },
              answer: { type: Type.STRING, description: "The answer string formatted exactly as: '<short_answer>。解析：<detailed_explanation>' in Chinese." },
              hints: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Exactly 3 progressive hints in Chinese (Hint 1: subtle nudge, Hint 2: specific advice, Hint 3: almost reveals the answer)."
              }
            },
            required: ["title", "scenario", "question", "answer", "hints"]
          }
        }
      });

      const jsonStr = response.text || '{}';
      const parsed = JSON.parse(jsonStr);

      return {
        id: `llm_${type}_${actualSeed}`,
        type: type,
        difficulty: difficulty,
        seed: actualSeed,
        title: parsed.title,
        description: parsed.scenario,
        initial_state: {
          question: parsed.question,
          picarat: picarat,
          category: type,
          tags: ["llm-generated", type]
        },
        goal_state: { answer: parsed.answer },
        hints: parsed.hints,
      };
    } catch (e) {
      console.error("Gemini Puzzle Generation failed:", e);
      return null;
    }
  }

  private buildPrompt(type: PuzzleType, difficulty: number, seed: number): string {
    let categoryDesc = "";
    switch (type) {
      case PuzzleType.LATERAL_THINKING:
        categoryDesc = "侧向思维谜题/海龟汤 (Lateral thinking puzzle, requires out-of-the-box reasoning or spotting a trick)";
        break;
      case PuzzleType.WORD_PLAY:
        categoryDesc = "文字游戏/谜语 (Wordplay or language riddles, double meanings, character restructuring)";
        break;
      case PuzzleType.MATH:
        categoryDesc = "趣味数学题 (Fun math puzzle, equation/logic puzzle, e.g., snail climbing a well, cuts of a cake, speed equations)";
        break;
      case PuzzleType.MEASUREMENT:
        categoryDesc = "度量与分配谜题 (Measurement and allocation puzzle, e.g., dividing water with jars, rope burning, balance scales)";
        break;
      default:
        categoryDesc = "经典侦探推理题 (Logical deduction or observation riddle)";
    }

    return `
You are a master puzzle designer benchmarked against the Professor Layton game series.
Your task is to generate a highly creative, unique, and engaging puzzle.

Puzzle Category: ${categoryDesc}
Target Difficulty Level: ${difficulty} (on a scale of 1 to 10, where 1 is simple and 10 requires deep lateral or logic thinking)
Random Seed: ${seed}

Rules for generation:
1. **Intrigue**: The story ('scenario') must feel like a classic Professor Layton mystery set in an old town or train, involving Luke, Professor Layton, or local eccentric residents.
2. **Clear Question**: The 'question' must be very clear. The player will type their answer in a text box. Therefore, the question MUST lead to a short, precise, and unambiguous correct answer (e.g. a specific number like "9", a single Chinese word like "雨伞", or a short simple phrase). Avoid open-ended questions.
3. **Formatted Answer**: The 'answer' string MUST follow this exact format:
   "<short_answer>。解析：<detailed_explanation>"
   For example: "3。解析：因为3只猫在3分钟内捉到3只老鼠，这意味着每只猫需要3分钟捉到1只老鼠。因此在100分钟内捉到100只老鼠，仍然只需要这3只猫。"
4. **Three Progressive Hints**: Provide exactly 3 hints that help the player step-by-step.
5. Language: All text must be written in elegant Simplified Chinese (简体中文).
6. Output: Strictly JSON matching the requested schema.
    `;
  }
}
