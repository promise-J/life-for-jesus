// Canonical list of the 66 books of the Protestant canon, with stable ids used across the game.
const OT = [
  ['gen', 'Genesis'], ['exo', 'Exodus'], ['lev', 'Leviticus'], ['num', 'Numbers'], ['deu', 'Deuteronomy'],
  ['jos', 'Joshua'], ['jdg', 'Judges'], ['rut', 'Ruth'], ['1sa', '1 Samuel'], ['2sa', '2 Samuel'],
  ['1ki', '1 Kings'], ['2ki', '2 Kings'], ['1ch', '1 Chronicles'], ['2ch', '2 Chronicles'], ['ezr', 'Ezra'],
  ['neh', 'Nehemiah'], ['est', 'Esther'], ['job', 'Job'], ['psa', 'Psalms'], ['pro', 'Proverbs'],
  ['ecc', 'Ecclesiastes'], ['sng', 'Song of Solomon'], ['isa', 'Isaiah'], ['jer', 'Jeremiah'], ['lam', 'Lamentations'],
  ['ezk', 'Ezekiel'], ['dan', 'Daniel'], ['hos', 'Hosea'], ['jol', 'Joel'], ['amo', 'Amos'],
  ['oba', 'Obadiah'], ['jon', 'Jonah'], ['mic', 'Micah'], ['nam', 'Nahum'], ['hab', 'Habakkuk'],
  ['zep', 'Zephaniah'], ['hag', 'Haggai'], ['zec', 'Zechariah'], ['mal', 'Malachi'],
];
const NT = [
  ['mat', 'Matthew'], ['mrk', 'Mark'], ['luk', 'Luke'], ['jhn', 'John'], ['act', 'Acts'],
  ['rom', 'Romans'], ['1co', '1 Corinthians'], ['2co', '2 Corinthians'], ['gal', 'Galatians'], ['eph', 'Ephesians'],
  ['php', 'Philippians'], ['col', 'Colossians'], ['1th', '1 Thessalonians'], ['2th', '2 Thessalonians'], ['1ti', '1 Timothy'],
  ['2ti', '2 Timothy'], ['tit', 'Titus'], ['phm', 'Philemon'], ['heb', 'Hebrews'], ['jas', 'James'],
  ['1pe', '1 Peter'], ['2pe', '2 Peter'], ['1jn', '1 John'], ['2jn', '2 John'], ['3jn', '3 John'],
  ['jud', 'Jude'], ['rev', 'Revelation'],
];

export const BOOKS = [
  ...OT.map(([id, name]) => ({ id, name, testament: 'OT' })),
  ...NT.map(([id, name]) => ({ id, name, testament: 'NT' })),
];

export const BOOK_BY_ID = Object.fromEntries(BOOKS.map((b) => [b.id, b]));

const aliases = { psalm: 'psa', 'song of songs': 'sng', song: 'sng', jas: 'jas', james: 'jas' };

/** Resolve a free-text book name ("1 cor", "John", "jn") to a book id, or null. */
export function resolveBook(input) {
  if (!input) return null;
  const q = input.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  if (aliases[q]) return aliases[q];
  if (BOOK_BY_ID[q]) return q;
  const exact = BOOKS.find((b) => b.name.toLowerCase() === q);
  if (exact) return exact.id;
  const compact = q.replace(/ /g, '');
  const prefix = BOOKS.find((b) => b.name.toLowerCase().replace(/ /g, '').startsWith(compact));
  return prefix ? prefix.id : null;
}

/**
 * Parse a reference such as "Matthew 28:19-20", "1 Cor 15:51–52", "Psalm 23".
 * Returns { bookId, chapter, verseStart, verseEnd } (verse fields null for whole chapters) or null.
 */
export function parseReference(ref) {
  if (!ref || typeof ref !== 'string') return null;
  const m = ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  if (!m) return null;
  const bookId = resolveBook(m[1]);
  if (!bookId) return null;
  const chapter = Number(m[2]);
  const verseStart = m[3] ? Number(m[3]) : null;
  const verseEnd = m[4] ? Number(m[4]) : verseStart;
  return { bookId, chapter, verseStart, verseEnd };
}
