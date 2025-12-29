const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const mime = require('mime-types'); // 追加パッケージが必要かもだが、拡張子から簡易判定でいく

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book_v2.html';
const IMAGES_DIR = 'images';

// 簡易MIMEタイプ判定
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.gif') return 'image/gif';
    return 'image/octet-stream';
}

async function generateHtmlBook() {
    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true
    });

    // 画像レンダラーのオーバーライド
    const defaultRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    md.renderer.rules.image = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const srcIndex = token.attrIndex('src');
        let src = token.attrs[srcIndex][1];

        // ローカルパスの場合、Base64に変換して埋め込む
        // srcが 'images/xxxx.png' のようになっているはず
        if (!src.startsWith('http') && !src.startsWith('data:')) {
            const localPath = path.join(process.cwd(), src); // src自体にimages/が含まれている前提
            if (fs.existsSync(localPath)) {
                const imgData = fs.readFileSync(localPath);
                const base64Image = Buffer.from(imgData).toString('base64');
                const mimeType = getMimeType(localPath);
                src = `data:${mimeType};base64,${base64Image}`;
                token.attrs[srcIndex][1] = src; // src属性を書き換え
            } else {
                console.warn(`Warning: Image not found at ${localPath}`);
            }
        }

        // 元のレンダラーまたは標準のimgタグ生成
        return defaultRender(tokens, idx, options, env, self);
    };

    const content = await fs.readFile(INPUT_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

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
            page-break-before: always; 
        }
        h3 {
            margin-top: 30px;
            border-left: 5px solid #000;
            padding-left: 10px;
            font-size: 1.2em;
        }
        p {
            margin-bottom: 1.5em;
        }
        /* 画像スタイルの強化 */
        img { 
            max-width: 100%; 
            height: auto; 
            display: block; 
            margin: 30px auto; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.15); /* 影をつけて本っぽく */
            border-radius: 4px;
        }
        blockquote { 
            background: #f9f9f9; 
            border-left: 5px solid #ccc; 
            margin: 1.5em 0; 
            padding: 1em 1.5em; 
            color: #666;
        }
        code { 
            background-color: #f4f4f4; 
            padding: 2px 5px; 
            border-radius: 3px; 
            font-family: monospace;
            font-size: 0.9em;
        }
        pre { 
            background-color: #282c34; 
            color: #abb2bf;
            padding: 20px; 
            border-radius: 8px;
            overflow-x: auto; 
            margin: 20px 0;
        }
        /* 前書きやあとがきなどの特別セクション */
        .special-section {
            background-color: #fffaf0;
            padding: 20px;
            border-radius: 8px;
            margin: 40px 0;
        }
    </style>
    `;

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
        <div class="cover" style="text-align:center; padding: 100px 20px; background: #222; color: #fff; margin-bottom: 50px; border-radius: 8px;">
            <h1 style="border:none; color: #fff; font-size: 3em; margin: 0;">Vibe Coding<br><span style="font-size:0.5em">完全入門</span></h1>
            <p style="margin-top: 30px; font-size: 1.2em; opacity: 0.8;">初心者でもAIでアプリを作って公開する技術</p>
            <p style="margin-top: 100px;">著：Kino</p>
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
