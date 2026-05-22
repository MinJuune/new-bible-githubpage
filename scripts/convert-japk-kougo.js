const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const BACKUP_DIR = path.join(DATA_DIR, "japanese-txt-backups");

const SOURCE_FILE = path.join(DATA_DIR, "JapKougo.txt");
const OT_OUTPUT = path.join(DATA_DIR, "OT_JP_formatted.txt");
const NT_OUTPUT = path.join(DATA_DIR, "NT_JP_formatted.txt");

const OT_BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Songs",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
];

const NT_BOOKS = [
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

const BOOKS = [...OT_BOOKS, ...NT_BOOKS];

const BOOK_ALIASES = {
  "Song of Solomon": "Song of Songs",
  "Revelation of John": "Revelation",
  "I Samuel": "1 Samuel",
  "II Samuel": "2 Samuel",
  "I Kings": "1 Kings",
  "II Kings": "2 Kings",
  "I Chronicles": "1 Chronicles",
  "II Chronicles": "2 Chronicles",
  "I Corinthians": "1 Corinthians",
  "II Corinthians": "2 Corinthians",
  "I Thessalonians": "1 Thessalonians",
  "II Thessalonians": "2 Thessalonians",
  "I Timothy": "1 Timothy",
  "II Timothy": "2 Timothy",
  "I Peter": "1 Peter",
  "II Peter": "2 Peter",
  "I John": "1 John",
  "II John": "2 John",
  "III John": "3 John",
};

const SPLIT_RULES = [
  {
    book: "3 John",
    sourceRef: "1:14",
    newRef: "1:15",
    marker: "\u5e73\u5b89\u304c\u3001\u3042\u306a\u305f\u306b\u3042\u308b\u3088\u3046\u306b\u3002",
  },
  {
    book: "Revelation",
    sourceRef: "12:17",
    newRef: "12:18",
    marker: "\u305d\u3057\u3066\u3001\u6d77\u306e\u7802\u306e\u4e0a\u306b\u7acb\u3063\u305f\u3002",
  },
];

function normalizeBookName(name) {
  const trimmed = String(name || "").trim();
  return BOOK_ALIASES[trimmed] || trimmed;
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanVerseText(value) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function backupExistingFile(filePath, timestamp) {
  if (!fs.existsSync(filePath)) return null;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = path.join(BACKUP_DIR, `${path.basename(filePath)}.${timestamp}.bak`);
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function parseSource() {
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error(`Missing source file: ${path.relative(ROOT_DIR, SOURCE_FILE)}`);
  }

  const text = fs.readFileSync(SOURCE_FILE, "utf8").replace(/^\uFEFF/, "");
  const headings = [];
  const headingPattern = /^###\s+(.+)\s*$/gm;
  let headingMatch;

  while ((headingMatch = headingPattern.exec(text))) {
    headings.push({
      name: headingMatch[1].trim(),
      start: headingPattern.lastIndex,
    });
  }

  const recordsByBook = new Map();
  const unknownBooks = [];
  const duplicates = [];

  for (let index = 0; index < headings.length; index += 1) {
    const book = normalizeBookName(headings[index].name);
    const sectionEnd = index + 1 < headings.length ? headings[index + 1].start : text.length;
    const section = text.slice(headings[index].start, sectionEnd);

    if (!BOOKS.includes(book)) {
      unknownBooks.push(headings[index].name);
    }

    if (!recordsByBook.has(book)) recordsByBook.set(book, new Map());
    const bookRecords = recordsByBook.get(book);
    const versePattern = /\[(\d+):(\d+)\]\s*([\s\S]*?)(?=\n?\[\d+:\d+\]|\n###\s+|$)/g;
    let verseMatch;

    while ((verseMatch = versePattern.exec(section))) {
      const chapter = Number.parseInt(verseMatch[1], 10);
      const verse = Number.parseInt(verseMatch[2], 10);
      const ref = `${chapter}:${verse}`;
      const verseText = cleanVerseText(verseMatch[3]);

      if (bookRecords.has(ref)) duplicates.push(`${book} ${ref}`);
      bookRecords.set(ref, verseText);
    }
  }

  applySplitRules(recordsByBook);

  return {
    recordsByBook,
    headingCount: headings.length,
    unknownBooks,
    duplicates,
  };
}

function applySplitRules(recordsByBook) {
  for (const rule of SPLIT_RULES) {
    const bookRecords = recordsByBook.get(rule.book);
    if (!bookRecords || !bookRecords.has(rule.sourceRef)) continue;
    if (bookRecords.has(rule.newRef)) continue;

    const text = bookRecords.get(rule.sourceRef);
    const markerIndex = text.indexOf(rule.marker);
    if (markerIndex < 0) {
      throw new Error(`Split marker not found for ${rule.book} ${rule.sourceRef}`);
    }

    bookRecords.set(rule.sourceRef, text.slice(0, markerIndex).trim());
    bookRecords.set(rule.newRef, text.slice(markerIndex).trim());
  }
}

function sortRefs(refs) {
  return refs.sort((left, right) => {
    const [leftChapter, leftVerse] = left.split(":").map(Number);
    const [rightChapter, rightVerse] = right.split(":").map(Number);
    return leftChapter - rightChapter || leftVerse - rightVerse;
  });
}

function buildTsv(bookOrder, recordsByBook) {
  const lines = ["Book\tReference\tVerse"];
  const missingBooks = [];
  let verseCount = 0;

  for (const book of bookOrder) {
    const bookRecords = recordsByBook.get(book);

    if (!bookRecords || bookRecords.size === 0) {
      missingBooks.push(book);
      continue;
    }

    for (const ref of sortRefs([...bookRecords.keys()])) {
      lines.push(`${book}\t${ref}\t${bookRecords.get(ref)}`);
      verseCount += 1;
    }
  }

  return {
    text: `${lines.join("\n")}\n`,
    missingBooks,
    verseCount,
  };
}

function validateAgainstExpected(recordsByBook) {
  const expectedRoot = path.join(ROOT_DIR, "docs", "data-json");
  const missing = [];
  const extra = [];

  for (const book of BOOKS) {
    const bookRecords = recordsByBook.get(book) || new Map();
    const expectedRefs = new Set();
    const chaptersPath = path.join(expectedRoot, "chapters", `${book}.json`);

    if (!fs.existsSync(chaptersPath)) continue;

    for (const chapter of JSON.parse(fs.readFileSync(chaptersPath, "utf8"))) {
      const chapterPath = path.join(expectedRoot, "verses", book, `${chapter}.json`);
      const payload = JSON.parse(fs.readFileSync(chapterPath, "utf8"));

      for (const verse of payload.verses) {
        expectedRefs.add(`${chapter}:${verse.number}`);
      }
    }

    for (const ref of expectedRefs) {
      if (!bookRecords.has(ref)) missing.push(`${book} ${ref}`);
    }

    for (const ref of bookRecords.keys()) {
      if (!expectedRefs.has(ref)) extra.push(`${book} ${ref}`);
    }
  }

  return { missing, extra };
}

function main() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  const otBackup = backupExistingFile(OT_OUTPUT, timestamp);
  const ntBackup = backupExistingFile(NT_OUTPUT, timestamp);
  const parsed = parseSource();
  const validation = validateAgainstExpected(parsed.recordsByBook);
  const ot = buildTsv(OT_BOOKS, parsed.recordsByBook);
  const nt = buildTsv(NT_BOOKS, parsed.recordsByBook);

  if (parsed.unknownBooks.length) {
    throw new Error(`Unknown books: ${parsed.unknownBooks.join(", ")}`);
  }
  if (parsed.duplicates.length) {
    throw new Error(`Duplicate references: ${parsed.duplicates.slice(0, 20).join(", ")}`);
  }
  if (validation.missing.length || validation.extra.length) {
    throw new Error(
      `Reference mismatch. Missing: ${validation.missing.slice(0, 20).join(", ") || "none"} / Extra: ${
        validation.extra.slice(0, 20).join(", ") || "none"
      }`,
    );
  }
  if (ot.missingBooks.length || nt.missingBooks.length) {
    throw new Error(`Missing books. OT: ${ot.missingBooks.join(", ") || "none"} / NT: ${nt.missingBooks.join(", ") || "none"}`);
  }

  fs.writeFileSync(OT_OUTPUT, ot.text, "utf8");
  fs.writeFileSync(NT_OUTPUT, nt.text, "utf8");

  console.log(`Source headings: ${parsed.headingCount}`);
  console.log(`Backed up OT: ${otBackup ? path.relative(ROOT_DIR, otBackup).replace(/\\/g, "/") : "none"}`);
  console.log(`Backed up NT: ${ntBackup ? path.relative(ROOT_DIR, ntBackup).replace(/\\/g, "/") : "none"}`);
  console.log(`Generated OT Japanese verses: ${ot.verseCount}`);
  console.log(`Generated NT Japanese verses: ${nt.verseCount}`);
  console.log(`Generated total Japanese verses: ${ot.verseCount + nt.verseCount}`);
  console.log("Output: data/OT_JP_formatted.txt, data/NT_JP_formatted.txt");
}

main();
