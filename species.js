// ============================================================
// 貝図鑑：種詳細ページ
// ============================================================


// ------------------------------------------------------------
// CSV
// ------------------------------------------------------------

const DATA_URL = "data/species.csv";
const PHOTOS_URL = "data/photos.csv";

const root = document.querySelector("#detail");


// ------------------------------------------------------------
// CSVパーサー
// ------------------------------------------------------------

function csvParse(text) {

  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {

    const c = text[i];
    const n = text[i + 1];

    // "" → "
    if (c === '"' && quoted && n === '"') {
      cell += '"';
      i++;
      continue;
    }

    // " の開始・終了
    if (c === '"') {
      quoted = !quoted;
      continue;
    }

    // セル区切り
    if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    // 行区切り
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

  // 最後の行
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
    .filter(r => r.some(v => String(v ?? "").trim() !== ""))
    .map(r => {

      const obj = {};

      headers.forEach((h, i) => {
        obj[h] = String(r[i] ?? "").trim();
      });

      return obj;
    });
}


// ------------------------------------------------------------
// HTMLエスケープ
// ------------------------------------------------------------

function esc(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ------------------------------------------------------------
// 有効な値か確認
// ------------------------------------------------------------

function hasValue(value) {

  const v = String(value ?? "").trim();

  return (
    v !== "" &&
    v !== "#N/A" &&
    v !== "N/A" &&
    v !== "NA" &&
    v !== "null" &&
    v !== "undefined"
  );
}


// ------------------------------------------------------------
// URLから種名を取得
// ------------------------------------------------------------

function getSpeciesName() {

  const params = new URLSearchParams(location.search);

  return params.get("name");
}


// ------------------------------------------------------------
// 学名HTML
// ------------------------------------------------------------

function makeScientificName(name) {

  if (!hasValue(name)) {
    return "";
  }

  return `<em>${esc(name)}</em>`;
}


// ------------------------------------------------------------
// 写真HTML
// ------------------------------------------------------------

function makePhotoHTML(photos, speciesID) {

  const speciesPhotos = photos.filter(p =>
    String(p.SpeciesID ?? "").trim() ===
    String(speciesID ?? "").trim()
  );

  const validPhotos = speciesPhotos
    .map(p => {

      const src =
        p.写真 ||
        p.Photo ||
        p.photo ||
        p.URL ||
        p.url ||
        p.画像 ||
        p.画像URL ||
        "";

      const caption =
        p.キャプション ||
        p.Caption ||
        p.caption ||
        "";

      return {
        src: String(src).trim(),
        caption: String(caption).trim()
      };

    })
    .filter(p => hasValue(p.src));


  // 写真なし
  if (validPhotos.length === 0) {

    return `
      <p class="no-photo">
        写真はありません。
      </p>
    `;
  }


  // 写真あり
  return `
    <div class="detail-photos">

      ${validPhotos.map(photo => `

        <figure class="detail-photo">

          <img
            src="${esc(photo.src)}"
            alt="${esc(photo.caption)}"
            loading="lazy"
          >

          ${
            hasValue(photo.caption)
              ? `<figcaption>${esc(photo.caption)}</figcaption>`
              : ""
          }

        </figure>

      `).join("")}

    </div>
  `;
}


// ------------------------------------------------------------
// 同定のポイント
// ------------------------------------------------------------

function makeIdentificationHTML(value) {

  if (!hasValue(value)) {
    return "";
  }

  const points = String(value)
    .split(/[;\n]/)
    .map(point => point.trim())
    .filter(point => hasValue(point));


  if (points.length === 0) {
    return "";
  }


  return `
    <section class="detail-section">

      <h2>同定のポイント</h2>

      <ul class="identification-points">

        ${points.map(point => `
          <li>${esc(point)}</li>
        `).join("")}

      </ul>

    </section>
  `;
}


// ------------------------------------------------------------
// 種情報
// ------------------------------------------------------------

function makeSpeciesInfoHTML(s) {

  const rows = [

    ["和名", s.和名],
    ["学名", s.学名],
    ["科", s.科],
    ["属", s.属],
    ["産地", s.産地_公開],
    ["水深", s.水深],
    ["生息環境", s.生息環境],
    ["緯度", s.緯度],
    ["経度", s.経度]

  ].filter(row => hasValue(row[1]));


  if (rows.length === 0) {
    return "";
  }


  return `
    <section class="detail-section">

      <h2>種情報</h2>

      <table class="detail-table">

        <tbody>

          ${rows.map(row => `

            <tr>

              <th>${esc(row[0])}</th>

              <td>
                ${esc(row[1]).replaceAll(";", "・")}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </section>
  `;
}


// ------------------------------------------------------------
// 参考資料
// ------------------------------------------------------------

function makeReferencesHTML(value) {

  if (!hasValue(value)) {
    return "";
  }

  const references = String(value)
    .split(/[;\n]/)
    .map(ref => ref.trim())
    .filter(ref => hasValue(ref));


  if (references.length === 0) {
    return "";
  }


  return `
    <section class="detail-section">

      <h2>参考資料</h2>

      <ul class="references">

        ${references.map(ref => `
          <li>${esc(ref)}</li>
        `).join("")}

      </ul>

    </section>
  `;
}


// ------------------------------------------------------------
// 備考
// ------------------------------------------------------------

function makeNotesHTML(value) {

  if (!hasValue(value)) {
    return "";
  }

  return `
    <section class="detail-section">

      <h2>備考</h2>

      <p>
        ${esc(value).replace(/\n/g, "<br>")}
      </p>

    </section>
  `;
}


// ------------------------------------------------------------
// 種詳細ページ
// ------------------------------------------------------------

async function loadSpecies() {

  try {

    // --------------------------------------------------------
    // CSV読み込み
    // --------------------------------------------------------

    const [speciesText, photosText] = await Promise.all([

      fetch(DATA_URL).then(response => {

        if (!response.ok) {
          throw new Error(
            `species.csv の読み込みに失敗しました: ${response.status}`
          );
        }

        return response.text();
      }),

      fetch(PHOTOS_URL).then(response => {

        if (!response.ok) {
          throw new Error(
            `photos.csv の読み込みに失敗しました: ${response.status}`
          );
        }

        return response.text();
      })

    ]);


    // --------------------------------------------------------
    // CSVを配列化
    // --------------------------------------------------------

    const species = csvParse(speciesText);
    const photos = csvParse(photosText);


    // --------------------------------------------------------
    // URLから種名を取得
    // --------------------------------------------------------

    const speciesName = getSpeciesName();


    // --------------------------------------------------------
    // 対象種を検索
    // --------------------------------------------------------

    const s = species.find(row =>
      String(row.和名 ?? "").trim() ===
      String(speciesName ?? "").trim()
    );


    // --------------------------------------------------------
    // 種が見つからない場合
    // --------------------------------------------------------

    if (!s) {

      root.innerHTML = `

        <section class="detail-section">

          <h1>種が見つかりません</h1>

          <p>
            指定された種の情報がありません。
          </p>

        </section>

      `;

      return;
    }


    // --------------------------------------------------------
    // 各パーツを作成
    // --------------------------------------------------------

    const photoHTML = makePhotoHTML(
      photos,
      s.SpeciesID
    );

    const identificationHTML =
      makeIdentificationHTML(s.同定のポイント);

    const speciesInfoHTML =
      makeSpeciesInfoHTML(s);

    const referencesHTML =
      makeReferencesHTML(s.文献);

    const notesHTML =
      makeNotesHTML(s.備考);


    // --------------------------------------------------------
    // 詳細ページHTML
    // --------------------------------------------------------

    root.innerHTML = `

      <!-- ================================================
           種名ヘッダー
      ================================================= -->

      <header class="detail-header">

        ${
          hasValue(s.科)
            ? `<div class="family">${esc(s.科)}</div>`
            : ""
        }

        ${
          hasValue(s.和名)
            ? `<h1>${esc(s.和名)}</h1>`
            : ""
        }

        ${
          hasValue(s.学名)
            ? `<div class="latin">${makeScientificName(s.学名)}</div>`
            : ""
        }

        ${
          hasValue(s.属)
            ? `<div class="genus">${esc(s.属)}</div>`
            : ""
        }

      </header>


      <!-- ================================================
           同定のポイント
      ================================================= -->

      ${identificationHTML}


      <!-- ================================================
           標本写真
      ================================================= -->

      <section class="detail-section">

        <h2>標本写真</h2>

        ${photoHTML}

      </section>


      <!-- ================================================
           種情報
      ================================================= -->

      ${speciesInfoHTML}


      <!-- ================================================
           参考資料
      ================================================= -->

      ${referencesHTML}


      <!-- ================================================
           備考
      ================================================= -->

      ${notesHTML}

    `;


  } catch (error) {

    console.error(error);

    root.innerHTML = `

      <section class="detail-section">

        <h1>読み込みエラー</h1>

        <p>
          種情報を読み込めませんでした。
        </p>

        <p>
          ${esc(error.message)}
        </p>

      </section>

    `;
  }
}


// ------------------------------------------------------------
// 実行
// ------------------------------------------------------------

loadSpecies();
