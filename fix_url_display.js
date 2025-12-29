const fs = require('fs-extra');

async function fixUrlAndOutline() {
    console.log('🔧 URL表示の修正と目次設定の準備...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. URLっぽい文字列の修正
    // 画像で指摘された "https://...vercel.app" のような箇所を ` ` コードスパンで囲む
    // これにより、等幅フォントになり、変な文字詰めが解消される

    // 特定の文字列をピンポイントで修正（誤爆を防ぐため）
    content = content.replace(/https:\/\/[\w\.\-]+vercel\.app/g, (match) => {
        return `\`${match}\``;
    });

    // 一般的なURLも、Markdownリンクになっていない "裸のURL" があればコード化する
    // ただし、既にリンクになっている (https://...) や <https://...> は除外したい
    // 今回は安全策として、上記指摘箇所のみ修正する

    // 2. 目次の深さについて
    // これはMarkdown修正ではなく、Pandocコマンドのオプションで対応する (--toc-depth=3)
    // ここではMarkdown自体の構造が正しいか念のため確認
    // # H1 (タイトル) -> 削除済み
    // ## H2 (章)
    // ### H3 (節) -> これまで目次に出ていなかったなら、Pandoc設定で出るようになる

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ URL表記の修正完了');
}

fixUrlAndOutline().catch(console.error);
