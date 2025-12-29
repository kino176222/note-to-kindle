const fs = require('fs-extra');

async function rescueHeadingsFromBox() {
    console.log('🚑 見出しの誤ったボックス化（引用）を解除します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. 引用記号付きの見出しを救出
    // パターン: 行頭に > があり、その後に # が続くもの
    // 例: > ### 見出し -> ### 見出し
    content = content.replace(/^> ?(#{1,6} .*)/gm, '$1');

    // 2. 空行だけの引用行を削除（念のため）
    // これが残っていると、ボックスが変に伸びたり分離したりする
    content = content.replace(/\n> ?\n/g, '\n\n');

    // 3. 意図しない箇条リストの引用化も防ぐ
    // 画像を見ると、リスト項目も箱に入ってしまっている可能性がある（AI Rules以外で）
    // AI Rules周辺以外の場所で、> - ... となっているものがあれば解除したいが、
    // AI Rules内はリストを使っているので、一律解除は危険。
    // 今回は「見出し」が主犯なので、まずは見出しの救出に集中。

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ 見出しの救出完了');
}

rescueHeadingsFromBox().catch(console.error);
