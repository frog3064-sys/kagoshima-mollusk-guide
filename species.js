// ============================================================
// 貝図鑑：種詳細ページ
// ============================================================


// ------------------------------------------------------------
// CSV読み込み
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
    .filter(r => r.some(v => v !== ""))
    .map(r => {

      const obj = {};

      headers.forEach((h, i) => {
        obj[h] = (r[i] ?? "").trim();
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
// URLからSpeciesIDを取得
// ------------------------------------------------------------

function getSpeciesID() {

  const params = new URLSearchParams(location.search);

  return params.get("id");
}


// ------------------------------------------------------------
// 写真HTML
// ------------------------------------------------------------

function makePhotoHTML(photos, speciesID) {

  const speciesPhotos = photos.filter(p =>
    String(p.SpeciesID).trim() === String(speciesID).trim()
  );

  if (speciesPhotos.length === 0) {

    return `
      <p class="no-photo">
        写真はありません。
      </p>
    `;
  }

  return `
    <div class="detail-photos">

      ${speciesPhotos.map(p => {

        const src =
          p.写真 ||
          p.Photo ||
          p.photo ||
          p.URL ||
          p.url ||
          p.画像 ||
          p.画像URL ||
          "";

        if (!src) return "";

        const caption =
          p.キャプション ||
          p.Caption ||
          p.caption ||
          "";

        return `
          <figure class="detail-photo">

            <img
              src="${esc(src)}"
              alt="${esc(caption)}"
              loading="lazy"
            >

            ${
              caption
                ? `<figcaption>${esc(caption)}</figcaption>`
                : ""
            }

          </figure>
        `;

      }).join("")}

    </div>
  `;
}


// ------------------------------------------------------------
// 詳細ページ表示
// ------------------------------------------------------------

async function loadSpecies() {

  try {

    // CSV読み込み
    const [speciesText, photosText] = await Promise.all([

      fetch(DATA_URL).then(r => {
        if (!r.ok) {
          throw new Error(`species.csv の読み込みに失敗しました: ${r.status}`);
        }
        return r.text();
      }),

      fetch(PHOTOS_URL).then(r => {
        if (!r.ok) {
          throw new Error(`photos.csv の読み込みに失敗しました: ${r.status}`);
        }
        return r.text();
      })

    ]);


    // CSVを配列化
    const species = csvParse(speciesText);
    const photos = csvParse(photosText);


    // URLのID
    const speciesID = getSpeciesID();


    // --------------------------------------------------------
    // 対象種を検索
    // --------------------------------------------------------

    const s = species.find(row =>
      String(row.SpeciesID).trim() === String(speciesID).trim()
    );


    // --------------------------------------------------------
    // 種が見つからない場合
    // --------------------------------------------------------

    if (!s) {

      root.innerHTML = `
        <section class="detail-section">

          <h1>種が見つかりません</h1>

          <p>
            指定されたSpeciesIDの種情報がありません。
          </p>

        </section>
      `;

      return;
    }


    // --------------------------------------------------------
    // 写真
    // --------------------------------------------------------

    const photoHTML = makePhotoHTML(
      photos,
      s.SpeciesID
    );


    // --------------------------------------------------------
    // 種情報
    // --------------------------------------------------------

    const rows = [

      ["和名", s.和名],

      ["学名", s.学名],

      ["科", s.科],

      ["属", s.属],

      ["産地", s.産地_公開],

      ["水深", s.水深],

      ["生息環境", s.生息環境],

      ["緯度", s.緯度],

      ["経度", s.経度],

      ["文献", s.文献]

    ].filter(x => x[1]);


    // --------------------------------------------------------
    // 同定のポイント
    // --------------------------------------------------------

    const identificationHTML = s.同定のポイント

      ? `

        <section class="detail-section">

          <h2>同定のポイント</h2>

          <ul class="identification-points">

            ${String(s.同定のポイント)

              .split(/[;\n]/)

              .map(point => point.trim())

              .filter(point => point)

              .map(point => `
                <li>${esc(point)}</li>
              `)

              .join("")
            }

          </ul>

        </section>

      `

      : "";


    // --------------------------------------------------------
    // 備考
    // --------------------------------------------------------

    const notesHTML = s.備考

      ? `

        <section class="detail-section">

          <h2>備考</h2>

          <p>
            ${esc(s.備考)}
          </p>

        </section>

      `

      : "";


    // --------------------------------------------------------
    // HTML
    // --------------------------------------------------------

    root.innerHTML = `

      <div class="detail-hero">

        <div class="detail-info">

          <div class="family">
            ${esc(s.科)}
          </div>

          <h1>
            ${esc(s.和名)}
          </h1>

          <div class="latin">
            ${esc(s.学名)}
          </div>

        </div>

      </div>


      ${identificationHTML}


      <section class="detail-section">

        <h2>標本写真</h2>

        ${photoHTML}

      </section>


      <section class="detail-section">

        <h2>種情報</h2>

        <table class="detail-table">

          ${rows.map(r => `

            <tr>

              <th>
                ${esc(r[0])}
              </th>

              <td>
                ${esc(r[1]).replaceAll(";", "・")}
              </td>

            </tr>

          `).join("")}

        </table>

      </section>


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
