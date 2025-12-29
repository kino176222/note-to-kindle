
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function refineInstallSearchTip() {
    console.log('Adding search tip to install section...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Target the text we just added
    // "もし分からないことがあっても大丈夫です。\nその画面を**スクショしてAIに貼り...AIが親切に教えてくれますし、それが一番の「Vibe Codingの練習」になります！"
    // I need to match this block. 
    // Since whitespace/newlines exact matching can be tricky, I'll match the last sentence.

    const targetPart = "それが一番の「Vibe Codingの練習」になります！";

    const addedText = `\n\nまた、どうしても詳しい手順図が見たい場合は、Noteなどで**「Antigravity インストール」**と検索してみてください。有志の方が書いた非常に分かりやすい解説記事が見つかるはずです。`;

    if (content.includes(targetPart)) {
        // Append the tip after the target part
        // Note: Check if I already added it to avoid dupes? (Unlikely unless re-run)

        // I will replace "Target" with "Target + AddedText"
        content = content.replace(targetPart, targetPart + addedText);

        await fs.writeFile(masterPath, content, 'utf8');
        console.log('Search tip added.');
    } else {
        console.error('Target text for refinement not found.');
    }
}

refineInstallSearchTip().catch(console.error);
