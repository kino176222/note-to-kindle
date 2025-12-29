const fs = require('fs-extra');

async function fixMarkdownIssues() {
    console.log('Markdownの修正を開始します...');

    // ターゲットファイル
    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. エラー表示 (ピンクの箱) の原因除去
    // <strong> と <p> の不整合を直すため、HTMLタグを Markdown記法に置換
    // 例: <strong>TEXT</strong> -> **TEXT**
    content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    // 不要なHTMLタグを削除
    content = content.replace(/<\/?p[^>]*>/g, '');

    // 2. 目次の重複・変な表示の修正
    // 先頭のタイトル（H1）はKindleのメタデータで設定するので、Markdownからは削除して重複を防ぐ
    // # 【完全無料】... を削除
    content = content.replace(/^# 【完全無料】初心者向けVibe Coding入門\n/, '');

    // H2が目次のトップレベルになる

    // 3. チェックリストの修正
    // [✓] を箇条書きリストに変換
    // [✓] AIに日本語で頼みながらアプリを作る -> - AIに日本語で頼みながらアプリを作る
    content = content.replace(/^\[✓\] /gm, '- ');

    // 4. "▼" の処理 (User request)
    // 矢印単体で置かれている場合、意味のある区切り線などにするか、削除するか。
    // 文脈: "▼ 迷ったら..." -> そのまま残すが、行頭の単独 "▼" は目立ちすぎるかも。
    // ここでは特に何もしないが、ユーザー意図が削除なら後で対応。一旦そのまま。

    // 保存
    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ Markdown修正完了');
}

fixMarkdownIssues().catch(console.error);
