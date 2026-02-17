#!/bin/bash

# パス設定
PROJECT_DIR="/Users/kino/Developer/note-to-kindle"
INPUT_FILE="$PROJECT_DIR/vibe_coding_master.md"
OUTPUT_FILE="/Users/kino/Desktop/vibe_coding_book.epub"
IMAGES_DIR="$PROJECT_DIR/images"
COVER_IMAGE="$IMAGES_DIR/book_cover_vibe.jpg"

echo "EPUB形式に変換中..."
echo "Input: $INPUT_FILE"
echo "Output: $OUTPUT_FILE"

# Pandocで変換
# --resource-path: 画像の検索パス
pandoc "$INPUT_FILE" \
  -o "$OUTPUT_FILE" \
  --metadata title="【完全無料】初心者向けVibe Coding入門" \
  --metadata author="Kino" \
  --metadata lang="ja" \
  --epub-cover-image="$COVER_IMAGE" \
  --resource-path="$PROJECT_DIR" \
  --toc \
  --toc-depth=3

echo "✅ EPUB変換完了"
echo "📁 ファイル: $OUTPUT_FILE"
