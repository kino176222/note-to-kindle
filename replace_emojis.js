const fs = require('fs-extra');

async function replaceEmojisWithText() {
    console.log('絵文字をテキストに置き換え中...');

    // Read master markdown
    let content = await fs.readFile('/Users/kino/Desktop/vibe_coding_master.md', 'utf8');

    // Replace checkbox emojis with text
    content = content.replace(/🔲/g, '[ ]');
    content = content.replace(/✅/g, '[✓]');
    content = content.replace(/☐/g, '[ ]');
    content = content.replace(/⬜/g, '[ ]');
    content = content.replace(/🔳/g, '[ ]');

    // Replace other common emojis
    content = content.replace(/👉/g, '→');
    content = content.replace(/⚠️/g, '【注意】');
    content = content.replace(/💡/g, '【ヒント】');
    content = content.replace(/🎯/g, '【ポイント】');

    // Save updated markdown
    await fs.writeFile('/Users/kino/Desktop/vibe_coding_master.md', content, 'utf8');

    console.log('✅ 絵文字の置き換え完了');
    console.log('次のステップ: HTMLを再生成してください');
}

replaceEmojisWithText().catch(console.error);
