const fs = require('fs-extra');

async function refineTOCLinks() {
    console.log('🔗 目次リンクを本気で直します...');

    // 現在の問題:
    // ユーザー提供の画像を見ると、目次のリスト自体は表示されているが、
    // タップしてもリンクとして機能していない、あるいは
    // ページ遷移がうまくいっていない可能性がある。
    // Markdownのリンク構文 [Title](#id) はPandocでは機能するはずだが、
    // IDの指定方法や、EPUB出力時の挙動に注意が必要。

    // Pandocでは、headersに自動的にIDが付与されることがあり、
    // 手動でつけた {#id} と競合したり、正しく認識されない場合がある。
    // しかし、明示的に {#id} をつければ、それが優先されるのが一般的。

    // ユーザーの画像2枚目（目次そのもの）を見ると、
    // "第1章..." と書かれていて、青色（リンク色）になっていないように見える。
    // Kindle端末やアプリによって表示は異なるが、
    // 確実にリンクさせるために、HTMLタグ <a> を使う、あるいは
    // Pandocのtoc機能を活用する。

    // しかし、今の目次は手動で挿入したMarkdownリスト。

    // 戦略:
    // 1. 手動の目次を削除し、Pandocの `--toc` 機能に任せる位置を調整する...
    //    いや、Pandocのtocは通常、本の冒頭に自動挿入される。
    //    ユーザーは「本文中の特定の位置」に目次が欲しいのかもしれないし、
    //    現状の出力（Pandocのtocオプションが有効）だと、
    //    自動生成された目次（本の冒頭）とは別に、手動挿入したリストが表示されている状態。

    // ユーザーの「目次 ちゃんと リンク に なる よう」というリクエストは、
    // 文脈からして「手動で入れたリストがリンクとして機能していない」ことを指していると思われる。

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 既存の目次リスト部分を特定
    const startMarker = '▼ 迷ったら、目次から「今やりたい章」だけ進めてください。';

    // 既存のリストを削除し、より堅牢な書き方に変更する。
    // HTMLのアンカータグを使うのが確実かもしれないが、EPUB変換でどうなるか。
    // Markdownの標準リンク記法でいくが、IDを再確認。

    // 1. 各見出しのIDが正しく付与されているか確認・再付与
    //    前回のスクリプトで {#chapter-X} をつけたが、
    //    もしPandocが日本語見出しから自動生成したIDを使っているとずれる。
    //    明示的につけたので大丈夫なはずだが、全角スペースなどが悪さをしているかも？

    // IDの付け方をシンプルにする。
    // {#chapter-1} -> {#ch1}

    // リストのリンク先も合わせる。

    // リストを再生成
    const tocList = [
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

    // 1. 見出し行のIDを置換
    // 正規表現で、{#...} を新しい短いIDに置き換える、あるいは追加する。

    tocList.forEach(item => {
        // タイトル部分で検索（エスケープが必要）
        const escapedTitle = item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 見出し行を探す: ## タイトル ...
        const regex = new RegExp(`^## ${escapedTitle}.*$`, 'm');

        content = content.replace(regex, `## ${item.title} {#${item.id}}`);
    });

    // 2. 目次リストを再構築
    let newToc = '\n';
    tocList.forEach(item => {
        // 空行を挟まないとリストとして認識されない場合がある
        newToc += `- [${item.title}](#${item.id})\n`;
    });
    newToc += '\n'; // 後ろにも空行

    // 既存の目次エリアを置換
    // startMarkerから、空白行を挟んで次のセクション（## 第1章）の前まで

    // 安全にやるために、startMarkerの直後を置き換える
    // 前回のスクリプトで挿入したリストは
    // - [本書のクリア条件（ゴール）](#chapter-goal)
    // ...
    // となっている。

    // startMarkerを探す
    const markerIndex = content.indexOf(startMarker);
    if (markerIndex !== -1) {
        // マーカーの次の行から、"## 第1章" が出てくる前までを削除して、新リスト挿入
        const afterMarker = content.slice(markerIndex + startMarker.length);
        const nextSectionIndex = afterMarker.indexOf('## 第1章');

        if (nextSectionIndex !== -1) {
            const beforeNextSection = content.slice(0, markerIndex + startMarker.length);
            const afterNextSection = content.slice(markerIndex + startMarker.length + nextSectionIndex);

            // 間に挟む
            content = beforeNextSection + '\n' + newToc + '\n' + afterNextSection;
        }
    }

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ 目次リンクを強力なIDで再接続しました');
}

refineTOCLinks().catch(console.error);
