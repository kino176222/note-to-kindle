
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function fixOrphanedBold() {
    console.log('Fixing orphaned bold markers...');
    let content = await fs.readFile(masterPath, 'utf8');

    // 1. 孤立した "**" 行のみを削除 (Garbage lines)
    // 行頭から行末まで "**" しかない行 (スペース許容)
    content = content.replace(/^\s*\*\*\s*$/gm, '');

    // 2. 行頭の "**" で始まっているが、閉じていない行を修正
    // 例: "**太字にしたい文" -> "**太字にしたい文**"
    // Regex: Start of line, spaces, **, text not containing **, end of line
    // Use HTML <strong> tagging to be safe and robust
    content = content.replace(/^(\s*)\*\*(?!\s)(.*?[^*])\s*$/gm, '$1<strong>$2</strong>');

    // スペースが入っているパターンも救済: "** 太字" -> <strong>太字</strong>
    content = content.replace(/^(\s*)\*\*\s+(.*?[^*])\s*$/gm, '$1<strong>$2</strong>');

    // 3. 多段太字の最終防壁
    // それでも残っている `**` ... `**` を強制HTML化
    // (改行を含んでいてもOK)
    content = content.replace(/\*\*(?!\s)([\s\S]*?)(?<!\s)\*\*/g, '<strong>$1</strong>');

    // 4. まだ残っている `**` (閉じ相手がいない等) は削除
    // content = content.replace(/\*\*/g, ''); 
    // ※ ユーザーの意図が「強調」なら消すのは惜しいが、ゴミとして表示されるよりマシ。
    content = content.replace(/\*\*/g, '');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Fixed orphaned bold lines.');
}

fixOrphanedBold().catch(console.error);
