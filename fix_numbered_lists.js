const fs = require('fs-extra');

async function fixSpecificLineBreaks() {
    console.log('🧹 ①と②の直前で改行を入れます...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // Case 1: ①
    // From: 今回用意するのは、次の**2つの盾**だけです。**① プライバシーポリシー**
    // To:   今回用意するのは、次の**2つの盾**だけです。\n\n**① プライバシーポリシー**

    content = content.replace(
        '今回用意するのは、次の**2つの盾**だけです。**① プライバシーポリシー**',
        '今回用意するのは、次の**2つの盾**だけです。\n\n**① プライバシーポリシー**'
    );

    // Case 2: ②
    // From: **書いてあること自体が、安心材料**になります。**② 利用規約**
    // To:   **書いてあること自体が、安心材料**になります。\n\n**② 利用規約**

    content = content.replace(
        '**書いてあること自体が、安心材料**になります。**② 利用規約**',
        '**書いてあること自体が、安心材料**になります。\n\n**② 利用規約**'
    );

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ ①と②の前に改行を追加しました');
}

fixSpecificLineBreaks().catch(console.error);
