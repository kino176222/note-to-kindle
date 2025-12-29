# Project: Note to Kindle (Vibe Publishing)

## 概要 (Overview)
Note.comの記事（Markdown）を、Kindle出版可能な形式（EPUB/KPF用HTML）に変換するプロジェクト。
ユーザーの「コピペ地獄」を解消し、画像収集・整形を自動化する。

## ターゲット (Target)
- 「Vibe Coding」の読者
- 技術書・実用書として読みやすいレイアウト（リフロー型）を目指す

## 仕様 (Specs)
- **入力**: ObsidianのMarkdownファイル
- **処理**:
    1. **画像収集**: `assets.st-note.com` の画像を全てローカルにダウンロード。
    2. **Markdown整形**:
        - Kindle互換の形式へ変換。
        - ページの区切り（改ページ）を適切に挿入。
        - 目次（TOC）の自動生成。
    3. **出力**: Kindle Previewer / Kindle Create で読み込める HTML または EPUB。

## 現在のステップ (Current Step)
- [x] プロジェクト初期化
- [ ] 画像ダウンロードスクリプトの作成
- [ ] 変換スクリプトの作成
- [ ] プレビュー確認

## 技術スタック (Tech Stack)
- Node.js (v18+)
- Libraries (TBD): `axios` (画像DL), `marked` or `unified` (MD変換)
