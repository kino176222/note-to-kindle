const fs = require('fs-extra');

async function fixLastPrompt() {
    console.log('🕵️‍♀️ まだ潜んでいた ruby パターン（個人開発として...）をプロンプト化します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // ユーザー画像から特定された箇所
    // ruby このWebアプリを、個人開発として全世界に公開したいと考えています。
    // まず、...
    // 【前提】...

    // このブロック全体を引用にしたい

    // パターン:
    // ruby (任意のテキスト) 
    // から
    // (次の見出し or 章の終わり) まで

    // 正規表現で、"ruby このWebアプリを" から始まるブロックを探す
    const specificRubyRegex = /^ruby (このWebアプリを[\s\S]*?)(?=\n#|\n\n\n|$)/m;

    // 汎用的に残っているrubyも拾う
    // "ruby " で始まり、改行が続いている箇所

    content = content.replace(/^ruby ([\s\S]*?)(?=\n\n|\n#)/gm, (match, body) => {
        // bodyの各行に > をつける
        return '> ' + body.replace(/\n/g, '\n> ');
    });

    // もし上記で拾いきれない場合（空行が挟まって別ブロック扱いになるとか）
    // 個別に狙い撃ち

    if (content.includes('ruby このWebアプリを')) {
        content = content.replace('ruby このWebアプリを', '> このWebアプリを');

        // その後の行も引用にする必要がある
        // "まず、 -このアプリに..."
        // "【前提】..."
        // "そのうえで..."

        // これらが引用になっていない状態（画像の状態）から、引用にする
        // ここは手動で範囲指定した方が確実か、あるいは「AI Rules」のようにブロック化するか。

        // 単純に、その段落周辺を置換する
        // ターゲットテキストを含む行を探して、置換

        const phrases = [
            'まず、 -このアプリに考えられるリスクを',
            '【前提】 -個人の学習・趣味開発です',
            'そのうえで、 -最低限用意した方がよい'
        ];

        phrases.forEach(p => {
            // 文字列が含まれていて、かつ引用記号がない場合
            if (content.indexOf(p) !== -1 && content.indexOf(`> ${p}`) === -1) {
                content = content.replace(p, `> ${p}`);
            }
        });
    }

    // 最後に、引用ブロック内の空行「> \n」が正しく機能するように、
    // 前回の修復ロジック（fix_broken_quotes.js）と同じことをこの周辺にも適用したいが、
    // 今回は全置換でカバーできていることを期待。

    // 念押し: 見出し以外の空行でない行で、直前が引用なら、ここも引用にする？
    // いや、それは危険。

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ 最後のプロンプト隠れ家を摘発しました');
}

fixLastPrompt().catch(console.error);
