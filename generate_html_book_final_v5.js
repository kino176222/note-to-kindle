const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

const INPUT_FILE = 'kindle_draft.md'; // 整形済みMarkdownを使用
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book_final_v5.html';

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.gif') return 'image/gif';
    return 'image/octet-stream';
}

async function generateHtmlBook() {
    console.log(`Generating HTML from ${INPUT_FILE}...`);

    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true
    });

    // ---------------------------------------------------------
    // 1. 画像処理 (堅牢化)
    // ---------------------------------------------------------
    const defaultRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    md.renderer.rules.image = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const srcIndex = token.attrIndex('src');
        let src = token.attrs[srcIndex][1];

        // Base64化ロジック
        if (!src.startsWith('http') && !src.startsWith('data:')) {
            try {
                // 相対パスを絶対パスに解決
                // images/xxx.png -> /path/to/project/images/xxx.png
                let localPath = path.resolve(process.cwd(), src);

                // たまに URLエンコードされている場合があるのでデコード
                localPath = decodeURIComponent(localPath);

                if (fs.existsSync(localPath)) {
                    const imgData = fs.readFileSync(localPath);
                    const base64Image = Buffer.from(imgData).toString('base64');
                    const mimeType = getMimeType(localPath);
                    src = `data:${mimeType};base64,${base64Image}`;
                    token.attrs[srcIndex][1] = src;
                } else {
                    console.warn(`[WARN] Image not found: ${localPath} (Source: ${src})`);
                    // 画像が見つからない場合でも、エラー表示用のプレースホルダーを出すと親切
                    // token.attrs[srcIndex][1] = 'https://placehold.co/600x400?text=Image+Not+Found';
                }
            } catch (err) {
                console.error(`[ERROR] Failed to process image: ${src}`, err);
            }
        }

        token.attrSet('class', 'content-image');
        return defaultRender(tokens, idx, options, env, self);
    };

    // ---------------------------------------------------------
    // 2. 本文読み込み
    // ---------------------------------------------------------
    const content = await fs.readFile(INPUT_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    // ---------------------------------------------------------
    // 3. カスタムレンダラー (目次収集 & バナー & H3装飾)
    // ---------------------------------------------------------
    const tocTree = [];
    let currentChapter = null;
    let h2Counter = 0;

    md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const level = token.tag;

        // --- H2 (章) ---
        if (level === 'h2') {
            h2Counter++;
            const contentToken = tokens[idx + 1];
            let rawTitle = contentToken.content;

            // Markdown側で番号は削除済みだが、念のためtrim
            let cleanTitle = rawTitle.trim();

            const chapterNumStr = `第${h2Counter}章`;
            const chId = `chapter-${h2Counter}`;

            currentChapter = {
                id: chId,
                numText: chapterNumStr,
                title: cleanTitle,
                subs: []
            };
            tocTree.push(currentChapter);

            // バナーHTML (フラットデザイン・微光沢)
            return `
            <div class="chapter-banner page-break" id="${chId}">
                <div class="banner-inner">
                    <div class="banner-num">${chapterNumStr}</div>
                    <div class="banner-title">${cleanTitle}</div>
                </div>
            </div>
            <h2 style="display:none">`; // 見出し自体は隠す
        }

        // --- H3 (小見出し) ---
        if (level === 'h3') {
            if (currentChapter) {
                const subIndex = currentChapter.subs.length + 1;
                const subNum = `${h2Counter}-${subIndex}`;

                const contentToken = tokens[idx + 1];
                let cleanSubTitle = contentToken.content.trim();

                const subId = `sub-${subNum}`;

                currentChapter.subs.push({
                    id: subId,
                    num: subNum,
                    title: cleanSubTitle
                });

                // H3内のテキストを装飾付きに書き換え
                // <span class="h3-num">3-1</span> タイトル
                contentToken.content = `<span class="h3-num">${subNum}</span> ${cleanSubTitle}`;
                contentToken.type = 'html_inline';

                token.attrSet('id', subId);
                token.attrSet('class', 'styled-h3');
                return `<h3 id="${subId}" class="styled-h3">`;
            }
        }
        return self.renderToken(tokens, idx, options, env, self);
    };

    let htmlBody = md.render(mdBody);

    // ---------------------------------------------------------
    // 4. 目次生成
    // ---------------------------------------------------------
    let tocHtml = `<div class="toc-container page-break"><div class="toc-header">CONTENTS</div><ul class="toc-root">`;
    tocTree.forEach(c => {
        tocHtml += `
        <li class="toc-chap-item">
            <a href="#${c.id}" class="toc-chap-link">${c.numText}　${c.title}</a>
            ${c.subs.length > 0 ? `
            <ul class="toc-sub-list">
                ${c.subs.map(s => `
                    <li><a href="#${s.id}" class="toc-sub-link"><span class="toc-s-num">${s.num}</span> ${s.title}</a></li>
                `).join('')}
            </ul>
            ` : ''}
        </li>`;
    });
    tocHtml += `</ul></div>`;

    // ---------------------------------------------------------
    // 5. コンポーネント (まえがき等はスクリプト内で定義)
    // ---------------------------------------------------------
    const preface = `
    <div class="preface page-break">
        <h2 style="border:none; text-align:left; font-size: 1.5em; border-bottom: 2px solid #333; display:inline-block; margin-bottom: 30px;">はじめに</h2>
        <div class="preface-body">
            <p>「プログラミングなんて、自分には縁がない」</p>
            <p>ずっとそう思っていました。<br>難しいコード、黒い画面、謎のエラー……。<br>「作りたいもの」はあるのに、その扉はいつも重く閉ざされていて、私には開け方すら分からなかったのです。</p>
            <p>でも、時代は変わりました。</p>
            <p>私が出会ったのは <strong>「Vibe Coding（バイブ・コーディング）」</strong>。</p>
            <p>これは、気合を入れて勉強する方法ではありません。<br>AIという最強の相棒と、「こんなの作りたい！」「ここ直して！」と会話しながら、ノリと勢い（Vibe）で形にしていく、新しいモノづくりのスタイルです。</p>
            <p>この本は、そんな「AIを使ったモノづくりの楽しさ」を、マンガや図解を交えながら、誰にでも分かるように全力でシェアするために書きました。</p>
            <div style="text-align:right; margin-top:40px; font-weight:bold;">Kino</div>
        </div>
    </div>
    `;

    const bioBox = `
    <div class="bio-box page-break">
        <h3>著者プロフィール</h3>
        <p><strong>Kino</strong></p>
        <p>AIと共に「つくる楽しさ」を探求するクリエイター。</p>
        <p>技術の壁をVibe（ノリと勢い）で乗り越える「Vibe Coding」を提唱。</p>
        <p>note: <a href="https://note.com/kino_11">https://note.com/kino_11</a></p>
    </div>
    `;

    // ---------------------------------------------------------
    // 6. CSS
    // ---------------------------------------------------------
    const css = `
    <style>
        /* ベース設定 */
        body { 
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Helvetica Neue", Arial, sans-serif;
            line-height: 2.0; 
            color: #333; 
            margin: 0; padding: 0;
            background: #fff;
            font-size: 19px; /* 少し大きめ */
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        /* 画像 */
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 30px auto;
            border: 1px solid #f0f0f0;
        }

        a { color: #0066cc; text-decoration: none; }
        .page-break { page-break-before: always; }

        /* 章扉バナー (フラットデザイン・修正版) */
        .chapter-banner {
            margin: 100px 0 60px 0;
            padding: 0;
            border: 4px solid #0066cc; /* シンプルな枠線 */
            background: #fff;
            box-shadow: none; /* 発光（影）を削除 */
            border-radius: 0;
        }
        .banner-inner {
            background: #fff;
            padding: 40px 30px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }
        .banner-num {
            font-size: 2.0em;
            color: #0066cc;
            font-weight: bold;
            margin-right: 30px;
            border-right: 2px solid #ccc;
            padding-right: 30px;
            white-space: nowrap;
        }
        .banner-title {
            font-size: 2.0em;
            font-weight: bold;
            line-height: 1.4;
            color: #222;
        }

        /* 小見出し (青系のシンプル帯) */
        h3.styled-h3 {
            background: #f0f8ff; /* 非常に薄い青 */
            padding: 15px 20px;
            font-size: 1.5em; /* サイズUP */
            color: #003366; 
            font-weight: bold;
            margin-top: 70px;
            margin-bottom: 30px;
            border-left: 10px solid #0066cc; /* アクセント太く */
        }
        .h3-num {
            margin-right: 15px;
            background: #0066cc;
            color: #fff;
            padding: 4px 12px;
            font-size: 0.8em; /* 番号のサイズもUP */
            border-radius: 4px;
            vertical-align: middle;
            display: inline-block;
        }

        /* 目次 */
        .toc-header {
            text-align: right;
            font-size: 1.0em;
            font-weight: bold;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            letter-spacing: 0.1em;
        }
        .toc-root { list-style: none; padding: 0; }
        .toc-chap-item { margin-bottom: 30px; }
        
        .toc-chap-link {
            font-size: 1.4em;
            font-weight: bold;
            color: #222; 
            display: block;
            margin-bottom: 10px;
            border-left: 5px solid #0066cc;
            padding-left: 15px;
        }
        .toc-sub-list {
            list-style: none;
            padding-left: 20px;
        }
        .toc-sub-list li {
            margin-bottom: 10px;
        }
        .toc-sub-link {
            font-size: 1.1em;
            color: #0066cc;
            text-decoration: underline;
            text-decoration-color: #cce5ff;
        }

        /* コードブロック & プロンプト (視認性改善・折り返し) */
        pre {
            background-color: #2d2d2d; /* 真っ黒すぎないカーボン色 */
            color: #f8f8f2;
            padding: 20px;
            border-radius: 6px;
            overflow-x: hidden; /* 横スクロール禁止 */
            white-space: pre-wrap; /* 自動折り返し */
            word-wrap: break-word; /* 長い単語も折る */
            font-family: Consolas, Monaco, "Andale Mono", monospace;
            font-size: 0.9em;
            line-height: 1.6;
            margin: 30px 0;
        }
        code {
            font-family: inherit;
        }

        /* 引用ブロック (Break Timeなど) */
        blockquote {
            background: #fff8e1;
            border-left: 5px solid #ffc107;
            margin: 30px 0;
            padding: 20px 30px;
            color: #555;
        }

        .bio-box {
            background: #fcfcfc;
            border: 1px solid #ddd;
            padding: 40px;
            border-radius: 8px;
            margin-top: 100px;
        }
    </style>
    `;

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>【完全無料】初心者向けVibe Coding入門</title>
        ${css}
    </head>
    <body>
        
        <div class="container">
            ${preface}
            ${tocHtml}
            ${htmlBody}
            ${bioBox}
        </div>

    </body>
    </html>
    `;

    await fs.writeFile(OUTPUT_HTML, fullHtml);
    console.log(`HTML Book Generated: ${OUTPUT_HTML}`);
}

generateHtmlBook();
