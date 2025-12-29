const fs = require('fs-extra');

async function fixBrokenQuotes() {
    console.log('🩹 誤って分割された引用ブロック（背景灰色）を修復します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. 文脈での修正
    // ユーザー画像を見ると、
    // > 次に...
    // > 
    // > 難しく...
    // となっているはずが、プレビューでは分離している。
    // まさか、空行の引用 `> ` が入っておらず、単なる空行 `\n\n` になっているせいで切れているのかも。

    // 解決策: 引用ブロックの中にある「ただの空行」を「> 付きの空行」に変換する
    // ただし、全ての空行を変換すると誤爆するので、前後の行が引用である場合のみ

    // パターン:
    // > テキスト
    // \n (ここが > なし)
    // > テキスト

    // これを
    // > テキスト
    // >
    // > テキスト
    // にする

    const lines = content.split('\n');
    const fixedLines = [];

    for (let i = 0; i < lines.length; i++) {
        const current = lines[i];
        const prev = i > 0 ? lines[i - 1] : '';
        const next = i < lines.length - 1 ? lines[i + 1] : '';

        // 現在が空行で、前後が引用行なら、ここも引用の空行にする
        if (current.trim() === '' && prev.startsWith('>') && next.startsWith('>')) {
            fixedLines.push('> ');
        } else {
            fixedLines.push(current);
        }
    }

    content = fixedLines.join('\n');

    // 2. 逆に、引用にしたくない部分が引用になっているケース（さっきの見出し救出漏れなど）
    // ユーザー指摘の「ここなおして」の具体的箇所は、おそらく「細切れになったグレーボックスを繋げたい」
    // 上記のロジックで繋がるはず。

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ 引用ブロックの連結修復完了');
}

fixBrokenQuotes().catch(console.error);
