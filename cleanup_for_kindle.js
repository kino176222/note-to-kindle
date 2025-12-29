const fs = require('fs-extra');

async function cleanupForKindle() {
    console.log('Kindle用にクリーンアップ中...');

    // Read master markdown
    let content = await fs.readFile('/Users/kino/Desktop/vibe_coding_master.md', 'utf8');

    // 1. Remove alt text from images (remove "画像" label)
    content = content.replace(/!\[画像\]/g, '![]');
    content = content.replace(/!\[.*?\]/g, '![]');

    // 2. Replace checkbox markers with bullet points
    content = content.replace(/^\s*\[ \]\s*/gm, '- ');
    content = content.replace(/^\s*\[✓\]\s*/gm, '- ');
    content = content.replace(/^\s*\[x\]\s*/gm, '- ');
    content = content.replace(/^\s*\[X\]\s*/gm, '- ');

    // Save updated markdown
    await fs.writeFile('/Users/kino/Desktop/vibe_coding_master.md', content, 'utf8');

    console.log('✅ クリーンアップ完了');
    console.log('  - 画像のaltテキストを削除');
    console.log('  - チェックボックスを箇条書きに変換');
}

cleanupForKindle().catch(console.error);
