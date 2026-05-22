const STORAGE_KEY = "multilingual-bible-state-v1";

const LANGS = [
  { key: "ko", toggle: "KO", label: "한국어" },
  { key: "en", toggle: "EN", label: "English" },
  { key: "de", toggle: "DE", label: "Deutsch" },
  { key: "zh", toggle: "ZH", label: "中文" },
  { key: "ja", toggle: "JA", label: "日本語" },
];

const DEFAULT_LANGS = {
  ko: true,
  en: true,
  de: true,
  zh: true,
  ja: true,
};

const state = {
  allBooks: [],
  currentTab: "OT",
  currentBook: null,
  currentChapter: null,
  activeLangs: { ...DEFAULT_LANGS },
  searchTerm: "",
};

const cache = {
  chapters: new Map(),
  chaptersPayload: new Map(),
};

const view = document.querySelector("#view");
let routeToken = 0;

function toSafeFileName(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, "_");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function encodeBookId(bookId) {
  return encodeURIComponent(bookId);
}

function getBookById(bookId) {
  return state.allBooks.find((book) => book.id === bookId) || null;
}

function getBookTitle(book) {
  if (!book) return "";
  return book.ko || book.en || book.id;
}

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.currentTab = saved.currentTab === "NT" ? "NT" : "OT";
    state.currentChapter = Number.isInteger(saved.currentChapter) ? saved.currentChapter : null;
    state.activeLangs = { ...DEFAULT_LANGS, ...(saved.activeLangs || {}) };
    return saved;
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      currentTab: state.currentTab,
      currentBook: state.currentBook ? state.currentBook.id : null,
      currentChapter: state.currentChapter,
      activeLangs: state.activeLangs,
    }),
  );
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} (${response.status})`);
  }
  return response.json();
}

async function getChapters(bookId) {
  if (!cache.chapters.has(bookId)) {
    const url = `./data-json/chapters/${toSafeFileName(bookId)}.json`;
    cache.chapters.set(bookId, await fetchJson(url));
  }
  return cache.chapters.get(bookId);
}

async function getChapterPayload(bookId, chapter) {
  const key = `${bookId}|${chapter}`;
  if (!cache.chaptersPayload.has(key)) {
    const url = `./data-json/verses/${toSafeFileName(bookId)}/${chapter}.json`;
    cache.chaptersPayload.set(key, await fetchJson(url));
  }
  return cache.chaptersPayload.get(key);
}

function navigate(hash) {
  if (window.location.hash === hash) {
    handleRoute();
    return;
  }
  window.location.hash = hash;
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean).map((part) => decodeURIComponent(part));

  if (parts[0] === "books") {
    return { screen: "books", testament: parts[1] === "NT" ? "NT" : "OT" };
  }
  if (parts[0] === "book" && parts[1]) {
    return { screen: "chapters", bookId: parts[1] };
  }
  if (parts[0] === "read" && parts[1] && parts[2]) {
    return { screen: "reader", bookId: parts[1], chapter: Number.parseInt(parts[2], 10) };
  }
  return { screen: "home" };
}

function renderTopbar(title, options = {}) {
  const left = options.backRoute
    ? `<button class="icon-button" type="button" data-route="${escapeHtml(options.backRoute)}" aria-label="뒤로">‹</button>`
    : `<button class="icon-button" type="button" data-route="#/" aria-label="홈">⌂</button>`;

  return `
    <header class="topbar">
      ${left}
      <div class="topbar-title">${escapeHtml(title)}</div>
      <button class="icon-button" type="button" data-route="#/" aria-label="홈">⌂</button>
    </header>
  `;
}

function showLoading() {
  view.innerHTML = `<div class="loading">불러오는 중</div>`;
}

function showError(error) {
  view.innerHTML = `
    <div class="error-state">
      <div>
        <strong>데이터를 불러오지 못했습니다.</strong><br>
        ${escapeHtml(error.message || error)}
      </div>
    </div>
  `;
}

function bindRouteButtons(root = view) {
  root.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.route));
  });
}

function renderHome() {
  const canContinue = state.currentBook && Number.isInteger(state.currentChapter);
  const continueButton = canContinue
    ? `<button class="cover-button continue-button" type="button" data-route="#/read/${encodeBookId(state.currentBook.id)}/${state.currentChapter}">
        ${escapeHtml(getBookTitle(state.currentBook))} ${state.currentChapter}장
      </button>`
    : "";

  view.innerHTML = `
    <section class="home">
      <div class="cover">
        <div class="cover-top">
          <div class="cover-mark" aria-hidden="true"></div>
          <strong>HOLY BIBLE</strong>
        </div>
        <div class="cover-title">
          <span>다국어 성경</span>
          <h1>다국어<br>성경</h1>
        </div>
        <div class="home-actions">
          <button class="cover-button" type="button" data-route="#/books/OT">구약</button>
          <button class="cover-button" type="button" data-route="#/books/NT">신약</button>
          ${continueButton}
        </div>
      </div>
    </section>
  `;
  bindRouteButtons();
}

function renderBooks() {
  view.innerHTML = `
    ${renderTopbar("성경")}
    <section class="content">
      <div class="segmented" role="tablist" aria-label="성경 구분">
        <button class="tab-button ${state.currentTab === "OT" ? "is-active" : ""}" type="button" data-tab="OT">구약</button>
        <button class="tab-button ${state.currentTab === "NT" ? "is-active" : ""}" type="button" data-tab="NT">신약</button>
      </div>
      <div class="search-wrap">
        <input class="search-input" id="book-search" type="search" value="${escapeHtml(state.searchTerm)}" placeholder="책 검색">
      </div>
      <div id="book-list" class="book-list"></div>
    </section>
  `;

  bindRouteButtons();
  view.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentTab = button.dataset.tab;
      state.searchTerm = "";
      saveState();
      navigate(`#/books/${state.currentTab}`);
    });
  });

  const searchInput = view.querySelector("#book-search");
  searchInput.addEventListener("input", () => {
    state.searchTerm = searchInput.value;
    renderBookList();
  });

  renderBookList();
}

function renderBookList() {
  const target = view.querySelector("#book-list");
  if (!target) return;

  const query = state.searchTerm.trim().toLocaleLowerCase("en-US");
  const books = state.allBooks
    .filter((book) => book.testament === state.currentTab)
    .filter((book) => {
      if (!query) return true;
      return ["id", "ko", "en", "de", "zh", "ja"].some((field) =>
        String(book[field] || "").toLocaleLowerCase("en-US").includes(query),
      );
    });

  if (!books.length) {
    target.innerHTML = `<div class="empty">검색 결과가 없습니다.</div>`;
    return;
  }

  target.innerHTML = books
    .map(
      (book) => `
        <button class="book-row" type="button" data-book-id="${escapeHtml(book.id)}">
          <span class="book-main">
            <span class="book-ko">${escapeHtml(book.ko)}</span>
            <span class="book-meta">${escapeHtml([book.en, book.de, book.zh, book.ja].filter(Boolean).join(" · "))}</span>
          </span>
          <span class="book-arrow" aria-hidden="true">›</span>
        </button>
      `,
    )
    .join("");

  target.querySelectorAll("[data-book-id]").forEach((button) => {
    button.addEventListener("click", () => navigate(`#/book/${encodeBookId(button.dataset.bookId)}`));
  });
}

async function renderChapters(bookId) {
  const book = getBookById(bookId);
  if (!book) {
    renderHome();
    return;
  }

  state.currentBook = book;
  state.currentTab = book.testament;
  const chapters = await getChapters(book.id);
  saveState();

  view.innerHTML = `
    ${renderTopbar(getBookTitle(book), { backRoute: `#/books/${book.testament}` })}
    <section class="content">
      <div class="book-heading">
        <h1>${escapeHtml(book.ko)}</h1>
        <p>${escapeHtml([book.en, book.de, book.zh, book.ja].filter(Boolean).join(" · "))}</p>
      </div>
      <div class="chapter-grid">
        ${chapters
          .map(
            (chapter) => `
              <button class="chapter-button" type="button" data-chapter="${chapter}">${chapter}</button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;

  bindRouteButtons();
  view.querySelectorAll("[data-chapter]").forEach((button) => {
    const chapter = Number.parseInt(button.dataset.chapter, 10);
    button.addEventListener("click", () => navigate(`#/read/${encodeBookId(book.id)}/${chapter}`));
  });
}

function buildVerseRows(verse, activeLangs) {
  const rows = [];

  if (activeLangs.ko && verse.ko) rows.push({ lang: "ko", label: "한국어", text: verse.ko });
  if (activeLangs.en && verse.en) rows.push({ lang: "en", label: "English", text: verse.en });
  if (activeLangs.de && verse.de) rows.push({ lang: "de", label: "Deutsch", text: verse.de });
  if (activeLangs.zh && verse.zh) rows.push({ lang: "zh", label: "中文", text: verse.zh });
  if (activeLangs.ja && verse.ja) rows.push({ lang: "ja", label: "日本語", text: verse.ja });

  return rows;
}

function renderVerseList(payload) {
  const blocks = payload.verses
    .map((verse) => {
      const rows = buildVerseRows(verse, state.activeLangs);
      if (!rows.length) return "";

      return `
        <article class="verse-block">
          <div class="verse-number">${verse.number}</div>
          <div class="verse-content">
            ${rows
              .map(
                (row) => `
                  <div class="verse-row verse-${row.lang}">
                    <div class="verse-label">${escapeHtml(row.label)}</div>
                    <div class="verse-text">${escapeHtml(row.text)}</div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
      `;
    })
    .filter(Boolean)
    .join("");

  return blocks || `<div class="empty">표시할 본문이 없습니다.</div>`;
}

async function renderReader(bookId, chapter) {
  const book = getBookById(bookId);
  if (!book || !Number.isInteger(chapter)) {
    renderHome();
    return;
  }

  state.currentBook = book;
  state.currentTab = book.testament;
  state.currentChapter = chapter;

  const [chapters, payload] = await Promise.all([getChapters(book.id), getChapterPayload(book.id, chapter)]);
  const chapterIndex = chapters.indexOf(chapter);
  const bookIndex = state.allBooks.findIndex((item) => item.id === book.id);
  const hasPrev = chapterIndex > 0 || bookIndex > 0;
  const hasNext = chapterIndex < chapters.length - 1 || bookIndex < state.allBooks.length - 1;

  saveState();

  view.innerHTML = `
    <section class="reader">
      ${renderTopbar(`${getBookTitle(book)} ${chapter}장`, { backRoute: `#/book/${encodeBookId(book.id)}` })}
      <div class="reader-toolbar">
        <div class="language-toggle" role="group" aria-label="언어 선택">
          ${LANGS.map(
            (lang) => `
              <button
                class="lang-button ${state.activeLangs[lang.key] ? "is-active" : ""}"
                type="button"
                data-lang="${lang.key}"
                aria-pressed="${state.activeLangs[lang.key] ? "true" : "false"}"
              >${lang.toggle}</button>
            `,
          ).join("")}
        </div>
      </div>
      <div class="verse-list">
        ${renderVerseList(payload)}
      </div>
      <div class="bottom-nav">
        <button class="nav-button prev" type="button" data-rel="-1" ${hasPrev ? "" : "disabled"}>이전 장</button>
        <button class="nav-button next" type="button" data-rel="1" ${hasNext ? "" : "disabled"}>다음 장</button>
      </div>
    </section>
  `;

  bindRouteButtons();
  view.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.lang;
      state.activeLangs[key] = !state.activeLangs[key];
      saveState();
      renderReader(book.id, chapter);
    });
  });

  view.querySelectorAll("[data-rel]").forEach((button) => {
    button.addEventListener("click", () => goToRelativeChapter(Number.parseInt(button.dataset.rel, 10)));
  });
}

async function goToRelativeChapter(direction) {
  if (!state.currentBook || !Number.isInteger(state.currentChapter)) return;

  const book = state.currentBook;
  const chapters = await getChapters(book.id);
  const chapterIndex = chapters.indexOf(state.currentChapter);
  const bookIndex = state.allBooks.findIndex((item) => item.id === book.id);

  if (direction < 0) {
    if (chapterIndex > 0) {
      navigate(`#/read/${encodeBookId(book.id)}/${chapters[chapterIndex - 1]}`);
      return;
    }

    const previousBook = state.allBooks[bookIndex - 1];
    if (previousBook) {
      const previousChapters = await getChapters(previousBook.id);
      navigate(`#/read/${encodeBookId(previousBook.id)}/${previousChapters[previousChapters.length - 1]}`);
    }
    return;
  }

  if (chapterIndex < chapters.length - 1) {
    navigate(`#/read/${encodeBookId(book.id)}/${chapters[chapterIndex + 1]}`);
    return;
  }

  const nextBook = state.allBooks[bookIndex + 1];
  if (nextBook) {
    navigate(`#/read/${encodeBookId(nextBook.id)}/1`);
  }
}

async function handleRoute() {
  const token = ++routeToken;
  const route = parseRoute();

  try {
    if (route.screen === "home") {
      renderHome();
      return;
    }

    if (route.screen === "books") {
      state.currentTab = route.testament;
      saveState();
      renderBooks();
      return;
    }

    showLoading();

    if (route.screen === "chapters") {
      await renderChapters(route.bookId);
      return;
    }

    if (route.screen === "reader") {
      await renderReader(route.bookId, route.chapter);
      return;
    }
  } catch (error) {
    if (token === routeToken) {
      showError(error);
    }
  }
}

async function init() {
  const saved = loadSavedState();
  showLoading();

  try {
    state.allBooks = await fetchJson("./data-json/books.json");
    state.currentBook = saved.currentBook ? getBookById(saved.currentBook) : null;

    window.addEventListener("hashchange", handleRoute);
    await handleRoute();
  } catch (error) {
    showError(error);
  }
}

init();
