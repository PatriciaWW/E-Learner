import { Injectable, signal } from '@angular/core';

/**
 * SpeechService — thin wrapper around the Web Speech API (window.speechSynthesis),
 * ported from the play/pause/stop + onboundary word-highlighting logic in script.js.
 */
@Injectable({ providedIn: 'root' })
export class SpeechService {
  private synth = window.speechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;

  readonly voices = signal<SpeechSynthesisVoice[]>([]);
  readonly speaking = signal(false);
  readonly paused = signal(false);
  /** Character index of the word currently being spoken, for highlighting. */
  readonly boundaryCharIndex = signal<number | null>(null);

  constructor() {
    this.refreshVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.refreshVoices();
    }
  }

  private refreshVoices(): void {
    const list = this.synth.getVoices();
    this.voices.set(list);
  }

  speak(text: string, opts: { voice?: SpeechSynthesisVoice; rate?: number } = {}): void {
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (opts.voice) utterance.voice = opts.voice;
    utterance.rate = opts.rate ?? 1;

    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== 'word') return;
      this.boundaryCharIndex.set(e.charIndex);
    };
    utterance.onstart = () => {
      this.speaking.set(true);
      this.paused.set(false);
    };
    utterance.onend = () => {
      this.speaking.set(false);
      this.paused.set(false);
      this.boundaryCharIndex.set(null);
    };
    utterance.onerror = () => {
      this.speaking.set(false);
      this.paused.set(false);
    };

    this.utterance = utterance;
    this.synth.speak(utterance);
  }

  pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.paused.set(true);
    }
  }

  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
      this.paused.set(false);
    }
  }

  stop(): void {
    this.synth.cancel();
    this.speaking.set(false);
    this.paused.set(false);
    this.boundaryCharIndex.set(null);
  }

  setRate(rate: number): void {
    if (this.utterance) this.utterance.rate = rate;
  }
}
