import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { QuizQuestion } from '../../models/quiz.model';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz {
  @Input() questions: QuizQuestion[] = [];
  @Output() finished = new EventEmitter<{ correct: number; total: number }>();

  readonly currentIndex = signal(0);
  readonly selected = signal<string | null>(null);
  readonly answered = signal(false);
  readonly correctCount = signal(0);

  get currentQuestion(): QuizQuestion | undefined {
    return this.questions[this.currentIndex()];
  }

  choose(option: string): void {
    if (this.answered()) return;
    this.selected.set(option);
    this.answered.set(true);
    if (option === this.currentQuestion?.correctAnswer) {
      this.correctCount.set(this.correctCount() + 1);
    }
  }

  next(): void {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex < this.questions.length) {
      this.currentIndex.set(nextIndex);
      this.selected.set(null);
      this.answered.set(false);
    } else {
      this.finished.emit({ correct: this.correctCount(), total: this.questions.length });
    }
  }
}