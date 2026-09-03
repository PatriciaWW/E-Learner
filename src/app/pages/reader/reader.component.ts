import { Component, computed, ElementRef, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DbService } from '../../services/db.service';
import { SettingsService } from '../../services/settings.service';
import { SpeechService } from '../../services/speech.service';
import { TextProcessingService } from '../../services/text-processing.service';
import { ReadingSession } from '../../models/profile.model';

interface WordToken {
  text: string;
  startChar: number;
  endChar: number;
}

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.css',
})
export class ReaderComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // ---- upload / paste state ----
  pastedText = '';
  dragOver = false;
  uploadError = '';

  // ---- session / chunk state ----
  chunks = signal<string[]>([]);
  currentChunkIndex = signal(0);
  session: ReadingSession | null = null;
  view = signal<'upload' | 'reading'>('upload');

  readonly currentChunkText = computed(() => this.chunks()[this.currentChunkIndex()] ?? '');
  readonly currentSummary = computed(() =>
    this.currentChunkText() ? this.textProcessing.generateSummary(this.currentChunkText()) : ''
  );
  readonly documentSummary = computed(() =>
    this.chunks().length ? this.textProcessing.generateDocumentSummary(this.chunks().join('\n\n')) : ''
  );
  readonly progressPct = computed(() => {
    const total = this.chunks().length;
    return total ? Math.round(((this.currentChunkIndex() + 1) / total) * 100) : 0;
  });

  readonly words = computed<WordToken[]>(() => {
    const text = this.currentChunkText();
    const tokens = text.match(/(\s+|\S+)/g) || [];
    const result: WordToken[] = [];
    let offset = 0;
    for (const token of tokens) {
      if (/\S/.test(token)) {
        result.push({ text: token, startChar: offset, endChar: offset + token.length });
      }
      offset += token.length;
    }
    return result;
  });

  readonly highlightedWordIndex = computed(() => {
    const charIndex = this.speech.boundaryCharIndex();
    if (charIndex === null) return -1;
    const list = this.words();
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < list.length; i++) {
      if (charIndex >= list[i].startChar && charIndex < list[i].endChar) return i;
      const dist = Math.abs(list[i].startChar - charIndex);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best;
  });

  // ---- expose services to the template ----
  constructor(
    private db: DbService,
    private textProcessing: TextProcessingService,
    readonly speech: SpeechService,
    readonly settingsSvc: SettingsService
  ) {}

  get settings() {
    return this.settingsSvc.settings();
  }

  // ---- upload handlers ----
  onDragOver(e: DragEvent): void { e.preventDefault(); this.dragOver = true; }
  onDragLeave(): void { this.dragOver = false; }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    if (e.dataTransfer?.files?.length) this.handleFiles(e.dataTransfer.files);
  }

  onFileInputChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.handleFiles(input.files);
  }

  browse(): void {
    this.fileInputRef.nativeElement.click();
  }

  private handleFiles(files: FileList): void {
    this.uploadError = '';
    const file = files[0];
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = e => {
        this.pastedText = (e.target?.result as string) || '';
        this.startLearning(file.name);
      };
      reader.readAsText(file);
    } else {
      // Non-text formats (images/audio/video/pdf) need server-side OCR / speech-to-text,
      // which this front-end demo doesn't perform — mirrors the original app's placeholder text.
      this.pastedText =
        `[Content extracted from: ${file.name}]\n\n` +
        `This is a simulated transcription of your uploaded file. In a full production version, ` +
        `this section would show text extracted from the media using AI-powered OCR (images/PDFs), ` +
        `speech-to-text (audio/video), or document parsing.`;
      this.startLearning(file.name);
    }
  }

  // ---- learning session ----
  startLearning(contentLabel?: string): void {
    const text = this.pastedText.trim();
    if (!text) {
      this.uploadError = 'Please paste some text or upload a document first.';
      return;
    }
    this.uploadError = '';
    const chunks = this.textProcessing.generateChunks(text);
    if (!chunks.length) return;

    this.chunks.set(chunks);
    this.currentChunkIndex.set(0);

    const profileId = this.db.currentProfile()?.id;
    if (profileId) {
      this.session = this.db.createSession(profileId, contentLabel || text.substring(0, 50));
      this.db.updateSession(this.session.id, { chunksTotal: chunks.length });
    }

    this.view.set('reading');
  }

  nextChunk(): void {
    this.speech.stop();
    const next = this.currentChunkIndex() + 1;
    if (next < this.chunks().length) {
      this.currentChunkIndex.set(next);
    } else if (this.session) {
      this.db.completeSession(this.session.id);
    }
  }

  startOver(): void {
    this.speech.stop();
    this.pastedText = '';
    this.chunks.set([]);
    this.currentChunkIndex.set(0);
    this.session = null;
    this.view.set('upload');
  }

  // ---- playback ----
  play(): void {
    if (this.speech.paused()) { this.speech.resume(); return; }
    const voices = this.speech.voices();
    const voice = voices[this.voiceIndex] ?? undefined;
    this.speech.speak(this.currentChunkText(), { voice, rate: this.settings.speechRate });
    if (this.session) {
      this.db.updateSession(this.session.id, { ttsPlays: (this.session.ttsPlays || 0) + 1 });
    }
  }

  pause(): void { this.speech.pause(); }
  stop(): void { this.speech.stop(); }

  voiceIndex = 0;
  onVoiceChange(index: number): void { this.voiceIndex = index; }

  onRateChange(rate: number): void {
    this.settingsSvc.update({ speechRate: rate });
    this.speech.setRate(rate);
  }

  // ---- display controls ----
  onFontFamilyChange(value: string): void { this.settingsSvc.update({ fontFamily: value }); }
  onFontSizeChange(value: number): void { this.settingsSvc.update({ fontSize: value }); }
  onLineHeightChange(value: number): void { this.settingsSvc.update({ lineHeight: value }); }
  onLetterSpacingChange(value: number): void { this.settingsSvc.update({ letterSpacing: value }); }

  exportSummary(): void {
    const fullSummary = this.chunks().join('\n\n');
    const blob = new Blob([fullSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AI_Summary_Export.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
