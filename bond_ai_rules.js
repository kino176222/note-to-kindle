const fs = require('fs-extra');

async function bondAiRules() {
    console.log('🔗 AI Rulesを強力に接着（1つの塊化）します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. AI Rulesセクションの特定
    // 開始: **AI Rules
    // 終了: ;yb

    // まず範囲を切り出す
    // 正規表現でマッチさせるが、改行を含むので [\s\S]*? を使う
    // **AI Rules... から ;yb まで
    const regex = /(\*\*AI Rules[\s\S]*?;yb)/;
    const match = content.match(regex);

    if (match) {
        let aiRulesBlock = match[1];

        // 2. ブロック内の整形
        // すべての行に対して処理を行う
        // a. 既存の `> ` を削除（一旦クリア）
        // b. 行頭に `> ` を付与
        // c. 空行も `> ` だけの行にする（これが重要）

        const lines = aiRulesBlock.split('\n');
        const processingLines = lines.map(line => {
            // 前後の空白削除し、既存の > を削除
            let cleanLine = line.replace(/^> ?/, '').trim();

            // 空行だったとしても、引用として継続させるためにスペースを入れる（Kindle対策）
            if (cleanLine === '') {
                return '> ‎'; // 見えない文字(Left-to-Right Mark)などを入れて強制的にコンテンツ扱いにするか、単に `> ` でいいか。
                // 安全策で `> ` (スペースあり)
                return '> ';
            }
            return `> ${cleanLine}`;
        });

        // 再結合
        // ここで `\n` で繋げれば、全行が `> ...` となるため、Markdown仕様上は「1つの引用ブロック」になるはず
        const newBlock = processingLines.join('\n');

        // 3. 元のテキストを置換
        content = content.replace(regex, newBlock);

        // 念のため、ブロックの前後に空行を確保
        // 直前が `\n` でなければ追加
    }

    // 4. 空行だけの引用行 (`> `) が連続しすぎないように調整
    // ただし、AI Rules内は繋げたいのでそのまま
    // 他の場所で悪影響がないか確認 -> プロンプトは独立しているので大丈夫なはず

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ AI Rules接着完了');
}

bondAiRules().catch(console.error);
