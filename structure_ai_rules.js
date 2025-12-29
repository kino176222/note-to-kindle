const fs = require('fs-extra');

async function structureAiRules() {
    console.log('🏛 AI Rulesの構造改革（リスト化と箱詰め）を開始します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // AI Rulesセクションを特定
    const rulesRegex = /(\*\*AI Rules[\s\S]*?;yb)/;
    const match = content.match(rulesRegex);

    if (match) {
        let rawRules = match[1].replace(/^> ?/gm, ''); // 一旦引用解除

        // ここで、テキストの塊になっているものを、空行を入れてリスト構造にする
        // キーワードを見つけて、その前に \n\n を挿入する作戦

        // 1. 各項目の番号付きリストの前
        rawRules = rawRules.replace(/(\d+\. )/g, '\n\n$1');

        // 2. 「-ルール:」のような箇条書きの前
        // ただし、行頭にある場合のみ、あるいは文脈による
        // 画像を見ると、"-ルール:" が文中に埋もれている
        rawRules = rawRules.replace(/( -ルール:)/g, '\n  - **ルール**: ');
        rawRules = rawRules.replace(/( -手順:)/g, '\n  - **手順**: ');
        rawRules = rawRules.replace(/( -目的:)/g, '\n  - **目的**: ');
        rawRules = rawRules.replace(/( -構成:)/g, '\n  - **構成**: ');
        rawRules = rawRules.replace(/( -言語:)/g, '\n  - **言語**: '); // 追加
        rawRules = rawRules.replace(/( -トーン:)/g, '\n  - **トーン**: '); // 追加

        // 3. 例外リスト、ls, rm, sudo などのコマンド行
        // これらは独立行にしたい
        rawRules = rawRules.replace(/^(ls|rm|sudo)$/gm, '\n  $1\n');

        // 4. 重複した改行を整理（3つ以上あっても2つにする）
        rawRules = rawRules.replace(/\n{3,}/g, '\n\n');

        // 5. 全行に > をつけて箱詰め
        // ここで、空行も > を含めて、途切れないようにする
        const lines = rawRules.split('\n');
        const processedLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed === '') return '> '; // 空行も引用にして箱を繋げる
            return `> ${line}`; // 元のスペース(インデント)は維持した方がリストっぽくなるかもだが、単純化のため > + space
        });

        const newBlock = processedLines.join('\n');
        content = content.replace(rulesRegex, newBlock);
    }

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ AI Rules構造改革完了');
}

structureAiRules().catch(console.error);
