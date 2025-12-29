const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book_final_v4.html';

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
    // 1. 画像レンダラー (Base64埋め込み)
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
        // 画像に対するクラス付与（CSSで制御するが念のため）
        token.attrSet('class', 'content-image');
        return defaultRender(tokens, idx, options, env, self);
    };

    const content = await fs.readFile(INPUT_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    // ---------------------------------------------------------
    // 2. テキスト前処理
    // ---------------------------------------------------------

    // 太字バグ修正
    mdBody = mdBody.replace(/\*\*\s*\n\s*/g, '**');
    mdBody = mdBody.replace(/\s*\n\s*\*\*/g, '**');

    // リンク残骸の一掃
    mdBody = mdBody.replace(/\[\*\*(.*?)\*\*.*?\]\((https:\/\/.*?)\)/g, '**$1** ($2)');
    mdBody = mdBody.replace(/\[\*\*(.*?)\*\*\]\((.*?)\)/g, '**$1**');
    mdBody = mdBody.replace(/g# AI Rules/g, '# AI Rules');
    mdBody = mdBody.replace(/;yb/g, '');
    mdBody = mdBody.replace(/🔴.*?(\n|$)/g, '');

    // ---------------------------------------------------------
    // 3. レンダリング & 目次データ収集 & バナー生成
    // ---------------------------------------------------------

    // 目次データ
    const tocTree = [];
    let currentChapter = null;
    let h2Counter = 0;

    // H2とH3のレンダラーをオーバーライドして、目次データを収集しつつHTMLを書き換える
    md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const level = token.tag;

        // --- H2 (章) ---
        if (level === 'h2') {
            h2Counter++;
            const contentToken = tokens[idx + 1];
            let rawTitle = contentToken.content;

            // タイトル掃除
            let cleanTitle = rawTitle
                .replace(/^\d+章\s*[:：]?\s*/, '') // "1章：" を消す
                .replace(/^\d+\.\s*/, '') // "1. " を消す
                .trim();

            // 目次用に保存
            const chapterNumStr = `第${h2Counter}章`;
            const chId = `chapter-${h2Counter}`;

            currentChapter = {
                id: chId,
                numText: chapterNumStr,
                title: cleanTitle,
                subs: []
            };
            tocTree.push(currentChapter);

            // バナーHTMLを生成して返す (H2タグの代わりに出力)
            // アンカー用に id を持った空の div か、あるいはバナー自体に id をつける
            // ここでは token.attrSet で属性を制御せず、HTML文字列を直接返す

            // H2の中身コンボ（open + content + close）をスキップさせるため、
            // contentの表示を空にするハックも必要だが、rendererは open タグだけを処理するもの。
            // したがって、ここでバナーの開始タグを出し、content は非表示、close で閉じる...というのは難しい。

            // 一番いいのは、H2タグ自体にクラスをつけて、CSSで非表示にしつつ、
            // その「手前」にバナーを置くこと。

            return `
            <div class="chapter-banner page-break" id="${chId}">
                <div class="banner-inner">
                    <div class="banner-num">${chapterNumStr}</div>
                    <div class="banner-title">${cleanTitle}</div>
                </div>
            </div>
            <h2 style="display:none">`; // 本当のH2は隠す
        }

        // --- H3 (小見出し) ---
        if (level === 'h3') {
            if (currentChapter) {
                const subIndex = currentChapter.subs.length + 1;
                const subNum = `${h2Counter}-${subIndex}`;

                const contentToken = tokens[idx + 1];
                let rawSubTitle = contentToken.content;

                // 掃除
                let cleanSubTitle = rawSubTitle
                    .replace(/^\d+(\.\d+)?\s*/, '')
                    .trim();

                const subId = `sub-${subNum}`;

                currentChapter.subs.push({
                    id: subId,
                    num: subNum,
                    title: cleanSubTitle
                });

                // 青い帯デザインのH3にして返す
                token.attrSet('id', subId);
                token.attrSet('class', 'styled-h3');

                // 中身のテキスト（contentToken.content）はこの後の処理で出力されるが、
                // ここで番号 (1-1) をプレフィックスとして注入したい。
                // contentToken.content を書き換えるのが一番楽。
                contentToken.content = `<span class="h3-num">${subNum}</span> ${cleanSubTitle}`;

                // markdown-it は htmlタグを含む文字列をエスケープするので、
                // html: true オプションがあっても text トークンの中身はエスケープされる場合がある。
                // contentToken.type = 'html_inline' に変えて無理やりHTMLを通す
                contentToken.type = 'html_inline';

                return `<h3 id="${subId}" class="styled-h3">`;
            }
        }

        return self.renderToken(tokens, idx, options);
    };


    let htmlBody = md.render(mdBody);

    // ---------------------------------------------------------
    // 目次HTML 生成 (収集した tocTree を使用)
    // ---------------------------------------------------------
    let tocHtml = `<div class="toc-container page-break"><div class="toc-header">MOKUJI</div><ul class="toc-root">`;
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
    // コンポーネント
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
    // CSS : 画像はみ出し防止 & 青系デザイン
    // ---------------------------------------------------------
    const css = `
    <style>
        body { 
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Helvetica Neue", Arial, sans-serif;
            line-height: 2.0; 
            color: #333; 
            margin: 0; padding: 0;
            background: #fff;
            font-size: 18px; 
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 50px 20px;
        }
        
        /* 画像のはみ出し防止 (最重要) */
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 30px auto;
            border: 1px solid #eee;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        a { color: #0056b3; text-decoration: none; }
        
        .page-break { page-break-before: always; }

        /* 章扉バナー (青系グラデーションに変更) */
        .chapter-banner {
            margin: 80px 0 60px 0;
            padding: 10px;
            /* 青系グラデーション */
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
            border-radius: 4px;
            box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        }
        .banner-inner {
            background: #fff;
            padding: 30px 20px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            min-height: 120px;
        }
        .banner-num {
            font-size: 1.8em;
            color: #0056b3; /* 濃い青 */
            font-weight: bold;
            margin-right: 30px;
            border-right: 2px solid #eee;
            padding-right: 30px;
            white-space: nowrap;
        }
        .banner-title {
            font-size: 1.8em;
            font-weight: bold;
            line-height: 1.3;
            color: #222;
        }

        /* 小見出し (青系の帯) */
        h3.styled-h3 {
            background: #e0f2ff; /* 薄い青 */
            padding: 12px 18px;
            font-size: 1.4em;
            color: #004085; /* テキスト色 */
            font-weight: bold;
            margin-top: 60px;
            margin-bottom: 25px;
            border-left: 8px solid #0056b3; /* 濃い青アクセント */
            border-radius: 4px;
        }
        .h3-num {
            margin-right: 12px;
            font-family: Arial, sans-serif;
            background: #0056b3;
            color: #fff;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            vertical-align: middle;
        }

        /* 目次 */
        .toc-header {
            text-align: right;
            font-size: 0.9em;
            font-weight: bold;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        .toc-root { list-style: none; padding: 0; }
        .toc-chap-item { margin-bottom: 25px; }
        
        .toc-chap-link {
            font-size: 1.3em;
            font-weight: bold;
            color: #222; 
            display: block;
            margin-bottom: 8px;
            border-left: 4px solid #0056b3;
            padding-left: 10px;
        }
        .toc-sub-list {
            list-style: none;
            padding-left: 20px;
        }
        .toc-sub-list li {
            margin-bottom: 8px;
        }
        .toc-sub-link {
            font-size: 1.05em;
            color: #0056b3;
            text-decoration: underline;
            text-decoration-color: #cce5ff;
        }

        /* 著者紹介 */
        .bio-box {
            background: #fcfcfc;
            border: 1px solid #ddd;
            padding: 30px;
            border-radius: 8px;
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
        
        <!-- 表紙 -->
        <div class="cover" style="height: 95vh; display: flex; flex-direction: column; justify-content: center; text-align:center; background: #fff; color: #333; padding: 20px; border: 20px solid #4facfe;">
            <p style="color: #0056b3; letter-spacing: 0.2em; font-weight: bold;">Vibe Coding Series</p>
            <h1 style="font-size: 4em; margin: 20px 0; line-height: 1.1;">Vibe<br>Coding<br><span style="font-size:0.5em; font-weight:300;">完全入門</span></h1>
            <p style="font-size: 1.3em; margin-top: 30px; color: #555;">AIと対話してアプリを作る技術</p>
            <div style="margin-top: 50px; font-size: 1.5em; font-weight: bold;">Kino</div>
        </div>
        
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
