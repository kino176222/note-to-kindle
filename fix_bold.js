
const fs = require('fs-extra');

const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function fixBoldAndArtifacts() {
    console.log('Fixing bold issues and artifacts...');
    let content = await fs.readFile(masterPath, 'utf8');

    // 1. Note形式リンクのクリーニング
    // [ **Title** *Desc* ...](url) のような形式を [Title](url) に単純化
    // Regex: [ **Title** *Desc* ...](url)
    // まず `**` や `*` をリンクテキスト内から削除
    content = content.replace(/\[\s*\*\*(.*?)\*\*\s*\*.*?\*\s*\]\((.*?)\)/g, '[$1]($2)'); // [ **Title** *...* ](url) -> [Title](url)
    content = content.replace(/\[\s*\*\*(.*?)\*\*\s*\]\((.*?)\)/g, '[$1]($2)'); // [ **Title** ](url) -> [Title](url)

    // 2. 箇条書きの統一 (* -> -)
    // 行頭の `* ` を `- ` に変換
    content = content.replace(/^\s*\*\s+/gm, '- ');

    // 3. 太字マーク周辺のスペース削除 (Bold Repair)
    // "文字 **" -> "文字**"
    content = content.replace(/([^\s])\s+\*\*/g, '$1**');
    // "** 文字" -> "**文字"
    content = content.replace(/\*\*\s+([^\s])/g, '**$1');
    // "文字 ** 文字" (孤立) -> "文字 文字" (ゴミ削除)
    // ただし、上記でスペース詰めているので、 "**" だけ残ることがあるか？
    // Regex: `\*\*` の中身が空、またはスペースのみの場合
    content = content.replace(/\*\*\s*\*\*/g, ''); // **** -> empty

    // 4. 残ったシングルアスタリスクの処理
    // 文中の `*` は、Markdownの斜体として機能していなければゴミ。
    // 日本語文中で斜体を使うことは少ないので、削除するか太字にするか。
    // User said "太字もどきの*も全部ない状態にしたい".
    // 文脈によるが、キャプション内の `*Text*` は上記リンク処理で消えているはず。
    // まだ残っている `*` を探して削除。
    // ただし `*` が箇条書き（行頭）でない場合。
    content = content.replace(/([^\n])\*/g, '$1'); // 行頭以外の `*` を削除

    // 5. 特定パターンの修正 (Log発見分)
    // "omikuji-app-theta.vercel.app*]" -> "*]" が残っている可能性
    content = content.replace(/\*\]/g, ']');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Fixed bold artifacts in:', masterPath);
}

fixBoldAndArtifacts().catch(console.error);
