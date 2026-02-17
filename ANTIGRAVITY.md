# Project: Note to Kindle (Vibe Publishing)

## 概要 (Overview)
Note.comの記事（Markdown）を、Kindle出版可能な形式（EPUB/KPF用HTML）に変換し、出版までをサポートするプロジェクト。
ユーザーの「コピペ地獄」を解消し、画像収集・整形・目次生成を自動化する。

## プロジェクト憲法 (Constitution)
- **ゴール**: Kindleでの出版完了（現在は「完全無料初心者向けVibe Coding入門」の審査待ち中）
- **MVP定義**: Kindle Previewerでエラーが出ず、目次が機能し、画像が表示される状態。
- **最新マスター**: `/Users/kino/Developer/note-to-kindle/published_builds/vibe_coding_v1.0_master.epub`
  - **重要**: 元場所（`~/Library/.../Kindle`）のファイルは安全のため「バックアップ」として残すが、今後は編集しない。
  - 次回以降の修正は、全てこのDeveloper配下のファイルを基準（正）として行う。

## 技術スタック & 資産 (Assets & Tech)
- **フォーマット**: EPUB (Pandoc generation) / HTML (Kindle Previewer conversion)
- **最新スタイル (Style Asset)**:
  - 以下のCSSスタイルを維持・適用すること。
  ```css
  /* 見出し H2: 青の左バー付き */
  h2 {
      background-color: #f4f8fb;
      border-left: 6px solid #2b7bb9;
      padding: 10px 15px;
  }
  /* 見出し H3: 青の下線 */
  h3 {
      border-bottom: 2px solid #2b7bb9;
      padding-bottom: 5px;
  }
  /* インライン目次: 階層化 */
  .inline-toc ul.toc-section { padding-left: 1.5em; } /* H3は字下げ */
  .inline-toc li.toc-item > a { padding: 5px 5px; } /* 間延び防止 */
  ```

## 現在のステップ (Current Step)
- [x] プロジェクト初期化
- [x] 画像収集・Markdown一括変換処理の実装
- [x] 目次の階層化・デザイン調整
- [x] MVP版 EPUB生成
- [ ] Kindle審査完了待ち（現在審査中）
- [ ] 審査通過後、最終版EPUB (`vibe_coding_book.epub` or `完全無料...17.epub`) のアップロード
- [ ] (Future) 次回作へのプロセス流用

## 運用ルール (Rules)
1. **修正は必ずマスターに反映**: 部分的な修正ではなく、Markdownソース(`vibe_coding_master.md`)を修正し、そこからEPUBを再生成するフローを守る。
2. **目次の階層化**: H2（章）とH3（節）の親子関係を明確にし、H3は字下げして表示する。
3. **画像の絶対パス**: 変換時はローカルの絶対パスを使用するが、Pandocオプション等で適切に埋め込むこと。
