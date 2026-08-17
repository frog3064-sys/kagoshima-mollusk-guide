const DATA_URL = "data/species.csv";
const PHOTOS_URL = "data/photos.csv";
const root = document.querySelector("#detail");

function csvParse(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];

    if (c === '"' && quoted && n === '"') {
      cell += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && n === "\n") i++;

      row.push(cell);
      cell = "";

      if (row.some(v => v !== "")) {
        rows.push(row);
      }

      row = [];
    } else {
      cell += c;
    }
  }

  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const h = rows.shift().map(x => x.trim());

  return rows.map(r =>
    Object.fromEntries(
      h.map((k, i) => [k, (r[i] ?? "").trim()])
    )
  );
}

function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );
}

async function init() {

  const name = new URLSearchParams(location.search).get("name");

  try {

    // species.csv と photos.csv を同時に読み込む
    const [speciesResponse, photosResponse] = await Promise.all([
      fetch(DATA_URL),
      fetch(PHOTOS_URL)
    ]);

    if (!speciesResponse.ok) {
      throw Error("species.csvを読み込めません");
    }

    if (!photosResponse.ok) {
      throw Error("photos.csvを読み込めません");
    }

    const speciesData = csvParse(await speciesResponse.text());
    const photoData = csvParse(await photosResponse.text());

    // 和名から種を探す
    const s = speciesData.find(x => x.和名 === name);

    if (!s) {

      root.innerHTML = `
        <section class="detail-section">
          <h2>種が見つかりません</h2>
          <p>図鑑一覧から選び直してください。</p>
        </section>
      `;

      return;
    }

    document.title =
      `${s.和名} | 鹿児島県産貝類図鑑`;

    // SpeciesIDが一致する写真だけ取得
    const speciesPhotos =
      photoData.filter(x => x.SpeciesID === s.SpeciesID);

    // -------------------------
    // 写真表示
    // -------------------------

    let photoHTML = "";

    if (speciesPhotos.length > 0) {

      // 産地ごとにグループ化
      const locations = {};

      speciesPhotos.forEach(photo => {

        const location =
          photo.産地 || "産地情報なし";

        if (!locations[location]) {
          locations[location] = [];
        }

        locations[location].push(photo);

      });

      photoHTML = Object.entries(locations)
        .map(([location, photos]) => {

          return `
            <div class="photo-location">

              <h3 class="photo-location-title">
                ${esc(location)}
              </h3>

              <div class="photo-gallery">

                ${photos.map((photo, i) => `
                  
                  <div class="photo-item">

                    <a
                      href="${esc(photo.写真)}"
                      target="_blank"
                    >
                      <img
                        src="${esc(photo.写真)}"
                        alt="${esc(s.和名)} ${esc(photo.備考 || "")}"
                        class="gallery-photo"
                      >
                    </a>

                    ${
                      photo.備考
                        ? `<div class="photo-caption">
                             ${esc(photo.備考)}
                           </div>`
                        : ""
                    }

                  </div>

                `).join("")}

              </div>

            </div>
          `;

        })
        .join("");

    } else {

      photoHTML = `
        <div class="detail-no-photo">
          写真準備中
        </div>
      `;

    }

    // -------------------------
    // 種情報
    // -------------------------

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

      ["文献", s.文献],

      ["備考", s.備考]

    ].filter(x => x[1]);

    // -------------------------
    // HTML
    // -------------------------

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


      <section class="detail-section">

        <h2>備考</h2>

        <p>
          ${esc(
            s.備考 ||
            "現在、備考はありません。"
          )}
        </p>

      </section>

    `;

  } catch (e) {

    console.error(e);

    root.innerHTML = `

      <section class="detail-section">

        <h2>
          データを読み込めませんでした
        </h2>

        <p>
          Webサーバー上で開いているか確認してください。
        </p>

      </section>

    `;

  }

}

init();
