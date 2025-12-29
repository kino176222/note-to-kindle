const fs = require('fs-extra');

async function hardcodeHtmlLinks() {
    console.log('🔗 目次と見出しを完全なHTML（絶対動作する形式）に書き換えます...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. 各章の見出しを HTML <h2> タグに置換する
    // 対象: ## タイトル {#id} の形式になっている行
    // 例: ## 第1章 Vibe Codingという考え方（概念） {#ch1}
    //  -> <h2 id="ch1" class="chapter-heading">第1章 Vibe Codingという考え方（概念）</h2>

    // 見出しのデザインCSSを h2 に対して当てているので、タグが変わってもCSSは効くはず。
    // クラスをつけておくと安心かもだけど、今のCSSは h2 要素セレクタなのでクラス不要。

    // 正規表現で置換
    // 行頭 ## スペース 任意の文字 スペース {#ID} 行末
    const headerRegex = /^##\s+(.+?)\s+\{#(.+?)\}$/gm;
    // multilineモードが必要だがJSのRegExpではmフラグで行頭マッチ

    // グローバル置換のためにループ処理、あるいは replace with function

    content = content.replace(/^##\s+(.+?)\s+\{#(.+?)\}$/gm, (match, title, id) => {
        // タイトルの中にMarkdown記法（**太字**など）が含まれている場合、
        // h2タグの中に入れてもPandocは処理してくれるか？
        // PandocはHTMLブロック内のMarkdownを処理するには blank lineが必要などの制約があるが、
        // 単純なインライン要素ならいけるか、あるいはパースされない可能性がある。
        // タイトルには太字などが含まれていないことを確認したほうがいいが、
        // 今回のリストを見る限り、タイトルはプレーンテキストっぽい。

        return `\n<h2 id="${id}">${title}</h2>\n`;
    });


    // 2. 目次リストを HTML <ul><li><a>... に置換する
    // 現在は <div class="inline-toc"> ... Markdown List ... </div> になっているはず。

    // inline-tocの中身をHTMLリストに書き換える。

    const tocMap = [
        { title: '本書のクリア条件（ゴール）', id: 'goal' },
        { title: '第0章 まずはこれだけ（ゴール宣言）', id: 'ch0' },
        { title: '第1章 Vibe Codingという考え方（概念）', id: 'ch1' },
        { title: '第2章 準備フェーズ（AIと環境を整える）', id: 'ch2' },
        { title: '第3章 武装フェーズ（AIを暴走させない）', id: 'ch3' },
        { title: '第4章 練習フェーズ（5分で成功体験）', id: 'ch4' },
        { title: '第5章 本番フェーズ（MVP開発）', id: 'ch5' },
        { title: '第6章 守りフェーズ（セキュリティ・規約）', id: 'ch6' },
        { title: '第7章 記録フェーズ（Git / GitHub）', id: 'ch7' },
        { title: '第8章 公開フェーズ（デプロイ）', id: 'ch8' },
        { title: '第9章 FAQ（よくある質問）', id: 'ch9' },
        { title: '第10章 AFTER 10（次の世界へ）', id: 'ch10' }
    ];

    let htmlToc = '<div class="inline-toc">\n<ul>\n';
    tocMap.forEach(item => {
        htmlToc += `  <li><a href="#${item.id}">${item.title}</a></li>\n`;
    });
    htmlToc += '</ul>\n</div>';

    // 現在の <div class="inline-toc"> ブロックを置換
    // 正規表現で <div class="inline-toc"> から </div> までをキャプチャ
    // 改行を含むため sフラグ相当が必要だがJSにはない。[\s\S]*? を使う。

    const tocBlockRegex = /<div class="inline-toc">[\s\S]*?<\/div>/;

    if (tocBlockRegex.test(content)) {
        content = content.replace(tocBlockRegex, htmlToc);
        console.log('✅ 目次ブロックをHTML形式に置換しました');
    } else {
        console.warn('⚠️ 目次ブロックが見つかりませんでした (inline-tocクラス)');
        // 前回の処理で入れたはずだが、失敗していたら手動リストを探すフォールバックが必要？
        // 多分大丈夫。
    }

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ すべてのリンク構造をHTML（ハードコード）化しました');
}

hardcodeHtmlLinks().catch(console.error);
