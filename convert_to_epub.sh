#!/bin/bash

echo "EPUB形式に変換中..."

# EPUBディレクトリを作成
mkdir -p /Users/kino/Desktop/epub_output

# Pandocで変換
pandoc /Users/kino/Desktop/vibe_coding_master.md \
  -o /Users/kino/Desktop/epub_output/vibe_coding.epub \
  --metadata title="【完全無料】初心者向けVibe Coding入門：AIと対話してアプリを作る→Gitで保存→世界に公開" \
  --metadata author="Kino" \
  --metadata lang="ja" \
  --epub-cover-image=/Users/kino/Desktop/kindle_upload/images/book_cover_vibe.jpg \
  --resource-path=/Users/kino/Developer/note-to-kindle/images:/Users/kino/Desktop/kindle_upload/images \
  --toc \
  --toc-depth=3

echo "✅ EPUB変換完了"
echo "📁 ファイル: /Users/kino/Desktop/epub_output/vibe_coding.epub"
