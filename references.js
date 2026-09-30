const DATA_URL = "data/references.csv";

const list = document.querySelector("#referenceList");
const count = document.querySelector("#referenceCount");
const searchInput = document.querySelector("#referenceSearch");
const localitySelect = document.querySelector("#referenceLocality");


function csvParse(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];

    if (c === '"' && quoted && n === '"') {
      cell += '"';
      i++;
      continue;
    }

    if (c === '"') {
      quoted = !quoted;
      continue;
    }

    if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && n === "\n") i++;

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += c;
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim());

  return rows
    .slice(1)
    .filter(row => row.some(cell => cell !== ""))
    .map(row => {
      const obj = {};

      headers.forEach((header, i) => {
        obj[header] = (row[i] ?? "").trim();
      });

      return obj;
    });
}


function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function hasValue(value) {
  const v = String(value ?? "").trim();

  return (
    v !== "" &&
    v.toUpperCase() !== "NA" &&
    v.toUpperCase() !== "#N/A"
  );
}


/* =========================================================
   産地の地域分類
========================================================= */

function getLocalityClass(locality) {

  const x = String(locality ?? "").trim();

  // 鹿児島県全域
  if (x === "鹿児島県全域") {
    return "locality-all";
  }

  // 本土
  if (
    [
      "北薩",
      "南薩",
      "大隅"
    ].includes(x)
  ) {
    return "locality-mainland";
  }

  // 島しょ域
  if (
    [
      "甑島列島",
      "種子島",
      "黒島",
      "竹島",
      "宇治群島",
      "草垣群島",
      "馬毛島",
      "屋久島",
      "口永良部島",
      "口之島",
      "中之島",
      "平島",
      "諏訪之瀬島",
      "悪石島",
      "小宝島",
      "宝島"
    ].includes(x)
  ) {
    return "locality-islands";
  }

  // 奄美群島
  if (
    [
      "奄美大島",
      "加計呂麻島",
      "請島",
      "与路島",
      "喜界島",
      "徳之島",
      "沖永良部島",
      "与論島"
    ].includes(x)
  ) {
    return "locality-amami";
  }

  // その他
  return "locality-other";
}


// ------------------------------------------------------------
// 文献表示
// ------------------------------------------------------------

function renderReferences(refs) {

  list.innerHTML = refs.map(r => {

    const author = hasValue(r.author)
      ? esc(r.author)
      : "";

    const year = hasValue(r.year)
      ? `(${esc(r.year)})`
      : "";

    const title = hasValue(r.title)
      ? esc(r.title)
      : "";

    const type = String(r.reference_type ?? "")
      .trim()
      .toLowerCase();

    let citation = "";

    // --------------------------------------------------------
    // book の場合
    // --------------------------------------------------------

    if (type === "book") {

      const publisher = hasValue(r.publisher)
        ? esc(r.publisher)
        : "";

      citation = `
        ${author} ${year}. ${title}.
        ${publisher}
      `;

    }

    // --------------------------------------------------------
    // 通常の文献
    // --------------------------------------------------------

    else {

      const journal = hasValue(r.journal)
        ? `<em>${esc(r.journal)}</em>`
        : "";

      const volume = hasValue(r.volume)
        ? esc(r.volume)
        : "";

      const issue = hasValue(r.issue)
        ? `(${esc(r.issue)})`
        : "";

      const pages = hasValue(r.pages)
        ? esc(r.pages)
        : "";

      let journalInfo = "";

      if (journal) {
        journalInfo += `${journal}`;
      }

      if (volume) {
        journalInfo += ` ${volume}`;
      }

      if (issue) {
        journalInfo += ` ${issue}`;
      }

      if (pages) {
        journalInfo += `: ${pages}`;
      }

      citation = `
        ${author} ${year}. ${title}.
        ${journalInfo}.
      `;

    }

    // --------------------------------------------------------
    // 備考
    // --------------------------------------------------------

    const notes = hasValue(r.notes)
      ? `
        <div class="reference-notes">
          <strong>備考：</strong>${esc(r.notes)}
        </div>
      `
      : "";


    return `
      <article class="reference-card">

        <div class="reference-citation">
          ${citation}
        </div>

        ${notes}

      </article>
    `;

  }).join("");

  count.textContent = `${refs.length} 件`;
}


/* =========================================================
   検索・地域絞り込み
========================================================= */

function filterReferences(allReferences) {

  const keyword =
    searchInput.value.trim().toLowerCase();

  const locality =
    localitySelect.value;

  const filtered = allReferences.filter(r => {

    const searchableText = [
      r.author,
      r.author_roman,
      r.year,
      r.title,
      r.journal,
      r.volume,
      r.issue,
      r.pages,
      r.notes
    ].join(" ").toLowerCase();

    if (
      keyword &&
      !searchableText.includes(keyword)
    ) {
      return false;
    }

    if (locality) {

      const localities = String(r.locality ?? "")
        .split(";")
        .map(x => x.trim());

      if (!localities.includes(locality)) {
        return false;
      }
    }

    return true;
  });

  renderReferences(filtered);
}


/* =========================================================
   CSV読み込み
========================================================= */

async function loadReferences() {

  try {

    const response =
      await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(
        `references.csv の読み込みに失敗しました: ${response.status}`
      );
    }

    const text =
      await response.text();


    /* -----------------------------------------------------
       importance → author_roman → year の順に並べる
    ----------------------------------------------------- */

    const allReferences =
      csvParse(text)
        .filter(r =>
          r.importance === "1" ||
          r.importance === "2"
        )
        .sort((a, b) => {

          // ① importance
          const importanceCompare =
            Number(a.importance) - Number(b.importance);

          if (importanceCompare !== 0) {
            return importanceCompare;
          }

          // ② author_roman
          const authorCompare =
            String(a.author_roman ?? "").localeCompare(
              String(b.author_roman ?? ""),
              "en",
              { sensitivity: "base" }
            );

          if (authorCompare !== 0) {
            return authorCompare;
          }

          // ③ year
          const yearA = Number(a.year);
          const yearB = Number(b.year);

          if (!Number.isNaN(yearA) && !Number.isNaN(yearB)) {
            return yearA - yearB;
          }

          return String(a.year ?? "").localeCompare(
            String(b.year ?? ""),
            "en"
          );
        });


    filterReferences(allReferences);


    searchInput.addEventListener("input", () => {
      filterReferences(allReferences);
    });


    localitySelect.addEventListener("change", () => {
      filterReferences(allReferences);
    });


  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <p class="no-results">
        文献データを読み込めませんでした。
      </p>
    `;
  }
}


loadReferences();
