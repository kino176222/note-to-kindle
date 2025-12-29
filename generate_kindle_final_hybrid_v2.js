
const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const path = require('path');

const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';
const outputPath = '/Users/kino/Desktop/vibe_coding_kindle_final.html';

async function generateKindleHtml() {
    console.log('Generating Kindle HTML (Hybrid Quality Mode v2)...');

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        breaks: false,
        typographer: true
    });

    let markdown = await fs.readFile(masterPath, 'utf8');
    let htmlContent = md.render(markdown);

    // ---------------------------------------------------------
    // Design Application
    // ---------------------------------------------------------

    // TOC Generation (Preserve original headers)
    const headers = [];
    let tocHtml = '<div class="toc"><h2>目 次</h2><ul>';
    let idCounter = 0;
    htmlContent = htmlContent.replace(/<(h[23])>(.*?)<\/\1>/g, (match, tag, title) => {
        idCounter++;
        const id = `header-${idCounter}`;
        const cleanTitle = title.replace(/<.*?>/g, '');
        tocHtml += `<li class="${tag === 'h2' ? 'toc-h2' : 'toc-h3'}"><a href="#${id}">${cleanTitle}</a></li>`;
        return `<${tag} id="${id}">${title}</${tag}>`;
    });
    tocHtml += '</ul></div><hr>';
    htmlContent = tocHtml + htmlContent;

    // Newlines for Japanese periods
    htmlContent = htmlContent.replace(/。(?=[^>]*<)/g, '。<br>');
    htmlContent = htmlContent.replace(/。\n/g, '。<br>\n');

    // Styling Components
    htmlContent = htmlContent.replace(/<li>\s*✅\s*(.*?)<\/li>/g, '<li class="checklist-item"><span class="check-icon">✅</span> $1</li>');
    htmlContent = htmlContent.replace(/<p>\s*✅\s*(.*?)<\/p>/g, '<div class="checklist-item"><span class="check-icon">✅</span> $1</div>');
    htmlContent = htmlContent.replace(/<p>\s*Q[\.．]\s*(.*?)<\/p>/g, '<div class="qa-item qa-q"><span class="qa-icon">Q.</span> $1</div>');
    htmlContent = htmlContent.replace(/<p>\s*A[\.．]\s*(.*?)<\/p>/g, '<div class="qa-item qa-a"><span class="qa-icon">A.</span> $1</div>');
    htmlContent = htmlContent.replace(/<p>\s*(【TIP】|【ヒント】|💡)\s*(.*?)<\/p>/g, '<div class="hint-box"><strong>💡 $1</strong><br>$2</div>');

    // Footer Links
    htmlContent += `
    <div class="app-showcase">
        <h2>あなたの旅はここから始まります</h2>
        <p>本書で紹介したアプリやコードの事例はこちら</p>
        <p><a href="https://github.com/kino-176222/manga-gallery">📌 GitHub Repository</a></p>
        <p><a href="https://manga-gallery-sable.vercel.app">🚀 Demo App</a></p>
    </div>
    <div class="x-contact">
        <h3>質問はこちらへ</h3>
        <p><a href="https://twitter.com/search?q=VibeCoding">#VibeCoding で検索・ツイート</a></p>
    </div>
    `;

    // ---------------------------------------------------------
    // Final Output with RICH CODE BLOCK CSS
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
        h2 { font-size: 1.4em; margin-top: 3em; border-bottom: 2px solid #3f51b5; padding-bottom: 0.3em; page-break-before: always; }
        h3 { font-size: 1.2em; margin-top: 2em; border-left: 5px solid #ff9800; padding-left: 10px; }
        p { margin-bottom: 1em; text-align: justify; }
        img { max-width: 100%; height: auto; display: block; margin: 1em auto; border-radius: 4px; }
        ul, ol { margin-bottom: 1em; padding-left: 1.5em; }
        li { margin-bottom: 0.2em; }

        /* Components */
        .checklist-item { background: #e8f5e9; padding: 10px; margin: 5px 0; border-left: 5px solid #43a047; list-style: none; }
        .qa-item { padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px; }
        .qa-q { background: #e1f5fe; color: #0277bd; font-weight: bold; }
        .qa-a { background: #fff3e0; }
        .hint-box { background: #fffde7; padding: 15px; border: 1px dashed #fdd835; margin: 20px 0; }
        
        /* TOC */
        .toc { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
        .toc h2 { border: none; text-align: center; margin: 0; }
        .toc ul { list-style: none; padding: 0; }
        .toc-h2 { font-weight: bold; margin-top: 10px; border-bottom: 1px solid #ddd; }
        .toc-h3 { margin-left: 20px; font-size: 0.9em; color: #666; }
        .toc a { text-decoration: none; color: #333; display: block; }
        .app-showcase, .x-contact { margin-top: 50px; padding: 20px; background: #eeeeee; border-radius: 8px; text-align: center; }
        a { color: #1565c0; }

        /* ----------------------------------------------------- */
        /*  CODE BLOCK STYLING (Terminal / Editor Look)          */
        /* ----------------------------------------------------- */
        pre {
            background-color: #282a36; /* Dracula Dark */
            color: #f8f8f2;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: Consolas, "Courier New", monospace;
            font-size: 0.9em;
            margin: 1.5em 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            position: relative;
        }
        /* Top bar simulation */
        pre::before {
            content: "PROMPT / CODE";
            display: block;
            background: #44475a;
            color: #bd93f9;
            font-size: 0.7em;
            padding: 2px 10px;
            border-radius: 4px 4px 0 0;
            margin: -15px -15px 10px -15px; /* Pull outside padding */
            font-weight: bold;
            letter-spacing: 1px;
        }
        code {
            font-family: Consolas, "Courier New", monospace;
        }
        /* Inline code */
        p code, li code {
            background-color: #f0f0f0;
            color: #d63384;
            padding: 2px 4px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    await fs.writeFile(outputPath, finalHtml, 'utf8');
    console.log('Final Hybrid HTML (v2) with Dark Code Blocks generated:', outputPath);
}

generateKindleHtml().catch(console.error);
