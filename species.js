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

  ["文献", s.文献]

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


  ${
  s.同定のポイント
    ? `
      <section class="detail-section">

        <h2>同定のポイント</h2>

        <ul class="identification-points">

          ${s.同定のポイント
            .split(";")
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
    : ""
}


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


  ${
    s.備考
      ? `
        <section class="detail-section">

          <h2>備考</h2>

          <p>
            ${esc(s.備考)}
          </p>

        </section>
      `
      : ""
  }

`;
