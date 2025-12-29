const fs = require('fs-extra');

async function fixLineBreaksAndPrompts() {
    console.log('🧹 改行位置とプロンプトの調整を行います...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. プロンプト内の改行を増やす
    // 原因: Markdownの仕様上、改行コード1つだけだと改行されない場合がある。
    // <br>を入れるか、空行を入れるか。引用記号の中なので空行が安全。
    // ターゲット: "Web開発をしたいので..." のブロック

    // 現在の状態:
    // > Web開発をしたいので、『Node.js』等のインストールを手伝ってください。
    // > 私の環境に合わせて、まずは一番簡単で確実な方法をナビゲートしてください。

    // これを
    // > Web開発をしたいので、『Node.js』等のインストールを手伝ってください。
    // > 
    // > 私の環境に合わせて...

    // のように空行を追加して、視覚的に分離させる。
    // あるいは全行末に半角スペース2つを入れる（Markdown改行強制）。

    // 特定の文字列置換で行う
    const targetPromptStart = "Web開発をしたいので、『Node.js』等のインストールを手伝ってください。";
    const improvedPromptStart = "Web開発をしたいので、『Node.js』等のインストールを手伝ってください。\n\n"; // 空行追加

    content = content.replace(targetPromptStart, improvedPromptStart);

    // "作業前に y/n で確認してください。" の後も改行
    content = content.replace("作業前に y/n で確認してください。", "作業前に y/n で確認してください。\n\n");


    // 2. "一番確実な方法はこれ" の箇所の改行修正
    // 現状: "**一番確実な方法はこれ👇**さきほど作った Developer フォルダを"
    // これが繋がって見えている。

    // 修正: "**一番確実な方法はこれ👇**\n\nさきほど作った Developer フォルダを"

    // 正規表現で狙い撃ち
    // "**一番確実な方法はこれ👇**" の後ろに改行がない、または少ない場合

    content = content.replace(/\*\*一番確実な方法はこれ👇\*\*([^\n]*)/, '**一番確実な方法はこれ👇**\n\n$1');

    // よく見ると "これ👇**さきほど" となっている可能性がある。
    // grep結果: "**一番確実な方法はこれ👇**さきほど作った Developer フォルダを" (同じ行に見える)

    // 強制的に改行を入れる
    content = content.replace('**一番確実な方法はこれ👇**さきほど', '**一番確実な方法はこれ👇**\n\nさきほど');


    // 3. Antigravity右側の... の前も改行確認
    // "Developer フォルダを  \n**Antigravity" となっていればOKだが、念のため。

    // content = content.replace('Developer フォルダを', 'Developer フォルダを\n\n'); 
    // ※これはやりすぎかもしれないので、とりあえず上記2点で様子見。

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ 改行と表示崩れを修正しました');
}

fixLineBreaksAndPrompts().catch(console.error);
