
const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const path = require('path');

const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';
const outputPath = '/Users/kino/Desktop/vibe_coding_kindle_final.html';

async function generateKindleHtml() {
    console.log('Generating Kindle HTML...');
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        breaks: false, // HTML側で制御するため一旦false（句点改行だけ入れたい）
        typographer: true
    });

    let markdown = await fs.readFile(masterPath, 'utf8');

    // ---------------------------------------------------------
    // Phase 1: Pre-Process (Markdown Level)
    // ---------------------------------------------------------
    // 太字のスペース調整だけ行う（HTMLパースで消えないように）
    markdown = markdown.replace(/([^\s\n「（])\*\*(.+?)\*\*/g, '$1 **$2**');
    markdown = markdown.replace(/\*\*(.+?)\*\*([^\s\n」）])/g, '**$1** $2');

    // HTML化
    let htmlContent = md.render(markdown);

    // ---------------------------------------------------------
    // Phase 2: HTML Post-Processing
    // ---------------------------------------------------------

    // 1. 目次 (TOC) の生成
    // <h2> (章), <h3> (節) を抽出して目次を作る
    const toc = [];
    let chapterCount = 0;

    // 見出しの置換とTOC収集
    // <h2>タグを検出、ID付与、番号付与
    htmlContent = htmlContent.replace(/<h2>(.*?)<\/h2>/g, (match, title) => {
        chapterCount++;
        const id = `chap-${chapterCount}`;
        const number = `第${chapterCount}章`;
        toc.push({ level: 2, id, number, title: title.replace(/<.*?>/g, '') }); // タグ除去したタイトル
        return `<h2 id="${id}"><span class="chapter-number">${number}</span> ${title}</h2>`;
    });

    // <h3>タグを検出
    // 直前のチャプター番号を使うため、replaceのloop順序に依存するが、
    // replaceは前から順に行われるので chapterCount は正しいはず。
    // ただし、replaceは一括で行われる可能性がある？
    // 安全のため、一度 split して処理するか、あるいは replace 関数内でカウンタを持つ。
    // replaceは先頭から順にマッチする仕様なので、カウンタ変数は有効。

    // カウンタリセットして再走査（h2とh3をまとめて処理しないと節番号がズレる）
    // なので、一度HTMLをパースしたほうがいいが、正規表現でやるなら少し工夫が必要。
    // ここではシンプルに「HTML文字列を上から走査して再構築」する。

    let finalBody = '';
    let lastIndex = 0;
    let chNum = 0;
    let subNum = 0;
    const headerRegex = /<(h[23])>(.*?)<\/\1>/g;
    let match;
    const newToc = [];

    // HTML全体をリセットしてループ処理
    // md.renderの結果を直接replaceした方が早いが、TOC順序関連付けのためループ

    // マッチするたびに置換
    htmlContent = htmlContent.replace(headerRegex, (m, tag, innerText) => {
        const cleanText = innerText.replace(/<.*?>/g, ''); // タグ除去
        if (tag === 'h2') {
            chNum++;
            subNum = 0;
            const id = `sec-${chNum}`;
            const numStr = `第${chNum}章`;
            newToc.push({ level: 2, id, text: `${numStr} ${cleanText}` });
            return `<h2 id="${id}"><span class="chapter-number">${numStr}</span> ${innerText}</h2>`;
        } else if (tag === 'h3') {
            subNum++;
            const id = `sec-${chNum}-${subNum}`;
            const numStr = `${chNum}-${subNum}`;
            newToc.push({ level: 3, id, text: `${numStr} ${cleanText}` });
            return `<h3 id="${id}"><span class="section-number">${numStr}</span> ${innerText}</h3>`;
        }
        return m;
    });

    // 目次HTML生成
    let tocHtml = '<div class="toc"><h2>目 次</h2><ul>';
    newToc.forEach(item => {
        const cls = item.level === 2 ? 'toc-chapter' : 'toc-section';
        tocHtml += `<li class="${cls}"><a href="#${item.id}">${item.text}</a></li>`;
    });
    tocHtml += '</ul></div><hr>'; // 目次の後に区切り

    // 本文の冒頭に目次を挿入
    htmlContent = tocHtml + htmlContent;

    // 2. 「。」で改行 (<br>)
    // HTMLタグの中（属性値など）を壊さないように、タグの外側の「。」だけを対象にする必要がある。
    // 正規表現で「タグの外」を判定するのは難しい。
    // 簡易的に「<...>」をスキップするロジック...は重い。
    // 安全策: cheerio使うのがベストだが無いので、
    // 「>」の後、「<」の前にある「。」を置換？
    // もっと単純に、replace(/。/g, '。<br>') だと、 <a href="...。..."> などで死ぬ。
    // 日本語の「。」が属性値に入ることは稀（ファイル名とか？）。
    // リスク承知で置換するか、あるいは「閉じタグの後」を狙う。
    // replace(/([^>])。/g, '$1。<br>')
    htmlContent = htmlContent.replace(/([。])(?=[^>]*<)/g, '$1<br>'); // 後ろにタグ開始がある（＝テキストノード内）と仮定
    // 完璧ではないが、Kindle原稿ならこれでほぼ動く。

    // 3. デザイン適用 (Checklist, Q&A)
    htmlContent = htmlContent.replace(/<li>\s*✅\s*(.*?)<\/li>/g, '<li class="checklist-item"><span class="check-icon">✅</span> $1</li>');
    htmlContent = htmlContent.replace(/<p>\s*✅\s*(.*?)<\/p>/g, '<div class="checklist-item"><span class="check-icon">✅</span> $1</div>');

    htmlContent = htmlContent.replace(/<p>\s*Q[\.．]\s*(.*?)<\/p>/g, '<div class="qa-item qa-q"><span class="qa-icon">Q.</span> $1</div>');
    htmlContent = htmlContent.replace(/<p>\s*A[\.．]\s*(.*?)<\/p>/g, '<div class="qa-item qa-a"><span class="qa-icon">A.</span> $1</div>');

    htmlContent = htmlContent.replace(/<p>\s*(【TIP】|【ヒント】|💡)\s*(.*?)<\/p>/g, '<div class="hint-box"><strong>💡 $1</strong><br>$2</div>');

    // 4. アプリ画像・QRコード (URLリンク)
    // ユーザー指定: URLのみでOK。
    // 特定のプレースホルダーがあるわけではないので、巻末に追加
    const appLinksHtml = `
    <div class="app-showcase">
        <h2>あなたの旅はここから始まります</h2>
        <p>本書で紹介したアプリやコードの事例はこちら（GitHub / Vercel）</p>
        <p><a href="https://github.com/kino-176222/manga-gallery">📌 Repository: Manga Gallery</a></p>
        <p><a href="https://manga-gallery-sable.vercel.app">🚀 Demo App: Manga Gallery</a></p>
    </div>`;
    htmlContent += appLinksHtml;

    // 5. X (Twitter) リンク
    // ユーザーのXアカウントが不明。プレースホルダーを入れる。
    // ソースにXのリンクがあれば使うが...
    // なさそうなので、一般的な案内を入れる。
    htmlContent += `
    <div class="x-contact">
        <h3>質問はこちらへ</h3>
        <p>Vibe Codingに関する質問や、作ったアプリの報告はX（旧Twitter）までお気軽に！</p>
        <p><a href="https://twitter.com/search?q=VibeCoding">#VibeCoding で検索・ツイート</a></p>
    </div>`;

    // ---------------------------------------------------------
    // Output Formatting (CSS)
    // ---------------------------------------------------------
    const finalHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Vibe Coding入門</title>
    <style>
        body {
            font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
            line-height: 1.8;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fbfbf9;
        }
        h1 { margin-bottom: 2em; text-align: center; color: #1a237e; }
        h2 { 
            font-size: 1.4em;
            margin-top: 3em; 
            border-bottom: 2px solid #3f51b5; 
            padding-bottom: 0.3em;
            page-break-before: always;
        }
        h3 { 
            font-size: 1.2em; 
            margin-top: 2em; 
            border-left: 5px solid #ff9800;
            padding-left: 10px;
        }
        p { margin-bottom: 1em; text-align: justify; }
        
        /* 箇条書きの隙間をなくす */
        ul, ol { margin-bottom: 1em; }
        li { margin-bottom: 0.1em; } 

        img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
        
        /* 目次デザイン */
        .toc { background: #eee; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
        .toc h2 { margin-top: 0; border: none; font-size: 1.2em; text-align: center; }
        .toc ul { list-style: none; padding: 0; }
        .toc-chapter { font-weight: bold; margin-top: 10px; }
        .toc-section { margin-left: 20px; font-size: 0.9em; color: #555; }
        .toc a { text-decoration: none; color: #333; }

        /* 装飾ボックス */
        .checklist-item {
            background: #e8f5e9;
            padding: 10px;
            margin: 5px 0;
            border-left: 5px solid #43a047;
            list-style: none;
        }
        .qa-item { padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px; }
        .qa-q { background: #e1f5fe; color: #0277bd; font-weight: bold; }
        .qa-a { background: #fff3e0; }
        .hint-box { background: #fffde7; padding: 15px; border: 1px dashed #fdd835; margin: 20px 0; }

        a { color: #0277bd; }
        
        /* リンクコーナー */
        .app-showcase, .x-contact {
            margin-top: 50px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
            text-align: center;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    await fs.writeFile(outputPath, finalHtml, 'utf8');
    console.log('Final Kindle HTML generated at:', outputPath);
}

generateKindleHtml().catch(console.error);
