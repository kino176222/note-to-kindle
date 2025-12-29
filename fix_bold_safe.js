
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function safeFixBold() {
    console.log('Safely fixing bold issues...');
    let content = await fs.readFile(masterPath, 'utf8');

    // 1. スペース補正（太字を有効化）
    // "** 文字" -> "**文字"
    content = content.replace(/\*\*[ \t]+(?=\S)/g, '**');
    // "文字 **" -> "文字**"
    content = content.replace(/(?<=\S)[ \t]+\*\*/g, '**');

    // 2. リンク記述内のゴミ掃除
    // [ **Title** *Desc* ] -> [Title]
    content = content.replace(/\[\s*\*\*(.*?)\*\*\s*\*.*?\*\s*\]\((.*?)\)/g, '[$1]($2)');
    content = content.replace(/\[\s*\*\*(.*?)\*\*\s*\]\((.*?)\)/g, '[$1]($2)');

    // 3. シングルアスタリスクの処理（慎重に）
    // 行頭の箇条書き `* ` は `- ` に。
    content = content.replace(/^\s*\*\s+/gm, '- ');

    // 文中の「孤立したアスタリスク」のみを削除
    // ** （太字）は触らない。
    // 方法: "*" を探すが、その前後が "*" でない場合のみマッチさせるのはRegexだと難しい（JSのLookbehindは環境依存）。
    // 代わりに、「**」を一時的に別の安全な文字列（例：`__BOLD__`）に退避させ、残った `*` を削除し、戻す。

    const BOLD_PLACEHOLDER = '___BOLD_MARKER___';

    // 退避: ** -> ___BOLD_MARKER___
    content = content.replace(/\*\*/g, BOLD_PLACEHOLDER);

    // 削除: 残っている * を削除（箇条書き以外の全ての *）
    // キャプション記述などで *Text* となっているイタリックも、Note由来なら不要なケースが多い。
    // ユーザー要望「変なアスタリスクも全部ない状態」→ 削除。
    content = content.replace(/\*/g, '');

    // 復帰: ___BOLD_MARKER___ -> **
    content = content.replace(new RegExp(BOLD_PLACEHOLDER, 'g'), '**');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Safely fixed bold artifacts.');
}

safeFixBold().catch(console.error);
