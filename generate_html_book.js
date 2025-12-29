const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book.html'; // デスクトップに出力
const IMAGES_DIR = 'images';

async function generateHtmlBook() {
    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true
    });

    const content = await fs.readFile(INPUT_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    // 画像パスの調整（HTMLはブラウザで開くため、相対パスでOKだが、今回は単一ファイルとして完結させたいのでDataURI化も手だが、まずは相対パスで）
    // デスクトップにHTMLを置く場合、画像フォルダもデスクトップか、絶対パス参照にする必要がある。
    // ここでは「絶対パス」を使って、どこに置いても画像が出るようにする。
    const currentDir = process.cwd();
    const headersContent = `
    <style>
        body { 
            font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2 { 
            text-align: center; 
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
            margin-top: 50px;
            page-break-before: always; /* 印刷・PDF変換時の改ページ */
        }
        h3 {
            margin-top: 30px;
            border-left: 5px solid #000;
            padding-left: 10px;
        }
        img { 
            max-width: 100%; 
            height: auto; 
            display: block; 
            margin: 20px auto; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        blockquote { 
            background: #f0f0f0; 
            border-left: 5px solid #555; 
            margin: 1.5em 0; 
            padding: 1em; 
            font-style: italic;
        }
        code { 
            background-color: #eee; 
            padding: 2px 5px; 
            border-radius: 3px; 
            font-family: monospace;
        }
        pre { 
            background-color: #2d2d2d; 
            color: #ccc;
            padding: 15px; 
            border-radius: 5px;
            overflow-x: auto; 
        }
        .toc {
            background: #fafafa;
            border: 1px solid #ddd;
            padding: 20px;
            margin-bottom: 40px;
            border-radius: 8px;
        }
        .toc h2 {
            margin-top: 0;
            border: none;
            font-size: 1.5em;
        }
        .toc ul {
            list-style: none;
            padding: 0;
        }
        .toc li {
            margin-bottom: 10px;
            border-bottom: 1px dotted #ccc;
        }
        .toc a {
            text-decoration: none;
            color: #333;
            display: block;
            width: 100%;
        }
        .toc a:hover {
            color: #007bff;
        }
        /* Kindle Previewer用改ページマーカー */
        .page-break { page-break-before: always; }
    </style>
    `;

    // 相対パスの画像を絶対パスに変換（これでデスクトップのHTMLからでも開ける）
    mdBody = mdBody.replace(/\(images\/(.*?)\)/g, (match, p1) => {
        return `(file://${path.join(currentDir, IMAGES_DIR, p1)})`;
    });

    // 見出しにIDを付与して目次を作れるようにする（簡易実装）
    // 今回は目次生成ロジックはスキップし、まずは本文変換のみ行う

    let htmlBody = md.render(mdBody);

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>【完全無料】初心者向けVibe Coding入門</title>
        ${headersContent}
    </head>
    <body>
        <div class="cover">
            <h1 style="margin-top: 200px; font-size: 3em;">【完全無料】<br>初心者向け<br>Vibe Coding入門</h1>
            <p style="text-align: center; font-size: 1.5em; margin-top: 20px;">AIと対話してアプリを作る<br>↓<br>Gitで保存<br>↓<br>世界に公開</p>
            <p style="text-align: center; margin-top: 50px;">著：Kino</p>
        </div>
        
        <div style="page-break-before: always;"></div>

        ${htmlBody}
    </body>
    </html>
    `;

    await fs.writeFile(OUTPUT_HTML, fullHtml);
    console.log(`HTML Book Generated: ${OUTPUT_HTML}`);
}

generateHtmlBook();
