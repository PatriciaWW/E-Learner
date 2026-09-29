export interface QuizQuestion {
  id: string;
  question: string;      // sentence with the answer blanked out
  options: string[];     // shuffled — includes the correct answer
  correctAnswer: string;
}