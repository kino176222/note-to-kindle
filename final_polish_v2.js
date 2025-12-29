const fs = require('fs-extra');

async function removeSpiralAndPolish() {
    console.log('🌀 デザイン最終調整（渦巻き除去・デザイン統一）を開始します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. 渦巻き 🌀 の除去・置換
    // 🌀迷ったら止めていいもの -> ### 【迷ったら止めていいもの】
    content = content.replace(/🌀/g, '### 【ポイント】'); // 汎用的なラベルに

    // 2. デザイン統一（Unify Designの再確認）
    // 前回のスクリプトで適用済みだが、念のため再適用ロジック
    // ```ruby ... ``` のような残骸があれば > 引用 に変換
    content = content.replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/g, (match, code) => {
        return code.split('\n').map(line => `> ${line}`).join('\n') + '\n';
    });

    // AI Rulesの崩れ修正（念押し）
    // ruby Antigravity... となっている行を修正
    content = content.replace(/^ruby Antigravity/gm, 'Antigravity');

    // AI Rulesの各項目がテキストのままになっているのをリスト化
    content = content.replace(/ -ルール:/g, '\n- **ルール**:');
    content = content.replace(/ -手順:/g, '\n- **手順**:');
    content = content.replace(/ -目的:/g, '\n- **目的**:');
    content = content.replace(/ -構成:/g, '\n- **構成**:');
    content = content.replace(/ -トーン:/g, '\n- **トーン**:');

    // 保存
    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ デザイン修正完了');
}

removeSpiralAndPolish().catch(console.error);
