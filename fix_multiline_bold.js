
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function fixMultilineBold() {
    console.log('Fixing multiline bold issues...');
    let content = await fs.readFile(masterPath, 'utf8');

    // 1. コードブロックを保護 (Protect Code Blocks)
    const blocks = [];
    content = content.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
        blocks.push(match);
        return `___CODE_BLOCK_${blocks.length - 1}___`;
    });

    // 2. 太字マーク周りの改行を除去 (Normalize Newlines around Bold)
    // Case: "**\nText" -> "**Text"
    content = content.replace(/\*\*\s*\n+\s*/g, '**');
    // Case: "Text\n**" -> "Text**"
    content = content.replace(/\s*\n+\s*\*\*/g, '**');

    // 3. 多段太字をHTMLタグ化 (Convert Multiline Bold to HTML)
    // Note: [\s\S]*? matches across lines.
    // We assume pairs are correct now.
    content = content.replace(/\*\*(?!\s)([\s\S]*?)(?<!\s)\*\*/g, '<strong>$1</strong>');

    // **Text** where Text has spaces at ends?
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 4. 残存する孤立 ** を削除 (ゴミ掃除)
    // もしペアになっていない ** があれば、それはゴミとして消す
    // (Bold tagにならなかった **)
    content = content.replace(/\*\*/g, '');

    // 5. コードブロック復帰 (Restore Code Blocks)
    content = content.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => {
        return blocks[parseInt(index)];
    });

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Fixed multiline bold and cleaned artifacts.');
}

fixMultilineBold().catch(console.error);
