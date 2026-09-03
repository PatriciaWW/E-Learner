import { Injectable } from '@angular/core';

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'because', 'before', 'being', 'below',
  'between', 'could', 'during', 'every', 'first', 'found', 'their', 'there',
  'these', 'thing', 'think', 'those', 'through', 'under', 'until', 'where',
  'which', 'while', 'would', 'should', 'having', 'other', 'still', 'shall',
]);

/**
 * TextProcessingService — adaptive chunking + lightweight, dependency-free
 * summarisation, ported from the generateChunks / generateSummary logic in
 * the original script.js so uploaded documents behave the same way.
 */
@Injectable({ providedIn: 'root' })
export class TextProcessingService {
  /** Split long text into ~400 char reading chunks, keeping paragraphs intact. */
  generateChunks(text: string): string[] {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    const chunks: string[] = [];
    let current = '';
    paragraphs.forEach(p => {
      if (current.length + p.length > 400 && current.length) {
        chunks.push(current.trim());
        current = p + ' ';
      } else {
        current += p + ' \n\n';
      }
    });
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  extractSentences(text: string): string[] {
    return text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.split(' ').length >= 4);
  }

  extractKeywords(text: string): string[] {
    const freq: Record<string, number> = {};
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !STOP_WORDS.has(w))
      .forEach(w => (freq[w] = (freq[w] || 0) + 1));
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w);
  }

  /** 1-2 sentence summary: topic sentence + top keyword as a theme label. */
  generateSummary(chunkText: string): string {
    const sentences = this.extractSentences(chunkText);
    const keywords = this.extractKeywords(chunkText);
    const topicSentence = sentences[0] || chunkText.substring(0, 120);
    const keyTheme = keywords[0]
      ? ` Key theme: ${keywords[0][0].toUpperCase()}${keywords[0].slice(1)}.`
      : '';
    return topicSentence + keyTheme;
  }

  /** Whole-document summary used by the document reader's "Summary" panel. */
  generateDocumentSummary(text: string, maxSentences = 5): string {
    const sentences = this.extractSentences(text);
    if (!sentences.length) return text.substring(0, 200);
    const keywords = new Set(this.extractKeywords(text).slice(0, 8));

    // Score sentences by how many top keywords they contain, keep original order.
    const scored = sentences.map((s, i) => {
      const lower = s.toLowerCase();
      let score = 0;
      keywords.forEach(k => { if (lower.includes(k)) score++; });
      if (i === 0) score += 2; // favour the opening sentence
      return { s, i, score };
    });

    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.i - b.i)
      .map(x => x.s);

    return top.join(' ');
  }
}
