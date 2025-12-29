const fs = require('fs-extra');

async function improveFormatting() {
    console.log('フォーマットを改善中...');

    let content = await fs.readFile('/Users/kino/Desktop/vibe_coding_master.md', 'utf8');

    // 1. AI Rules の画像を削除（行486付近）
    // 画像パターンを探して削除
    content = content.replace(/!\[\]\(images\/antigravity_usage_note\.png\)/g, '');

    // 2. コードブロックを追加（プロンプト例）
    // 「スクショして」の前後をコードブロックに
    content = content.replace(
        /「これどういう意味\？」「次は何ボタンを押せばいい\？」と聞けば、\nAIが完璧な翻訳ガイドになってくれます。/g,
        '「これどういう意味？」「次は何ボタンを押せばいい？」と聞けば、\nAIが完璧な翻訳ガイドになってくれます。\n\n```\nスクショを添付して「これどういう意味？」と質問\n```'
    );

    // 3. TIP/鉄則をコードブロックに
    content = content.replace(
        /【TIP\/ 鉄則】\n「英語とエラーは、スクショで解決」/g,
        '```\n【TIP/ 鉄則】\n「英語とエラーは、スクショで解決」\n```'
    );

    await fs.writeFile('/Users/kino/Desktop/vibe_coding_master.md', content, 'utf8');

    console.log('✅ フォーマット改善完了');
}

improveFormatting().catch(console.error);
