const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const OUTPUT_DIR = path.join(ROOT_DIR, "docs", "data-json");

function toSafeFileName(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, "_");
}

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

const BOOK_IDS = [...OT_BOOKS, ...NT_BOOKS];

const KO_NAMES = {
  Genesis: "창세기",
  Exodus: "출애굽기",
  Leviticus: "레위기",
  Numbers: "민수기",
  Deuteronomy: "신명기",
  Joshua: "여호수아",
  Judges: "사사기",
  Ruth: "룻기",
  "1 Samuel": "사무엘상",
  "2 Samuel": "사무엘하",
  "1 Kings": "열왕기상",
  "2 Kings": "열왕기하",
  "1 Chronicles": "역대상",
  "2 Chronicles": "역대하",
  Ezra: "에스라",
  Nehemiah: "느헤미야",
  Esther: "에스더",
  Job: "욥기",
  Psalms: "시편",
  Proverbs: "잠언",
  Ecclesiastes: "전도서",
  "Song of Songs": "아가",
  Isaiah: "이사야",
  Jeremiah: "예레미야",
  Lamentations: "예레미야애가",
  Ezekiel: "에스겔",
  Daniel: "다니엘",
  Hosea: "호세아",
  Joel: "요엘",
  Amos: "아모스",
  Obadiah: "오바댜",
  Jonah: "요나",
  Micah: "미가",
  Nahum: "나훔",
  Habakkuk: "하박국",
  Zephaniah: "스바냐",
  Haggai: "학개",
  Zechariah: "스가랴",
  Malachi: "말라기",
  Matthew: "마태복음",
  Mark: "마가복음",
  Luke: "누가복음",
  John: "요한복음",
  Acts: "사도행전",
  Romans: "로마서",
  "1 Corinthians": "고린도전서",
  "2 Corinthians": "고린도후서",
  Galatians: "갈라디아서",
  Ephesians: "에베소서",
  Philippians: "빌립보서",
  Colossians: "골로새서",
  "1 Thessalonians": "데살로니가전서",
  "2 Thessalonians": "데살로니가후서",
  "1 Timothy": "디모데전서",
  "2 Timothy": "디모데후서",
  Titus: "디도서",
  Philemon: "빌레몬서",
  Hebrews: "히브리서",
  James: "야고보서",
  "1 Peter": "베드로전서",
  "2 Peter": "베드로후서",
  "1 John": "요한일서",
  "2 John": "요한이서",
  "3 John": "요한삼서",
  Jude: "유다서",
  Revelation: "요한계시록",
};

const DE_NAMES = {
  Genesis: "1. Mose",
  Exodus: "2. Mose",
  Leviticus: "3. Mose",
  Numbers: "4. Mose",
  Deuteronomy: "5. Mose",
  Joshua: "Josua",
  Judges: "Richter",
  Ruth: "Ruth",
  "1 Samuel": "1. Samuel",
  "2 Samuel": "2. Samuel",
  "1 Kings": "1. Könige",
  "2 Kings": "2. Könige",
  "1 Chronicles": "1. Chronik",
  "2 Chronicles": "2. Chronik",
  Ezra: "Esra",
  Nehemiah: "Nehemia",
  Esther: "Esther",
  Job: "Hiob",
  Psalms: "Psalmen",
  Proverbs: "Sprüche",
  Ecclesiastes: "Prediger",
  "Song of Songs": "Hohelied",
  Isaiah: "Jesaja",
  Jeremiah: "Jeremia",
  Lamentations: "Klagelieder",
  Ezekiel: "Hesekiel",
  Daniel: "Daniel",
  Hosea: "Hosea",
  Joel: "Joel",
  Amos: "Amos",
  Obadiah: "Obadja",
  Jonah: "Jona",
  Micah: "Micha",
  Nahum: "Nahum",
  Habakkuk: "Habakuk",
  Zephaniah: "Zephanja",
  Haggai: "Haggai",
  Zechariah: "Sacharja",
  Malachi: "Maleachi",
  Matthew: "Matthäus",
  Mark: "Markus",
  Luke: "Lukas",
  John: "Johannes",
  Acts: "Apostelgeschichte",
  Romans: "Römer",
  "1 Corinthians": "1. Korinther",
  "2 Corinthians": "2. Korinther",
  Galatians: "Galater",
  Ephesians: "Epheser",
  Philippians: "Philipper",
  Colossians: "Kolosser",
  "1 Thessalonians": "1. Thessalonicher",
  "2 Thessalonians": "2. Thessalonicher",
  "1 Timothy": "1. Timotheus",
  "2 Timothy": "2. Timotheus",
  Titus: "Titus",
  Philemon: "Philemon",
  Hebrews: "Hebräer",
  James: "Jakobus",
  "1 Peter": "1. Petrus",
  "2 Peter": "2. Petrus",
  "1 John": "1. Johannes",
  "2 John": "2. Johannes",
  "3 John": "3. Johannes",
  Jude: "Judas",
  Revelation: "Offenbarung",
};

const ZH_NAMES = {
  Genesis: "创世记",
  Exodus: "出埃及记",
  Leviticus: "利未记",
  Numbers: "民数记",
  Deuteronomy: "申命记",
  Joshua: "约书亚记",
  Judges: "士师记",
  Ruth: "路得记",
  "1 Samuel": "撒母耳记上",
  "2 Samuel": "撒母耳记下",
  "1 Kings": "列王纪上",
  "2 Kings": "列王纪下",
  "1 Chronicles": "历代志上",
  "2 Chronicles": "历代志下",
  Ezra: "以斯拉记",
  Nehemiah: "尼希米记",
  Esther: "以斯帖记",
  Job: "约伯记",
  Psalms: "诗篇",
  Proverbs: "箴言",
  Ecclesiastes: "传道书",
  "Song of Songs": "雅歌",
  Isaiah: "以赛亚书",
  Jeremiah: "耶利米书",
  Lamentations: "耶利米哀歌",
  Ezekiel: "以西结书",
  Daniel: "但以理书",
  Hosea: "何西阿书",
  Joel: "约珥书",
  Amos: "阿摩司书",
  Obadiah: "俄巴底亚书",
  Jonah: "约拿书",
  Micah: "弥迦书",
  Nahum: "那鸿书",
  Habakkuk: "哈巴谷书",
  Zephaniah: "西番雅书",
  Haggai: "哈该书",
  Zechariah: "撒迦利亚书",
  Malachi: "玛拉基书",
  Matthew: "马太福音",
  Mark: "马可福音",
  Luke: "路加福音",
  John: "约翰福音",
  Acts: "使徒行传",
  Romans: "罗马书",
  "1 Corinthians": "哥林多前书",
  "2 Corinthians": "哥林多后书",
  Galatians: "加拉太书",
  Ephesians: "以弗所书",
  Philippians: "腓立比书",
  Colossians: "歌罗西书",
  "1 Thessalonians": "帖撒罗尼迦前书",
  "2 Thessalonians": "帖撒罗尼迦后书",
  "1 Timothy": "提摩太前书",
  "2 Timothy": "提摩太后书",
  Titus: "提多书",
  Philemon: "腓利门书",
  Hebrews: "希伯来书",
  James: "雅各书",
  "1 Peter": "彼得前书",
  "2 Peter": "彼得后书",
  "1 John": "约翰一书",
  "2 John": "约翰二书",
  "3 John": "约翰三书",
  Jude: "犹大书",
  Revelation: "启示录",
};

const JA_NAMES = {
  Genesis: "創世記",
  Exodus: "出エジプト記",
  Leviticus: "レビ記",
  Numbers: "民数記",
  Deuteronomy: "申命記",
  Joshua: "ヨシュア記",
  Judges: "士師記",
  Ruth: "ルツ記",
  "1 Samuel": "サムエル記Ⅰ",
  "2 Samuel": "サムエル記Ⅱ",
  "1 Kings": "列王記Ⅰ",
  "2 Kings": "列王記Ⅱ",
  "1 Chronicles": "歴代誌Ⅰ",
  "2 Chronicles": "歴代誌Ⅱ",
  Ezra: "エズラ記",
  Nehemiah: "ネヘミヤ記",
  Esther: "エステル記",
  Job: "ヨブ記",
  Psalms: "詩篇",
  Proverbs: "箴言",
  Ecclesiastes: "伝道者の書",
  "Song of Songs": "雅歌",
  Isaiah: "イザヤ書",
  Jeremiah: "エレミヤ書",
  Lamentations: "哀歌",
  Ezekiel: "エゼキエル書",
  Daniel: "ダニエル書",
  Hosea: "ホセア書",
  Joel: "ヨエル書",
  Amos: "アモス書",
  Obadiah: "オバデヤ書",
  Jonah: "ヨナ書",
  Micah: "ミカ書",
  Nahum: "ナホム書",
  Habakkuk: "ハバクク書",
  Zephaniah: "ゼパニヤ書",
  Haggai: "ハガイ書",
  Zechariah: "ゼカリヤ書",
  Malachi: "マラキ書",
  Matthew: "マタイの福音書",
  Mark: "マルコの福音書",
  Luke: "ルカの福音書",
  John: "ヨハネの福音書",
  Acts: "使徒の働き",
  Romans: "ローマ人への手紙",
  "1 Corinthians": "コリント人への手紙第一",
  "2 Corinthians": "コリント人への手紙第二",
  Galatians: "ガラテヤ人への手紙",
  Ephesians: "エペソ人への手紙",
  Philippians: "ピリピ人への手紙",
  Colossians: "コロサイ人への手紙",
  "1 Thessalonians": "テサロニケ人への手紙第一",
  "2 Thessalonians": "テサロニケ人への手紙第二",
  "1 Timothy": "テモテへの手紙第一",
  "2 Timothy": "テモテへの手紙第二",
  Titus: "テトスへの手紙",
  Philemon: "ピレモンへの手紙",
  Hebrews: "ヘブル人への手紙",
  James: "ヤコブの手紙",
  "1 Peter": "ペテロの手紙第一",
  "2 Peter": "ペテロの手紙第二",
  "1 John": "ヨハネの手紙第一",
  "2 John": "ヨハネの手紙第二",
  "3 John": "ヨハネの手紙第三",
  Jude: "ユダの手紙",
  Revelation: "ヨハネの黙示録",
};

const EXTRA_ALIASES = {
  "1 Chronicles": ["1. Chonik"],
  Obadiah: ["Der Prophet Obadja"],
  Philemon: ["Der Brief des Apostels Paulus an Philemon"],
  "2 John": ["Der zweite Brief des Johannes"],
  "3 John": ["Der dritte Brief des Johannes"],
  Jude: ["Der Brief des Judas"],
  Proverbs: ["箴言知恵の泉", "箴言 知恵の泉"],
};

const SOURCE_FILES = [
  { file: "ko_ot.txt", lang: "ko" },
  { file: "ko_nt.txt", lang: "ko" },
  { file: "OT_EN_formatted.txt", lang: "en" },
  { file: "NT_EN_formatted.txt", lang: "en" },
  { file: "OT_GM_formatted.txt", lang: "de" },
  { file: "NT_GM_formatted.txt", lang: "de" },
  { file: "OT_CH_formatted.txt", lang: "zh" },
  { file: "NT_CH_formatted.txt", lang: "zh" },
  { file: "OT_JP_formatted.txt", lang: "ja" },
  { file: "NT_JP_formatted.txt", lang: "ja" },
];

function normalizeBookName(name) {
  return name
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\s+/g, "")
    .toLocaleLowerCase("en-US");
}

function createAliasMap() {
  const aliasMap = new Map();
  const nameMaps = [KO_NAMES, DE_NAMES, ZH_NAMES, JA_NAMES];

  function addAlias(alias, id) {
    if (!alias) return;
    aliasMap.set(normalizeBookName(alias), id);
  }

  for (const id of BOOK_IDS) {
    addAlias(id, id);
    for (const nameMap of nameMaps) {
      addAlias(nameMap[id], id);
    }
    for (const alias of EXTRA_ALIASES[id] || []) {
      addAlias(alias, id);
    }
  }

  return aliasMap;
}

function createBooksPayload() {
  return BOOK_IDS.map((id) => ({
    id,
    en: id,
    de: DE_NAMES[id] || id,
    zh: ZH_NAMES[id] || id,
    ja: JA_NAMES[id] || id,
    ko: KO_NAMES[id] || id,
    testament: OT_BOOKS.includes(id) ? "OT" : "NT",
  }));
}

function createEmptyVerse(number) {
  return {
    number,
    ko: "",
    en: "",
    de: "",
    zh: "",
    ja: "",
  };
}

function parseLine(line) {
  const cols = line
    .replace(/^\uFEFF/, "")
    .split("\t")
    .map((col) => col.trim());

  let refIndex = cols.findIndex((col) => /^\d+:\d+$/.test(col));
  let adjustedCols = cols;

  if (refIndex < 0) {
    const compoundIndex = cols.findIndex((col) => /^\d+:\d+\s+/.test(col));
    if (compoundIndex >= 1) {
      const match = cols[compoundIndex].match(/^(\d+:\d+)\s+(.*)$/);
      adjustedCols = [
        ...cols.slice(0, compoundIndex),
        match[1],
        match[2],
        ...cols.slice(compoundIndex + 1),
      ];
      refIndex = compoundIndex;
    }
  }

  if (refIndex < 1) {
    return null;
  }

  const reference = adjustedCols[refIndex];
  if (!/^\d+:\d+$/.test(reference)) {
    return null;
  }

  return {
    bookName: adjustedCols.slice(0, refIndex).join(" ").trim(),
    reference,
    text: adjustedCols.slice(refIndex + 1).join("\t").trim(),
  };
}

function readSourceFile(source, aliasMap, merged, langVerseKeys, warnings) {
  const filePath = path.join(DATA_DIR, source.file);
  if (!fs.existsSync(filePath)) {
    warnings.push(`Warning [${source.file}]: source file not found`);
    return;
  }

  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    const parsed = parseLine(line);
    if (!parsed) {
      const looksLikeHeader = index === 0 && /book/i.test(line) && /(verse|reference|text)/i.test(line);
      if (!looksLikeHeader) {
        warnings.push(`Warning [${source.file}:${index + 1}]: reference parse failed`);
      }
      return;
    }

    const bookId = aliasMap.get(normalizeBookName(parsed.bookName));
    if (!bookId) {
      warnings.push(`Warning [${source.file}:${index + 1}]: unknown book "${parsed.bookName}"`);
      return;
    }

    const [chapterRaw, verseRaw] = parsed.reference.split(":");
    const chapter = Number.parseInt(chapterRaw, 10);
    const verseNumber = Number.parseInt(verseRaw, 10);

    if (!Number.isInteger(chapter) || !Number.isInteger(verseNumber)) {
      warnings.push(`Warning [${source.file}:${index + 1}]: invalid reference "${parsed.reference}"`);
      return;
    }

    if (!merged.has(bookId)) merged.set(bookId, new Map());
    const chapters = merged.get(bookId);
    if (!chapters.has(chapter)) chapters.set(chapter, new Map());
    const verses = chapters.get(chapter);
    if (!verses.has(verseNumber)) verses.set(verseNumber, createEmptyVerse(verseNumber));

    verses.get(verseNumber)[source.lang] = parsed.text;
    langVerseKeys[source.lang].add(`${bookId}|${chapter}|${verseNumber}`);
  });
}

function ensureValidBooks(books) {
  const otCount = books.filter((book) => book.testament === "OT").length;
  const ntCount = books.filter((book) => book.testament === "NT").length;

  if (books.length !== 66) {
    throw new Error(`books.json must contain 66 books, received ${books.length}`);
  }

  if (otCount !== 39 || ntCount !== 27) {
    throw new Error(`Expected OT 39 and NT 27, received OT ${otCount} and NT ${ntCount}`);
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function build() {
  const aliasMap = createAliasMap();
  const books = createBooksPayload();
  const merged = new Map();
  const warnings = [];
  const langVerseKeys = {
    ko: new Set(),
    en: new Set(),
    de: new Set(),
    zh: new Set(),
    ja: new Set(),
  };

  ensureValidBooks(books);

  for (const source of SOURCE_FILES) {
    readSourceFile(source, aliasMap, merged, langVerseKeys, warnings);
  }

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, "chapters"), { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, "verses"), { recursive: true });

  writeJson(path.join(OUTPUT_DIR, "books.json"), books);

  let generatedChapterCount = 0;
  let generatedVerseCount = 0;

  for (const book of books) {
    const chapters = merged.get(book.id) || new Map();
    const chapterNumbers = [...chapters.keys()].sort((a, b) => a - b);
    const safeBookName = toSafeFileName(book.id);

    writeJson(path.join(OUTPUT_DIR, "chapters", `${safeBookName}.json`), chapterNumbers);

    for (const chapter of chapterNumbers) {
      const verses = [...chapters.get(chapter).values()].sort((a, b) => a.number - b.number);
      generatedChapterCount += 1;
      generatedVerseCount += verses.length;

      writeJson(path.join(OUTPUT_DIR, "verses", safeBookName, `${chapter}.json`), {
        book: book.id,
        chapter,
        verses,
      });
    }
  }

  for (const warning of warnings) {
    console.warn(warning);
  }

  console.log("Parsed verses by language:");
  for (const lang of ["ko", "en", "de", "zh", "ja"]) {
    console.log(`${lang}: ${langVerseKeys[lang].size}`);
  }
  console.log(`Final merged verses: ${generatedVerseCount}`);
  console.log(`Generated books: ${books.length}`);
  console.log(`Generated chapters: ${generatedChapterCount}`);
  console.log(`Generated verses: ${generatedVerseCount}`);
  console.log(`Output: ${path.relative(ROOT_DIR, OUTPUT_DIR).replace(/\\/g, "/")}`);
}

build();
