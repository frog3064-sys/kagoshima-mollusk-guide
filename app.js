const DATA_URL="data/species.csv";
const PHOTOS_URL="data/photos.csv";
const THUMBNAILS_URL="data/thumbnails.csv";

const search=document.querySelector("#search");
const family=document.querySelector("#family");
const locality=document.querySelector("#locality");
const grid=document.querySelector("#speciesGrid");
const count=document.querySelector("#count");
const total=document.querySelector("#speciesTotal");

let species=[];
let photos=[];
let thumbnails=[];

function csvParse(text){
  const rows=[];
  let row=[],cell="",quoted=false;

  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];

    if(c==='"'&&quoted&&n==='"'){
      cell+='"';
      i++;
    }else if(c==='"'){
      quoted=!quoted;
    }else if(c===","&&!quoted){
      row.push(cell);
      cell="";
    }else if((c==="\n"||c==="\r")&&!quoted){
      if(c==="\r"&&n==="\n")i++;
      row.push(cell);
      cell="";
      if(row.some(v=>v!==""))rows.push(row);
      row=[];
    }else{
      cell+=c;
    }
  }

  if(cell!==""||row.length){
    row.push(cell);
    rows.push(row);
  }

  const headers=rows.shift().map(x=>x.trim());

  return rows.map(r=>
    Object.fromEntries(
      headers.map((h,i)=>[h,(r[i]??"").trim()])
    )
  );
}

function vals(key){
  return [...new Set(
    species.map(s=>s[key]).filter(Boolean)
  )].sort((a,b)=>a.localeCompare(b,"ja"));
}

function fill(sel,arr){
  arr.forEach(v=>{
    const o=document.createElement("option");
    o.value=v;
    o.textContent=v;
    sel.appendChild(o);
  });
}

function esc(v){
  return String(v??"").replace(
    /[&<>"']/g,
    c=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c])
  );
}

function slug(s){
  return encodeURIComponent(s.和名);
}

/* サムネイル画像を探す */
function getThumbnail(speciesID){
  const t=thumbnails.find(
    x=>x.SpeciesID===speciesID
  );

  return t ? t.サムネイル : "";
}

function render(){

  const q=search.value.trim().toLowerCase();
  const f=family.value;
  const l=locality.value;

  const filtered=species.filter(s=>{

    const hay=[
      s.和名,
      s.学名,
      s.科,
      s.属,
      s.産地,
      s.備考
    ].join(" ").toLowerCase();

    return (
      (!q||hay.includes(q)) &&
      (!f||s.科===f) &&
      (!l||s.産地.includes(l))
    );
  });

  count.textContent=`${filtered.length} 種を表示`;

  grid.innerHTML=filtered.length
    ? filtered.map(s=>`

      <article class="card">

        <a class="card-link"
           href="species.html?name=${slug(s)}">

          ${
            getThumbnail(s.SpeciesID)
            ? `
              <img
                class="card-image"
                src="${esc(getThumbnail(s.SpeciesID))}"
                alt="${esc(s.和名)}"
                loading="lazy">
            `
            : `
              <div class="no-image">
                写真準備中
              </div>
            `
          }

          <div class="card-body">

            <h3>${esc(s.和名)}</h3>

            <p class="scientific">
  <em>${esc(s.学名)}</em>
  ${s.命名者 ? `<span class="author">${esc(s.命名者)}</span>` : ""}
</p>

            <p class="meta">
              <strong>科：</strong>${esc(s.科)}
            </p>
            <span class="badge">
              ${esc(s.生息環境||"情報準備中")}
            </span>

          </div>

        </a>

      </article>

    `).join("")
    : `<div class="empty">該当する種がありません。</div>`;
}

async function init(){

  try{

    const [
      speciesResponse,
      photosResponse,
      thumbnailsResponse
    ]=await Promise.all([

      fetch(DATA_URL),
      fetch(PHOTOS_URL),
      fetch(THUMBNAILS_URL)

    ]);

    if(!speciesResponse.ok)throw Error();
    if(!photosResponse.ok)throw Error();
    if(!thumbnailsResponse.ok)throw Error();

    species=csvParse(
      await speciesResponse.text()
    );

    photos=csvParse(
      await photosResponse.text()
    );

    thumbnails=csvParse(
      await thumbnailsResponse.text()
    );

    total.textContent=species.length;

    fill(family,vals("科"));
    fill(locality,vals("産地"));

    [search,family,locality].forEach(
      x=>x.addEventListener("input",render)
    );

    render();

  }catch(e){

    console.error(e);

    grid.innerHTML=
      '<div class="empty">データを読み込めませんでした。GitHub PagesなどのWebサーバー上で開いてください。</div>';
  }
}

init();
