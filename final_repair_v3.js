const fs = require('fs-extra');

async function finalRepair() {
    console.log('🚧 最終修復プロセス開始...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. AI Rules (1-2枚目) の修正
    // 現状: 全体が > (引用) になっていて、改行がない塊になっている可能性がある
    // 対策: AI Rulesセクションの > を一旦全解除し、適切なMarkdownリストに直す

    // AI Rulesセクションを特定 (簡易的に "AI Rules" から "第1章" or 次のセクションまで)
    // ただし正規表現で引用記号を外すのは難しいので、ピンポイントで置換

    // まず、巨大な引用ブロックになってしまっている "AI Rules & Guidelines" を探す
    // `> AI Rules & Guidelines` のようになっているはず
    content = content.replace(/> AI Rules & Guidelines/g, '## AI Rules & Guidelines');

    // その下の塊も引用が続いていると思われる。
    // AI Rules周辺の `> ` を削除したいが、プロンプトまで消さないように注意が必要。
    // 文脈依存が強いので、ここでは "AI Rulesの中身っぽいキーワード" をキーに整形する

    const aiRuleKeywords = [
        'このファイルは、本プロジェクトにおける',
        '最上位命令として',
        '1. 開発開始の儀式',
        'ルール：独自の判断で実装を開始しない',
        '2. 開発戦略',
        '3. 安全管理',
        '4. 全世界公開時',
        '5. コミュニケーション',
        '6. 運用・成果物'
    ];

    aiRuleKeywords.forEach(keyword => {
        // 引用記号があれば消し、改行を入れてリストっぽく見せる
        content = content.replace(new RegExp(`> ?${keyword}`, 'g'), `\n\n${keyword}`);
    });

    // 2. 意図しないグレーボックス (3枚目)
    // 空行の引用 `>` を削除
    content = content.replace(/\n> \n/g, '\n\n');
    content = content.replace(/\n>\n/g, '\n\n');

    // 3. 渦巻きの残骸 (4枚目)
    // `### 【ポイント】` がそのまま出ているのは、おそらくエスケープされているか、前行と繋がっている
    // `\#\#\#` になっているか、 `text\n###` となっていないか
    // 前の行との間に確実に空行を入れる
    content = content.replace(/([^\n])\n### 【ポイント】/g, '$1\n\n### 【ポイント】');
    // もしかして `\#\#\#` になっているなら
    content = content.replace(/\\#\\#\\# 【ポイント】/g, '### 【ポイント】');

    // 4. プロンプト化漏れ (5枚目)
    // `ruby これからアプリを...` -> `> これからアプリを...`
    // 他の `ruby` 残骸も処理
    content = content.replace(/ruby (これからアプリを[\s\S]*?)(?=\n\n|$)/g, '> $1');
    content = content.replace(/ruby /g, ''); // 万が一残っていたら消す

    // 5. 第4章、第5章の消失
    // 前回のHTMLタグ削除で `<h2...>第4章...</h2>` みたいなパターンで消えたのかも
    // バックアップがないと復元不能だが、アウトラインファイルなどから推測して復活させるか、
    // あるいは単純に `#` が消えてテキスト担っているだけなら `#` をつける

    // "第4章" という行があれば、見出し化する
    content = content.replace(/\n第(\d)章 (.+)/g, '\n## 第$1章 $2');

    // ついでに全角スペース由来のレイアウト崩れ防止
    content = content.replace(/　/g, ' ');

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ 最終修復完了');
}

finalRepair().catch(console.error);
