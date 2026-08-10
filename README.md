# 鹿児島県産貝類図鑑 v2

写真・分類・検索・詳細ページを備えた静的Web図鑑テンプレートです。

## 使い方

`data/species.csv` に種を追加してください。

列：
和名 / 学名 / 科 / 属 / 産地 / 緯度 / 経度 / 水深 / 生息環境 / 写真 / 文献 / 備考

写真は `images` フォルダに置き、CSVの「写真」に相対パスを入れます。
例：`images/scutus_sinensis.jpg`

## 公開

GitHubでPublic repositoryを作り、ファイルをアップロード。
Settings → Pages → Deploy from a branch → main → /(root) → Save。

数分後に表示されるURLが公開サイトです。

## 重要

写真・文献・標本情報の公開権限を確認してください。
非公開の正確な採集地点など、公開すべきでない情報はCSVに入れないでください。
