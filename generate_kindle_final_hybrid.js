
const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const path = require('path');

const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';
const outputPath = '/Users/kino/Desktop/vibe_coding_kindle_final.html';

async function generateKindleHtml() {
    console.log('Generating Kindle HTML (Hybrid Quality Mode)...');

    // Markdown Parser
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        breaks: false, // HTML後処理で制御するためfalse
        typographer: true
    });

    let markdown = await fs.readFile(masterPath, 'utf8');

    // HTML変換
    let htmlContent = md.render(markdown);

    // ---------------------------------------------------------
    // Design Application (Post-Processing)
    // ---------------------------------------------------------

    // 1. 目次の自動生成
    // ユーザーのオリジナル見出し（例：0章）をそのまま使い、目次を作る。
    // h2, h3を抽出
    const headers = [];
    let tocHtml = '<div class="toc"><h2>目 次</h2><ul>';
    let idCounter = 0;

    // Replace headers to add ID
    htmlContent = htmlContent.replace(/<(h[23])>(.*?)<\/\1>/g, (match, tag, title) => {
        idCounter++;
        const id = `header-${idCounter}`;
        const cleanTitle = title.replace(/<.*?>/g, ''); // Remove tags

        // Add to TOC data
        headers.push({ tag, id, title: cleanTitle });

        // TOC HTML Builder
        const indentClass = tag === 'h2' ? 'toc-h2' : 'toc-h3';
        tocHtml += `<li class="${indentClass}"><a href="#${id}">${cleanTitle}</a></li>`;

        return `<${tag} id="${id}">${title}</${tag}>`;
    });
    tocHtml += '</ul></div><hr>';

    // Insert TOC at the beginning
    htmlContent = tocHtml + htmlContent;

    // 2. 句点の改行 (Safe Mode)
    // テキストノード内の「。」のみ改行させる。
    // 簡易実装: タグの直前にある「。」は無視しづらいが、
    // replace(/。(?=[^>]*<)/) は「次のタグまで」を見る。Kindle用ならこれで十分。
    htmlContent = htmlContent.replace(/。(?=[^>]*<)/g, '。<br>');
    // 行末の「。」（改行の前）も対象
    htmlContent = htmlContent.replace(/。\n/g, '。<br>\n');

    // 3. デザイン適用
    // 緑のチェックリスト (✅)
    htmlContent = htmlContent.replace(/<li>\s*✅\s*(.*?)<\/li>/g, '<li class="checklist-item"><span class="check-icon">✅</span> $1</li>');
    htmlContent = htmlContent.replace(/<p>\s*✅\s*(.*?)<\/p>/g, '<div class="checklist-item"><span class="check-icon">✅</span> $1</div>');

    // Q&A
    htmlContent = htmlContent.replace(/<p>\s*Q[\.．]\s*(.*?)<\/p>/g, '<div class="qa-item qa-q"><span class="qa-icon">Q.</span> $1</div>');
    htmlContent = htmlContent.replace(/<p>\s*A[\.．]\s*(.*?)<\/p>/g, '<div class="qa-item qa-a"><span class="qa-icon">A.</span> $1</div>');

    // Hint
    htmlContent = htmlContent.replace(/<p>\s*(【TIP】|【ヒント】|💡)\s*(.*?)<\/p>/g, '<div class="hint-box"><strong>💡 $1</strong><br>$2</div>');

    // 4. Append Links (App & Contact)
    htmlContent += `
    <div class="app-showcase">
        <h2>あなたの旅はここから始まります</h2>
        <p>本書で紹介したアプリやコードの事例はこちら（GitHub / Vercel）</p>
        <p><a href="https://github.com/kino-176222/manga-gallery">📌 Repository: Manga Gallery</a></p>
        <p><a href="https://manga-gallery-sable.vercel.app">🚀 Demo App: Manga Gallery</a></p>
    </div>
    <div class="x-contact">
        <h3>質問はこちらへ</h3>
        <p>Vibe Codingに関する質問や報告はXまで！</p>
        <p><a href="https://twitter.com/search?q=VibeCoding">#VibeCoding で検索・ツイート</a></p>
    </div>
    `;

    // ---------------------------------------------------------
    // Final Output with Styling
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
            padding: 5%;
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
        
        img { max-width: 100%; height: auto; display: block; margin: 1em auto; border-radius: 4px; }
        
        /* Lists */
        ul, ol { margin-bottom: 1em; padding-left: 1.5em; }
        li { margin-bottom: 0.2em; }

        /* Checklist Style */
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

        /* TOC Style */
        .toc { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
        .toc h2 { border: none; text-align: center; margin-top: 0; font-size: 1.2em; }
        .toc ul { list-style: none; padding: 0; }
        .toc-h2 { font-weight: bold; margin-top: 10px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
        .toc-h3 { margin-left: 20px; font-size: 0.9em; color: #666; }
        .toc a { text-decoration: none; color: #333; display: block; }
        
        /* Links */
        .app-showcase, .x-contact {
            margin-top: 50px;
            padding: 20px;
            background: #eeeeee;
            border-radius: 8px;
            text-align: center;
        }
        a { color: #1565c0; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    await fs.writeFile(outputPath, finalHtml, 'utf8');
    console.log('Final Hybrid HTML generated at:', outputPath);
}

generateKindleHtml().catch(console.error);
