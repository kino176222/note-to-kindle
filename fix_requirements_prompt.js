const fs = require('fs-extra');

async function structureRequirementsPrompt() {
    console.log('🧹 要件定義プロンプトを引用ブロック化し、整形します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 置換対象の範囲を特定する
    // 開始: "【進め方】"
    // 終了: "最初の質問から始めてください。**" あるいは "最初の質問から始めてください。"

    // しかし、間のテキストが複数行に渡るため、正規表現または行単位の処理が必要。
    // ここは一意な文字列で挟んで置換する。

    const startMarker = '【進め方】';
    const endMarker = '最初の質問から始めてください。**';

    // endMarkerの "**" はあってもなくても対応できるように

    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) {
        console.error('Start marker not found');
        return;
    }

    // 終了位置を探す（startより後で）
    const searchFrom = content.substring(startIndex);
    let endIndex = searchFrom.indexOf(endMarker);
    let lengthToAdd = endMarker.length;

    if (endIndex === -1) {
        // **がないパターンも試す
        const endMarkerSimple = '最初の質問から始めてください。';
        endIndex = searchFrom.indexOf(endMarkerSimple);
        lengthToAdd = endMarkerSimple.length;

        if (endIndex === -1) {
            console.error('End marker not found');
            return;
        }
    }

    const targetBlock = searchFrom.substring(0, endIndex + lengthToAdd);

    // 新しいフォーマットを作成
    const newBlock = `**【コピペ用プロンプト（要件定義）】**

> **【進め方】**
> 
> 1. まずは「どんなアプリを作りたいか」を、ざっくり聞いてください
> 2. そのあと、目的・使う人・使う場面などを、**1つずつ**質問してください
> 3. 機能については、
>    - 「最初に絶対必要なもの（MVP）」
>    - 「余裕が出たら追加したいもの（後回し）」
>      に分けて整理してください
> 
> 4. 最後に、ここまでの内容をまとめて **シンプルな要件定義メモ** として提示してください
> 
> **【大事な前提】**
> - 正解を出そうとしなくてOK
> - 途中で「やっぱ違う」と思ったら修正してOK
> - 質問は必ず1つずつ、やさしい言葉でしてください
> - 技術用語は使わず、「使う人の目線」で考えてください
> 
> 準備ができたら、最初の質問から始めてください。`;

    // 置換実行
    // targetBlockを使わずに、位置で詳細に置換したほうが安全だが、
    // ここは targetBlock全体を一括置換する。

    const finalContent = content.substring(0, startIndex) + newBlock + content.substring(startIndex + targetBlock.length);

    await fs.writeFile(TARGET_FILE, finalContent, 'utf8');
    console.log('✅ 要件定義プロンプトを整形しました');
}

structureRequirementsPrompt().catch(console.error);
