
const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const path = require('path');

const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';
const outputPath = '/Users/kino/Desktop/vibe_coding_kindle_final.html';

async function generateKindleHtml() {
    const md = new MarkdownIt({
        html: true, // HTMLタグ維持
        linkify: true,
        breaks: true, // 改行を<br>に変換（これが自然な挙動）
        typographer: true
    });

    let markdown = await fs.readFile(masterPath, 'utf8');

    // レンダリング（HTML化）
    let htmlContent = md.render(markdown);

    // ---------------------------------------------------------
    // Phase 2: HTML Post-Processing (安全な装飾)
    // ---------------------------------------------------------
    // Markdownパーサーを通した後なので、ここでタグをいじっても
    // 原文の太字(<strong>)などは既に確定しており壊れない。

    // 1. チェックリストの装飾
    // <p>✅ ...</p> または <li>✅ ...</li> を検出してクラス付与
    // <li>✅ テキスト</li> -> <li class="checklist-item"><span class="icon">✅</span> テキスト</li>
    htmlContent = htmlContent.replace(/<li>\s*✅\s*(.*?)<\/li>/g, '<li class="checklist-item"><span class="check-icon">✅</span> $1</li>');
    // 段落の場合
    htmlContent = htmlContent.replace(/<p>\s*✅\s*(.*?)<\/p>/g, '<div class="checklist-item"><span class="check-icon">✅</span> $1</div>');

    // 2. Q&Aの装飾
    htmlContent = htmlContent.replace(/<p>\s*Q[\.．]\s*(.*?)<\/p>/g, '<div class="qa-item qa-q"><span class="qa-icon">Q.</span> $1</div>');
    htmlContent = htmlContent.replace(/<p>\s*A[\.．]\s*(.*?)<\/p>/g, '<div class="qa-item qa-a"><span class="qa-icon">A.</span> $1</div>');

    // 3. ヒントボックス (【TIP】など)
    htmlContent = htmlContent.replace(/<p>\s*(【TIP】|【ヒント】|💡)\s*(.*?)<\/p>/g, '<div class="hint-box"><strong>💡 $1</strong><br>$2</div>');

    // 4. 章番号の自動付与（CSS Countersを利用する方法もあるが、確実なのはここで埋め込むこと）
    // <h2> -> <h2>第N章 
    let chapterCount = 1;
    htmlContent = htmlContent.replace(/<h2>/g, () => `<h2><span class="chapter-number">第${chapterCount++}章</span> `);

    // ---------------------------------------------------------
    // Output Formatting
    // ---------------------------------------------------------
    const finalHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Vibe Coding入門</title>
    <style>
        /* Kindle Standard Reset */
        body {
            font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
            line-height: 1.8;
            color: #333;
            padding: 5% 5%;
            max-width: 800px;
            margin: 0 auto;
            background-color: #fbfbf9; /* Paper-like */
        }
        
        /* Typography */
        h1 { font-size: 200%; margin-bottom: 2em; text-align: center; color: #1a237e; }
        h2 { 
            font-size: 150%; 
            margin-top: 3em; 
            margin-bottom: 1em; 
            border-bottom: 2px solid #1a237e; 
            padding-bottom: 0.5em;
            page-break-before: always; /* Kindle: 改ページ */
        }
        h3 { font-size: 120%; margin-top: 2em; color: #303f9f; }
        p { margin-bottom: 1.5em; text-align: justify; }

        /* Images */
        img { max-width: 100%; height: auto; display: block; margin: 2em auto; border-radius: 4px; }

        /* Custom Components */
        .checklist-item {
            display: block;
            background: #e8f5e9;
            padding: 1rem;
            margin: 1rem 0;
            border-left: 5px solid #4caf50;
            list-style: none; /* liの場合 */
        }
        .qa-item {
            padding: 1rem;
            margin: 0.5rem 0;
            border-radius: 8px;
        }
        .qa-q { background: #e3f2fd; color: #0d47a1; font-weight: bold; }
        .qa-a { background: #fff3e0; color: #e65100; margin-left: 1em; }
        
        .hint-box {
            background: #fff9c4;
            padding: 1.5rem;
            margin: 1.5rem 0;
            border: 2px dashed #fbc02d;
            border-radius: 8px;
        }

        /* Lists */
        ul, ol { margin-bottom: 1.5em; padding-left: 2em; }
        li { margin-bottom: 0.5em; }

        /* Code Blocks */
        pre {
            background: #263238;
            color: #eceff1;
            padding: 1em;
            overflow-x: auto;
            border-radius: 4px;
            font-family: monospace;
        }
        code {
            background: #eceff1;
            color: #d81b60;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
        }
        pre code {
            background: none;
            color: inherit;
            padding: 0;
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
