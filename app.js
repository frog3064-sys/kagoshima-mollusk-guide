const DATA_URL = "data/species.csv";
const PHOTOS_URL = "data/photos.csv";
const THUMBNAILS_URL = "data/thumbnails.csv";

const search = document.querySelector("#search");
const family = document.querySelector("#family");
const locality = document.querySelector("#locality");
const grid = document.querySelector("#speciesGrid");
const count = document.querySelector("#count");
const total = document.querySelector("#speciesTotal");

let species = [];
let photos = [];
let thumbnails = [];

function csvParse(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];

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

  const headers = rows.shift().map(x =>
    x.replace(/^\uFEFF/, "").trim()
  );

  return rows.map(r =>
    Object.fromEntries(
      headers.map((h, i) => [
        h,
        (r[i] ?? "").trim()
      ])
    )
  );
}

function vals(key) {
  return [
    ...new Set(
      species
        .map(s => s[key])
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, "ja"));
}

function fill(sel, arr) {
  arr.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    sel.appendChild(o);
  });
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

function slug(s) {
  return encodeURIComponent(s.和名);
}
/* 産地ラベルの色分け */
function getLocalityClass(locality) {
  const value = String(locality ?? "").trim();

  if (["鹿児島湾", "錦江湾"].includes(value)) {
    return "locality-sea";
  }

  if (value === "鹿児島県全域") {
    return "locality-all";
  }

  if ([
    "北薩", "南薩", "大隅", "鹿児島市",
    "薩摩半島", "大隅半島"
  ].includes(value)) {
    return "locality-mainland";
  }

  if ([
    "奄美大島", "加計呂麻島", "請島", "与路島",
    "喜界島", "徳之島", "沖永良部島", "与論島"
  ].includes(value)) {
    return "locality-amami";
  }

  if ([
    "甑島列島", "種子島", "黒島", "竹島", "宇治群島",
    "草垣群島", "馬毛島", "屋久島", "口永良部島",
    "口之島", "中之島", "平島", "諏訪之瀬島",
    "悪石島", "小宝島", "宝島"
  ].includes(value)) {
    return "locality-islands";
  }

  return "locality-other";
}


/* 産地を個別のラベルにする */
function renderLocalityTags(value) {
  const localities = [...new Set(
    String(value ?? "")
      .split(/[,，、;\n\r]+/)
      .map(locality => locality.trim())
      .filter(Boolean)
  )];

  if (localities.length === 0) {
    return "";
  }

  return `
    <div class="locality-tags">
      ${localities.map(locality => `
        <span class="locality-tag ${getLocalityClass(locality)}">
          ${esc(locality)}
        </span>
      `).join("")}
    </div>
  `;
}


/* サムネイル画像を探す */
function getThumbnail(speciesID) {
  const t = thumbnails.find(
    x => x.SpeciesID === speciesID
  );

  return t ? t.サムネイル : "";
}


function render() {

  const q = search.value.trim().toLowerCase();
  const f = family.value;
  const l = locality.value;

  /* サムネイルがある種だけ表示 */
  const filtered = species.filter(s => {

    const thumbnail = getThumbnail(s.SpeciesID);

    if (!thumbnail) return false;

    const hay = [
      s.和名,
      s.学名,
      s.科,
      s.属,
      s.産地,
      s.備考
    ].join(" ").toLowerCase();

    /* 産地欄が複数の地域に分かれていても絞り込める */
    const localities = String(s.産地 ?? "")
      .split(/[,，、;\n\r]+/)
      .map(x => x.trim())
      .filter(Boolean);

    return (
      (!q || hay.includes(q)) &&
      (!f || s.科 === f) &&
      (!l || localities.includes(l))
    );
  });

  count.textContent = `${filtered.length} 種を表示`;

  grid.innerHTML = filtered.length
    ? filtered.map(s => `

      <article class="card">

        <a class="card-link"
           href="species.html?name=${slug(s)}">

          <img
            class="card-image"
            src="${esc(getThumbnail(s.SpeciesID))}"
            alt="${esc(s.和名)}"
            loading="lazy">

          <div class="card-body">

            <h3>${esc(s.和名)}</h3>

            <p class="scientific">
              <em>${esc(s.学名)}</em>
              ${s.命名者 && s.命名者 !== "#N/A"
                ? `<span class="author">${esc(s.命名者)}</span>`
                : ""}
            </p>

            <p class="meta">
              ${esc(s.科)}科
            </p>

            ${
              s.生息環境
                ? `
                  <span class="badge">
                    ${esc(s.生息環境)}
                  </span>
                `
                : ""
            }

            ${renderLocalityTags(s.産地)}

          </div>

        </a>

      </article>

    `).join("")

    : `<div class="empty">該当する種がありません。</div>`;
}
async function init() {

  try {

    const [
      speciesResponse,
      photosResponse,
      thumbnailsResponse
    ] = await Promise.all([
      fetch(DATA_URL),
      fetch(PHOTOS_URL),
      fetch(THUMBNAILS_URL)
    ]);

    if (!speciesResponse.ok) throw Error();
    if (!photosResponse.ok) throw Error();
    if (!thumbnailsResponse.ok) throw Error();

    species = csvParse(
      await speciesResponse.text()
    );

    photos = csvParse(
      await photosResponse.text()
    );

    thumbnails = csvParse(
      await thumbnailsResponse.text()
    );

    /* サムネイルがある種だけを掲載種数としてカウント */
    const speciesWithThumbnail = species.filter(
      s => getThumbnail(s.SpeciesID)
    );

    total.textContent = speciesWithThumbnail.length;

    fill(family, vals("科"));

    /* 地域名を個別に抽出して、重複しない選択肢を作る */
    const allLocalities = [
      ...new Set(
        species.flatMap(s =>
          String(s.産地 ?? "")
            .split(/[,，、;\n\r]+/)
            .map(x => x.trim())
            .filter(Boolean)
        )
      )
    ].sort((a, b) => a.localeCompare(b, "ja"));

    fill(locality, allLocalities);

    [search, family, locality].forEach(
      x => x.addEventListener("input", render)
    );

    render();

  } catch (e) {

    console.error(e);

    grid.innerHTML =
      '<div class="empty">データを読み込めませんでした。GitHub PagesなどのWebサーバー上で開いてください。</div>';
  }
}

init();