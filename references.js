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

function renderReferences(data) {

  count.textContent = `${data.length} 件の文献`;

  if (data.length === 0) {
    list.innerHTML = `
      <p class="no-results">
        条件に一致する文献はありません。
      </p>
    `;
    return;
  }

  list.innerHTML = data.map(r => `

    <article class="reference-card">

      <div class="reference-meta">
        ${esc(r.author)}
        ${r.year ? ` (${esc(r.year)})` : ""}
      </div>

      <h2 class="reference-title">
        ${esc(r.title)}
      </h2>

      ${
        r.journal
          ? `
            <div class="reference-journal">
              <em>${esc(r.journal)}</em>
              ${r.volume ? ` ${esc(r.volume)}` : ""}
              ${r.issue ? `(${esc(r.issue)})` : ""}
              ${r.pages ? `: ${esc(r.pages)}` : ""}
            </div>
          `
          : ""
      }

      <div class="reference-tags">
        ${
          String(r.locality ?? "")
            .split(";")
            .map(x => x.trim())
            .filter(Boolean)
            .map(x => `
              <span class="reference-tag">
                ${esc(x)}
              </span>
            `)
            .join("")
        }
      </div>

    </article>

  `).join("");
}

function filterReferences(allReferences) {

  const keyword =
    searchInput.value.trim().toLowerCase();

  const locality =
    localitySelect.value;

  const filtered = allReferences.filter(r => {

    const searchableText = [
      r.author,
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

    const allReferences =
      csvParse(text);

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