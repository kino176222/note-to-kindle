const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const container = require('markdown-it-container'); // 吹き出しやコラム用

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book_v4.html';
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

    // ---------------------------------------------------------
    // 1. レンダラーカスタマイズ (画像埋め込み)
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 2. コンテンツの前処理 (リライト・修正)
    // ---------------------------------------------------------
    const content = await fs.readFile(INPUT_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    // (A) バグ修正: いきなり改行された太字記号 (**) を修正
    // 例: **\nそこで => **そこで
    // 正規表現で、**の前後の余計な改行やスペースを吸収して太字タグに変換する処理はMarkdownItがやるが、
    // 意図しない改行が入っているケースを救済する。
    mdBody = mdBody.replace(/\*\*\s*\n\s*/g, '**');
    mdBody = mdBody.replace(/\s*\n\s*\*\*/g, '**');

    // (B) 著者の個人URL関連の修正
    // Google Antigravityの記事リンクっぽいのを修正
    mdBody = mdBody.replace(/\[\*\*Google Antigravity\*\*.*?\]\(.*?\)/g, '**公式サイト (antigravity.google) にアクセス**');
    mdBody = mdBody.replace(/Googleアカウントでログイン\*\* まで進めてください。/g, 'Googleアカウントでログイン** してください。');

    // (C) ゴミ削除
    mdBody = mdBody.replace(/🔴.*?(\n|$)/g, ''); // 赤丸で始まる行を削除
    mdBody = mdBody.replace(/g# AI Rules/g, '# AI Rules'); // 先頭のゴミ削除
    mdBody = mdBody.replace(/;yb/g, ''); // 謎のゴミ削除

    // (D) プロンプト関連の注記
    // コードブロックの前後に挿入
    const promptNote = '\n\n> **【💡 読者限定特典】**\n> 本書のプロンプトは、以下の特典ページからワンクリックでコピーできます。\n> [https://note.com/kino_11/magazines](https://note.com/kino_11/magazines)\n\n';

    // (E) 著者紹介セクション作成
    const bioBox = `
<div class="bio-box">
    <h3>著者：Kino</h3>
    <p>AIと共に「つくる楽しさ」を探求するクリエイター。</p>
    <p>技術の壁をVibe（ノリと勢い）で乗り越える「Vibe Coding」を提唱し、初心者でもアプリ開発を楽しめる手法を発信中。</p>
    <p>note: <a href="https://note.com/kino_11">https://note.com/kino_11</a></p>
</div>
<div style="page-break-before: always;"></div>
`;

    // ---------------------------------------------------------
    // 3. 目次生成とHTML構築
    // ---------------------------------------------------------
    const tocLines = [];
    const lines = mdBody.split('\n');
    let chapterCount = 0;
    const convertedBody = [];

    for (const line of lines) {
        const match = line.match(/^##\s+(.+)$/);
        if (match) {
            chapterCount++;
            const title = match[1];
            const id = `chapter-${chapterCount}`;
            tocLines.push(`<li><a href="#${id}"><span class="toc-num">${chapterCount}</span> <span class="toc-text">${title}</span></a></li>`);
            // シンプルな左線デザインに変更
            convertedBody.push(`<h2 id="${id}" class="simple-chapter">${title}</h2>`);
        } else {
            convertedBody.push(line);
        }
    }

    mdBody = convertedBody.join('\n');

    // 目次HTML
    const tocHtml = `
    <div class="toc" style="page-break-before: always;">
        <h2 style="border:none; text-align:center;">CONTENTS</h2>
        <ul>
            ${tocLines.join('\n')}
        </ul>
    </div>
    <div style="page-break-before: always;"></div>
    `;

    let htmlBody = md.render(mdBody);

    // ---------------------------------------------------------
    // 4. CSSデザイン (シンプル・技術書風)
    // ---------------------------------------------------------
    const headersContent = `
    <style>
        body { 
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Helvetica Neue", Arial, sans-serif;
            line-height: 1.9; /* 少し広げて読みやすく */
            max-width: 750px; /* 少し狭くして視線移動を減らす */
            margin: 0 auto;
            padding: 40px 20px;
            color: #222;
        }

        /* リンクの色を落ち着いた青に */
        a { color: #0056b3; text-decoration: none; }
        a:hover { text-decoration: underline; }

        /* H2: シンプルな左線デザイン */
        h2.simple-chapter {
            border-left: 8px solid #0056b3; /* 濃い青 */
            padding: 10px 0 10px 20px;
            margin-top: 80px;
            margin-bottom: 40px;
            font-size: 1.8em;
            color: #333;
            background: transparent;
            font-weight: bold;
            page-break-before: always;
            border-bottom: none;
            text-align: left;
        }

        /* H3: 下線のみ */
        h3 {
            margin-top: 50px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            font-size: 1.4em;
            color: #444;
            border-left: none;
            background: none;
        }

        /* 太字 */
        strong {
            background: linear-gradient(transparent 70%, rgba(0, 150, 255, 0.2) 70%); /* 青系の控えめマーカー */
            font-weight: 700;
        }

        /* 引用ブロック (HINT) */
        blockquote { 
            background: #f7f9fc;
            border-left: 5px solid #0056b3;
            margin: 30px 0; 
            padding: 20px; 
            color: #555;
            border-radius: 0 4px 4px 0;
        }

        /* 画像 */
        img { 
            max-width: 100%; 
            height: auto;
            display: block; 
            margin: 40px auto; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
            border: 1px solid #eee;
        }

        /* 著者紹介ボックス */
        .bio-box {
            border: 1px solid #ddd;
            padding: 30px;
            margin-top: 100px;
            border-radius: 8px;
            background: #fafafa;
        }
        .bio-box h3 {
            margin-top: 0;
            border-bottom: none;
        }

        /* 目次スタイル */
        .toc ul { list-style: none; padding: 0; margin-top: 30px;}
        .toc li { 
            margin-bottom: 15px; 
            border-bottom: 1px solid #eee; 
            padding-bottom: 5px; 
        }
        .toc-num {
            font-weight: bold;
            color: #0056b3;
            margin-right: 10px;
            font-size: 1.2em;
        }
        .toc a { display: block; width: 100%; color: #333;}
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
        <div class="cover" style="height: 90vh; display: flex; flex-direction: column; justify-content: center; text-align:center; background: #fff; color: #333;">
            <div style="border: 4px solid #333; padding: 60px 40px; margin: 20px;">
                <p style="letter-spacing: 0.2em; font-size: 0.9em; margin-bottom: 20px; color: #555;">KINDLE EDITION</p>
                <h1 style="border:none; font-size: 3.2em; margin: 0; text-transform: uppercase;">Vibe Coding<br>完全入門</h1>
                <p style="margin-top: 30px; font-size: 1.1em;">AIと対話してアプリを作り、世界に公開する技術</p>
                <p style="margin-top: 100px; font-weight: bold;">Kino</p>
            </div>
        </div>
        
        <div style="page-break-before: always;"></div>

        ${bioBox}
        ${tocHtml}
        ${htmlBody}
    </body>
    </html>
    `;

    await fs.writeFile(OUTPUT_HTML, fullHtml);
    console.log(`HTML Book Generated: ${OUTPUT_HTML}`);
}

generateHtmlBook();
