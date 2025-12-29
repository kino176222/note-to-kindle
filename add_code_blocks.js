const fs = require('fs-extra');

async function addCodeBlocks() {
    console.log('コードブロックを追加中...');

    let content = await fs.readFile('/Users/kino/Desktop/vibe_coding_master.md', 'utf8');

    // 1. AI Rules全体をコードブロックで囲む
    content = content.replace(
        /# AI Rules & Guidelines \(Vibe Coding & Security Master\)([\s\S]*?)(?=\n#[^#]|\n---\n|$)/,
        '```\n# AI Rules & Guidelines (Vibe Coding & Security Master)$1```\n'
    );

    // 2. コマンド例をコードブロックで囲む（例: npm run dev）
    content = content.replace(/`([^`\n]+)`/g, (match, code) => {
        // 既にコードブロック内なら無視
        if (code.includes('\n')) return match;
        // コマンドっぽいものだけ
        if (code.match(/^(npm|node|git|cd|mkdir|ls|cp|mv|rm|brew|curl|wget|sudo)/)) {
            return `\n\`\`\`\n${code}\n\`\`\`\n`;
        }
        return match;
    });

    await fs.writeFile('/Users/kino/Desktop/vibe_coding_master.md', content, 'utf8');

    console.log('✅ コードブロック追加完了');
}

addCodeBlocks().catch(console.error);
