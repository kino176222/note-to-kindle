const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const container = require('markdown-it-container'); // コンテナ用（もし必要なら）
const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book_v3.html';
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

    // 1. 画像レンダラーのオーバーライド（Base64埋め込み）
    const defaultRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    md.renderer.rules.image = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const srcIndex = token.attrIndex('src');
        let src = token.attrs[srcIndex][1];

        if (!src.startsWith('http') && !src.startsWith('data:')) {
            const localPath = path.join(process.cwd(), src);
            if (fs.existsSync(localPath)) {
                const imgData = fs.readFileSync(localPath);
                const base64Image = Buffer.from(imgData).toString('base64');
                const mimeType = getMimeType(localPath);
                src = `data:${mimeType};base64,${base64Image}`;
                token.attrs[srcIndex][1] = src;
            }
        }
        return defaultRender(tokens, idx, options, env, self);
    };

    const content = await fs.readFile(INPUT_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    // 2. 目次（TOC）生成ロジック
    // H2タグを抽出して目次を作成
    const tocLines = [];
    const lines = mdBody.split('\n');
    let chapterCount = 0;

    // Markdownの本文を走査して、H2を見つけるたびに目次に追加し、IDを埋め込むための置換を行う準備
    const toc = [];
    let convertedBody = [];

    for (const line of lines) {
        const match = line.match(/^##\s+(.+)$/);
        if (match) {
            chapterCount++;
            const title = match[1];
            const id = `chapter-${chapterCount}`;
            toc.push(`<li><a href="#${id}">Chapter ${chapterCount}: ${title}</a></li>`);
            // 見出し行にIDを付与（HTMLタグに直接変換してしまう）
            // アイコンを入れるためのspanも追加
            convertedBody.push(`<h2 id="${id}" class="chapter-heading"><span class="chapter-icon">🚀</span> ${title}</h2>`);
        } else {
            convertedBody.push(line);
        }
    }

    // 目次HTML
    const tocHtml = `
    <div class="toc" style="page-break-before: always;">
        <h2 style="border:none;">目次</h2>
        <ul>
            ${toc.join('\n')}
        </ul>
    </div>
    <div style="page-break-before: always;"></div>
    `;

    mdBody = convertedBody.join('\n'); // 本文を更新

    // 3. 吹き出し変換ロジック（簡易版）
    // 「AI: こんにちは」とか「Kino: やあ」みたいな行を変換
    // ここでは、特定の記法ではなく、文脈から判断するのは難しいので、
    // ユーザーが「コピペ用プロンプト」等で使う ```ruby ... ``` などのブロックを
    // 特別な「コード風ボックス」にする処理はCSSで行う。
    // 今回は「吹き出し」は手動マークアップが必要になるため、まずはCSSだけ用意し、
    // 今ある「引用」を「会話風」に見せるお試し変換を入れてみる。

    // 引用（> ...）を、AIのアドバイス吹き出し風に変えてみる実験
    // mdBody = mdBody.replace(/^>\s+(.*)$/gm, '<div class="chat-bubble ai">$1</div>');

    // 本文変換
    let htmlBody = md.render(mdBody);

    // CSS定義
    const headersContent = `
    <style>
        body { 
            font-family: "Helvetica Neue", Arial, sans-serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #fdfdfd; /* 紙っぽい白 */
        }
        
        /* 1. 見出しデザイン（アイコン＋帯） */
        h2.chapter-heading { 
            background: linear-gradient(to right, #6a11cb 0%, #2575fc 100%); /* Vibeなグラデーション */
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-top: 60px;
            margin-bottom: 30px;
            box-shadow: 0 4px 10px rgba(37, 117, 252, 0.3);
            text-align: left; /* 左寄せ */
            border-bottom: none;
            page-break-before: always;
        }
        .chapter-icon {
            font-size: 1.2em;
            margin-right: 10px;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        }

        /* 小見出し */
        h3 {
            margin-top: 40px;
            border-left: 6px solid #2575fc;
            padding-left: 15px;
            font-size: 1.4em;
            color: #2c3e50;
            background: #f0f7ff; /* 薄い青背景 */
            padding-top: 5px;
            padding-bottom: 5px;
        }

        /* 2. マーカー風装飾（strongタグをマーカーにする） */
        strong {
            background: linear-gradient(transparent 60%, rgba(255, 230, 0, 0.6) 60%);
            font-weight: bold;
            color: #000;
        }

        /* 3. 吹き出し風デザイン（引用ブロックを転用） */
        blockquote { 
            position: relative;
            background: #eef;
            border: 2px solid #2575fc;
            border-radius: 15px;
            margin: 30px 20px; 
            padding: 20px; 
            color: #333;
            font-style: normal;
        }
        blockquote::before {
            content: "💡 HINT"; /* アイコン */
            display: block;
            font-weight: bold;
            color: #2575fc;
            margin-bottom: 10px;
        }

        /* 画像 */
        img { 
            max-width: 100%; 
            display: block; 
            margin: 30px auto; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.15); 
            border-radius: 8px;
            border: 1px solid #eee;
        }

        /* コードブロック */
        pre { 
            background-color: #1e1e1e; /* ダークモード */
            color: #dcdcdc;
            padding: 20px; 
            border-radius: 8px;
            overflow-x: auto; 
            margin: 20px 0;
            border: 1px solid #333;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
        }
        code {
            font-family: "Consolas", "Monaco", monospace;
        }

        /* 目次スタイル */
        .toc {
            background: #fff;
            border: 2px solid #ddd;
            padding: 30px;
            border-radius: 10px;
        }
        .toc h2 {
            margin-top: 0;
            color: #333;
            text-align: center;
            background: none;
            box-shadow: none;
            padding: 0;
        }
        .toc ul { list-style: none; padding: 0; }
        .toc li { margin-bottom: 12px; border-bottom: 1px dashed #ddd; padding-bottom: 5px; }
        .toc a { text-decoration: none; color: #444; font-weight: bold; display: block;}
        .toc a:hover { color: #2575fc; }

    </style>
    `;

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>【完全無料】初心者向けVibe Coding入門</title>
        ${headersContent}
    </head>
    <body>
        <div class="cover" style="text-align:center; padding: 120px 20px; background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%); color: #fff; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div style="border: 2px solid #444; padding: 40px; border-radius: 4px;">
                <h1 style="border:none; color: #fff; font-size: 3.5em; margin: 0; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">Vibe Coding<br><span style="font-size:0.4em; letter-spacing: 5px; color: #aaa;">STARTBOOK</span></h1>
                <p style="margin-top: 40px; font-size: 1.4em; font-weight: 300;">AIと対話してアプリを作る技術</p>
                <div style="margin-top: 80px; font-size: 1.1em; color: #ddd;">著：Kino</div>
            </div>
        </div>
        
        <div style="page-break-before: always;"></div>

        ${tocHtml}

        ${htmlBody}
    </body>
    </html>
    `;

    await fs.writeFile(OUTPUT_HTML, fullHtml);
    console.log(`HTML Book Generated: ${OUTPUT_HTML}`);
}

generateHtmlBook();
