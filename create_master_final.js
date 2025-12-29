
const fs = require('fs-extra');
const path = require('path');

// Source
const notePath = '/Users/kino/Library/Mobile Documents/iCloud~md~obsidian/Documents/Mynote/10_Inbox/WebClip/【完全無料】初心者向けVibe Coding入門：AIと対話してアプリを作る→Gitで保存→世界に公開｜Kino.md';
// Output: Master Manuscript
const outputPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function createQualityMaster() {
    console.log('Reading source note...');
    let content = await fs.readFile(notePath, 'utf8');

    // ---------------------------------------------------------
    // 1. Minimum Cleaning (No structure changes)
    // ---------------------------------------------------------

    // Frontmatter削除
    content = content.replace(/^---[\s\S]*?---\n*/, '');

    // 広告バナー削除
    // 文頭・文末のNote画像リンク (Image link starting with !)
    content = content.replace(/^!\[.*?(banner|campaign|point).*?\]\(.*?\)\n*/gmi, '');
    content = content.replace(/!\[.*?\]\(https:\/\/assets\.st-note\.com\/.*?campaign.*?\)/g, '');

    // 目次用placeholder削除
    content = content.replace(/\[(toc|目次)\]/gi, '');

    // ---------------------------------------------------------
    // 2. Text Normalization
    // ---------------------------------------------------------

    // Note -> 本書 (ただしURL等は除外)
    // 簡易的な置換だが、日本語文中の Note に限定する
    content = content.replace(/このNote/g, '本書');
    content = content.replace(/Note記事/g, '本書');
    // 単独の "Note" も "本書" にしたいがリスクあり。今回は安全重視で上記のみ。
    // User requested "Noteという表現を本書にしてほしい".
    // Try careful replace: "Noteでは" -> "本書では"
    content = content.replace(/Noteでは/g, '本書では');
    content = content.replace(/Noteの/g, '本書の');

    // リストの標準化 (・ -> -)
    content = content.replace(/^・/gm, '-');
    // リスト前の改行確保
    content = content.replace(/([^\n])\n(- |・|✅|🔲)/g, '$1\n\n$2');

    // 太字のスペース標準化 (Markdownとして認識されるように)
    // Space around bold syntax
    content = content.replace(/([^\s\n「（])\*\*(.+?)\*\*/g, '$1 **$2**');
    content = content.replace(/\*\*(.+?)\*\*([^\s\n」）])/g, '**$1** $2');

    // ---------------------------------------------------------
    // 3. Structure Preservation
    // ---------------------------------------------------------
    // ユーザー要望: オリジナルの構成（0章など）を維持する。
    // なので、見出し（## 0章...）は**いじらない**。

    // ただし、区切り線は削除
    content = content.replace(/^\s*[-*_]{3,}\s*$/gm, '');

    // ---------------------------------------------------------
    // 4. Save
    // ---------------------------------------------------------
    // Optimize newlines
    content = content.replace(/\n{3,}/g, '\n\n');

    await fs.writeFile(outputPath, content, 'utf8');
    console.log('Quality Master created at:', outputPath);
}

createQualityMaster().catch(console.error);
