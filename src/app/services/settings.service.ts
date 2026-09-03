import { Injectable, signal } from '@angular/core';

export interface ReadingSettings {
  fontFamily: string;
  fontSize: number; // px
  lineHeight: number;
  letterSpacing: number; // px
  speechRate: number;
  voiceIndex: number;
}

const STORAGE_KEY = 'smart_reader_settings';

const DEFAULT_SETTINGS: ReadingSettings = {
  fontFamily: `'Lexend', sans-serif`,
  fontSize: 24,
  lineHeight: 1.8,
  letterSpacing: 1.5,
  speechRate: 1,
  voiceIndex: 0,
};

/**
 * SettingsService — drives the same CSS custom properties the original
 * static site toggled directly on <html>, so any component's template can
 * simply use var(--font-family) / var(--font-size) etc. and stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly settings = signal<ReadingSettings>(this.restore());

  private restore(): ReadingSettings {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const merged = { ...DEFAULT_SETTINGS, ...(saved || {}) };
      this.applyToDocument(merged);
      return merged;
    } catch {
      this.applyToDocument(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  }

  update(partial: Partial<ReadingSettings>): void {
    const next = { ...this.settings(), ...partial };
    this.settings.set(next);
    this.applyToDocument(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private applyToDocument(s: ReadingSettings): void {
    const root = document.documentElement.style;
    root.setProperty('--font-family', s.fontFamily);
    root.setProperty('--font-size', `${s.fontSize}px`);
    root.setProperty('--line-height', `${s.lineHeight}`);
    root.setProperty('--letter-spacing', `${s.letterSpacing}px`);
  }
}
