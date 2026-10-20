// Serves Bible text from a local data file (default: the public-domain World English Bible).
// No verse text is ever generated — everything returned here comes from the data file.
import { readFileSync, existsSync } from 'node:fs';
import { parseReference, BOOK_BY_ID, BOOKS } from '@lfj/shared';
import { config } from '../config.js';
import { logger } from '../logger.js';

let data = null;
let flat = null;

export function loadBible(file = config.bibleFile) {
  if (data) return data;
  if (!existsSync(file)) {
    logger.warn({ file }, 'Bible data file missing — run `npm run bible:build`. Scripture text will be unavailable.');
    data = { translation: 'N/A', translationName: 'Unavailable', licence: '', books: [] };
    flat = [];
    return data;
  }
  data = JSON.parse(readFileSync(file, 'utf8'));
  flat = [];
  for (const b of data.books) {
    b.chapters.forEach((ch, ci) => ch.forEach((text, vi) => flat.push({ bookId: b.id, book: b.name, chapter: ci + 1, verse: vi + 1, text, lower: text.toLowerCase() })));
  }
  logger.info({ translation: data.translation, verses: flat.length }, 'Bible loaded');
  return data;
}

export function translationInfo() {
  const d = loadBible();
  return { id: d.translation, name: d.translationName, licence: d.licence, source: d.source, available: d.books.length > 0 };
}

export function listBooks() {
  const d = loadBible();
  return d.books.map((b) => ({ id: b.id, name: b.name, testament: b.testament, chapters: b.chapters.length }));
}

function bookData(bookId) {
  return loadBible().books.find((b) => b.id === bookId);
}

export function getChapter(bookId, chapter) {
  const b = bookData(bookId);
  if (!b || !b.chapters[chapter - 1]) return null;
  return {
    reference: `${b.name} ${chapter}`,
    book: b.name,
    bookId,
    chapter,
    chapters: b.chapters.length,
    verses: b.chapters[chapter - 1].map((text, i) => ({ verse: i + 1, text })),
    translation: translationInfo(),
  };
}

export function getPassage(ref) {
  const p = parseReference(ref);
  if (!p) return null;
  const b = bookData(p.bookId);
  const ch = b?.chapters[p.chapter - 1];
  if (!ch) return null;
  const start = p.verseStart || 1;
  const end = Math.min(p.verseEnd || ch.length, ch.length);
  if (start > ch.length || end < start) return null;
  const verses = [];
  for (let v = start; v <= end; v++) verses.push({ verse: v, text: ch[v - 1] });
  const name = BOOK_BY_ID[p.bookId].name;
  return {
    reference: p.verseStart ? `${name} ${p.chapter}:${start}${end !== start ? `–${end}` : ''}` : `${name} ${p.chapter}`,
    bookId: p.bookId,
    chapter: p.chapter,
    verses,
    translation: translationInfo(),
  };
}

/** Full-text search across every verse. All words must match (case-insensitive). */
export function search(query, { page = 1, pageSize = 20, testament } = {}) {
  loadBible();
  const words = String(query).toLowerCase().split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
  if (!words.length) return { total: 0, page, pageSize, results: [] };
  const books = testament ? new Set(BOOKS.filter((b) => b.testament === testament).map((b) => b.id)) : null;
  const hits = flat.filter((v) => (!books || books.has(v.bookId)) && words.every((w) => v.lower.includes(w)));
  const startIdx = (page - 1) * pageSize;
  return {
    total: hits.length,
    page,
    pageSize,
    results: hits.slice(startIdx, startIdx + pageSize).map((v) => ({ reference: `${v.book} ${v.chapter}:${v.verse}`, bookId: v.bookId, chapter: v.chapter, verse: v.verse, text: v.text })),
  };
}
