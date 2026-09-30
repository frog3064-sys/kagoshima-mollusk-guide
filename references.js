const DATA_URL = "data/references.csv";

const list = document.querySelector("#referenceList");
const count = document.querySelector("#referenceCount");
const searchInput = document.querySelector("#referenceSearch");
const localitySelect = document.querySelector("#referenceLocality");


/* =========================================================
   CSV parser
========================================================= */

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
      if (c === "\r" && n === "\n") {
        i++;
      }

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

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map(h => h.trim());

  return rows
    .slice(1)
    .filter(row =>
      row.some(cell => String(cell ?? "").trim() !== "")
    )
    .map(row => {

      const obj = {};

      headers.forEach((header, i) => {
        obj[header] = (row[i] ?? "").trim();
      });

      return obj;
    });
}


/* =========================================================
   HTML escape
========================================================= */

function esc(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   値があるか
========================================================= */

function hasValue(value) {

  const v = String(value ?? "").trim();

  return (
    v !== "" &&
    v.toUpperCase() !== "NA" &&
    v.toUpperCase() !== "#N/A" &&
    v.toUpperCase() !== "N/A" &&
    v.toLowerCase() !== "null" &&
    v.toLowerCase() !== "undefined"
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


/* =========================================================
   文献表示
========================================================= */

function renderReferences(refs) {

  list.innerHTML = refs.map(r => {


    /* -----------------------------------------------------
       基本情報
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       書籍
    ----------------------------------------------------- */

    if (type === "book") {

      const publisher = hasValue(r.publisher)
        ? esc(r.publisher)
        : "";


      citation = `
        ${author} ${year}. ${title}.
        ${publisher}.
      `;

    }


    /* -----------------------------------------------------
       通常の文献
    ----------------------------------------------------- */

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
        journalInfo += journal;
      }


      if (volume) {

        if (journalInfo) {
          journalInfo += " ";
        }

        journalInfo += volume;
      }


      if (issue) {

        if (journalInfo) {
          journalInfo += " ";
        }

        journalInfo += issue;
      }


      if (pages) {
        journalInfo += `: ${pages}`;
      }


      citation = `
        ${author} ${year}. ${title}.
        ${journalInfo}.
      `;

    }


    /* -----------------------------------------------------
       DOI / URL
    ----------------------------------------------------- */

    let doiUrl = "";

    if (hasValue(r["DOI,URL"])) {

      const rawUrl = String(r["DOI,URL"]).trim();


      /*
       * URLが http / https の場合だけリンクにする。
       * それ以外（DOI文字列など）は通常テキストとして表示。
       */

      if (/^https?:\/\//i.test(rawUrl)) {

        doiUrl = `
          <div class="reference-doi">
            <a
              href="${esc(rawUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${esc(rawUrl)}
            </a>
          </div>
        `;

      } else {

        doiUrl = `
          <div class="reference-doi">
            ${esc(rawUrl)}
          </div>
        `;

      }

    }


    /* -----------------------------------------------------
       備考
    ----------------------------------------------------- */

    const notes = hasValue(r.notes)
      ? `
        <div class="reference-notes">
          <strong>備考：</strong>${esc(r.notes)}
        </div>
      `
      : "";


    /* -----------------------------------------------------
       地域
    ----------------------------------------------------- */

    const locality = hasValue(r.locality)
      ? `
        <div class="reference-locality">
          ${esc(r.locality)}
        </div>
      `
      : "";


    /* -----------------------------------------------------
       カード
    ----------------------------------------------------- */

    return `
      <article class="reference-card">

        <div class="reference-citation">
          ${citation}
        </div>

        ${doiUrl}

        ${locality}

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


  const filtered =
    allReferences.filter(r => {


      /* ---------------------------------------------------
         検索対象
      --------------------------------------------------- */

      const searchableText = [

        r.reference_id,

        r.reference_type,

        r.author,

        r.author_roman,

        r.year,

        r.title,

        r.journal,

        r.volume,

        r.issue,

        r.pages,

        r.publisher,

        r["publisher English"],

        r["DOI,URL"],

        r.language,

        r.locality,

        r.notes

      ]
        .filter(v => hasValue(v))
        .join(" ")
        .toLowerCase();


      /* ---------------------------------------------------
         キーワード検索
      --------------------------------------------------- */

      if (
        keyword &&
        !searchableText.includes(keyword)
      ) {
        return false;
      }


      /* ---------------------------------------------------
         地域絞り込み
      --------------------------------------------------- */

      if (locality) {

        const localities =
          String(r.locality ?? "")
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


    /* -----------------------------------------------------
       CSV取得
    ----------------------------------------------------- */

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
       CSV解析
    ----------------------------------------------------- */

    const allReferences =
      csvParse(text)

        /*
         * importance が 1 または 2 の文献だけ表示
         */
        .filter(r =>
          r.importance === "1" ||
          r.importance === "2"
        )

        /*
         * sort_number の順番で並べる
         */
        .sort((a, b) => {

          const sortA =
            Number(a.sort_number);

          const sortB =
            Number(b.sort_number);


          /*
           * 数字が入っているものを先にする。
           * 空欄・数字でないものは最後。
           */

          const validA =
            Number.isFinite(sortA);

          const validB =
            Number.isFinite(sortB);


          if (validA && validB) {
            return sortA - sortB;
          }


          if (validA) {
            return -1;
          }


          if (validB) {
            return 1;
          }


          return 0;

        });


    /* -----------------------------------------------------
       初回表示
    ----------------------------------------------------- */

    filterReferences(allReferences);


    /* -----------------------------------------------------
       検索
    ----------------------------------------------------- */

    searchInput.addEventListener("input", () => {

      filterReferences(allReferences);

    });


    /* -----------------------------------------------------
       地域絞り込み
    ----------------------------------------------------- */

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


    count.textContent = "0 件";

  }

}


/* =========================================================
   開始
========================================================= */

loadReferences();