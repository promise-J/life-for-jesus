// Builds server/data/web-bible.json from the public-domain World English Bible (WEB)
// as packaged by github.com/TehShrike/world-english-bible.
// Output: { translation, licence, books: [{ id, name, testament, chapters: [[verse1, verse2, ...], ...] }] }
// Run: npm run bible:build
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOKS } from '../shared/content/books.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'server', 'data', 'web-bible.json');
const BASE = 'https://raw.githubusercontent.com/TehShrike/world-english-bible/master/json/';

function clean(text) {
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchBook(book) {
  const file = book.name.toLowerCase().replace(/\s+/g, '') + '.json';
  const res = await fetch(BASE + file);
  if (!res.ok) throw new Error(`Failed ${file}: ${res.status}`);
  const items = await res.json();
  const chapters = [];
  for (const item of items) {
    if (!item.chapterNumber || !item.verseNumber || typeof item.value !== 'string') continue;
    const c = item.chapterNumber - 1;
    const v = item.verseNumber - 1;
    chapters[c] ??= [];
    chapters[c][v] = (chapters[c][v] ? chapters[c][v] + ' ' : '') + item.value;
  }
  return chapters.map((ch) => (ch || []).map((v) => clean(v || '')));
}

const books = [];
for (const book of BOOKS) {
  process.stdout.write(`${book.name} `);
  const chapters = await fetchBook(book);
  books.push({ id: book.id, name: book.name, testament: book.testament, chapters });
}
await mkdir(dirname(OUT), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({
    translation: 'WEB',
    translationName: 'World English Bible',
    licence: 'Public Domain',
    source: 'https://ebible.org/web/ via github.com/TehShrike/world-english-bible',
    books,
  }),
);
console.log(`\nWrote ${OUT}`);
