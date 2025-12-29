const fs = require('fs-extra');

async function fixAiRulesBox() {
    console.log('📦 AI Rulesを1つの箱にまとめる作業を開始します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. AI Rulesの開始位置と終了位置を特定
    // "AI Rules & Guidelines" から ";yb" までがターゲット

    // まず、前回の修正で「見出し(##)」にしてしまった部分をただの太字にする
    // ## AI Rules & Guidelines ... -> **AI Rules & Guidelines ...**
    content = content.replace(/^## (AI Rules & Guidelines.*)/m, '**$1**');

    // 2. このセクション全体を引用化（> ）する
    // ただし、既に部分的に引用されていたり、改行が混じっていたりするので、
    // 一旦この範囲のテキストを正規化してから、全行に > をつける

    // 開始: **AI Rules
    // 終了: ;yb

    const startMarker = '**AI Rules & Guidelines';
    const endMarker = ';yb';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
        // 対象範囲を切り出す
        const before = content.substring(0, startIndex);
        const targetArea = content.substring(startIndex, endIndex + endMarker.length);
        const after = content.substring(endIndex + endMarker.length);

        // targetAreaの整形
        // 1. 既存の引用記号 > を削除
        let cleanTarget = targetArea.replace(/^> ?/gm, '');
        // 2. 変な空行ブロック（rm, ls, sudoだけの行）の前後の改行を調整
        // 見た目をよくするため、少し詰める

        // 3. 全行に > をつける
        const quotedTarget = cleanTarget.split('\n').map(line => {
            // 空行ならそのまま、文字があれば > をつける
            // Kindleでの表示を安定させるため、空行も > をつけておく（スペース付きで）
            return line.trim() === '' ? '>' : `> ${line}`;
        }).join('\n');

        // 結合
        content = before + quotedTarget + after;

        // 念のため、直前の行との結合を防ぐために空行を入れる
        content = content.replace(before.trimEnd(), before.trimEnd() + '\n\n');
    }

    // 3. ついでに他の細かい修正
    // 意図しない空引用ブロック（> だけの行が連続）があれば削除
    content = content.replace(/\n>\n>\n/g, '\n\n');

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ AI Rules箱詰め完了');
}

fixAiRulesBox().catch(console.error);
