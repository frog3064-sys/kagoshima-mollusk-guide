const DATA_URL="data/species.csv";
const root=document.querySelector("#detail");
function csvParse(text){
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];
  if(c==='"'&&quoted&&n==='"'){cell+='"';i++}else if(c==='"')quoted=!quoted;
  else if(c===","&&!quoted){row.push(cell);cell=""}
  else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(cell);cell="";if(row.some(v=>v!==""))rows.push(row);row=[]}
  else cell+=c;
 }
 if(cell!==""||row.length){row.push(cell);rows.push(row)}
 const h=rows.shift().map(x=>x.trim());return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]??"").trim()])));
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function init(){
 const name=new URLSearchParams(location.search).get("name");
 try{
  const r=await fetch(DATA_URL);if(!r.ok)throw Error();
  const data=csvParse(await r.text());
  const s=data.find(x=>x.和名===name);
  if(!s){root.innerHTML='<section class="detail-section"><h2>種が見つかりません</h2><p>図鑑一覧から選び直してください。</p></section>';return}
  document.title=`${s.和名} | 鹿児島県産貝類図鑑`;
  const photo=s.写真?`<img class="detail-photo" src="${esc(s.写真)}" alt="${esc(s.和名)}">`:'<div class="detail-no-photo">写真準備中</div>';
  const rows=[["和名",s.和名],["学名",s.学名],["科",s.科],["属",s.属],["産地",s.産地],["水深",s.水深],["生息環境",s.生息環境],["緯度",s.緯度],["経度",s.経度],["文献",s.文献],["備考",s.備考]].filter(x=>x[1]);
  root.innerHTML=`<div class="detail-hero">${photo}<div class="detail-info"><div class="family">${esc(s.科)}</div><h1>${esc(s.和名)}</h1><div class="latin">${esc(s.学名)}</div></div></div>
  <section class="detail-section"><h2>種情報</h2><table class="detail-table">${rows.map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1]).replaceAll(";","・")}</td></tr>`).join("")}</table></section>
  <section class="detail-section"><h2>備考</h2><p>${esc(s.備考||"現在、備考はありません。")}</p></section>`;
 }catch(e){root.innerHTML='<section class="detail-section"><h2>データを読み込めませんでした</h2><p>Webサーバー上で開いているか確認してください。</p></section>'}
}
init();
